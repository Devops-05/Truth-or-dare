import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminScreen from './src/screens/AdminScreen';
import ConsentScreen from './src/screens/ConsentScreen';
import GameScreen from './src/screens/GameScreen';
import HomeScreen from './src/screens/HomeScreen';
import WaitingScreen from './src/screens/WaitingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Consent"  component={ConsentScreen} />
        <Stack.Screen name="Home"     component={HomeScreen} />
        <Stack.Screen name="Waiting"  component={WaitingScreen} />
        <Stack.Screen name="Game"     component={GameScreen} />
        <Stack.Screen name="Admin"    component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}