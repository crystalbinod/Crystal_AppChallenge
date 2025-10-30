// screens/LearnScreen.tsx
import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function LearnScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F2E5D7', padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={{ fontFamily: 'Windows', fontSize: 28, color: '#C97D60', marginBottom: 12 }}>Game rules & finances</Text>

      <Text style={{ fontFamily: 'Pixel', fontSize: 16, marginBottom: 8 }}>How you earn money</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Company job: $200 per minute</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Freelance job: $150 per minute</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Part-time job: $100 per minute</Text>

      <Text style={{ fontFamily: 'Pixel', fontSize: 16, marginTop: 12, marginBottom: 8 }}>Work rules (min / max)</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Minimum to earn: you must record at least 1 minute of work for that job before a payout is made.</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Payout timing: the app advances a day using the Next Day button. When your stored hours/minutes are paid according to your job, hours are reset.</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Maximum: there is no hard per-day maximum enforced by the game, but very large totals may be subject to game logic (checks or caps added later).</Text>

      <Text style={{ fontFamily: 'Pixel', fontSize: 16, marginTop: 12, marginBottom: 8 }}>Housing & bills</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• If you own a house in the game (your housing = 'house' or own flag), you do not pay rent.</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• If you do not own a house you will have rent payments periodically (the app treats months as 15-day cycles).</Text>

      <Text style={{ fontFamily: 'Pixel', fontSize: 16, marginTop: 12, marginBottom: 8 }}>Credit, cards & loans</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Credit card bills appear every 15 days. You can pay them from Checking, Savings, or charge new purchases to Credit. Build your credit score by paying back as much as you can before the closing statement date</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Closing statement: 5 days before your credit card bill is due the app records a closing balance. You can pay early (the wallet opens up to 10 days before due).</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Loans: you may take out loans from the Loan screen. Loans create a loans.{'{id}'} entry and have a monthlyPayment amount (a "month" is 15 days in this game). Loan installments are due every 15 days.</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• If you don't have enough money to pay a bill you may take a loan to cover shortfalls, but loans must be repaid over time.</Text>

      <Text style={{ fontFamily: 'Pixel', fontSize: 16, marginTop: 12, marginBottom: 8 }}>Other tips</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Your liquid money total (`liquidMoney.total`) is authoritative — checking and savings are sub-accounts of that total.</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Pay attention to the Reminders screen — it lists upcoming payments and loan reminders so you don't miss a due date.</Text>
      <Text style={{ fontFamily: 'Pixel', marginBottom: 6 }}>• Want to change behaviors or tune rates? I can update the job rates, payout rules, or add caps — tell me what you want.</Text>
    </ScrollView>
  );
}