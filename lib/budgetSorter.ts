export const ITEMS_PER_ROUND = 10;

export type BudgetCategory = 'need' | 'want';

export type BudgetItem = {
  id: string;
  label: string;
  amount?: number;
  category: BudgetCategory;
  hint: string;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BUDGET_ITEMS: BudgetItem[] = [
  {
    id: 'rent',
    label: 'Rent payment',
    amount: 200,
    category: 'need',
    hint: 'Housing keeps a roof over your head — pay this before fun spending.',
  },
  {
    id: 'utilities',
    label: 'Electric & water bill',
    amount: 45,
    category: 'need',
    hint: 'Utilities keep your home running — a basic living cost.',
  },
  {
    id: 'groceries',
    label: 'Groceries for the week',
    amount: 60,
    category: 'need',
    hint: 'Food is a need — your sim needs it to stay healthy.',
  },
  {
    id: 'loan-min',
    label: 'Minimum loan payment',
    amount: 80,
    category: 'need',
    hint: 'Missing loan payments hurts credit and adds fees.',
  },
  {
    id: 'credit-card',
    label: 'Credit card bill (due now)',
    amount: 55,
    category: 'need',
    hint: 'Pay at least the minimum on time to protect your score.',
  },
  {
    id: 'bus-pass',
    label: 'Bus pass to get to work',
    amount: 30,
    category: 'need',
    hint: 'Transportation to earn income counts as a need.',
  },
  {
    id: 'prescription',
    label: 'Prescription medicine',
    amount: 25,
    category: 'need',
    hint: 'Health essentials come before optional purchases.',
  },
  {
    id: 'childcare',
    label: 'Childcare while you work',
    amount: 90,
    category: 'need',
    hint: 'Care that lets you work is a necessary expense.',
  },
  {
    id: 'phone-plan-basic',
    label: 'Basic phone plan',
    amount: 35,
    category: 'need',
    hint: 'A basic phone plan helps you work and handle bills.',
  },
  {
    id: 'work-uniform',
    label: 'Required work uniform',
    amount: 40,
    category: 'need',
    hint: 'If your job requires it, it supports your income.',
  },
  {
    id: 'emergency-repair',
    label: 'Emergency car repair',
    amount: 120,
    category: 'need',
    hint: 'Repairs that keep you working or safe are needs.',
  },
  {
    id: 'sneakers',
    label: 'Designer sneakers (already have shoes)',
    amount: 150,
    category: 'want',
    hint: 'Extra fashion when you already have shoes is a want.',
  },
  {
    id: 'streaming-extra',
    label: 'Second streaming subscription',
    amount: 15,
    category: 'want',
    hint: 'Entertainment extras are wants — cover bills first.',
  },
  {
    id: 'fancy-coffee',
    label: 'Daily fancy coffee habit',
    amount: 25,
    category: 'want',
    hint: 'Small treats add up — nice, but not essential.',
  },
  {
    id: 'concert',
    label: 'Concert tickets',
    amount: 75,
    category: 'want',
    hint: 'Fun experiences are wants when money is tight.',
  },
  {
    id: 'video-game',
    label: 'New video game release',
    amount: 60,
    category: 'want',
    hint: 'Games are entertainment — budget for needs first.',
  },
  {
    id: 'vacation',
    label: 'Weekend vacation trip',
    amount: 300,
    category: 'want',
    hint: 'Travel is great, but not urgent like rent or food.',
  },
  {
    id: 'jewelry',
    label: 'Gold necklace',
    amount: 200,
    category: 'want',
    hint: 'Luxury items are wants unless truly necessary.',
  },
  {
    id: 'latest-phone',
    label: 'Latest phone (yours still works)',
    amount: 800,
    category: 'want',
    hint: 'Upgrading working tech is usually a want.',
  },
  {
    id: 'delivery-takeout',
    label: 'Takeout delivery (pantry full)',
    amount: 35,
    category: 'want',
    hint: 'Convenience food when you already have groceries is a want.',
  },
  {
    id: 'gym-premium',
    label: 'Premium gym with pool',
    amount: 50,
    category: 'want',
    hint: 'Nice-to-have fitness perks are wants on a tight budget.',
  },
  {
    id: 'in-app-skins',
    label: 'In-game cosmetic skins',
    amount: 20,
    category: 'want',
    hint: 'Virtual cosmetics do not cover real bills.',
  },
  {
    id: 'shopping-spree',
    label: 'Shopping spree at the mall',
    amount: 100,
    category: 'want',
    hint: 'Impulse shopping is a want — plan purchases instead.',
  },
  {
    id: 'pet-costume',
    label: 'Costume for your pet',
    amount: 18,
    category: 'want',
    hint: 'Cute, but not a survival or bill priority.',
  },
  {
    id: 'food-shop',
    label: 'Food from the Shop (running low)',
    amount: 40,
    category: 'need',
    hint: 'In PocketPiggy, food keeps you going — stock up before it runs out.',
  },
  {
    id: 'house-shop',
    label: 'Buying a house in the Shop',
    amount: 500,
    category: 'need',
    hint: 'If rent keeps draining you, a house can be a smart long-term need.',
  },
  {
    id: 'savings-transfer',
    label: 'Moving $50 to savings',
    amount: 50,
    category: 'need',
    hint: 'Saving for emergencies is a financial need once basics are covered.',
  },
  {
    id: 'arcade-night',
    label: 'Arcade night with friends',
    amount: 40,
    category: 'want',
    hint: 'Social fun is a want when bills are due soon.',
  },
  {
    id: 'brand-hoodie',
    label: 'Brand-name hoodie',
    amount: 85,
    category: 'want',
    hint: 'You likely already have clothes — this is extra.',
  },
  {
    id: 'lottery-tickets',
    label: 'Lottery scratch tickets',
    amount: 10,
    category: 'want',
    hint: 'Gambling-style spending is never a need.',
  },
  {
    id: 'charity-optional',
    label: 'Optional charity donation',
    amount: 25,
    category: 'want',
    hint: 'Generous, but classify optional giving as a want until bills are safe.',
  },
  {
    id: 'car-upgrade',
    label: 'Car from the Shop (already have one)',
    amount: 400,
    category: 'want',
    hint: 'A second car when one works is a want.',
  },
];

export function pickBudgetRound(count = ITEMS_PER_ROUND): BudgetItem[] {
  return shuffle(BUDGET_ITEMS).slice(0, Math.min(count, BUDGET_ITEMS.length));
}

export function categoryLabel(category: BudgetCategory): string {
  return category === 'need' ? 'Need' : 'Want';
}
