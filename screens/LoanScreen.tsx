// screens/InvestmentScreen.tsx
import * as React from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { useFonts } from 'expo-font';

export default function LoanScreen() {
  const [fontsLoaded] = useFonts({
    'Windows': require('../assets/windows-bold.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });

  const [userData, setUserData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [amount, setAmount] = React.useState<string>('100');
  const [termMonths, setTermMonths] = React.useState<string>('12');
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    const u = auth.currentUser;
    if (!u) { setUserData(null); return; }
    const ref = doc(db, 'users', u.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setUserData(snap.exists() ? snap.data() : null);
    }, (e) => { console.error('LoanScreen onSnapshot', e); });
    return () => unsub();
  }, []);

  const parseNumber = (v: string) => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const pickInterestRateForScore = (score: number | null) => {
    const s = typeof score === 'number' ? score : 600;
    if (s >= 750) return 5;
    if (s >= 700) return 8;
    if (s >= 650) return 12;
    if (s >= 600) return 18;
    return 25;
  };

  const calcMonthlyPayment = (principal: number, annualPct: number, months: number) => {
    if (months <= 0) return 0;
    const r = annualPct / 100 / 12;
    if (r === 0) return +(principal / months).toFixed(2);
    const payment = (r * principal) / (1 - Math.pow(1 + r, -months));
    return +payment.toFixed(2);
  };

  const applyForLoan = async () => {
    const amt = Math.round(parseNumber(amount));
    const months = Math.round(parseNumber(termMonths));
    if (!auth.currentUser) return Alert.alert('Not signed in');
    if (amt <= 0) return Alert.alert('Amount must be > 0');
    if (months <= 0) return Alert.alert('Term (months) must be > 0');

    setLoading(true);
    setStatus(null);
    try {
      const u = auth.currentUser!;
      const userRef = doc(db, 'users', u.uid);
      const result = await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User doc missing');
        const data = snap.data() as any;

        const credit = data.credit ?? {};
        const creditScore = typeof credit.creditScore === 'number' ? credit.creditScore : null;
        const creditLimit = Number(credit.creditLimit) || 100;

        // approval chance depends on score and size
        const score = creditScore ?? 600;
        // base chance scaled from 300..850 -> 0..1
        const baseChance = Math.min(0.95, Math.max(0.05, (score - 300) / 550));
        // size penalty: loan larger than creditLimit reduces chance
        const sizeRatio = amt / Math.max(1, creditLimit);
        const sizePenalty = Math.min(0.5, Math.max(0, (sizeRatio - 0.5) / 5));
        const chance = Math.max(0.02, baseChance - sizePenalty);

        const approved = Math.random() < chance;

        if (!approved) {
          return { approved: false, chance };
        }

  const interestRate = pickInterestRateForScore(creditScore);
  const monthlyPayment = calcMonthlyPayment(amt, interestRate, months);

  // create a new loan entry under loans with a unique key
  const loanId = `loan_${Date.now()}`;
  const updates: any = {};
  updates[`loans.${loanId}.amount`] = amt;
  updates[`loans.${loanId}.interestRate`] = interestRate;
  updates[`loans.${loanId}.termMonths`] = months;
  updates[`loans.${loanId}.monthlyPayment`] = monthlyPayment;

  // compute total owed (sum of monthly payments over the term) — treat monthlyPayment as per-period
  const totalOwed = Math.round(monthlyPayment * months * 100) / 100;
  updates[`loans.${loanId}.remaining`] = totalOwed;

    // add funds to liquidMoney.total and first checking account if present
        const liquid = data.liquidMoney ?? {};
        const prevTotal = Number(liquid.total) || 0;
        updates['liquidMoney.total'] = prevTotal + amt;
        const checking = (liquid.checkingAccount && typeof liquid.checkingAccount === 'object') ? liquid.checkingAccount : {};
        const firstKey = Object.keys(checking)[0] ?? null;
        if (firstKey) {
          const prev = Number(checking[firstKey]) || 0;
          updates['liquidMoney.checkingAccount.' + firstKey] = prev + amt;
        }

        tx.update(userRef, updates);
        return { approved: true, interestRate, monthlyPayment, loanId };
      });
      if (result.approved) {
        setStatus(`Approved — loan id ${result.loanId}, rate ${result.interestRate}% APR, monthly $${result.monthlyPayment}`);
      } else {
        setStatus(`Application denied (probability ${Math.round((result as any).chance * 100)}%)`);
      }
    } catch (e: any) {
      console.error('applyForLoan', e);
      Alert.alert('Loan error', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const creditScore = userData?.credit?.creditScore ?? null;
  const creditLimit = Number(userData?.credit?.creditLimit) || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Loans</Text>
        <Text style={styles.label}>Credit score: {creditScore ?? 'N/A'}</Text>
        <Text style={styles.label}>Credit limit: ${creditLimit}</Text>

        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

        <Text style={styles.label}>Term (months)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={termMonths} onChangeText={setTermMonths} />

        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={applyForLoan} style={styles.button} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Apply</Text>}
        </TouchableOpacity>

        {status ? <Text style={{ marginTop: 12 }}>{status}</Text> : null}

        {/* Existing loans */}
        {userData?.loans ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: 'Pixel', fontWeight: '700' }}>Your loans</Text>
            {Object.entries(userData.loans).map(([id, loan]: any) => (
              <View key={id} style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8, marginTop: 8 }}>
                <Text style={{ fontFamily: 'Pixel' }}>{id}</Text>
                <Text style={{ fontFamily: 'Pixel' }}>Amount: ${loan.amount}</Text>
                <Text style={{ fontFamily: 'Pixel' }}>Rate: {loan.interestRate}%</Text>
                <Text style={{ fontFamily: 'Pixel' }}>Term: {loan.termMonths} months</Text>
                <Text style={{ fontFamily: 'Pixel' }}>Monthly: ${loan.monthlyPayment}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2E5D7' },
  card: { backgroundColor: '#fff8f3', padding: 20, borderRadius: 12, marginVertical: 8 },
  title: { fontSize: 28, color: '#63372C', fontFamily: 'Windows', marginBottom: 8 },
  label: { fontFamily: 'Pixel', color: '#333', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#C97D60', padding: 8, borderRadius: 8, marginTop: 6, fontFamily: 'Pixel', backgroundColor: '#fff' },
  button: { backgroundColor: '#C97D60', padding: 12, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: 'Pixel' },
});
