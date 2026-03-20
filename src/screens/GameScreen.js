import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert } from 'react-native';
import { ref, onValue, update, get } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db } from '../firebase';

const genId = () => Math.random().toString(36).substr(2, 9);

export default function GameScreen({ route, navigation }) {
  const { roomCode, myRole, myId, isAdmin } = route.params;
  const [room,        setRoom]        = useState(null);
  const [askInput,    setAskInput]    = useState('');
  const [askWantsImg, setAskWantsImg] = useState(false);
  const [askWantsLoc, setAskWantsLoc] = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [needleAngle, setNeedleAngle] = useState(0);
  const [animating,   setAnimating]   = useState(false);
  const lastState = useRef(null);
  const roundNum  = useRef(0);

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), (snap) => {
      if (!snap.exists()) return;
      setRoom(snap.val());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!room) return;
    if (room.state === 'ready' && lastState.current !== 'ready') {
      setNeedleAngle(0); setAnimating(false);
    }
    if (room.state === 'spinning' && lastState.current !== 'spinning') {
      const target = (5 + Math.floor(Math.random() * 4)) * 360 + (room.spinResult === 'p2' ? 90 : -90);
      setAnimating(true); setNeedleAngle(target);
      setTimeout(async () => {
        setAnimating(false);
        const snap = await get(ref(db, `rooms/${roomCode}`));
        if (snap.exists() && snap.val().state === 'spinning') {
          await update(ref(db, `rooms/${roomCode}`), { state: 'reveal' });
        }
      }, 3700);
    }
    lastState.current = room.state;
  }, [room?.state, room?.spinResult]);

  const spin = async () => {
    if (!room || room.state !== 'ready' || animating) return;
    const result = Math.random() < 0.5 ? 'p1' : 'p2';
    roundNum.current += 1;
    await update(ref(db, `rooms/${roomCode}`), {
      state: 'spinning', spinResult: result,
      todChoice: null, question: null,
      wantsImg: false, wantsLoc: false, photo: null, sharedLoc: null,
    });
  };

  const chooseTod = async (choice) => {
    await update(ref(db, `rooms/${roomCode}`), { state: 'ask', todChoice: choice });
  };

  const submitAsk = async () => {
    if (!askInput.trim()) return;
    await update(ref(db, `rooms/${roomCode}`), {
      state: 'answering', question: askInput.trim(),
      wantsImg: askWantsImg, wantsLoc: askWantsLoc,
    });
    setAskInput(''); setAskWantsImg(false); setAskWantsLoc(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to upload.'); return; }
    setUploading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5, base64: true,
    });
    if (!result.canceled) {
      await update(ref(db, `rooms/${roomCode}`), {
        photo: `data:image/jpeg;base64,${result.assets[0].base64}`
      });
    }
    setUploading(false);
  };

  const shareLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location access.'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    await update(ref(db, `rooms/${roomCode}`), {
      sharedLoc: {
        lat: loc.coords.latitude, lng: loc.coords.longitude,
        label: `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
      }
    });
  };

  const nextRound = async () => {
    await update(ref(db, `rooms/${roomCode}`), {
      state: 'ready', spinResult: null, todChoice: null,
      question: null, wantsImg: false, wantsLoc: false,
      photo: null, sharedLoc: null,
    });
  };

  if (!room) return <View style={styles.container}><Text style={styles.hint}>Connecting…</Text></View>;

  const amPicked  = room.spinResult === myRole;
  const amAsking  = room.spinResult && room.spinResult !== myRole;
  const pickedInit = room.spinResult === 'p1' ? room.p1?.initial : room.p2?.initial;
  const p1Active  = ['reveal','ask','answering'].includes(room.state) && room.spinResult === 'p1';
  const p2Active  = ['reveal','ask','answering'].includes(room.state) && room.spinResult === 'p2';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.pill}><Text style={styles.pillTxt}>Room · {roomCode}</Text></View>

      {/* Spinner */}
      <View style={styles.spinRow}>
        <View style={styles.initialBlock}>
          <Text style={[styles.initial, { color: p1Active ? '#ff2d78' : 'rgba(255,45,120,0.35)' }]}>
            {room.p1?.initial || '?'}
          </Text>
          <Text style={styles.youLabel}>{myRole === 'p1' ? 'YOU' : 'THEM'}</Text>
        </View>

        <View style={styles.ring}>
          <View style={[styles.needleWrap, {
            transform: [{ rotate: `${needleAngle}deg` }]
          }]}>
            <View style={styles.needle}/>
          </View>
          <View style={styles.pivot}/>
        </View>

        <View style={styles.initialBlock}>
          <Text style={[styles.initial, { color: p2Active ? '#00e5ff' : 'rgba(0,229,255,0.35)' }]}>
            {room.p2?.initial || '?'}
          </Text>
          <Text style={styles.youLabel}>{myRole === 'p2' ? 'YOU' : 'THEM'}</Text>
        </View>
      </View>

      {/* Admin button */}
      {isAdmin && (
        <TouchableOpacity style={styles.adminBtn}
          onPress={() => navigation.navigate('Admin', { roomCode, myRole })}>
          <Text style={styles.adminBtnTxt}>⚡ Admin Panel</Text>
        </TouchableOpacity>
      )}

      {/* States */}
      {room.state === 'ready' && (
        <TouchableOpacity style={styles.spinBtn} onPress={spin} disabled={animating}>
          <Text style={styles.spinBtnTxt}>SPIN</Text>
        </TouchableOpacity>
      )}

      {room.state === 'spinning' && <Text style={styles.hint}>✦ Spinning…</Text>}

      {room.state === 'reveal' && (
        <View style={styles.panel}>
          <Text style={styles.hint}>It's</Text>
          <Text style={[styles.bigPick, { color: room.spinResult === 'p1' ? '#ff2d78' : '#00e5ff' }]}>
            {pickedInit}'s TURN!
          </Text>
          {amPicked ? (
            <View style={styles.row}>
              <TouchableOpacity style={styles.truthBtn} onPress={() => chooseTod('truth')}>
                <Text style={styles.choiceTxt}>TRUTH</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dareBtn} onPress={() => chooseTod('dare')}>
                <Text style={styles.choiceTxt}>DARE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.hint}>Waiting for {pickedInit} to choose…</Text>
          )}
        </View>
      )}

      {room.state === 'ask' && (
        <View style={styles.panel}>
          <View style={[styles.badge, room.todChoice === 'truth' ? styles.badgeTruth : styles.badgeDare]}>
            <Text style={styles.badgeTxt}>{room.todChoice?.toUpperCase()}</Text>
          </View>
          {amAsking ? (
            <>
              <TextInput style={styles.inp}
                placeholder={room.todChoice === 'truth' ? 'Your question…' : 'Your dare…'}
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={askInput} onChangeText={setAskInput} multiline />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.toggleBtn, askWantsImg && styles.toggleOn]}
                  onPress={() => setAskWantsImg(v => !v)}>
                  <Text style={styles.toggleTxt}>{askWantsImg ? '📷 Photo ✓' : '📷 Photo'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, askWantsLoc && styles.toggleOn]}
                  onPress={() => setAskWantsLoc(v => !v)}>
                  <Text style={styles.toggleTxt}>{askWantsLoc ? '📍 Loc ✓' : '📍 Location'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.btn} onPress={submitAsk} disabled={!askInput.trim()}>
                <Text style={styles.btnTxt}>Send</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.hint}>Waiting for question…</Text>
          )}
        </View>
      )}

      {room.state === 'answering' && room.question && (
        <View style={styles.panel}>
          <View style={[styles.badge, room.todChoice === 'truth' ? styles.badgeTruth : styles.badgeDare]}>
            <Text style={styles.badgeTxt}>{room.todChoice?.toUpperCase()}</Text>
          </View>
          <View style={styles.qCard}>
            <Text style={styles.qText}>"{room.question}"</Text>
            <View style={styles.row}>
              {room.wantsImg && <View style={styles.reqBadge}><Text style={styles.reqTxt}>📷 Photo required</Text></View>}
              {room.wantsLoc && <View style={styles.reqBadge}><Text style={styles.reqTxt}>📍 Location required</Text></View>}
            </View>
          </View>

          {amPicked && room.wantsImg && !room.photo && (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploading}>
              <Text style={styles.uploadTxt}>{uploading ? 'Uploading…' : '📷 Pick a photo'}</Text>
            </TouchableOpacity>
          )}

          {amPicked && room.wantsLoc && !room.sharedLoc && (
            <TouchableOpacity style={styles.uploadBtn} onPress={shareLocation}>
              <Text style={styles.uploadTxt}>📍 Share my location</Text>
            </TouchableOpacity>
          )}

          {room.photo && (
            <Image source={{ uri: room.photo }} style={styles.photo} resizeMode="cover"/>
          )}

          {room.sharedLoc && (
            <View style={styles.locChip}>
              <Text style={styles.locTxt}>📍 {room.sharedLoc.label}</Text>
            </View>
          )}

          {!amPicked && room.wantsImg && !room.photo && <Text style={styles.hint}>Waiting for {pickedInit}'s photo…</Text>}
          {!amPicked && room.wantsLoc && !room.sharedLoc && <Text style={styles.hint}>Waiting for {pickedInit}'s location…</Text>}

          <TouchableOpacity style={styles.ghostBtn} onPress={nextRound}>
            <Text style={styles.ghostTxt}>Next Round →</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07060f' },
  content: { alignItems: 'center', padding: 20, paddingTop: 56, gap: 16 },
  pill: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 30, paddingHorizontal: 18, paddingVertical: 5 },
  pillTxt: { color: 'rgba(255,255,255,0.28)', fontSize: 11, letterSpacing: 3 },
  spinRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  initialBlock: { alignItems: 'center' },
  initial: { fontSize: 56, fontWeight: '900', lineHeight: 60 },
  youLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
  ring: { width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,45,120,0.03)', alignItems: 'center', justifyContent: 'center' },
  needleWrap: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  needle: { width: 5, height: 140, borderRadius: 3, backgroundColor: '#fff' },
  pivot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  adminBtn: { backgroundColor: 'rgba(255,45,120,0.15)', borderWidth: 1, borderColor: 'rgba(255,45,120,0.4)', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  adminBtnTxt: { color: '#ff6198', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  spinBtn: { backgroundColor: '#ff2d78', borderRadius: 14, paddingHorizontal: 60, paddingVertical: 16 },
  spinBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 6 },
  panel: { width: '100%', gap: 12, alignItems: 'center' },
  hint: { color: 'rgba(255,255,255,0.28)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center' },
  bigPick: { fontSize: 64, fontWeight: '900', textAlign: 'center', lineHeight: 66 },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  truthBtn: { flex: 1, backgroundColor: '#6d28d9', borderRadius: 14, padding: 16, alignItems: 'center' },
  dareBtn:  { flex: 1, backgroundColor: '#ff2d78', borderRadius: 14, padding: 16, alignItems: 'center' },
  choiceTxt: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 2 },
  badge: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeTruth: { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#7c3aed' },
  badgeDare:  { backgroundColor: 'rgba(255,45,120,0.2)',  borderColor: '#ff2d78' },
  badgeTxt: { fontWeight: '700', fontSize: 13, letterSpacing: 2, color: '#fff' },
  inp: { width: '100%', backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15 },
  toggleBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 11, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  toggleOn:  { borderColor: 'rgba(74,222,128,0.5)', backgroundColor: 'rgba(74,222,128,0.07)' },
  toggleTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  btn: { width: '100%', backgroundColor: '#ff2d78', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  qCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderRadius: 16, padding: 20, alignItems: 'center', gap: 12 },
  qText: { color: '#fff', fontSize: 18, fontWeight: '500', textAlign: 'center', lineHeight: 26 },
  reqBadge: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.35)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  reqTxt: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
  uploadBtn: { width: '100%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.13)', borderRadius: 14, borderStyle: 'dashed', padding: 20, alignItems: 'center' },
  uploadTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 15 },
  photo: { width: '100%', height: 220, borderRadius: 12 },
  locChip: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  locTxt: { color: '#4ade80', fontSize: 13 },
  ghostBtn: { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  ghostTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: '600' },
});