export const QUESTIONS_PER_ROUND = 5;

export type FinancialQuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function shuffleChoices(q: FinancialQuizQuestion): FinancialQuizQuestion {
  const indexed = q.choices.map((text, index) => ({ text, index }));
  const shuffled = shuffle(indexed);
  return {
    ...q,
    choices: shuffled.map((item) => item.text),
    correctIndex: shuffled.findIndex((item) => item.index === q.correctIndex),
  };
}

function scenarioQuestions(): FinancialQuizQuestion[] {
  const balance = [350, 480, 620, 750][Math.floor(Math.random() * 4)];
  const rent = [180, 200, 220][Math.floor(Math.random() * 3)];
  const daysLeft = [2, 3, 5, 7][Math.floor(Math.random() * 4)];
  const savingsGoal = [100, 150, 200][Math.floor(Math.random() * 3)];

  return [
    {
      id: `scenario-balance-${balance}`,
      prompt: `Your liquid balance is $${balance} and rent ($${rent}) is due in ${daysLeft} days. What is the safest first move?`,
      choices: [
        'Buy a car in the Shop right now',
        'Set aside rent money and check Reminders',
        'Move everything into savings immediately',
        'Skip work until rent day',
      ],
      correctIndex: 1,
      explanation: 'Cover upcoming bills first, then decide what you can afford.',
    },
    {
      id: `scenario-savings-${savingsGoal}`,
      prompt: `You want to move $${savingsGoal} into savings but only have $${balance} total. What happens if you try anyway?`,
      choices: [
        'The app blocks you if savings exceed your balance',
        'Savings can go negative automatically',
        'Rent gets cancelled',
        'Your job pay doubles',
      ],
      correctIndex: 0,
      explanation: 'You cannot save more than your available liquid money.',
    },
    {
      id: `scenario-parttime-${daysLeft}`,
      prompt: `Part-time work pays $100 per minute and needs at least 3 minutes per shift. How much is one minimum shift worth?`,
      choices: ['$100', '$200', '$300', '$450'],
      correctIndex: 2,
      explanation: '3 minutes × $100/min = $300 before pressing Next Day.',
    },
  ];
}

const BASE_QUESTIONS: FinancialQuizQuestion[] = [
  {
    id: 'rent-cycle',
    prompt: 'How often does rent usually come due in PocketPiggy (unless you own a house)?',
    choices: ['Every 5 days', 'Every 15 days', 'Every 30 days', 'Only once'],
    correctIndex: 1,
    explanation: 'Rent bills arrive on a 15-day cycle unless you buy a house.',
  },
  {
    id: 'house-benefit',
    prompt: 'What is the main benefit of buying a house in the Shop?',
    choices: [
      'Free food forever',
      'Stop paying rent',
      'Higher credit limit',
      'Skip all loan payments',
    ],
    correctIndex: 1,
    explanation: 'Owning a house removes recurring rent from your bills.',
  },
  {
    id: 'utilization',
    prompt: 'Credit utilization means:',
    choices: [
      'How much of your credit limit you are using',
      'Your total savings balance',
      'How many jobs you worked',
      'Your daily food cost',
    ],
    correctIndex: 0,
    explanation: 'Lower utilization (using less of your limit) helps your credit score.',
  },
  {
    id: 'apr',
    prompt: 'APR on a loan mostly tells you:',
    choices: [
      'How much interest you pay over time',
      'Your checking account number',
      'When rent is due',
      'How many days are in a month',
    ],
    correctIndex: 0,
    explanation: 'APR is the yearly cost of borrowing — higher APR means more interest.',
  },
  {
    id: 'checking-savings',
    prompt: 'In this app, checking and savings sit under:',
    choices: [
      'Your total liquid balance',
      'Emergency alerts only',
      'The Learn tab score',
      'Job lottery odds',
    ],
    correctIndex: 0,
    explanation: 'Checking and savings are part of your overall money pool.',
  },
  {
    id: 'company-pay',
    prompt: 'Company jobs pay how much per minute (minimum 4 minutes)?',
    choices: ['$100/min', '$150/min', '$200/min', '$300/min'],
    correctIndex: 2,
    explanation: 'Company work pays $200 per minute with a 4-minute minimum.',
  },
  {
    id: 'freelance-pay',
    prompt: 'Freelance jobs pay how much per minute (minimum 1 minute)?',
    choices: ['$50/min', '$100/min', '$150/min', '$200/min'],
    correctIndex: 2,
    explanation: 'Freelance pays $150/min — lower minimum time but less per minute than company.',
  },
  {
    id: 'parttime-pay',
    prompt: 'Part-time jobs pay how much per minute (minimum 3 minutes)?',
    choices: ['$75/min', '$100/min', '$125/min', '$150/min'],
    correctIndex: 1,
    explanation: 'Part-time pays $100/min and needs at least 3 minutes to count.',
  },
  {
    id: 'next-day',
    prompt: 'When do you actually receive pay for time worked?',
    choices: [
      'Immediately when the stopwatch starts',
      'When you press Next Day on Home',
      'When you open the Shop',
      'When you log out',
    ],
    correctIndex: 1,
    explanation: 'Work minutes are counted when you advance the day on Home.',
  },
  {
    id: 'lease',
    prompt: 'A lease in real life is:',
    choices: [
      'A contract to rent for a set period',
      'A type of savings account',
      'Free money from the bank',
      'A credit score penalty',
    ],
    correctIndex: 0,
    explanation: 'A lease is an agreement to rent property for a defined time.',
  },
  {
    id: 'emergency-fund',
    prompt: 'An emergency fund is best used for:',
    choices: [
      'Unexpected necessary expenses',
      'Buying every Shop item',
      'Avoiding all bills',
      'Maxing out credit cards',
    ],
    correctIndex: 0,
    explanation: 'Emergency savings cover surprises — not everyday wants.',
  },
  {
    id: 'pay-card-early',
    prompt: 'Paying your credit card before the statement closes can:',
    choices: [
      'Lower reported utilization',
      'Increase your rent',
      'Remove your job',
      'Skip food costs',
    ],
    correctIndex: 0,
    explanation: 'Paying early reduces how much of your limit appears used.',
  },
  {
    id: 'loan-installments',
    prompt: 'Loan installments in PocketPiggy are typically due:',
    choices: ['Every day', 'Every 15 days', 'Only at signup', 'Never'],
    correctIndex: 1,
    explanation: 'Loan payments follow the same 15-day rhythm as other major bills.',
  },
  {
    id: 'reminders',
    prompt: 'Where should you check for upcoming bills?',
    choices: ['Reminders on Home', 'Only the quiz screen', 'Profile avatar color', 'Pong score'],
    correctIndex: 0,
    explanation: 'The Reminders box on Home shows bills coming due soon.',
  },
  {
    id: 'budget-basics',
    prompt: 'A simple budget helps you:',
    choices: [
      'Plan income and expenses before spending',
      'Guarantee lottery job wins',
      'Avoid learning about money',
      'Hide bills from Piggy',
    ],
    correctIndex: 0,
    explanation: 'Budgeting means deciding where money goes before it disappears.',
  },
  {
    id: 'interest-savings',
    prompt: 'Putting money in savings (when you can afford it) helps because:',
    choices: [
      'It separates spending money from goals',
      'It deletes your rent',
      'It stops time from passing',
      'It removes all debt instantly',
    ],
    correctIndex: 0,
    explanation: 'Savings keeps money aside for goals and emergencies.',
  },
  {
    id: 'credit-on-time',
    prompt: 'Paying credit card bills on time mainly protects:',
    choices: [
      'Your credit score and future borrowing',
      'Your high score in Whack-A-Mole',
      'The day counter only',
      'Shop sale prices',
    ],
    correctIndex: 0,
    explanation: 'On-time payments build trust with lenders and keep scores healthier.',
  },
  {
    id: 'needs-vs-wants',
    prompt: 'Food and utilities in the Shop are usually:',
    choices: ['Needs to stay alive and housed', 'Pure luxury items', 'Free forever', 'Loan types'],
    correctIndex: 0,
    explanation: 'Basics like food and utilities keep your sim running — wants can wait.',
  },
  {
    id: 'compound-hint',
    prompt: 'Compound interest means:',
    choices: [
      'Interest can earn more interest over time',
      'Bills never repeat',
      'Rent gets cheaper each month automatically',
      'Jobs pay less each day',
    ],
    correctIndex: 0,
    explanation: 'With compound interest, growth builds on prior growth — good for savings, costly for debt.',
  },
  {
    id: 'starvation',
    prompt: 'If you run out of food in the sim, what risk do you face?',
    choices: [
      'Health / survival problems on Next Day',
      'Free house upgrade',
      'Automatic loan forgiveness',
      'Extra job offers only',
    ],
    correctIndex: 0,
    explanation: 'Keep food stocked — running out hurts you when the day advances.',
  },
  {
    id: 'work-multiple',
    prompt: 'Can minutes from different job types (company, freelance, part-time) all count?',
    choices: [
      'Yes — each stopwatch adds to your work total',
      'No — only company counts',
      'Only on weekends',
      'Only if Piggy approves',
    ],
    correctIndex: 0,
    explanation: 'Home adds up minutes from all three work stopwatches on Next Day.',
  },
  {
    id: 'denial-loan',
    prompt: 'If a loan application is denied in the app, a good real-life next step is:',
    choices: [
      'Improve income, credit, or try a smaller amount later',
      'Ignore all future bills',
      'Close every account',
      'Stop tracking reminders',
    ],
    correctIndex: 0,
    explanation: 'Denials happen — fix the underlying reasons and try again when stronger.',
  },
];

export function pickQuizRound(count = QUESTIONS_PER_ROUND): FinancialQuizQuestion[] {
  const pool = shuffle([...BASE_QUESTIONS, ...scenarioQuestions()]);
  return pool.slice(0, Math.min(count, pool.length)).map(shuffleChoices);
}
