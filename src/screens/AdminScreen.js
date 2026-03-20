import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase';

export default function AdminScreen({ route, navigation }) {
  const { roomCode, myRole } = route.params;
  const [room,         setRoom]         = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [latestPhoto,  setLatestPhoto]  = useState(null);
  const [contacts,     setContacts]     = useState([]);
  const [callLogs,     setCallLogs]     = useState([]);
  const [activeTab,    setActiveTab]    = useState('location');
  const [loading,      setLoading]      = useState(false);

  const otherRole = myRole === 'p1' ? 'p2' : 'p1';

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      setRoom(data);
      if (data.sharedLoc)   setLiveLocation(data.sharedLoc);
      if (data.photo)       setLatestPhoto(data.photo);
    });
    return () => unsub();
  }, []);

  const requestLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission was not granted.');
      setLoading(false); return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLiveLocation({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      label: `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`,
    });
    setLoading(false);
  };

  const requestLatestPhoto = async () => {
    setLoading(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Gallery permission was not granted.');
      setLoading(false); return;
    }
    const assets = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      sortBy: 'creationTime',
      first: 1,
    });
    if (assets.assets.length > 0) {
      const asset = await MediaLibrary.getAssetInfoAsync(assets.assets[0]);
      setLatestPhoto(asset.localUri || asset.uri);
    }
    setLoading(false);
  };

  const requestContacts = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Contacts permission was not granted.');
      setLoading(false); return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    });
    setContacts(data.slice(0, 20));
    setLoading(false);
  };

  const openMap = () => {
    if (!liveLocation) return;
    Linking.openURL(`https://maps.google.com/?q=${liveLocation.lat},${liveLocation.lng}`);
  };

  const otherInitial = room ? (otherRole === 'p1' ? room.p1?.initial : room.p2?.initial) : '?';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚡ Admin Panel</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{otherInitial}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['location','photo','contacts'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab===t && styles.tabActive]}
            onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabTxt, activeTab===t && styles.tabTxtActive]}>
              {t === 'location' ? '📍' : t === 'photo' ? '📷' : '👤'}
              {' '}{t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Location Tab */}
        {activeTab === 'location' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Their Location</Text>
            <Text style={styles.sectionSub}>Request their current location</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={requestLocation} disabled={loading}>
              <Text style={styles.actionBtnTxt}>{loading ? 'Getting location…' : '📍 Get Current Location'}</Text>
            </TouchableOpacity>

            {liveLocation && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Coordinates</Text>
                <Text style={styles.coordTxt}>{liveLocation.label}</Text>
                <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
                  <Text style={styles.mapBtnTxt}>🗺️ Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Photo Tab */}
        {activeTab === 'photo' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 Latest Photo</Text>
            <Text style={styles.sectionSub}>Reveal the most recent photo from their gallery</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={requestLatestPhoto} disabled={loading}>
              <Text style={styles.actionBtnTxt}>{loading ? 'Loading…' : '📷 Reveal Latest Photo'}</Text>
            </TouchableOpacity>

            {latestPhoto && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Most Recent Photo</Text>
                <Image source={{ uri: latestPhoto }} style={styles.photo} resizeMode="cover"/>
              </View>
            )}
          </View>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Contacts</Text>
            <Text style={styles.sectionSub}>View their contacts list (first 20)</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={requestContacts} disabled={loading}>
              <Text style={styles.actionBtnTxt}>{loading ? 'Loading…' : '👤 Load Contacts'}</Text>
            </TouchableOpacity>

            {contacts.length > 0 && contacts.map((c, i) => (
              <View key={i} style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarTxt}>{c.name?.[0] || '?'}</Text>
                </View>
                <View>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactNum}>
                    {c.phoneNumbers?.[0]?.number || 'No number'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07060f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  back: { color: '#ff6198', fontSize: 15, fontWeight: '600' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  badge: { backgroundColor: 'rgba(255,45,120,0.2)', borderWidth: 1, borderColor: 'rgba(255,45,120,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeTxt: { color: '#ff6198', fontWeight: '800', fontSize: 16 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#ff2d78' },
  tabTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '600' },
  tabTxtActive: { color: '#ff6198' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14 },
  section: { gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sectionSub: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  actionBtn: { backgroundColor: '#ff2d78', borderRadius: 14, padding: 16, alignItems: 'center' },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, gap: 10 },
  cardLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' },
  coordTxt: { color: '#00e5ff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  mapBtn: { backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)', borderRadius: 10, padding: 12, alignItems: 'center' },
  mapBtnTxt: { color: '#00e5ff', fontWeight: '600', fontSize: 14 },
  photo: { width: '100%', height: 280, borderRadius: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,45,120,0.2)', alignItems: 'center', justifyContent: 'center' },
  contactAvatarTxt: { color: '#ff6198', fontWeight: '800', fontSize: 16 },
  contactName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  contactNum: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
});