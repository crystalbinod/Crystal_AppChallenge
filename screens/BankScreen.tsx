// screens/BankScreen.tsx
import React, { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp,getDoc} from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; 
import { View, Text, ScrollView } from 'react-native';

export default function BankScreen() {
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
            // support either camelCase or existing naming variations
            const ccBill = Number(credit.creditCardBill ?? credit.creditCardbill ?? 0) || 0;
            setCreditCardBill(ccBill);
            setCreditScore(typeof credit.creditScore === 'number' ? credit.creditScore : (credit.creditScore ? Number(credit.creditScore) : null));
            setCreditLimit(typeof credit.creditLimit === 'number' ? credit.creditLimit : (credit.creditLimit ? Number(credit.creditLimit) : null));
        if (liquid && typeof liquid === 'object') {
          // If Firestore stores a precomputed total, prefer it. Otherwise compute the sum.
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
            // skip the special 'total' property if present
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

  fetchData(); // call the async function
}, [auth.currentUser?.uid]);


  return (
    // Center the content in the screen
    <ScrollView style={{ 
                flex: 1, 
                backgroundColor: '#F2E5D7',
                flexDirection: 'column',
                
              }}>
                
                {/* column 1 */}
                <View style={{ 
            flex: 1, 
            
            backgroundColor: '#F2E5D7',
            marginBottom: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
                  <View style={{
                    marginTop:30,
                   backgroundColor:'#63372C',
                   borderRadius:30,
                   padding: 20,
                   paddingBottom: 150,
                   marginHorizontal:20,
                   width:800,
                   height:400,
                }}>
                  <Text style={{
                  fontSize: 38,
                  color: '#C97D60',
                  fontFamily: 'Windows',
                  fontWeight:"bold",
                  
                }}>
                  Bank Summary
                </Text>
                <Text style={{ color: '#fff', fontFamily: 'Pixel', fontSize: 16, marginTop: 6 }}>liquid money / easy access cash:  
                  {total}</Text>

                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: '#fff', fontFamily: 'Pixel', fontSize: 16, marginTop: 6 }}>
                    Credit card bill: ${creditCardBill.toFixed(2)}
                  </Text>
                  <Text style={{ color: '#fff', fontFamily: 'Pixel', fontSize: 16, marginTop: 6 }}>
                    Credit score: {creditScore ?? '—'}
                  </Text>
                  <Text style={{ color: '#fff', fontFamily: 'Pixel', fontSize: 16, marginTop: 6 }}>
                    Credit limit: {creditLimit != null ? `$${creditLimit.toFixed(2)}` : '—'}
                  </Text>
                </View>


                <View style={{ marginTop: 16 }}>
                  {Object.entries(totalsByMap).map(([k, v]) => (
                    <Text key={k} style={{ color: '#fff', fontFamily: 'Pixel', fontSize: 16, marginTop: 6 }}>
                      {k}: {v}
                    </Text>
                  ))}
                </View>
                </View>
                
                </View>
    
                {/* column 2 */}
                
        </ScrollView>
  );
}