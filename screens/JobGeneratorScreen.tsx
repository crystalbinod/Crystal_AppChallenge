// screens/JobScreen.tsx
// screens/JobScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function JobScreen() {
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
const [pressed1, setPressed1] = useState(false);
const [pressed2, setPressed2] = useState(false);
const [pressed3, setPressed3] = useState(false);
  const handleJobSelection = async (job: string, chance: number, setPressed: React.Dispatch<React.SetStateAction<boolean>>) => {
    
    const random = Math.random();
    if (random <= chance) {
      try {
        const user = auth.currentUser;
        if (!user ) {
          Alert.alert('Error', 'No user logged in');
          
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { job }, { merge: true });

        Alert.alert('Success!', `You got the ${job} job!`);
        navigation.goBack(); // return to HomeScreen
      } catch (err) {
        console.error('Error updating job:', err);
        Alert.alert('Error', 'Failed to set job in Firestore');
      }
    } else {
      Alert.alert('Sorry!', `You didn’t get the ${job} job.`);
      setPressed(true);
    }

  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#F2E5D7', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Text style={{
        fontSize: 36,
        fontFamily: 'Windows',
        fontWeight: 'bold',
        color: '#C97D60',
        marginBottom: 40
      }}>
        Pick a Job
      </Text>

      {/* Freelance Button */}
      <TouchableOpacity
        onPress={() => handleJobSelection('Freelance', 0.4, setPressed1)}
        activeOpacity={0.7}
        disabled={pressed1}
      >
        <Image 
          source={require('../assets/button.png')}
          style={{ width: 200, height: 100, position: 'absolute', alignSelf: 'center' }}
        />
        <Text style={{
          paddingTop: 30,
          marginBottom: 30,
          color: '#63372C',
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "Pixel",
        }}>
          Freelance 
        </Text>
      </TouchableOpacity>

      {/* Company Button */}
      <TouchableOpacity
        onPress={() => handleJobSelection('Company', 0.2, setPressed2)}
        disabled={pressed2}
        activeOpacity={0.7}
      >
        <Image 
          source={require('../assets/button.png')}
          style={{ width: 200, height: 100, position: 'absolute', alignSelf: 'center' }}
        />
        <Text style={{
          paddingTop: 30,
          marginBottom: 30,
          color: '#63372C',
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "Pixel",
        }}>
          Company 
        </Text>
      </TouchableOpacity>

      {/* Part-Time Button */}
      <TouchableOpacity
        onPress={() => handleJobSelection('PartTime', 1, setPressed3)}
        disabled={pressed3}
        activeOpacity={0.7}
      >
        <Image 
          source={require('../assets/button.png')}
          style={{ width: 200, height: 100, position: 'absolute', alignSelf: 'center' }}
        />
        <Text style={{
          paddingTop: 30,
          marginBottom: 30,
          color: '#63372C',
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "Pixel",
        }}>
          Part-Time 
        </Text>
      </TouchableOpacity>
    </View>
  );
}
