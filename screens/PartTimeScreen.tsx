// screens/PartTimeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';
import PartTimeStopwatch from '../lib/stopwatch_parttime';

type GameButtonProps = {
  label: string;
  onPress: () => void;
  btnW: number;
  btnH: number;
};

function GameButton({ label, onPress, btnW, btnH }: GameButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ width: btnW, minHeight: btnH, alignItems: 'center', marginBottom: 20 }}
    >
      <Image
        source={require('../assets/button.png')}
        style={{ width: btnW, height: btnH, position: 'absolute', alignSelf: 'center' }}
      />
      <Text style={{
        paddingTop: btnH * 0.3,
        marginBottom: btnH * 0.1,
        color: '#63372C',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Pixel',
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PartTimeScreen() {
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPortrait = height > width;
  const btnW = isPortrait ? Math.min(260, width - 64) : 220;
  const btnH = isPortrait ? 80 : 100;

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

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      try { PartTimeStopwatch.pause(); } catch (e) { /* noop */ }
    });
    return unsub;
  }, [navigation]);

  const startGame = (screen: keyof RootStackParamList) => {
    PartTimeStopwatch.start();
    navigation.navigate(screen);
  };

  const games = (
    <>
      <GameButton label="MineSweeper" btnW={btnW} btnH={btnH} onPress={() => startGame('MineSweeper')} />
      <GameButton label="Memory Game" btnW={btnW} btnH={btnH} onPress={() => startGame('Memory')} />
      <GameButton label="Finance Quiz" btnW={btnW} btnH={btnH} onPress={() => startGame('FinanceQuiz')} />
      <GameButton label="Whack-A-Mole" btnW={btnW} btnH={btnH} onPress={() => startGame('Whack-A-Mole')} />
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 16,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator
    >
      <Text style={styles.title}>Pick a Job</Text>
      <Text style={styles.session}>
        Session: {formatTime(elapsedMs)} {swRunning ? '(running)' : '(paused)'}
      </Text>

      {isPortrait ? (
        <View style={styles.portraitStack}>{games}</View>
      ) : (
        <View style={styles.landscapeGrid}>
          <View style={styles.landscapeCol}>
            <GameButton label="MineSweeper" btnW={btnW} btnH={btnH} onPress={() => startGame('MineSweeper')} />
            <GameButton label="Memory Game" btnW={btnW} btnH={btnH} onPress={() => startGame('Memory')} />
          </View>
          <View style={[styles.landscapeCol, { marginLeft: 48 }]}>
            <GameButton label="Finance Quiz" btnW={btnW} btnH={btnH} onPress={() => startGame('FinanceQuiz')} />
            <GameButton label="Whack-A-Mole" btnW={btnW} btnH={btnH} onPress={() => startGame('Whack-A-Mole')} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E5D7',
  },
  title: {
    fontSize: 36,
    fontFamily: 'Windows',
    fontWeight: 'bold',
    color: '#C97D60',
    marginBottom: 16,
    textAlign: 'center',
  },
  session: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  portraitStack: {
    width: '100%',
    alignItems: 'center',
  },
  landscapeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  landscapeCol: {
    alignItems: 'center',
  },
});
