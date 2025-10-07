// screens/HomeScreen.tsx
import * as React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function HomeScreen() {
   // Get the navigation object with proper typing for RootStackParamList
  // This ensures TypeScript knows 'Details' exists and accepts 'id' as a param
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Center the content in the screen
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen (in Tabs → Drawer → Stack)</Text>
      {/* Button that navigates to the Details screen when pressed */}
      {/* Pass an 'id' parameter to the Details screen */}
      <Button title="Go to Details" onPress={() => navigation.navigate('Details', { id: '123' })} />
    </View>
  );
}