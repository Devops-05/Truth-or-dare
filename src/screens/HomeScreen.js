import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ref, set, get, update } from 'firebase/database';
import { db } from '../firebase';

const genId   = () => Math.random().toString(36).substr(2, 9);
const genCode = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

// ✏️ CHANGE THIS TO YOUR OWN SECRET PASSWORD
const ADMIN_PASSWORD = "fcukBad$345";

export default function HomeScreen({ navigation }) {
  const [tab,        setTab]        = useState('create');
  const [initial,    setInitial]    = useState('');
  const [code,       setCode]       = useState('');
  const [adminPass,  setAdminPass]  = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  const isAdmin = adminPass === ADMIN_PASSWORD;

  const createRoom = async () => {
    if (!initial.trim()) { Alert.alert('Enter your initial first'); return; }
    setLoading(true);
    const roomCode = genCode();
    const myId = genId();
    try {
      await set(ref(db, `rooms/${roomCode}`), {
        p1: { id: myId, initial: initial.toUpperCase()[0], isAdmin },
        p2: null, state: 'waiting',
        spinResult: null, todChoice: null, question: null,
        wantsImg: false, wantsLoc: false, photo: null, sharedLoc: null,
      });
      navigation.navigate('Waiting', { roomCode, myRole: 'p1', myId, isAdmin });
    } catch (e) { Alert.alert('Error', 'Could not create room.'); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!initial.trim()) { Alert.alert('Enter your initial first'); return; }
    if (code.length < 4) { Alert.alert('Enter the 4-letter room code'); return; }
    setLoading(true);
    const myId = genId();
    try {
      const snap = await get(ref(db, `rooms/${code.toUpperCase()}`));
      if (!snap.exists())  { Alert.alert('Room not found!'); setLoading(false); return; }
      if (snap.val().p2)   { Alert.alert('Room is full!');   setLoading(false); return; }
      await update(ref(db, `rooms/${code.toUpperCase()}`), {
        'p2/id': myId,
        'p2/initial': initial.toUpperCase()[0],
        'p2/isAdmin': isAdmin,
        state: 'ready',
      });
      navigation.navigate('Game', { roomCode: code.toUpperCase(), myRole: 'p2', myId, isAdmin });
    } catch (e) { Alert.alert('Error', 'Could not join room.'); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TRUTH{'\n'}OR DARE</Text>
      <Text style={styles.sub}>Play with a friend online</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab==='create' && styles.tabActive]} onPress={() => setTab('create')}>
          <Text style={[styles.tabTxt, tab==='create' && styles.tabTxtActive]}>Create Room</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab==='join' && styles.tabActive]} onPress={() => setTab('join')}>
          <Text style={[styles.tabTxt, tab==='join' && styles.tabTxtActive]}>Join Room</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.inp} placeholder="Your initial (e.g. A)"
        placeholderTextColor="rgba(255,255,255,0.2)" maxLength={1}
        value={initial} onChangeText={t => setInitial(t.toUpperCase())}
        autoCapitalize="characters" />

      {tab === 'join' && (
        <TextInput style={[styles.inp, styles.codeInp]} placeholder="ROOM CODE"
          placeholderTextColor="rgba(255,255,255,0.2)" maxLength={4}
          value={code} onChangeText={t => setCode(t.toUpperCase())}
          autoCapitalize="characters" />
      )}

      {/* Secret admin password field */}
      <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.adminToggle}>
        <Text style={styles.adminToggleTxt}>
          {showPass ? '🔒 Hide admin login' : '⚡ Admin login'}
        </Text>
      </TouchableOpacity>

      {showPass && (
        <View style={styles.adminBox}>
          <TextInput style={styles.inp}
            placeholder="Admin password"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={adminPass}
            onChangeText={setAdminPass}
            secureTextEntry={true}
          />
          {isAdmin && (
            <Text style={styles.adminGranted}>⚡ Admin access granted</Text>
          )}
        </View>
      )}

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]}
        onPress={tab === 'create' ? createRoom : joinRoom} disabled={loading}>
        <Text style={styles.btnTxt}>
          {loading ? 'Please wait…' : tab === 'create' ? 'Create Room' : 'Join Room'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07060f', alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { fontWeight: '900', fontSize: 56, color: '#ff2d78', textAlign: 'center', lineHeight: 54, marginBottom: 8 },
  sub: { color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 36 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
  tab: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(255,45,120,0.12)', borderColor: 'rgba(255,45,120,0.5)' },
  tabTxt: { color: 'rgba(255,255,255,0.35)', fontWeight: '600', fontSize: 14 },
  tabTxtActive: { color: '#ff6198' },
  inp: { width: '100%', backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16, marginBottom: 12 },
  codeInp: { fontSize: 22, letterSpacing: 10, textAlign: 'center' },
  adminToggle: { alignSelf: 'flex-start', marginBottom: 10 },
  adminToggleTxt: { color: 'rgba(255,45,120,0.6)', fontSize: 13, fontWeight: '600' },
  adminBox: { width: '100%' },
  adminGranted: { color: '#4ade80', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: -4 },
  btn: { width: '100%', backgroundColor: '#ff2d78', borderRadius: 14, padding: 16, marginTop: 8 },
  btnDisabled: { opacity: 0.4 },
  btnTxt: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16, letterSpacing: 2 },
});
