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
import FreelanceStopwatch from '../lib/stopwatch_freelance';

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

export default function FreelanceScreen() {
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
  const btnW = isPortrait ? Math.min(260, width - 64) : 200;
  const btnH = isPortrait ? 80 : 90;

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

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      try { FreelanceStopwatch.pause(); } catch (e) { /* noop */ }
    });
    return unsub;
  }, [navigation]);

  const startGame = (screen: string) => {
    FreelanceStopwatch.start();
    (navigation as any).navigate(screen);
  };

  const games = (
    <>
      <GameButton label="Budget Sorter" btnW={btnW} btnH={btnH} onPress={() => startGame('BudgetSorter')} />
      <GameButton label="Cup-Pong" btnW={btnW} btnH={btnH} onPress={() => startGame('Cup-Pong')} />
      <GameButton label="Flappy Bird" btnW={btnW} btnH={btnH} onPress={() => startGame('FlappyBird')} />
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + (isPortrait ? 40 : 56),
        paddingHorizontal: 16,
        alignItems: 'center',
        flexGrow: 1,
        justifyContent: isPortrait ? 'flex-start' : 'center',
        minHeight: isPortrait ? undefined : height - insets.top - insets.bottom,
      }}
      showsVerticalScrollIndicator
    >
      <Text style={styles.title}>Pick a Job</Text>
      <Text style={styles.session}>
        Session: {formatMs(fwMs)} {fwRunning ? '(running)' : '(paused)'}
      </Text>

      {isPortrait ? (
        <View style={styles.portraitStack}>{games}</View>
      ) : (
        <View style={styles.landscapeLayout}>
          <View style={styles.landscapeRow}>
            <View style={styles.landscapeCol}>
              <GameButton label="Budget Sorter" btnW={btnW} btnH={btnH} onPress={() => startGame('BudgetSorter')} />
              <GameButton label="Cup-Pong" btnW={btnW} btnH={btnH} onPress={() => startGame('Cup-Pong')} />
            </View>
            <View style={[styles.landscapeCol, styles.landscapeColRight]}>
              <GameButton label="Flappy Bird" btnW={btnW} btnH={btnH} onPress={() => startGame('FlappyBird')} />
            </View>
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
  landscapeLayout: {
    width: '100%',
    alignItems: 'center',
  },
  landscapeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  landscapeCol: {
    alignItems: 'center',
  },
  landscapeColRight: {
    marginLeft: 40,
    paddingTop: 45,
  },
});
