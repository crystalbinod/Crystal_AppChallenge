import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../lib/firebase';
import {
  doc,
  onSnapshot,
  runTransaction,
  deleteField,
} from 'firebase/firestore';

function sanitizeKey(raw: string) {
  return raw.trim().replace(/\s+/g, '_').replace(/\./g, '_');
}

export default function CheckingScreen() {
  const [loading, setLoading] = useState(true);
  const [checkingMap, setCheckingMap] = useState<Record<string, number>>({});
  const [total, setTotal] = useState<number>(0);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('0');

  // Editing state per key
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingValue, setEditingValue] = useState('0');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setCheckingMap({});
        setTotal(0);
        setLoading(false);
        return;
      }
      const data = snap.data() as any;
      const liquid = data?.liquidMoney ?? {};
      const checking = (liquid.checkingAccount && typeof liquid.checkingAccount === 'object')
        ? (liquid.checkingAccount as Record<string, any>)
        : {};

      const parsed: Record<string, number> = {};
      for (const [k, v] of Object.entries(checking)) {
        parsed[k] = Number(v) || 0;
      }
      setCheckingMap(parsed);
      // Show the grand total for checking accounts only (sum of checkingAccount fields)
      const checkingSum = Object.values(parsed).reduce((s, n) => s + (Number(n) || 0), 0);
      setTotal(checkingSum);
      setLoading(false);
    }, (err) => {
      console.error('checking onSnapshot error', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const addAccount = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Not signed in');

    const key = sanitizeKey(newName || 'checking_account_' + Date.now());
    const valueNum = Math.floor(Number(newValue) || 0);

    if (!key) return Alert.alert('Invalid name');

    const userRef = doc(db, 'users', user.uid);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User doc missing');
        const data = snap.data() as any;
        const liquid = data?.liquidMoney ?? {};
        const prevTotal = Number(liquid.total) || 0;

        // compute current accounts sum from server values
        const checkingMap = (liquid.checkingAccount && typeof liquid.checkingAccount === 'object') ? liquid.checkingAccount : {};
        const savingsMap = (liquid.savingsAccount && typeof liquid.savingsAccount === 'object') ? liquid.savingsAccount : {};

        const sumValues = (m: any) => Object.values(m || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
        const currentAccountsSum = sumValues(checkingMap) + sumValues(savingsMap);
        const newAccountsSum = currentAccountsSum + valueNum;

        if (newAccountsSum > prevTotal) {
          throw new Error('Adding this account would exceed your liquidMoney.total. Reduce value or increase total first.');
        }

        // set new nested field only; do NOT modify liquidMoney.total here
        tx.update(userRef, {
          ['liquidMoney.checkingAccount.' + key]: valueNum,
        });
      });

      setNewName('');
      setNewValue('0');
    } catch (e: any) {
      console.error('addAccount error', e);
      Alert.alert('Error', e.message || String(e));
    }
  };

  const saveEdited = async (oldKey: string) => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Not signed in');
    const userRef = doc(db, 'users', user.uid);

    const safeNewKey = sanitizeKey(editingName || oldKey);
    const newValNum = Math.floor(Number(editingValue) || 0);
    const oldValNum = checkingMap[oldKey] || 0;

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User doc missing');
        const data = snap.data() as any;
        const liquid = data?.liquidMoney ?? {};
        const prevTotal = Number(liquid.total) || 0;
        // compute current accounts sum from server values
        const checkingMap = (liquid.checkingAccount && typeof liquid.checkingAccount === 'object') ? liquid.checkingAccount : {};
        const savingsMap = (liquid.savingsAccount && typeof liquid.savingsAccount === 'object') ? liquid.savingsAccount : {};
        const sumValues = (m: any) => Object.entries(m || {}).reduce((s: number, [k, v]: any) => {
          // if this is the key we're editing, substitute the new value
          if (k === oldKey) return s + (newValNum || 0);
          return s + (Number(v) || 0);
        }, 0);
        const currentAccountsSum = sumValues(checkingMap) + Object.values(savingsMap || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0);

        if (currentAccountsSum > prevTotal) {
          throw new Error('Saving this change would exceed your liquidMoney.total. Reduce value or increase total first.');
        }

        const updates: any = {};
        if (safeNewKey !== oldKey) {
          updates['liquidMoney.checkingAccount.' + safeNewKey] = newValNum;
          updates['liquidMoney.checkingAccount.' + oldKey] = deleteField();
        } else {
          updates['liquidMoney.checkingAccount.' + oldKey] = newValNum;
        }

        tx.update(userRef, updates);
      });

      setEditingKey(null);
    } catch (e: any) {
      console.error('saveEdited error', e);
      Alert.alert('Error', e.message || String(e));
    }
  };

  const deleteAccount = async (key: string) => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Not signed in');
    const userRef = doc(db, 'users', user.uid);

    const oldValNum = checkingMap[key] || 0;

    try {
      // Deleting an account should NOT change liquidMoney.total (total remains authoritative)
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User doc missing');
        const updates: any = {};
        updates['liquidMoney.checkingAccount.' + key] = deleteField();
        tx.update(userRef, updates);
      });
    } catch (e: any) {
      console.error('deleteAccount error', e);
      Alert.alert('Error', e.message || String(e));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#63372C" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Checking Accounts</Text>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total (stored):</Text>
          <Text style={styles.totalValue}>${total}</Text>
        </View>

        <View style={{ marginTop: 12 }}>
          {Object.entries(checkingMap).length === 0 && (
            <Text style={styles.empty}>No checking accounts yet. Add one below.</Text>
          )}

          {Object.entries(checkingMap).map(([k, v]) => (
            <View key={k} style={styles.row}>
              {editingKey === k ? (
                <>
                  <TextInput
                    style={styles.inputSmall}
                    value={editingName}
                    onChangeText={setEditingName}
                    placeholder="field name"
                  />
                  <TextInput
                    style={styles.inputSmall}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => saveEdited(k)}
                  >
                    <Text style={styles.btnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setEditingKey(null)}
                  >
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{k}</Text>
                    <Text style={styles.rowValue}>${v}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                      setEditingKey(k);
                      setEditingName(k);
                      setEditingValue(String(v));
                    }}
                  >
                    <Text style={styles.btnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() =>
                      Alert.alert('Delete', `Delete ${k}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteAccount(k) },
                      ])
                    }
                  >
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="New field name"
          />
          <TextInput
            style={styles.inputSmall}
            value={newValue}
            onChangeText={setNewValue}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addAccount}>
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2E5D7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    margin: 18,
    backgroundColor: '#63372C',
    borderRadius: 20,
    padding: 16,
  },
  title: { fontSize: 32, color: '#C97D60', fontFamily: 'Windows', fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  totalLabel: { color: '#fff', fontFamily: 'Pixel' },
  totalValue: { color: '#fff', fontFamily: 'Pixel', fontSize: 18 },
  empty: { color: '#fff', marginTop: 8, fontFamily: 'Pixel' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  rowName: { color: '#fff', fontFamily: 'Pixel', fontSize: 16 },
  rowValue: { color: '#fff', fontFamily: 'Pixel', fontSize: 14 },
  input: { backgroundColor: '#fff', padding: 8, borderRadius: 8, flex: 1, marginRight: 8 },
  inputSmall: { backgroundColor: '#fff', padding: 8, borderRadius: 8, width: 120, marginRight: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  addBtn: { backgroundColor: '#C97D60', padding: 10, borderRadius: 8 },
  editBtn: { backgroundColor: '#C97D60', padding: 8, borderRadius: 6, marginLeft: 8 },
  deleteBtn: { backgroundColor: '#ff5c5c', padding: 8, borderRadius: 6, marginLeft: 8 },
  saveBtn: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 6, marginLeft: 8 },
  cancelBtn: { backgroundColor: '#777', padding: 8, borderRadius: 6, marginLeft: 8 },
  btnText: { color: '#fff', fontFamily: 'Pixel' },
});
