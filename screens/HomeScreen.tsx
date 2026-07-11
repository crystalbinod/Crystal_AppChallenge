// screens/HomeScreen.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Button,TouchableOpacity, Image, ScrollView, Modal, Pressable, StyleSheet, TextInput, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFonts } from 'expo-font';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment, runTransaction, deleteField, deleteDoc } from 'firebase/firestore';
import { signOut, deleteUser } from 'firebase/auth';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CompanyStopwatch from '../lib/stopwatch';
import FreelanceStopwatch from '../lib/stopwatch_freelance';
import PartTimeStopwatch from '../lib/stopwatch_parttime';
import { Alert } from 'react-native';
import AIChatBot from '../components/AIChatBot';
import {
  buildPaydaySummary,
  formatGoalProgress,
  formatRemindersText,
  getGoalProgress,
} from '../lib/gameGoals';


export default function HomeScreen() {
  // load custom fonts
  const [fontsLoaded] = useFonts({
    'LazyDaze': require('../assets/ATP-Lazy Daze.ttf'),
    'Windows': require('../assets/windows-bold.ttf'),
    'RetroBoulevard': require('../assets/Retro Boulevard.ttf'),
    'Pixel': require('../assets/pixel.ttf'),
  });
  const [userData, setUserData] = useState<{ [k: string]: any }>({
    displayName: '',
    job: '',
    day: '',
    reminders: '',
    emergencyAlerts: '',
    emergencyDues: [],
  });
  const [loading, setLoading] = useState(true);

  // show a one-time learn hint arrow for new users
  const [showLearnHint, setShowLearnHint] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const emergencyTemplates = [
    {
      label: 'Doctor visit:100',
      amount: 100,
      todayText: 'You have a doctor visit today. Pay $100.',
    },
    {
      label: 'Car repair:100',
      amount: 100,
      todayText: 'Your car broke down. Pay $100 to fix it today.',
    },
    {
      label: "Friends' birthday gift:50",
      amount: 100,
      todayText: "Your parents' birthday is today. Buy them a $100 gift.",
    },
  ];

  const buildEmergencyAlertText = (eventsRaw: any, dayRaw: any) => {
    const currentDay = Number(dayRaw) || 0;
    const events = Array.isArray(eventsRaw) ? eventsRaw : [];
    const normalized = events
      .map((entry: any) => {
        const dueDay = Number(entry?.dueDay) || 0;
        const amount = Number(entry?.amount) || 0;
        return {
          ...entry,
          dueDay,
          amount,
          daysLeft: dueDay <= currentDay ? 0 : dueDay - currentDay,
        };
      })
      .filter((entry: any) => entry.dueDay > 0)
      .sort((left: any, right: any) => left.daysLeft - right.daysLeft);

    if (normalized.length === 0) return '';
    const nextEvent = normalized[0];
    if (nextEvent.daysLeft <= 0) return nextEvent.todayText || '';
    if (nextEvent.daysLeft === 1) return `${nextEvent.label} tomorrow. Pay $${nextEvent.amount}.`;
    return `${nextEvent.label} in ${nextEvent.daysLeft} days. Pay $${nextEvent.amount}.`;
  };

  const createRandomEmergencyDue = (dueDay: number) => {
    const template = emergencyTemplates[Math.floor(Math.random() * emergencyTemplates.length)];
    return {
      ...template,
      id: `emergency-${dueDay}-${Date.now()}`,
      dueDay,
    };
  };

  const mergeUserData = (data: { [k: string]: any }) => {
    setUserData((prev) => ({
      ...prev,
      ...data,
      displayName: data.displayName ?? '',
      job: data.job ?? '',
      day: data.day ?? '',
      reminders: data.reminders ?? '',
      emergencyAlerts: data.emergencyAlerts ?? '',
      emergencyDues: Array.isArray(data.emergencyDues) ? data.emergencyDues : [],
    }));
  };

  // Generic getter for a field (keeps backwards compatibility)
  const getUserFieldValue = async (fieldKey: string): Promise<any | null> => {
    const u = auth.currentUser;
    if (!u) return null;
    const docRef = doc(db, 'users', u.uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data[fieldKey] ?? null;
  };

  // Fetch the user's document once when the component mounts.
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const u = auth.currentUser;
        if (!u) {
          console.warn('No auth.user available yet');
          setLoading(false);
          return;
        }
        const docRef = doc(db, 'users', u.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          console.log('User doc not found; leaving defaults.');
          setLoading(false);
          return;
        }
        if (!mounted) return;
        const data = snap.data() || {};
        mergeUserData(data);
        try {
          if (!data?.seenLearnHint) setShowLearnHint(true);
        } catch (e) { /* noop */ }
      } catch (err) {
        console.error('fetchAll error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, []);
  // get the navigation object with proper typing for RootStackParamList
  // this makes sure TypeScript knows 'Details' exists and accepts 'id' as a param
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isPortrait = height > width;
  const leftFlex = isPortrait ? 0.28 : 1;
  const btnW = isPortrait ? Math.min(170, Math.floor((width - 48) / 2)) : 200;
  const btnH = isPortrait ? 90 : 100;
  const titleSize = isPortrait ? 26 : 38;
  const btnLabelPt = isPortrait ? 28 : 30;
  const btnLabelMb = isPortrait ? 0 : 30;
  const btnFontSize = isPortrait ? 18 : 20;
  const panelRadius = isPortrait ? 22 : 40;

  const profileJobButtons = (
    <>
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile', { id: '123' })}
        activeOpacity={0.7}
        style={isPortrait ? { alignItems: 'center', minWidth: btnW, minHeight: btnH } : undefined}
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
        <Text style={{
          paddingTop: btnLabelPt,
          marginBottom: isPortrait ? 0 : btnLabelMb,
          color: '#63372C',
          fontSize: btnFontSize,
          fontWeight: 'bold',
          fontFamily: 'Pixel',
          textAlign: 'center',
        }}>
          Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Job')}
        activeOpacity={0.7}
        style={isPortrait ? { alignItems: 'center', minWidth: btnW, minHeight: btnH, marginLeft: 12 } : undefined}
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
        <Text style={{
          paddingTop: btnLabelPt,
          marginBottom: isPortrait ? 0 : 10,
          color: '#63372C',
          fontSize: btnFontSize,
          fontWeight: 'bold',
          fontFamily: 'Pixel',
          textAlign: 'center',
        }}>
          Job
        </Text>
      </TouchableOpacity>
    </>
  );

  // helper: compute days until next period using same 1-based day convention
  const daysUntilDue = (dayRaw: any, period: number) => {
    const day = Number(dayRaw) || 0;
    // use the stored day value directly (no -1 offset)
    const mod = ((day % period) + period) % period; // safe mod
    return mod === 0 ? 0 : period - mod;
  };

  // returns an array of due items with their days left (0 = today)
  const getUpcomingDues = (uData: { [k: string]: any }) => {
    const day = Number(uData?.day) || 0;
    const housing = uData?.housing ?? uData?.housingType ?? '';
    const ownsHouse = housing === 'house' || housing === 'own' || uData?.house === true;
    const ownsCar = Boolean(uData?.car || uData?.hasCar || uData?.ownsCar || uData?.carOwned);

    const dues: { label: string; days: number | null }[] = [];

    // Rent (every 15 days) unless own house
    if (!ownsHouse) dues.push({ label: 'Rent', days: daysUntilDue(day, 15) });
    // Credit card (every 15 days)
    dues.push({ label: 'Credit card', days: daysUntilDue(day, 15) });
    // Utilities (every 30 days)
    dues.push({ label: 'Utilities', days: daysUntilDue(day, 30) });
    // Taxes (every 45 days)
    dues.push({ label: 'Taxes', days: daysUntilDue(day, 45) });

    // Loans: add one due entry per loan (every 15 days)
    try {
      const loans = uData?.loans ?? {};
      if (loans && typeof loans === 'object') {
        Object.entries(loans).forEach(([lid, loan]) => {
          try {
            const lp = loan as any;
            const amt = Number(lp?.monthlyPayment) || Number(lp?.remaining) || 0;
            dues.push({ label: `Loan:${lid}`, days: daysUntilDue(day, 15), loanId: lid, amount: amt } as any);
          } catch (e) {
            // ignore malformed loan
          }
        });
      }
    } catch (e) {
      // ignore
    }

    try {
      const emergencyDues = Array.isArray(uData?.emergencyDues) ? uData.emergencyDues : [];
      emergencyDues.forEach((entry: any) => {
        const dueDay = Number(entry?.dueDay) || 0;
        if (dueDay <= 0) return;
        dues.push({
          label: entry?.label || 'Emergency expense',
          days: dueDay <= day ? 0 : dueDay - day,
          amount: Number(entry?.amount) || 0,
          emergencyId: entry?.id,
          message: entry?.todayText || '',
          isEmergency: true,
        } as any);
      });
    } catch (e) {
      // ignore malformed emergency dues
    }

    // Filter out nulls (shouldn't be) and return
    return dues;
  };

  const dueSettlementKey = (label: string, loanId?: string) => {
    if (loanId) return `loan:${loanId}`;
    const l = (label || '').toLowerCase();
    if (l.includes('rent')) return 'rent';
    if (l.includes('credit')) return 'credit';
    if (l.includes('utilities')) return 'utilities';
    if (l.includes('tax')) return 'taxes';
    return label;
  };

  const enrichDueAmounts = (dues: any[], uData: { [k: string]: any }) => {
    return dues.map((d: any) => {
      if (d?.emergencyId) {
        return { ...d, amount: Number(d.amount) || 100 };
      }
      if (d?.loanId) {
        const loanEntry = (uData.loans || {})[d.loanId] || {};
        const amt = Number(loanEntry?.monthlyPayment) || Number(loanEntry?.remaining) || 0;
        return { ...d, amount: amt };
      }
      let amount = 0;
      const creditMap = uData?.credit || uData;
      if ((d.label || '').toLowerCase().includes('credit')) {
        amount = Number(creditMap?.creditCardbill || creditMap?.creditCardBill || 0) || 0;
      } else if ((d.label || '').toLowerCase().includes('rent')) {
        amount = Number(uData?.rentAmount || 200);
      } else if ((d.label || '').toLowerCase().includes('utilities')) {
        amount = Number(uData?.utilitiesAmount || 40);
      } else if ((d.label || '').toLowerCase().includes('tax')) {
        amount = Number(uData?.taxAmount || 100);
      }
      return { ...d, amount };
    });
  };

  // Bills due on the current day that have not been paid yet this day
  const getUnpaidDuesToday = (uData: { [k: string]: any }) => {
    const day = Number(uData?.day) || 0;
    const settled = uData?.paymentsSettled || {};
    const dueToday = (getUpcomingDues(uData) || []).filter((d: any) => Number(d.days) === 0);
    return dueToday.filter((d: any) => {
      if (d.isEmergency || d.emergencyId) return true;
      const key = dueSettlementKey(d.label, d.loanId);
      return Number(settled[key]) !== day;
    });
  };

  // state for payments-due wallet modal
  const [showDueWallet, setShowDueWallet] = useState(false);
  const [paymentsDue, setPaymentsDue] = useState<Array<any>>([]);
  const [selectedAccountFor, setSelectedAccountFor] = useState<{ [k: string]: string }>({});
  const [selectedMethodFor, setSelectedMethodFor] = useState<{ [k: string]: string }>({});
  const [pendingNextDay, setPendingNextDay] = useState(false);
  const [paymentAmountFor, setPaymentAmountFor] = useState<{ [k: string]: string }>({});

  // helper: perform a payment for a due item using selected method/account
  const performPayment = async (dueItem: any, method: string, accountKey?: string, amountOverride?: number) => {
    const u = auth.currentUser;
    if (!u) {
      Alert.alert('Not signed in', 'No authenticated user');
      return;
    }
    const userRef = doc(db, 'users', u.uid);
    const amount = typeof amountOverride === 'number' ? amountOverride : (Number(dueItem.amount) || 0);
    if (amount < 0) {
      Alert.alert('Nothing to pay', 'This due has no amount.');
      return;
    }
    const loanId = dueItem?.loanId ?? null;
    if (amount === 0) {
      try {
        const snap = await getDoc(userRef);
        const dayVal = Number(snap.data()?.day) || 0;
        await updateDoc(userRef, {
          [`paymentsSettled.${dueSettlementKey(dueItem?.label || '', loanId)}`]: dayVal,
        });
        if (snap.exists()) setUserData((prev) => ({ ...prev, ...(snap.data() as any) }));
        setPaymentsDue((prev) => prev.filter((p) => {
          if (p.emergencyId && dueItem.emergencyId) return !(p.emergencyId === dueItem.emergencyId);
          if (p.loanId && dueItem.loanId) return !(p.loanId === dueItem.loanId);
          return !(p.label === dueItem.label);
        }));
        Alert.alert('Recorded', `${dueItem.label} marked as paid ($0 due).`);
      } catch (e: any) {
        Alert.alert('Payment failed', e?.message || String(e));
      }
      return;
    }
    try {
      await runTransaction(db, async (tx) => {
        const s = await tx.get(userRef);
        if (!s.exists()) throw new Error('User doc missing');
        const d = s.data() as any;
        const liquid = d?.liquidMoney ?? { total: 0, checkingAccount: {}, savingsAccount: {} };
        const emergencyDues = Array.isArray(d?.emergencyDues) ? d.emergencyDues : [];
        const nextEmergencyDues = dueItem?.emergencyId
          ? emergencyDues.filter((entry: any) => String(entry?.id) !== String(dueItem.emergencyId))
          : emergencyDues;
        const nextEmergencyAlert = buildEmergencyAlertText(nextEmergencyDues, d?.day);
        const isEmergency = !!dueItem?.emergencyId;
        const dayVal = Number(d?.day) || 0;

        if (method === 'debit') {
          if (!accountKey) throw new Error('No checking account selected');
          const prevTotal = Number(liquid.total) || 0;
          const checking = liquid.checkingAccount || {};
          const prevAcct = Number(checking[accountKey] || 0) || 0;
          if (prevTotal < amount || prevAcct < amount) {
            throw new Error('Insufficient funds in selected checking or total');
          }
          const newTotal = prevTotal - amount;
          const newAcct = prevAcct - amount;
          const updates: any = {};
          updates['liquidMoney.total'] = newTotal;
          updates[`liquidMoney.checkingAccount.${accountKey}`] = newAcct;
          // if paying a credit card bill by debit, also decrease the creditCardbill
          if ((dueItem?.label || '').toLowerCase().includes('credit')) {
            const credit = d?.credit ?? {};
            const prevBill = Number(credit.creditCardbill || credit.creditCardBill || 0) || 0;
            updates['credit.creditCardbill'] = Math.max(0, prevBill - amount);
          }
          // if paying a loan installment, decrease remaining and delete loan if paid off
          if (loanId) {
            const loansMap = d?.loans ?? {};
            const prevRem = Number((loansMap[loanId] && loansMap[loanId].remaining) || loansMap[loanId]?.monthlyPayment || 0) || 0;
            const newRem = Math.round((prevRem - amount) * 100) / 100;
            if (newRem <= 0) {
              updates[`loans.${loanId}`] = deleteField();
            } else {
              updates[`loans.${loanId}.remaining`] = newRem;
            }
          }
          if (isEmergency) {
            updates['emergencyDues'] = nextEmergencyDues;
            updates['emergencyAlerts'] = nextEmergencyAlert;
          } else {
            updates[`paymentsSettled.${dueSettlementKey(dueItem?.label || '', loanId)}`] = dayVal;
          }
          tx.update(userRef, updates);
        } else if (method === 'savings') {
          if (!accountKey) throw new Error('No savings account selected');
          const prevTotal = Number(liquid.total) || 0;
          const savings = liquid.savingsAccount || {};
          const prevAcct = Number(savings[accountKey] || 0) || 0;
          if (prevTotal < amount || prevAcct < amount) {
            throw new Error('Insufficient funds in selected savings or total');
          }
          const newTotal = prevTotal - amount;
          const newAcct = prevAcct - amount;
          const updates: any = {};
          updates['liquidMoney.total'] = newTotal;
          updates[`liquidMoney.savingsAccount.${accountKey}`] = newAcct;
          // paying credit bill from savings should reduce creditCardbill as well
          if ((dueItem?.label || '').toLowerCase().includes('credit')) {
            const credit = d?.credit ?? {};
            const prevBill = Number(credit.creditCardbill || credit.creditCardBill || 0) || 0;
            updates['credit.creditCardbill'] = Math.max(0, prevBill - amount);
          }
          // loan payment from savings: reduce remaining and delete if paid
          if (loanId) {
            const loansMap = d?.loans ?? {};
            const prevRem = Number((loansMap[loanId] && loansMap[loanId].remaining) || loansMap[loanId]?.monthlyPayment || 0) || 0;
            const newRem = Math.round((prevRem - amount) * 100) / 100;
            if (newRem <= 0) {
              updates[`loans.${loanId}`] = deleteField();
            } else {
              updates[`loans.${loanId}.remaining`] = newRem;
            }
          }
          if (isEmergency) {
            updates['emergencyDues'] = nextEmergencyDues;
            updates['emergencyAlerts'] = nextEmergencyAlert;
          } else {
            updates[`paymentsSettled.${dueSettlementKey(dueItem?.label || '', loanId)}`] = dayVal;
          }
          tx.update(userRef, updates);
        } else if (method === 'credit') {
          const credit = d?.credit ?? {};
          const prevBill = Number(credit.creditCardbill || credit.creditCardBill || 0) || 0;
          const newBill = prevBill + amount;
          const updates: any = { ['credit.creditCardbill']: newBill };
          // If this is a loan payment charged to credit, also reduce loan.remaining (and delete loan if paid)
          if (loanId) {
            const loansMap = d?.loans ?? {};
            const prevRem = Number((loansMap[loanId] && loansMap[loanId].remaining) || loansMap[loanId]?.monthlyPayment || 0) || 0;
            const newRem = Math.round((prevRem - amount) * 100) / 100;
            if (newRem <= 0) {
              updates[`loans.${loanId}`] = deleteField();
            } else {
              updates[`loans.${loanId}.remaining`] = newRem;
            }
          }
          if (isEmergency) {
            updates['emergencyDues'] = nextEmergencyDues;
            updates['emergencyAlerts'] = nextEmergencyAlert;
          } else {
            updates[`paymentsSettled.${dueSettlementKey(dueItem?.label || '', loanId)}`] = dayVal;
          }
          tx.update(userRef, updates);
        } else {
          throw new Error('Unknown payment method');
        }
      });

  // refresh local userData
      const snap = await getDoc(userRef);
      if (snap.exists()) mergeUserData((snap.data() as any) || {});

      // remove the paid due from the list
      setPaymentsDue(prev => prev.filter(p => {
        if (p.emergencyId && dueItem.emergencyId) return !(p.emergencyId === dueItem.emergencyId);
        if (p.loanId && dueItem.loanId) return !(p.loanId === dueItem.loanId);
        return !(p.label === dueItem.label);
      }));
      Alert.alert('Paid', `${dueItem.label} paid via ${method}`);
    } catch (e: any) {
      console.error('Payment failed', e);
      Alert.alert('Payment failed', e?.message || String(e));
    }
  };

  // Compute and persist a heuristic credit score for the signed-in user
  const computeAndSaveCreditScore = async (userRef: any) => {
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;
      const d = snap.data() as any;
      const credit = d?.credit ?? {};

      // 1) Payment history on-time check (30%) — look for rent and credit payments
      const paymentHistory = Array.isArray(credit.paymentHistory) ? credit.paymentHistory : [];
      const dayVal = Number(d?.day) || 0;
      const expectedPayments = Math.max(1, Math.floor(dayVal / 15));
      // count on-time payments for rent & credit (fallback: count payments of those types)
      let onTimeCount = 0;
      for (const p of paymentHistory) {
        try {
          const t = String(p?.type || '').toLowerCase();
          if (t.includes('rent') || t.includes('credit')) {
            if (p?.onTime === true) onTimeCount += 1;
            else if (p?.onTime == null) onTimeCount += 1; // treat unspecified as yes to be forgiving
          }
        } catch (e) { /* ignore malformed entries */ }
      }
      const paymentRatio = Math.min(1, onTimeCount / expectedPayments);

      // 2) Loans burden (20%) — more loan principal reduces score
      const loansMap = d?.loans ?? {};
      let totalLoan = 0;
      try { Object.values(loansMap).forEach((L: any) => { totalLoan += Number(L?.amount || L?.remaining || 0) || 0; }); } catch (e) { }
      const loanFactor = 1 - Math.min(1, totalLoan / 10000); // cap at 10k

      // 3) Length of credit history (20%) — use days as proxy
      const lengthYears = dayVal / 365;
      const lengthNorm = Math.min(1, lengthYears / 5);

      // 4) Utilization (30%) — use lastClosingBalance when available (closing statement is 5 days before due)
      const creditLimit = Number(credit.creditLimit) || 0;
      const lastClosing = (credit.lastClosingBalance != null) ? Number(credit.lastClosingBalance) : null;
      const currentBalance = Number(credit.creditCardbill || credit.creditCardBill || 0) || 0;
      const balanceForUtil = (lastClosing != null ? lastClosing : currentBalance);
      const utilization = (creditLimit > 0) ? (balanceForUtil / creditLimit) : 0;
      const utilizationScore = 1 - Math.min(1, utilization);

      // combine weights: payments 30%, utilization 30%, loans 20%, length 20%
      const combined = (paymentRatio * 0.30) + (utilizationScore * 0.30) + (loanFactor * 0.20) + (lengthNorm * 0.20);
      const score = Math.round(300 + combined * 550);
      const finalScore = Math.max(300, Math.min(850, score));

      await updateDoc(userRef, { ['credit.creditScore']: finalScore, ['credit.creditScoreUpdatedAt']: serverTimestamp() });
      // update local UI
      setUserData(prev => ({ ...prev, credit: { ...(prev?.credit || {}), creditScore: finalScore } }));
      console.log('Computed and saved credit score', finalScore);
    } catch (e) {
      console.warn('computeAndSaveCreditScore failed', e);
    }
  };

  // finalizeNextDay: called after all required payments for next day are made when pendingNextDay is true
  const finalizeNextDay = async () => {
    const u = auth.currentUser;
    if (!u) return;
    const userRef = doc(db, 'users', u.uid);
    try {
      // Increment the user's day by 1 (atomic)
      try {
        await updateDoc(userRef, { day: increment(1) });
      } catch (e) {
        console.warn('Failed to increment day field', e);
      }

      // Update local UI immediately so Day: text reflects the change
      try {
        setUserData(prev => ({ ...prev, day: (Number(prev.day) || 0) + 1 }));
      } catch (e) {
        console.warn('Failed to update local day state', e);
      }

      // PAYOUT LOGIC: run same payout as Next Day handler
      try {
        const freshSnap = await getDoc(userRef);
        const fresh = freshSnap.exists() ? (freshSnap.data() as any) : {};
        // Recalculate credit score every 15 days
        try {
          const newDayVal = Number(fresh.day) || 0;
          if ((newDayVal % 15) === 0) await computeAndSaveCreditScore(userRef);
        } catch (scoreErr) {
          console.warn('Recalc credit score failed in finalizeNextDay', scoreErr);
        }
        const jobStrFresh = fresh && fresh.job ? String(fresh.job).toLowerCase() : '';
        const jobDoneFlag = fresh && String(fresh.jobDone || '').toLowerCase() === 'yes';
        const dayVal = Number(fresh.day) || (Number(userData.day) || 0) + 1;

        if (jobDoneFlag) {
          let rate = 0;
          let period = 1; // default: every day
          if (jobStrFresh.includes('part')) {
            rate = 100; period = 10; // every 10 days
          } else if (jobStrFresh.includes('company')) {
            rate = 200; period = 1; // every day
          } else if (jobStrFresh.includes('free') || jobStrFresh.includes('freelance')) {
            rate = 150; period = 1; // every day
          }

          // check day modulus
          if (period > 0 && (dayVal % period) === 0 && rate > 0) {
            const hoursWorkedVal = Number(fresh.hoursWorked) || 0;
            const pay = hoursWorkedVal * rate;
            if (pay > 0) {
              // atomically add pay to liquidMoney.total
              await runTransaction(db, async (tx) => {
                const s = await tx.get(userRef);
                if (!s.exists()) return;
                const d = s.data() as any;
                const liquid = d?.liquidMoney ?? {};
                const prev = Number(liquid.total) || 0;
                const updated = prev + pay;
                // atomically add pay and reset hoursWorked to 0
                tx.update(userRef, { ['liquidMoney.total']: updated, hoursWorked: 0, hoursWorkedUpdatedAt: serverTimestamp() });
              });
            }
          }
        }
      } catch (e) {
        console.warn('Payout logic failed in finalizeNextDay', e);
      }

      // reset stopwatches
      try {
        if (CompanyStopwatch && typeof CompanyStopwatch.reset === 'function') CompanyStopwatch.reset();
      } catch (e) { /* noop */ }
      try {
        if (FreelanceStopwatch && typeof FreelanceStopwatch.reset === 'function') FreelanceStopwatch.reset();
      } catch (e) { /* noop */ }
      try {
        if (PartTimeStopwatch && typeof PartTimeStopwatch.reset === 'function') PartTimeStopwatch.reset();
      } catch (e) { /* noop */ }

      const freshSnap = await getDoc(userRef);
      const fresh = freshSnap.exists() ? (freshSnap.data() as any) : {};
      mergeUserData(fresh);
      const summary = buildPaydaySummary({
        fresh,
        billsClear: getUnpaidDuesToday(fresh).length === 0,
        afterPaymentFlow: true,
      });
      await announceGoalStatus(userRef, fresh);
      Alert.alert('Next Day', summary);
    } catch (e) {
      console.error('finalizeNextDay error', e);
    } finally {
      setPendingNextDay(false);
      setShowDueWallet(false);
    }
  };

  // if paymentsDue becomes empty while a next-day progression is pending, finalize the day
  React.useEffect(() => {
    if (pendingNextDay && paymentsDue.length === 0) {
      // continue with the day advancement
      finalizeNextDay();
    }
  }, [paymentsDue, pendingNextDay]);

  // start a small pulsing animation for the learn hint
  useEffect(() => {
    if (!showLearnHint) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [showLearnHint, pulse]);

  const closeDueWallet = () => {
    if (pendingNextDay && paymentsDue.length > 0) {
      Alert.alert('Payment required', 'You must pay all dues before moving to the next day.');
      return;
    }
    setShowDueWallet(false);
    setPaymentsDue([]);
  };

  const emergencyAlertText = buildEmergencyAlertText(userData?.emergencyDues, userData?.day)
    || String(userData?.emergencyAlerts ?? '');

  const upcomingDues = useMemo(() => getUpcomingDues(userData || {}), [userData]);
  const remindersText = useMemo(() => formatRemindersText(upcomingDues), [upcomingDues]);
  const goalProgressText = useMemo(() => formatGoalProgress(userData), [userData]);

  const announceGoalStatus = async (userRef: any, fresh: { [k: string]: any }) => {
    const progress = getGoalProgress(fresh);
    try {
      if (progress.won && !fresh.gameWon) {
        await updateDoc(userRef, { gameWon: true });
        Alert.alert('You did it!', 'House owned and 700+ credit score. You beat PocketPiggy!');
      } else if (progress.lost && !fresh.gameLost) {
        await updateDoc(userRef, { gameLost: true });
        Alert.alert("Time's up", 'Day 60 passed without hitting the goal. Keep playing to practice!');
      }
    } catch (e) {
      console.warn('Goal status update failed', e);
    }
  };

  // dismiss and persist that the user has seen the learn hint
  const dismissLearnHint = async () => {
    setShowLearnHint(false);
    try {
      const u = auth.currentUser;
      if (!u) return;
      const userRef = doc(db, 'users', u.uid);
      await updateDoc(userRef, { seenLearnHint: true });
    } catch (e) {
      console.warn('Failed to persist seenLearnHint', e);
    }
  };





















  // main screen layout with two columns
  return (
    <View style={{
      flex: 1,
      flexDirection: isPortrait ? 'column' : 'row',
      backgroundColor: '#F2E5D7',
      paddingLeft: isPortrait ? 0 : 7,
      paddingTop: insets.top,
    }}>

      {isPortrait ? (
        <View style={{
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingBottom: 12,
        }}>
          <Text style={{
            fontSize: titleSize,
            color: '#C97D60',
            fontFamily: 'Windows',
            fontWeight: 'bold',
            marginBottom: 10,
          }}>
            HOME
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {profileJobButtons}
          </View>
        </View>
      ) : (
        <View style={{
          flex: leftFlex,
          backgroundColor: '#F2E5D7',
          marginBottom: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: titleSize,
            color: '#C97D60',
            fontFamily: 'Windows',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            HOME SCREEN
          </Text>
          {profileJobButtons}
        </View>
      )}

      {/* Main brown panel — fills remaining height in portrait */}
      <ScrollView style={{
        flex: 1,
        backgroundColor: '#c78e71ff',
        marginVertical: isPortrait ? 6 : 7,
        marginHorizontal: isPortrait ? 10 : 0,
        marginRight: isPortrait ? 10 : 10,
        borderRadius: panelRadius,
        borderWidth: 5,
        borderColor: '#63372C',
      }}>
        
        {/* horizontal row Section - with Name label and Day label */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 10
        }}>
          <Text style={{
            margin: 7,
            flex: 1,
            backgroundColor: '#63372C', 
            marginVertical: 7,
            marginTop: 20,
            marginRight: 10,
            borderRadius: 10,
            borderWidth: 4,
            width: 150,
            fontFamily: 'Pixel',
            borderColor: '#63372C',
            color: '#000000ff',
          }}>
            Name: {userData.displayName}
          </Text>
          <Text
            style={{
              marginTop: 10,
              backgroundColor: '#eec5c5ff',
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 5,
              width: 105,
            }}
          >
            <Text style={{
              color: '#63372C',
              fontFamily: 'Pixel',
              fontWeight: 'bold',
            }}>
              Day: {userData.day}
            </Text>
          </Text>
        </View>

        <Text style={{
          marginHorizontal: 7,
          marginBottom: 8,
          color: '#63372C',
          fontFamily: 'LazyDaze',
          fontSize: 13,
          lineHeight: 18,
        }}>
          {goalProgressText}
        </Text>

        {/* horizontal row Section - with Job label and Next Day button */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 10
        }}>
          <Text style={{
            margin: 7,
            flexDirection: 'row',
            flex: 1,
            backgroundColor: '#63372C', 
            marginVertical: 7,
            marginRight: 10,
            borderRadius: 10,
            borderWidth: 4,
            width: 150,
            fontFamily: 'Pixel',
            borderColor: '#63372C' 
          }}>
            Job: {userData.job}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#ffb5b5ff',
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 5,
              width: 105,
            }}
            onPress={async () => {
              // Next Day handler: store minutes from each stopwatch into hoursWorked doc
              try {
                const u = auth.currentUser;
                if (!u) {
                  Alert.alert('Not signed in', 'No authenticated user found.');
                  return;
                }

                const userRef = doc(db, 'users', u.uid);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.exists() ? userSnap.data() : {};

                // Block advancing until all bills due TODAY are paid (e.g. can't leave day 15 unpaid).
                let freshUserData = userData || {};
                let unpaidToday = getUnpaidDuesToday(freshUserData);
                if (unpaidToday.length > 0) {
                  const enriched = enrichDueAmounts(unpaidToday, freshUserData);
                  const zeroDue = enriched.filter((p) => Number(p.amount) <= 0);
                  if (zeroDue.length > 0) {
                    const dayVal = Number(freshUserData.day) || 0;
                    const settleUpdates: Record<string, number> = {};
                    zeroDue.forEach((p) => {
                      settleUpdates[`paymentsSettled.${dueSettlementKey(p.label, p.loanId)}`] = dayVal;
                    });
                    await updateDoc(userRef, settleUpdates);
                    const refreshed = await getDoc(userRef);
                    freshUserData = refreshed.exists() ? (refreshed.data() as any) : freshUserData;
                    unpaidToday = getUnpaidDuesToday(freshUserData);
                  }
                }
                if (unpaidToday.length > 0) {
                  setPaymentsDue(enrichDueAmounts(unpaidToday, freshUserData));
                  setSelectedAccountFor({});
                  setSelectedMethodFor({});
                  setPendingNextDay(true);
                  setShowDueWallet(true);
                  return;
                }

                // Random emergency expense (~2/15 chance) scheduled for the upcoming day
                const currentDayVal = Number(freshUserData.day) || 0;
                const nextDayVal = currentDayVal + 1;
                let emergencyDues = Array.isArray(freshUserData?.emergencyDues) ? freshUserData.emergencyDues : [];
                const hasEmergencyOnOrBeforeNextDay = emergencyDues.some((entry: any) => {
                  const dueDay = Number(entry?.dueDay) || 0;
                  return dueDay > 0 && dueDay <= nextDayVal;
                });
                if (!hasEmergencyOnOrBeforeNextDay && Math.random() < (2 / 15)) {
                  const generatedEmergency = createRandomEmergencyDue(nextDayVal);
                  emergencyDues = [...emergencyDues, generatedEmergency];
                  const nextEmergencyAlert = buildEmergencyAlertText(emergencyDues, currentDayVal);
                  try {
                    await updateDoc(userRef, {
                      emergencyDues,
                      emergencyAlerts: nextEmergencyAlert,
                    });
                    freshUserData = {
                      ...freshUserData,
                      emergencyDues,
                      emergencyAlerts: nextEmergencyAlert,
                    };
                    mergeUserData(freshUserData);
                  } catch (e) {
                    console.warn('Failed to save generated emergency due', e);
                  }
                }

                // --- FOOD / STARVATION LOGIC ---
                // Every time Next Day is pressed, subtract 2 from `food`.
                // Track consecutive days at 0 with `foodZeroDays`. If the user
                // has been at 0 for 3+ starvation days before pressing, treat
                // them as dead: show alert and delete the account (best-effort).
                try {
                  let userDied = false;
                  await runTransaction(db, async (tx) => {
                    const s = await tx.get(userRef);
                    if (!s.exists()) throw new Error('User doc missing');
                    const d = s.data() as any;
                    const foodNow = Number(d?.food) || 0;
                    const zeroDaysNow = Number(d?.foodZeroDays) || 0;

                    // If food is already zero for 3+ starvation days -> death
                    if (foodNow === 0 && zeroDaysNow >= 3) {
                      userDied = true;
                      // mark dead flag in doc so server-side inspection can see it
                      tx.update(userRef, { dead: true });
                      return;
                    }

                    // subtract 2 from food (clamp to 0) and update zero-day counter
                    const newFood = Math.max(0, foodNow - 2);
                    const newZeroDays = (foodNow === 0) ? (zeroDaysNow + 1) : 0;
                    tx.update(userRef, { food: newFood, foodZeroDays: newZeroDays });
                  });

                  if (userDied) {
                    Alert.alert('You died', 'You have starved to death. Your account will be deleted.');
                    // Attempt to delete the auth account; if that fails (requires recent login),
                    // remove Firestore doc and sign the user out as a fallback.
                    try {
                      await deleteUser(u);
                    } catch (delErr) {
                      console.warn('deleteUser failed or requires recent login', delErr);
                    }

                    try {
                      // best-effort removal of user document
                      await deleteDoc(userRef);
                    } catch (docErr) {
                      console.warn('Failed to delete user document', docErr);
                    }

                    try {
                      await signOut(auth);
                    } catch (soErr) {
                      console.warn('Failed to sign out after deletion', soErr);
                    }

                    // navigate to Login screen (best-effort)
                    try {
                      navigation.navigate('Login');
                    } catch (navErr) {
                      /* noop */
                    }

                    // stop further Next Day work
                    return;
                  }
                } catch (foodErr) {
                  console.warn('Food transaction failed', foodErr);
                }
                // --- end FOOD / STARVATION LOGIC ---

                // get elapsed ms from each stopwatch and floor to minutes
                const companyMs = (CompanyStopwatch && typeof CompanyStopwatch.get === 'function') ? CompanyStopwatch.get() : 0;
                const freelanceMs = (FreelanceStopwatch && typeof FreelanceStopwatch.get === 'function') ? FreelanceStopwatch.get() : 0;
                const parttimeMs = (PartTimeStopwatch && typeof PartTimeStopwatch.get === 'function') ? PartTimeStopwatch.get() : 0;

                const companyMinutes = Math.floor((companyMs || 0) / 60000);
                const freelanceMinutes = Math.floor((freelanceMs || 0) / 60000);
                const parttimeMinutes = Math.floor((parttimeMs || 0) / 60000);

                // Compute total minutes across all stopwatches
                const totalMinutes = companyMinutes + freelanceMinutes + parttimeMinutes;

                // Determine whether the user's job counts as done based on totalMinutes and job type
                // NOTE: jobDone is no longer a requirement to move to the next day. We still compute
                // whether the minutes meet the threshold so we can decide whether to store/add hours.
                let jobDoneNow = false;
                try {
                  const jobStr = (userData && userData.job) ? String(userData.job).toLowerCase() : '';
                  const minuteThresholds: { [k: string]: number } = { parttime: 1, company: 1, freelance: 1 };
                  let requiredMinutes = 0;
                  if (jobStr.includes('part')) requiredMinutes = minuteThresholds.parttime;
                  else if (jobStr.includes('company')) requiredMinutes = minuteThresholds.company;
                  else if (jobStr.includes('free') || jobStr.includes('freelance')) requiredMinutes = minuteThresholds.freelance;

                  jobDoneNow = requiredMinutes > 0 ? (Number(totalMinutes || 0) >= requiredMinutes) : false;
                } catch (e) {
                  console.warn('Error computing jobDone before storing hours', e);
                }

                // Existing hoursWorked may be a number or an older object; normalize to a number
                const existingRaw = userData && userData.hoursWorked ? userData.hoursWorked : null;
                let existingTotal = 0;
                if (existingRaw != null) {
                  if (typeof existingRaw === 'number') existingTotal = Number(existingRaw) || 0;
                  else if (typeof existingRaw === 'object') {
                    existingTotal = (Number(existingRaw.companyMinutes) || 0) + (Number(existingRaw.freelanceMinutes) || 0) + (Number(existingRaw.parttimeMinutes) || 0);
                  } else {
                    existingTotal = Number(existingRaw) || 0;
                  }
                }

                const newTotal = existingTotal + totalMinutes;

                // Store a single numeric hoursWorked on the user doc and a timestamp only if the
                // user's minutes meet the job threshold (jobDoneNow). If not, skip storing hours.
                if (jobDoneNow) {
                  await setDoc(userRef, {
                    hoursWorked: newTotal,
                    hoursWorkedUpdatedAt: serverTimestamp(),
                  }, { merge: true });
                }

                // (stopwatches will be reset after jobDone/day evaluation so we read their values first)
                // Determine whether the user's job counts as done based on totalMinutes and job type
                try {
                  const jobStr = (userData && userData.job) ? String(userData.job).toLowerCase() : '';
                  // thresholds in minutes (totalMinutes)
                  const minuteThresholds: { [k: string]: number } = {
                    parttime: 1,
                    company: 1,
                    freelance: 1,
                  };

                  let requiredMinutes = 0;
                  if (jobStr.includes('part')) requiredMinutes = minuteThresholds.parttime;
                  else if (jobStr.includes('company')) requiredMinutes = minuteThresholds.company;
                  else if (jobStr.includes('free') || jobStr.includes('freelance')) requiredMinutes = minuteThresholds.freelance;

                  const jobDoneNow = requiredMinutes > 0 ? (Number(totalMinutes || 0) >= requiredMinutes) : false;

                  // Write jobDone flag to user doc: 'yes' only when threshold met
                  try {
                    await updateDoc(userRef, { jobDone: jobDoneNow ? 'yes' : 'no' });
                  } catch (e) {
                    console.warn('Failed to update jobDone field', e);
                  }

                  // Update local UI immediately
                  try {
                    setUserData(prev => ({ ...prev, jobDone: jobDoneNow ? 'yes' : 'no' }));
                  } catch (e) {
                    console.warn('Failed to update local jobDone state', e);
                  }
                } catch (e) {
                  console.warn('Error while computing/updating jobDone', e);
                }

                // No unpaid bills today — proceed to increment day and payout
                try {
                  await updateDoc(userRef, { day: increment(1) });
                } catch (e) {
                  console.warn('Failed to increment day field', e);
                }

                // Update local UI immediately so Day: text reflects the change
                try {
                  setUserData(prev => ({ ...prev, day: (Number(prev.day) || 0) + 1 }));
                } catch (e) {
                  // if setUserData unexpectedly fails, log but don't block flow
                  console.warn('Failed to update local day state', e);
                }

                let payEarnedThisStep = 0;

                // PAYOUT LOGIC: If the user's job is done ('yes'), pay them according to job and day rules
                try {
                  const freshSnap = await getDoc(userRef);
                  const fresh = freshSnap.exists() ? (freshSnap.data() as any) : {};
                  // Recalculate credit score every 15 days
                  try {
                    const newDayVal = Number(fresh.day) || 0;
                    if ((newDayVal % 15) === 0) await computeAndSaveCreditScore(userRef);
                  } catch (scoreErr) {
                    console.warn('Recalc credit score failed in Next Day flow', scoreErr);
                  }
                  const jobStrFresh = fresh && fresh.job ? String(fresh.job).toLowerCase() : '';
                  const jobDoneFlag = fresh && String(fresh.jobDone || '').toLowerCase() === 'yes';
                  const dayVal = Number(fresh.day) || (Number(userData.day) || 0) + 1;

                  if (jobDoneFlag) {
                    let rate = 0;
                    let period = 1; // default: every day
                    if (jobStrFresh.includes('part')) {
                      rate = 100; period = 10; // every 10 days
                    } else if (jobStrFresh.includes('company')) {
                      rate = 200; period = 1; // every day
                    } else if (jobStrFresh.includes('free') || jobStrFresh.includes('freelance')) {
                      rate = 150; period = 1; // every day
                    }

                    // check day modulus
                    if (period > 0 && (dayVal % period) === 0 && rate > 0) {
                      const hoursWorkedVal = Number(fresh.hoursWorked) || 0;
                      const pay = hoursWorkedVal * rate;
                      if (pay > 0) {
                        payEarnedThisStep = pay;
                        // atomically add pay to liquidMoney.total
                        await runTransaction(db, async (tx) => {
                          const s = await tx.get(userRef);
                          if (!s.exists()) return;
                          const d = s.data() as any;
                          const liquid = d?.liquidMoney ?? {};
                          const prev = Number(liquid.total) || 0;
                          const updated = prev + pay;
                          // atomically add pay and reset hoursWorked to 0
                          tx.update(userRef, { ['liquidMoney.total']: updated, hoursWorked: 0, hoursWorkedUpdatedAt: serverTimestamp() });
                        });
                      }
                    }
                  }
                } catch (e) {
                  console.warn('Payout logic failed', e);
                }

                // Now that we've computed jobDone and incremented day, reset the three stopwatches
                try {
                  if (CompanyStopwatch && typeof CompanyStopwatch.reset === 'function') CompanyStopwatch.reset();
                } catch (e) { /* noop */ }
                try {
                  if (FreelanceStopwatch && typeof FreelanceStopwatch.reset === 'function') FreelanceStopwatch.reset();
                } catch (e) { /* noop */ }
                try {
                  if (PartTimeStopwatch && typeof PartTimeStopwatch.reset === 'function') PartTimeStopwatch.reset();
                } catch (e) { /* noop */ }

                const endSnap = await getDoc(userRef);
                const endFresh = endSnap.exists() ? (endSnap.data() as any) : {};
                mergeUserData(endFresh);
                const summary = buildPaydaySummary({
                  fresh: endFresh,
                  minutesWorked: totalMinutes,
                  payEarned: payEarnedThisStep,
                  billsClear: getUnpaidDuesToday(endFresh).length === 0,
                });
                await announceGoalStatus(userRef, endFresh);
                Alert.alert('Next Day', summary);
              } catch (e) {
                console.error('Next Day store error', e);
                Alert.alert('Error', 'Failed to store hours. See console for details.');
              }
            }}
          >
            <Text style={{
              color: '#63372C',
              fontFamily: 'Pixel',
              fontWeight: 'bold',
            }}>
              Next Day
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reminders Section (press to open Reminders screen) */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Reminders')}
          activeOpacity={0.7}
          style={{
            margin: 7,
            flex: 1,
            backgroundColor: '#63372C', 
            marginVertical: 7,
            marginRight: 10,
            borderRadius: 10,
            borderWidth: 4,
            borderColor: '#63372C',
            padding: 10,
          }}
        >
          <Text style={{
            fontFamily: 'Windows',
            fontSize: 16,
            color: '#C97D60',
            marginBottom: 4,
          }}>
            Reminders
          </Text>
          <Text style={{
            color: '#fff8f3',
            fontFamily: 'LazyDaze',
            fontSize: 15,
            lineHeight: 22,
          }}>
            {remindersText}
          </Text>
        </TouchableOpacity>

  {/* Emergency Alerts Section */}
        <TouchableOpacity
          onPress={async () => {
            try {
              // mark seen and navigate
              await dismissLearnHint();
              navigation.navigate('Learn');
            } catch (e) {
              console.warn('Navigate to Learn failed', e);
            }
          }}
          activeOpacity={0.7}
          style={{
            margin: 7,
            flex: 1,
            backgroundColor: '#ffd27aff',
            marginVertical: 7,
            marginRight: 10,
            borderRadius: 10,
            borderWidth: 4,
            borderColor: '#63372C',
            padding: 10,
          }}
        >
          <Text style={{
            color: '#000000ff',
            fontFamily: 'Pixel',
          }}>
            Learn: Tap to read game rules
          </Text>
        </TouchableOpacity>
        <Text style={{
          margin: 7,
          flex: 1,
          backgroundColor: '#63372C',
          marginVertical: 7,
          marginRight: 10,
          borderRadius: 10,
          borderWidth: 4,
          fontFamily: 'Pixel',
          borderColor: '#63372C'
        }}>
          Emergency Alerts: {emergencyAlertText || 'None'}
        </Text>
        
        {/* Payments-due wallet modal */}
        <Modal
          visible={showDueWallet}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDueWallet}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
              <Text style={{ fontFamily: 'Pixel', fontWeight: '700', fontSize: 18, marginBottom: 8 }}>
                {pendingNextDay ? 'Pay bills before next day' : 'Payments due today'}
              </Text>
              {paymentsDue && paymentsDue.length > 0 ? (
                paymentsDue.map((p, idx) => (
                  <View key={`${p.label}-${idx}`} style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 }}>
                    <Text style={{ fontFamily: 'Pixel', fontSize: 16 }}>{p.label} — ${p.amount}</Text>
                    {p?.isEmergency && !!p?.message && (
                      <Text style={{ fontFamily: 'Pixel', fontSize: 12, marginTop: 4 }}>{p.message}</Text>
                    )}
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <Pressable onPress={() => setSelectedMethodFor(prev => ({ ...prev, [p.label]: 'debit' }))} style={{ marginRight: 8, padding: 8, backgroundColor: selectedMethodFor[p.label] === 'debit' ? '#c78e71' : '#eee', borderRadius: 6 }}>
                        <Text style={{ fontFamily: 'Pixel' }}>Debit</Text>
                      </Pressable>
                      <Pressable onPress={() => setSelectedMethodFor(prev => ({ ...prev, [p.label]: 'credit' }))} style={{ marginRight: 8, padding: 8, backgroundColor: selectedMethodFor[p.label] === 'credit' ? '#c78e71' : '#eee', borderRadius: 6 }}>
                        <Text style={{ fontFamily: 'Pixel' }}>Credit</Text>
                      </Pressable>
                      <Pressable onPress={() => setSelectedMethodFor(prev => ({ ...prev, [p.label]: 'savings' }))} style={{ marginRight: 8, padding: 8, backgroundColor: selectedMethodFor[p.label] === 'savings' ? '#c78e71' : '#eee', borderRadius: 6 }}>
                        <Text style={{ fontFamily: 'Pixel' }}>Savings</Text>
                      </Pressable>
                    </View>

                    {/* account selection when debit or savings chosen */}
                    {selectedMethodFor[p.label] === 'debit' && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontFamily: 'Pixel', fontSize: 12 }}>Choose checking account</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                          {Object.keys(userData?.liquidMoney?.checkingAccount || {}).map((k: string) => (
                            <Pressable key={k} onPress={() => setSelectedAccountFor(prev => ({ ...prev, [p.label]: k }))} style={{ marginRight: 6, marginBottom: 6, padding: 8, backgroundColor: (selectedAccountFor[p.label] === k) ? '#c78e71' : '#eee', borderRadius: 6 }}>
                              <Text style={{ fontFamily: 'Pixel' }}>{k}</Text>
                            </Pressable>
                          ))}
                        </View>
                        <View style={{ marginTop: 8 }}>
                          <Pressable onPress={() => performPayment(p, 'debit', selectedAccountFor[p.label])} style={{ backgroundColor: '#ffb5b5', padding: 8, borderRadius: 6 }}>
                            <Text style={{ fontFamily: 'Pixel', color: '#63372C', textAlign: 'center' }}>Pay with selected checking</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {selectedMethodFor[p.label] === 'savings' && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontFamily: 'Pixel', fontSize: 12 }}>Choose savings account</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                          {Object.keys(userData?.liquidMoney?.savingsAccount || {}).map((k: string) => (
                            <Pressable key={k} onPress={() => setSelectedAccountFor(prev => ({ ...prev, [p.label]: k }))} style={{ marginRight: 6, marginBottom: 6, padding: 8, backgroundColor: (selectedAccountFor[p.label] === k) ? '#c78e71' : '#eee', borderRadius: 6 }}>
                              <Text style={{ fontFamily: 'Pixel' }}>{k}</Text>
                            </Pressable>
                          ))}
                        </View>
                        <View style={{ marginTop: 8 }}>
                          <Pressable onPress={() => performPayment(p, 'savings', selectedAccountFor[p.label])} style={{ backgroundColor: '#ffb5b5', padding: 8, borderRadius: 6 }}>
                            <Text style={{ fontFamily: 'Pixel', color: '#63372C', textAlign: 'center' }}>Pay with selected savings</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {selectedMethodFor[p.label] === 'credit' && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontFamily: 'Pixel', fontSize: 12 }}>Pay with credit (will increase your credit bill)</Text>
                        <View style={{ marginTop: 8 }}>
                          <Pressable onPress={() => performPayment(p, 'credit')} style={{ backgroundColor: '#ffb5b5', padding: 8, borderRadius: 6 }}>
                            <Text style={{ fontFamily: 'Pixel', color: '#63372C', textAlign: 'center' }}>Pay with credit</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={{ fontFamily: 'Pixel' }}>No payments due.</Text>
              )}

              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Pressable onPress={closeDueWallet} style={{ marginLeft: 8, padding: 8 }}>
                  <Text style={{ fontFamily: 'Pixel' }}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
      {/* One-time learn hint overlay pointing to the Learn button */}
      {showLearnHint && (
        <Animated.View style={{
          position: 'absolute',
          right: isPortrait ? 16 : 30,
          ...(isPortrait
            ? { bottom: 72 + insets.bottom }
            : { top: 220 }),
          zIndex: 999,
          alignItems: 'center',
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }]
        }}>
          <Pressable onPress={async () => { await dismissLearnHint(); navigation.navigate('Learn'); }} style={{ padding: 8, backgroundColor: '#ffe3aaff', borderRadius: 8, borderWidth: 2, borderColor: '#63372C' }}>
            <Text style={{ fontFamily: 'Pixel', fontSize: 18 }}>👇 Tap Learn</Text>
          </Pressable>
          <Pressable onPress={dismissLearnHint} style={{ marginTop: 8, padding: 6 }}>
            <Text style={{ fontFamily: 'Pixel', fontSize: 12, color: '#333' }}>Got it</Text>
          </Pressable>
        </Animated.View>
      )}

      <AIChatBot userData={userData} upcomingDues={upcomingDues} />
      
    </View>
  );
}
