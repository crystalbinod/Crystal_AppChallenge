// screens/ParttimeScreen.tsx
// screens/JobScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { auth, db } from '../lib/firebase';
import Stopwatch from '../lib/stopwatch';
import { doc, setDoc } from 'firebase/firestore';

export default function JobScreen() {
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Subscribe to shared stopwatch
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const unsub = Stopwatch.subscribe((ms, isRunning) => {
      setElapsedMs(ms);
      setRunning(isRunning);
    });
    return unsub;
  }, []);

  // pause stopwatch when returning (screen focus)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      Stopwatch.pause();
    });
    return unsub;
  }, [navigation]);

  // helper to start stopwatch then navigate
  const startAndNavigate = (screen: string) => {
    Stopwatch.start();
    navigation.navigate(screen as any);
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

      <Text style={{ marginBottom: 20, color: '#63372C', fontFamily: 'Pixel' }}>
        Session time: {formatTime(elapsedMs)} {running ? '(running)' : '(paused)'}
      </Text>

      {/* Part-Time Button */}
      
      <TouchableOpacity
                    onPress= {() => startAndNavigate('Dino')}
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
                      Dino
                    </Text>
                  </TouchableOpacity>
        <TouchableOpacity
                      onPress= {() => startAndNavigate('2048')}
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
                        2048
                      </Text>
                    </TouchableOpacity>
    </View>
  );
}
