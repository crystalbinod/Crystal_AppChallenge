// screens/LearnScreen.tsx
import * as React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FinanceHelpLink from '../components/FinanceHelpLink';
import SpeakButton from '../components/SpeakButton';
import { LEARN_SCREEN_SPEECH } from '../lib/learnContent';

export default function LearnScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.title}>Game rules & finances</Text>
      <SpeakButton text={LEARN_SCREEN_SPEECH} label="Read all aloud" variant="light" />

      <Text style={styles.section}>How you earn money</Text>
      <Text style={styles.bullet}>• Company job: $200 per minute; work 4+ minutes</Text>
      <Text style={styles.bullet}>• Freelance job: $150 per minute; work 1+ minute</Text>
      <Text style={styles.bullet}>• Part-time job: $100 per minute; work 3+ minutes</Text>
      <Text style={styles.bullet}>• Press Next Day to get paid after you work enough time.</Text>

      <Text style={styles.section}>Housing & bills</Text>
      <Text style={styles.bullet}>• Rent is due every 15 days (~$200) unless you own a house.</Text>
      <Text style={styles.bullet}>• Buy a house in the Shop to stop paying rent.</Text>
      <FinanceHelpLink topic="rentLease" label="Rent vs lease explained" variant="light" />

      <Text style={styles.section}>Credit & loans</Text>
      <Text style={styles.bullet}>• Credit card bills come every 15 days. Pay on time to protect your score.</Text>
      <FinanceHelpLink topic="utilization" label="What is utilization?" variant="light" />
      <FinanceHelpLink topic="apr" label="What is APR?" variant="light" />
      <Text style={styles.bullet}>• Loans charge interest (APR). Pay installments every 15 days.</Text>
      <Text style={styles.bullet}>• Closing statement: 5 days before your bill is due — pay early to lower utilization.</Text>

      <Text style={styles.section}>Other tips</Text>
      <Text style={styles.bullet}>• Your total balance is your main money pool; checking and savings sit under it.</Text>
      <Text style={styles.bullet}>• Check Reminders for upcoming bills so you do not miss a due date.</Text>
      <Text style={styles.bullet}>• Ask Piggy on the home screen if a money word confuses you.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2E5D7' },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: 'Windows', fontSize: 28, color: '#C97D60', marginBottom: 8 },
  section: {
    fontFamily: 'Windows',
    fontSize: 18,
    marginTop: 14,
    marginBottom: 8,
    color: '#63372C',
  },
  bullet: {
    fontFamily: 'LazyDaze',
    fontSize: 15,
    marginBottom: 8,
    color: '#3d2a22',
    lineHeight: 22,
  },
});
