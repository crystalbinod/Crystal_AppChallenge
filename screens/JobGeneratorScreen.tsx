// screens/JobGeneratorScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
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
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
  formatJobRejectionMessage,
  getRandomJobRejectionExcuse,
  jobRejectionAlertTitle,
} from '../lib/jobRejectionExcuses';

type JobPickButtonProps = {
  label: string;
  onPress: () => void;
  disabled: boolean;
  btnW: number;
  btnH: number;
};

function JobPickButton({ label, onPress, disabled, btnW, btnH }: JobPickButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={{ width: btnW, minHeight: btnH, alignItems: 'center', marginBottom: 24, opacity: disabled ? 0.5 : 1 }}
    >
      <Image
        source={require('../assets/button.png')}
        style={{ width: btnW, height: btnH, position: 'absolute', alignSelf: 'center' }}
      />
      <Text style={{
        paddingTop: btnH * 0.3,
        marginBottom: btnH * 0.1,
        color: '#63372C',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Pixel',
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const JOB_LABELS: Record<string, string> = {
  Freelance: 'Freelance',
  Company: 'Company',
  PartTime: 'Part-Time',
};

export default function JobGeneratorScreen() {
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
  const btnH = isPortrait ? 80 : 100;

  const [pressed1, setPressed1] = useState(false);
  const [pressed2, setPressed2] = useState(false);
  const [pressed3, setPressed3] = useState(false);

  const handleJobSelection = async (
    job: string,
    chance: number,
    setPressed: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    const random = Math.random();
    if (random <= chance) {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert('Error', 'No user logged in');
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { job }, { merge: true });

        Alert.alert('Success!', `You got the ${job} job!`);
        navigation.goBack();
      } catch (err) {
        console.error('Error updating job:', err);
        Alert.alert('Error', 'Failed to set job in Firestore');
      }
    } else {
      const label = JOB_LABELS[job] ?? job;
      const excuse = getRandomJobRejectionExcuse();
      Alert.alert(
        jobRejectionAlertTitle(),
        formatJobRejectionMessage(label, excuse),
      );
      setPressed(true);
    }
  };

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

      <JobPickButton
        label="Freelance"
        btnW={btnW}
        btnH={btnH}
        disabled={pressed1}
        onPress={() => handleJobSelection('Freelance', 0.4, setPressed1)}
      />
      <JobPickButton
        label="Company"
        btnW={btnW}
        btnH={btnH}
        disabled={pressed2}
        onPress={() => handleJobSelection('Company', 0.2, setPressed2)}
      />
      <JobPickButton
        label="Part-Time"
        btnW={btnW}
        btnH={btnH}
        disabled={pressed3}
        onPress={() => handleJobSelection('PartTime', 1, setPressed3)}
      />
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
    marginBottom: 32,
    textAlign: 'center',
  },
});
