// screens/LoginScreen.tsx
import * as React from 'react';
import { View, Text, Button, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function LoginScreen() {
   // Get the navigation object with proper typing for RootStackParamList
  // This ensures TypeScript knows 'Details' exists and accepts 'id' as a param
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Center the content in the screen
  return (
    <View style={{ 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#F2E5D7' }}>
      <Text style={{
        fontSize: 28,
        color: '#63372C',
        fontFamily: 'System' // or custom font name
     }}>Title</Text>
     <Image 
        source={require('')}
        
    
  />
      <Button title="Login" onPress={() => navigation.navigate('Main')} />
    </View>
  );
}
