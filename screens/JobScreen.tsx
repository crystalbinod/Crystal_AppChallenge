// screens/JobScreen.tsx
import * as React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';



export default function JobScreen() {


  const [fontsLoaded] = useFonts({
      'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
      'Windows': require('../assets/windows-bold.ttf'),
      'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
      'Pixel': require('../assets/pixel.ttf'),
    });
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    

    // Center the content in the screen
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2E5D7' }}>
      <Text>Job</Text>
      <TouchableOpacity
                onPress={() => navigation.navigate('Job1')}
                activeOpacity={0.7}
              >
                <Image 
                  source={require('../assets/button.png')}
                  style={{
                    width: 200,
                    height: 100,
                    position: 'absolute',
                    alignSelf: 'center', 
                  }}
                />
                <Text style={{
                  paddingTop: 30,
                  marginBottom: 30,
                  color: '#63372C',
                  fontSize: 20,
                  fontWeight: "bold",
                  fontFamily: "Pixel",
                }}>
                  Job 1 
                </Text>
              </TouchableOpacity>
    </View>
  );
}