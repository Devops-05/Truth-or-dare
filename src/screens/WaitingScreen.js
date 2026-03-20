import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export default function WaitingScreen({ route, navigation }) {
  const { roomCode, myRole, myId, isAdmin } = route.params;

  useEffect(() => {
    const unsub = onValue(ref(db, `rooms/${roomCode}`), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      if (data.p2) {
        navigation.replace('Game', { roomCode, myRole, myId, isAdmin });
      }
    });
    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Share this code with your friend</Text>
      <Text style={styles.code}>{roomCode}</Text>
      <Text style={styles.waiting}>Waiting for them to join…</Text>
      <View style={styles.dots}>
        <View style={styles.dot}/>
        <View style={[styles.dot, { opacity: 0.5 }]}/>
        <View style={[styles.dot, { opacity: 0.2 }]}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07060f', alignItems: 'center', justifyContent: 'center', padding: 28 },
  label: { color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20 },
  code: { fontSize: 72, fontWeight: '900', color: '#00e5ff', letterSpacing: 16, marginBottom: 36 },
  waiting: { color: 'rgba(255,255,255,0.35)', fontSize: 15, marginBottom: 20 },
  dots: { flexDirection: 'row', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff2d78' },
});