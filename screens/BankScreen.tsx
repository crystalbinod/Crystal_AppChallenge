// screens/BankScreen.tsx
import React, { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BankScreen() {
  const insets = useSafeAreaInsets();
  const [total, setTotal] = useState<number>(0);
  const [totalsByMap, setTotalsByMap] = useState<{ [k: string]: number }>({});
  const [creditCardBill, setCreditCardBill] = useState<number>(0);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const liquid = data.liquidMoney;
          const credit = data.credit ?? {};
          const ccBill = Number(credit.creditCardBill ?? credit.creditCardbill ?? 0) || 0;
          setCreditCardBill(ccBill);
          setCreditScore(
            typeof credit.creditScore === 'number'
              ? credit.creditScore
              : credit.creditScore
                ? Number(credit.creditScore)
                : null,
          );
          setCreditLimit(
            typeof credit.creditLimit === 'number'
              ? credit.creditLimit
              : credit.creditLimit
                ? Number(credit.creditLimit)
                : null,
          );

          if (liquid && typeof liquid === 'object') {
            const maybeTotal = (liquid as any).total;
            const byMap: { [k: string]: number } = {};
            let grand = 0;

            const sumValues = (obj: any) => {
              let s = 0;
              if (obj == null) return 0;
              if (obj instanceof Map) {
                for (const v of obj.values()) {
                  if (v && typeof v === 'object') s += Number(v.balance ?? v.amount ?? 0) || 0;
                  else s += Number(v) || 0;
                }
                return s;
              }
              if (Array.isArray(obj)) {
                for (const v of obj) {
                  if (v && typeof v === 'object') s += Number(v.balance ?? v.amount ?? 0) || 0;
                  else s += Number(v) || 0;
                }
                return s;
              }
              if (typeof obj === 'object') {
                for (const v of Object.values(obj)) {
                  if (v && typeof v === 'object') s += Number((v as any).balance ?? (v as any).amount ?? 0) || 0;
                  else s += Number(v) || 0;
                }
                return s;
              }
              return Number(obj) || 0;
            };

            for (const [k, v] of Object.entries(liquid)) {
              if (k === 'total') continue;
              const sum = sumValues(v);
              byMap[k] = sum;
              grand += sum;
            }

            setTotalsByMap(byMap);

            if (typeof maybeTotal === 'number') {
              setTotal(maybeTotal);
            } else if (typeof maybeTotal === 'string' && !isNaN(Number(maybeTotal))) {
              setTotal(Number(maybeTotal));
            } else {
              setTotal(grand);
            }
          } else {
            setTotalsByMap({});
            setTotal(0);
          }
        }
      }
    };

    fetchData();
  }, [auth.currentUser?.uid]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 40,
      }}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Bank Summary</Text>

        <Text style={styles.label}>
          Liquid money / easy access cash: ${total}
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Credit card bill: ${creditCardBill.toFixed(2)}</Text>
          <Text style={styles.label}>Credit score: {creditScore ?? '—'}</Text>
          <Text style={styles.label}>
            Credit limit: {creditLimit != null ? `$${creditLimit.toFixed(2)}` : '—'}
          </Text>
        </View>

        <View style={styles.section}>
          {Object.entries(totalsByMap).map(([k, v]) => (
            <Text key={k} style={styles.label}>
              {k}: ${v}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2E5D7' },
  card: {
    margin: 18,
    backgroundColor: '#63372C',
    borderRadius: 20,
    padding: 16,
  },
  title: {
    fontSize: 32,
    color: '#C97D60',
    fontFamily: 'Windows',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    color: '#fff',
    fontFamily: 'Pixel',
    fontSize: 16,
    marginTop: 6,
  },
  section: { marginTop: 12 },
});
