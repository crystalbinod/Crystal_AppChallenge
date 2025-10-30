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
import FreelanceStopwatch from '../lib/stopwatch_freelance';

export default function JobScreen() {
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // show freelance stopwatch session time (mm:ss)
  const [fwMs, setFwMs] = useState<number>(0);
  const [fwRunning, setFwRunning] = useState<boolean>(false);

  useEffect(() => {
    const unsub = FreelanceStopwatch.subscribe((ms: number, running: boolean) => {
      setFwMs(ms);
      setFwRunning(Boolean(running));
    });
    return unsub;
  }, []);

  const formatMs = (ms: number) => {
    const totalSec = Math.floor((ms || 0) / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // When this screen regains focus (user returned from a freelance game), pause the freelance stopwatch
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      // pause the freelance stopwatch when returning to the freelance parent screen
      try { FreelanceStopwatch.pause(); } catch (e) { /* noop */ }
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

      {/* Freelance session timer */}
      <Text style={{
        fontSize: 20,
        fontFamily: 'Pixel',
        color: '#63372C',
        marginBottom: 20,
      }}>
        Session: {formatMs(fwMs)} {fwRunning ? '(running)' : ''}
      </Text>

      {/* Part-Time Button */}
            <TouchableOpacity
              onPress= {() => { FreelanceStopwatch.start(); (navigation as any).navigate('snakegame'); }}
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
                Snake Game 
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress= {() => { FreelanceStopwatch.start(); (navigation as any).navigate('Cup-Pong'); }}
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
                Cup-Pong
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress= {() => { FreelanceStopwatch.start(); (navigation as any).navigate('FlappyBird'); }}
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
                Flappy Bird 
              </Text>
            </TouchableOpacity>

    </View>
  );
}
