// screens/JobScreen.tsx
import * as React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  formatJobRejectionMessage,
  getRandomJobRejectionExcuse,
  jobRejectionAlertTitle,
} from '../lib/jobRejectionExcuses';

const JOB_SCREEN_LABELS: Partial<Record<keyof RootStackParamList, string>> = {
  PartTime: 'Part-Time',
  Freelance: 'Freelance',
  Company: 'Company',
};

function hasNoJob(job: unknown): boolean {
  if (job == null) return true;
  const value = String(job).trim();
  return value === '' || value.toLowerCase() === 'none';
}

type JobButtonProps = {
  label: string;
  onPress: () => void;
  btnW: number;
  btnH: number;
  spacingAfter?: number;
};

function JobButton({ label, onPress, btnW, btnH, spacingAfter }: JobButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.jobBtnWrap,
        { width: btnW, minHeight: btnH },
        spacingAfter ? { marginBottom: spacingAfter } : null,
      ]}
    >
      <Image
        source={require('../assets/button.png')}
        style={{
          width: btnW,
          height: btnH,
          position: 'absolute',
          alignSelf: 'center',
        }}
      />
      <Text style={[styles.jobBtnText, { paddingTop: btnH * 0.3, marginBottom: btnH * 0.1 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function JobScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPortrait = height > width;
  const landscapeGap = 80;
  const btnW = isPortrait
    ? Math.min(260, width - 96)
    : Math.min(255, Math.floor((width - landscapeGap - 48) / 2));
  const btnH = isPortrait ? 80 : 100;

  const CheckConditions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user signed in');
        return false;
      }

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const day = Number(data.day) || 0;

        if (data.dead) {
          Alert.alert('Cannot select job', 'Your character has died.');
          return false;
        }

        if (hasNoJob(data.job)) {
          navigation.navigate('JobGenerator');
          return true;
        }

        if ((day - 1) % 15 === 0) {
          navigation.navigate('JobGenerator');
          return true;
        }

        Alert.alert(
          'Job selection closed',
          'You already have a job. New job offers appear every 15 days.'
        );
      } else {
        console.log('No user document found');
      }

      return false;
    } catch (error) {
      console.error('Error checking conditions:', error);
      return false;
    }
  };

  const navigateToJob = async (screen: keyof RootStackParamList) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user signed in');
        return false;
      }

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const job = data.job;

        if (job == String(screen)) {
          navigation.navigate(screen);
          return true;
        }

        const label = JOB_SCREEN_LABELS[screen] ?? String(screen);
        const excuse = getRandomJobRejectionExcuse();
        Alert.alert(
          jobRejectionAlertTitle(),
          formatJobRejectionMessage(label, excuse),
        );
      } else {
        console.log('No user document found');
      }

      return false;
    } catch (error) {
      console.error('Error checking conditions:', error);
      return false;
    }
  };

  const portraitButtons = (
    <View style={styles.portraitStack}>
      <JobButton label="Job Selection" btnW={btnW} btnH={btnH} spacingAfter={32} onPress={() => { CheckConditions(); }} />
      <JobButton label="Part-Time" btnW={btnW} btnH={btnH} spacingAfter={32} onPress={() => { navigateToJob('PartTime'); }} />
      <JobButton label="Freelance" btnW={btnW} btnH={btnH} spacingAfter={32} onPress={() => { navigateToJob('Freelance'); }} />
      <JobButton label="Company" btnW={btnW} btnH={btnH} onPress={() => { navigateToJob('Company'); }} />
    </View>
  );

  const landscapeButtons = (
    <View style={[styles.landscapeGrid, { gap: landscapeGap }]}>
      <View style={styles.landscapeCol}>
        <JobButton label="Job Selection" btnW={btnW} btnH={btnH} spacingAfter={72} onPress={() => { CheckConditions(); }} />
        <JobButton label="Part-Time" btnW={btnW} btnH={btnH} onPress={() => { navigateToJob('PartTime'); }} />
      </View>
      <View style={styles.landscapeCol}>
        <JobButton label="Freelance" btnW={btnW} btnH={btnH} spacingAfter={72} onPress={() => { navigateToJob('Freelance'); }} />
        <JobButton label="Company" btnW={btnW} btnH={btnH} onPress={() => { navigateToJob('Company'); }} />
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: isPortrait ? 12 : 20,
        alignItems: 'center',
      }}
    >
      <Text style={styles.title}>Jobs</Text>

      {isPortrait ? (
        <View style={styles.brownPanel}>{portraitButtons}</View>
      ) : (
        landscapeButtons
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
    fontSize: 32,
    color: '#C97D60',
    fontFamily: 'Windows',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  brownPanel: {
    width: '100%',
    backgroundColor: '#c78e71ff',
    borderRadius: 22,
    borderWidth: 5,
    borderColor: '#63372C',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  portraitStack: {
    width: '100%',
    alignItems: 'center',
  },
  landscapeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 8,
  },
  landscapeCol: {
    alignItems: 'center',
    flexShrink: 0,
  },
  jobBtnWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  jobBtnText: {
    color: '#63372C',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Pixel',
    textAlign: 'center',
  },
});
