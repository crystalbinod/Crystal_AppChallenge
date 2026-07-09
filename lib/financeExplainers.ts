import { Alert } from 'react-native';

export const FINANCE_EXPLAINERS = {
  apr: {
    title: 'What is APR?',
    message:
      'APR (Annual Percentage Rate) is the yearly cost of borrowing money, shown as a percent.\n\n' +
      'Example: a $1,000 loan at 12% APR means you pay interest on top of what you borrowed. A lower APR costs less over time.\n\n' +
      'In PocketPiggy, your credit score affects your APR — better credit usually means a lower rate.',
  },
  utilization: {
    title: 'What is utilization?',
    message:
      'Credit utilization is how much of your credit limit you are using.\n\n' +
      'Formula: (your balance ÷ your limit) × 100\n\n' +
      'Example: $300 balance on a $1,000 limit = 30% utilization.\n\n' +
      'Lower is better. High utilization can hurt your credit score. Paying down your balance before the closing statement helps.',
  },
  rentLease: {
    title: 'Rent vs lease',
    message:
      'Rent: you pay to live somewhere but do not own it. In this game, rent is due every 15 days unless you buy a house.\n\n' +
      'Lease: a contract to rent for a set time (often 12 months in real life). It lists monthly payment, rules, and what happens if you leave early.\n\n' +
      'Owning a house in PocketPiggy stops rent bills. Until then, budget for rent like any recurring bill.',
  },
} as const;

export type ExplainerKey = keyof typeof FINANCE_EXPLAINERS;

export function showExplainer(key: ExplainerKey) {
  const { title, message } = FINANCE_EXPLAINERS[key];
  Alert.alert(title, message);
}
