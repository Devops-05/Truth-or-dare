import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ConsentScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>TRUTH{'\n'}OR DARE</Text>
      <Text style={styles.sub}>Before you play, read this</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This app accesses</Text>
        <Text style={styles.item}>📍 Your curiosity 🧐</Text>
        <Text style={styles.item}>📷 Your smiles 😊</Text>
        <Text style={styles.item}>📞 Your intreset in play 🏄</Text>
        <Text style={styles.item}>💬 Your fun 🧩</Text>
        <Text style={styles.item}>👤 Your </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>✅ You agree that</Text>
        <Text style={styles.item}>• Both players instrest to play🧩</Text>
        <Text style={styles.item}>• you will play genuinely 🤗</Text>
        <Text style={styles.item}>• No data is shared with anyone outside this GameScreen 🔐</Text>
        <Text style={styles.item}>• You always call your friend yo join the game 😉</Text>
      </View>

      <TouchableOpacity style={styles.btn}
        onPress={() => navigation.replace('Home')}>
        <Text style={styles.btnTxt}>I UNDERSTAND &amp; AGREE</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        This app is only meant to be used between two people who both consent.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07060f' },
  content: { padding: 28, paddingTop: 60, alignItems: 'center' },
  title: { fontWeight: '900', fontSize: 52, color: '#ff2d78',
    textAlign: 'center', lineHeight: 52, marginBottom: 8 },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 13,
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 28 },
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 18, marginBottom: 16 },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 12 },
  item: { color: 'rgba(255,255,255,0.6)', fontSize: 14,
    marginBottom: 8, lineHeight: 20 },
  btn: { width: '100%', backgroundColor: '#ff2d78',
    borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 16 },
  btnTxt: { color: '#fff', textAlign: 'center',
    fontWeight: '800', fontSize: 15, letterSpacing: 2 },
  note: { color: 'rgba(255,255,255,0.2)', fontSize: 12,
    textAlign: 'center', lineHeight: 18 },
});