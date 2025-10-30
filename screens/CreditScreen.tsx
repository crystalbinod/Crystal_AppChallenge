import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, runTransaction, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

function makeId() {
  return 'card_' + Date.now();
}

export default function CreditScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>({});
  const [creditCards, setCreditCards] = useState<Record<string, number>>({});
  const [creditLimit, setCreditLimit] = useState<number>(0);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', u.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setUser({});
        setCreditCards({});
        setCreditLimit(0);
        setLoading(false);
        return;
      }
  const data = snap.data() as any;
  setUser(data);
  const credit = data.credit ?? {};
  const cards = (credit.creditCards && typeof credit.creditCards === 'object') ? credit.creditCards : {};
  const parsed: Record<string, number> = {};
  for (const [k, v] of Object.entries(cards)) parsed[k] = Number(v) || 0;
  setCreditCards(parsed);
  setCreditLimit(Number(credit.creditLimit) || 0);
      setLoading(false);
    }, (err) => {
      console.error('credit onSnapshot', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const canApply = () => {
    const day = Number(user?.day) || 0;
    return day > 0 && (day % 15) === 0;
  };

  const computeCreditScore = (d: any) => {
    const credit = d?.credit ?? {};
    const paymentHistory = Array.isArray(credit.paymentHistory) ? credit.paymentHistory : [];
    const creditLimit = Number(credit.creditLimit) || 0;
    const lastClosingBalance = (credit.lastClosingBalance != null) ? Number(credit.lastClosingBalance) : null;
    const currentBalance = Number(credit.creditCardbill || credit.creditCardBill || 0) || 0;
    const balanceForUtil = (lastClosingBalance != null ? lastClosingBalance : currentBalance);
    const utilization = (creditLimit > 0) ? (balanceForUtil / creditLimit) : 0;
    const utilizationNorm = 1 - Math.min(1, utilization);
    const paymentsCount = paymentHistory.filter((p: any) => p && (p.type === 'credit' || p.type === 'creditCharge' || p.type === 'loan')).length;
    const expectedPayments = Math.max(1, Math.floor((Number(d?.day) || 0) / 15));
    const paymentRatio = Math.min(1, paymentsCount / expectedPayments);
    const loansMap = d?.loans ?? {};
    let totalLoan = 0;
    try {
      Object.values(loansMap).forEach((L: any) => { totalLoan += Number(L?.amount || L?.remaining || 0) || 0; });
    } catch (e) { /* noop */ }
    const loanFactor = 1 - Math.min(1, totalLoan / 10000); // assumes 10k is high burden
    const lengthYears = (Number(d?.day) || 0) / 365;
    const lengthNorm = Math.min(1, lengthYears / 5); // 5 years cap
    const combined = (paymentRatio * 0.35) + (utilizationNorm * 0.25) + (loanFactor * 0.2) + (lengthNorm * 0.2);
    const score = Math.round(300 + combined * 550);
    return Math.max(300, Math.min(850, score));
  };

  const recalcAndSave = async () => {
    try {
      const score = computeCreditScore(user || {});
      Alert.alert('Credit score', `Computed score: ${score}`);
      const u = auth.currentUser;
      if (!u) return;
      const userRef = doc(db, 'users', u.uid);
      await updateDoc(userRef, { ['credit.creditScore']: score, ['credit.creditScoreUpdatedAt']: serverTimestamp() });
      // update local snapshot state so UI reflects immediately
  setUser((prev: any) => ({ ...prev, credit: { ...(prev?.credit || {}), creditScore: score } }));
    } catch (e: any) {
      console.error('recalcAndSave error', e);
      Alert.alert('Error', e?.message || String(e));
    }
  };

  const applyForCard = async () => {
    const u = auth.currentUser;
    if (!u) return Alert.alert('Not signed in');
    const userRef = doc(db, 'users', u.uid);

  // approval chance based on signed-in user's credit score normalized from 300..850 -> 0..1
  const scoreVal = Number(user?.credit?.creditScore ?? user?.creditScore ?? 0) || 0;
  const approvalChance = Math.max(0, Math.min(1, (scoreVal - 300) / 550));
  const approved = Math.random() < approvalChance;
    if (!approved) {
      Alert.alert('Application result', 'Your credit card application was not approved.');
      return;
    }

    // generate a random limit between 100 and 2000 (you can change range)
    const limit = Math.floor(100 + Math.random() * 1900);
    const id = makeId();

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User doc missing');
        const data = snap.data() as any;
        const credit = data.credit ?? {};
        const prevLimit = Number(credit.creditLimit) || 0;
        const newLimit = prevLimit + limit;
        // write nested credit card and update credit.creditLimit field
        const updates: any = {};
        updates['credit.creditCards.' + id] = limit;
        updates['credit.creditLimit'] = newLimit;
        tx.update(userRef, updates);
      });

      Alert.alert('Approved', `Card approved with $${limit} limit.`);
    } catch (e: any) {
      console.error('applyForCard error', e);
      Alert.alert('Error', e.message || String(e));
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#63372C"/></View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Credit</Text>
    <Text style={styles.label}>Job: {user.job || '—'}</Text>
    <Text style={styles.label}>Day: {user.day ?? '—'}</Text>
    <Text style={styles.label}>Credit score: {user?.credit?.creditScore ?? user?.creditScore ?? '—'}</Text>
        <View style={{ height: 12 }} />
  <Text style={styles.label}>Credit Card Bill: ${Number(user?.credit?.creditCardbill ?? user.creditCardbill ?? 0) || 0}</Text>
  <Text style={styles.label}>Total credit limit: ${creditLimit}</Text>

        <View style={{ height: 12 }} />
        <Text style={[styles.sub, { marginBottom: 8 }]}>Your Credit Cards</Text>
        {Object.entries(creditCards).length === 0 && (
          <Text style={styles.note}>No credit cards yet.</Text>
        )}
        {Object.entries(creditCards).map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.cardText}>{k}</Text>
            <Text style={styles.cardText}>Limit: ${v}</Text>
          </View>
        ))}

        <View style={{ height: 16 }} />
        {canApply() ? (
          <TouchableOpacity style={styles.applyBtn} onPress={applyForCard}>
            <Text style={styles.applyText}>Apply for new credit card +</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.note}>New credit card applications available every 15 days.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2E5D7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#63372C', margin: 12, padding: 16, borderRadius: 12 },
  title: { fontSize: 28, color: '#C97D60', fontFamily: 'Windows', fontWeight: 'bold' },
  label: { color: '#fff', fontFamily: 'Pixel', marginTop: 6 },
  sub: { color: '#fff', fontFamily: 'Pixel', fontSize: 16 },
  note: { color: '#fff', fontFamily: 'Pixel', opacity: 0.9 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  cardText: { color: '#fff', fontFamily: 'Pixel' },
  applyBtn: { backgroundColor: '#C97D60', padding: 12, borderRadius: 8, marginTop: 8, alignItems: 'center' },
  applyText: { color: '#fff', fontFamily: 'Pixel', fontWeight: '700' },
});
