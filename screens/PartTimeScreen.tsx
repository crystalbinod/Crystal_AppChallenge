// screens/ParttimeScreen.tsx
// screens/JobScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import PartTimeStopwatch from '../lib/stopwatch_parttime';

export default function JobScreen() {
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // display the part-time stopwatch on this parent screen
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState(false);
  useEffect(() => {
    const unsub = PartTimeStopwatch.subscribe((ms: number, running: boolean) => {
      setElapsedMs(ms);
      setSwRunning(running);
    });
    return unsub;
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Pause the part-time stopwatch when returning to this parent screen
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      try { PartTimeStopwatch.pause(); } catch (e) { /* noop */ }
    });
    return unsub;
  }, [navigation]);

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

  <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Session: {formatTime(elapsedMs)} {swRunning ? '(running)' : '(paused)'}</Text>

      {/* Part-Time Button */}
      <TouchableOpacity
        onPress= {() => { PartTimeStopwatch.start(); (navigation as any).navigate('MineSweeper'); }}
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
          MineSweeper 
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress= {() => { PartTimeStopwatch.start(); (navigation as any).navigate('Memory'); }}
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
          Memory Game 
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress= {() => { PartTimeStopwatch.start(); (navigation as any).navigate('Pong'); }}
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
          Pong
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress= {() => { PartTimeStopwatch.start(); (navigation as any).navigate('Whack-A-Mole'); }}
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
          Whack-A-Mole
        </Text>
      </TouchableOpacity>
    </View>
  );
}
