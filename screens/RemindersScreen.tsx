import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function daysUntilDue(day: number, period: number) {
  // Use the stored day value directly to compute modulus; no -1 offset.
  const d = Number(day) || 0;
  const mod = ((d % period) + period) % period;
  return mod === 0 ? 0 : period - mod;
}

export default function RemindersScreen() {
  const navigation = useNavigation();
  const [info, setInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const u = auth.currentUser;
        if (!u) return;
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        if (!mounted) return;
        const data = snap.data() || {};

        // Read commonly-used fields with fallbacks
        const day = Number(data.day) || 0;
        const housing = data.housing ?? data.housingType ?? '';
        const ownsHouse = housing === 'house' || housing === 'own' || data.house === true;
        const ownsCar = Boolean(data.car || data.hasCar || data.ownsCar || data.carOwned);
        const food = Number(data.food) || 0;
        const checking = Number(data.checkingAccount) || Number(data.checking) || 0;
        const creditCardBill = Number(data.creditCardBill) || Number(data.creditCard) || 0;
        const utilities = Number(data.utilities ?? data.utilityLevel ?? data.utility) || null;

  const rentDays = ownsHouse ? null : daysUntilDue(day, 15);
  const creditDays = daysUntilDue(day, 15);
  const utilitiesDays = daysUntilDue(day, 30);
  const taxesDays = daysUntilDue(day, 45);
  // Loan payments every 15 days if the user has any loans
  const loansObj = data.loans ?? {};
  const loansCount = Object.keys(loansObj || {}).length;
  const loansDays = loansCount > 0 ? daysUntilDue(day, 15) : null;
  // sum loan principals and monthly payments (monthlyPayment field) — a month is 15 days in this app
  let loansTotalPrincipal = 0;
  let loansTotalPayment = 0;
  if (loansCount > 0) {
    Object.values(loansObj).forEach((L: any) => {
      loansTotalPrincipal += Number(L?.amount) || 0;
      loansTotalPayment += Number(L?.monthlyPayment) || 0;
    });
    // round payments to two decimals
    loansTotalPayment = Math.round((loansTotalPayment + Number.EPSILON) * 100) / 100;
  }

        setInfo({
          day,
          housing,
          ownsHouse,
          ownsCar,
          food,
          checking,
          creditCardBill,
          utilities,
          rentDays,
          creditDays,
          utilitiesDays,
          taxesDays,
          loansCount,
          loansDays,
          loansTotalPrincipal,
          loansTotalPayment,
        });
      } catch (e) {
        console.error('Reminders load error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const renderDue = (label: string, days: number | null, extra?: string) => {
    let text = '';
    if (days === null) text = `${label}: Not applicable`;
    else if (days === 0) text = `${label}: Due today`;
    else text = `${label}: Due in ${days} day${days === 1 ? '' : 's'}`;
    if (extra) text += ` — ${extra}`;
    return (
      <Text style={styles.reminderText} key={label}>{text}</Text>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reminders</Text>
      <ScrollView style={styles.box} contentContainerStyle={{ padding: 12 }}>
        {loading && <Text style={styles.reminderText}>Loading...</Text>}

        {!loading && (
          <>
            {renderDue('Credit card bill (every 15 days)', info.creditDays, `Amount: $${info.creditCardBill}`)}
            {renderDue('Utilities (every 30 days)', info.utilitiesDays, info.utilities != null ? `Current: ${info.utilities}` : 'Target: 40')}
            {renderDue('Taxes (every 45 days)', info.taxesDays)}
            {info.rentDays !== null ? renderDue('Rent (every 15 days)', info.rentDays) : (
              <Text style={styles.reminderText}>Rent: You own a house — no rent due.</Text>
            )}
            {/* Loan payments reminder when the user has loans */}
            {info.loansCount > 0 ? renderDue('Loan payments (every 15 days)', info.loansDays, `Loans: ${info.loansCount} — Next payment: $${info.loansTotalPayment}`) : null}

            <View style={{ height: 12 }} />
            <Text style={[styles.reminderText, { fontWeight: '700' }]}>Daily effects</Text>
            <Text style={styles.reminderText}>You lose 2 food each day.</Text>
            {typeof info.food === 'number' && (
              <Text style={styles.reminderText}>At {info.food} food, you'll run out in {Math.ceil(info.food / 2) || 0} day(s).</Text>
            )}

            {!info.ownsCar && (
              <>
                <Text style={styles.reminderText}>You lose $1 from your checking account each day (no car).</Text>
                <Text style={styles.reminderText}>Checking balance: ${info.checking} — will be depleted in {Math.ceil(info.checking) || 0} day(s).</Text>
              </>
            )}
            {info.ownsCar && (
              <Text style={styles.reminderText}>You own a car — no daily checking deduction.</Text>
            )}

            <View style={{ height: 12 }} />
            <Text style={styles.reminderText}>Calculation note: days left computed from your account 'day' field using modulus arithmetic.</Text>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E5D7',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    color: '#63372C',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'Pixel',
  },
  box: {
    width: '100%',
    backgroundColor: '#c78e71ff',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#63372C',
    marginBottom: 16,
  },
  reminderText: {
    color: '#000',
    fontFamily: 'Pixel',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#ffb5b5ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#63372C',
    fontFamily: 'Pixel',
    fontWeight: 'bold',
  },
});
