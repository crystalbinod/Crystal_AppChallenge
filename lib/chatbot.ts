import { GAME_GOAL } from './gameGoals';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type UserContext = {
  displayName?: string;
  job?: string;
  day?: string | number;
  food?: number;
  liquidMoney?: { total?: number };
  credit?: { creditScore?: number; creditCardbill?: number };
  reminders?: string;
};

const pick = (text: string) => text.toLowerCase();

export function getWelcomeMessage(userData?: UserContext): string {
  const name = userData?.displayName?.trim();
  const greeting = name ? `Hey ${name}!` : 'Hey there!';
  return `${greeting} I'm Piggy, your pocketpiggy guide. Your goal: ${GAME_GOAL.title}. Ask me about jobs, bills, credit, food, or how to play!`;
}

export function getNextDayNudgeMessage(): string {
  return 'Worked or played a job game? Head to Home and press Next Day to get paid and move forward!';
}

export function buildSystemPrompt(userData?: UserContext): string {
  const context = userData
    ? `
Current player snapshot:
- Name: ${userData.displayName || 'unknown'}
- Day: ${userData.day ?? 'unknown'}
- Job: ${userData.job || 'none'}
- Food: ${userData.food ?? 'unknown'}
- Total balance: ${userData.liquidMoney?.total ?? 'unknown'}
- Credit score: ${userData.credit?.creditScore ?? 'unknown'}
- Credit card bill: ${userData.credit?.creditCardbill ?? 'unknown'}
- Reminders: ${userData.reminders || 'none'}`
    : '';

  return `You are Piggy, a friendly and cute assistant for the mobile game "pocketpiggy" — a finance life simulator with pixel-art style.

Help players understand how to earn money, pay bills, manage credit, avoid starvation, and progress through in-game days. Keep answers short, clear, and encouraging. Use bullet points when listing rules.

Game rules:
- Jobs: Company ($200/min, need 1+ min), Freelance ($150/min, need 1+ min), Part-time ($100/min, need 1+ min). Work time is tracked by stopwatches on job screens.
- Press Next Day to advance. It costs 2 food, stores work minutes, may trigger payouts, and can block advancement if bills are due today.
- Rent every 15 days (~$200) unless the player owns a house.
- Credit card bills every 15 days. Pay from checking, savings, or charge to credit. Closing statement is 5 days before due.
- Utilities every 30 days (~$40). Taxes every 45 days (~$100).
- Loans from the Loan screen; installments due every 15 days.
- Food: if food stays at 0 for 3 consecutive in-game days, the player dies and the account is deleted. Buy food from Shop.
- liquidMoney.total is the main balance; checking and savings are sub-accounts.
- Reminders on the home screen show upcoming due dates.
- Win condition: own a house and reach credit score 700 by day 60.

Only answer questions about this game and personal finance within the game. If asked unrelated questions, gently redirect back to the game.
${context}`;
}

export function getChatResponse(message: string, userData?: UserContext): string {
  const q = pick(message);
  const day = Number(userData?.day) || 0;
  const job = String(userData?.job || 'none');
  const food = Number(userData?.food);
  const balance = Number(userData?.liquidMoney?.total);
  const creditScore = userData?.credit?.creditScore;
  const creditBill = userData?.credit?.creditCardbill;

  if (/^(hi|hello|hey|yo)\b/.test(q)) {
    return getWelcomeMessage(userData);
  }

  if (q.includes('job') || q.includes('work') || q.includes('earn') || q.includes('paycheck') || q.includes('salary')) {
    let reply =
      'Jobs pay when you press Next Day after working enough minutes:\n' +
      '• Company: $200/min, need 1+ min\n' +
      '• Freelance: $150/min, need 1+ min\n' +
      '• Part-time: $100/min, need 1+ min\n' +
      'Work time is tracked by stopwatches on each job screen.';
    if (job && job !== 'none') reply += `\n\nYour current job: ${job}.`;
    return reply;
  }

  if (q.includes('next day') || q.includes('advance') || q.includes('day')) {
    let reply =
      'Press Next Day on the home screen to move forward. It subtracts 2 food, stores your work minutes, and may trigger bills. If something is due today, you must pay it before the day advances.';
    if (day > 0) reply += `\n\nYou are currently on day ${day}.`;
    return reply;
  }

  if (q.includes('rent') || q.includes('housing') || q.includes('house')) {
    return 'Rent is due every 15 in-game days unless you own a house. If your housing is set to house/own, rent is skipped. Default rent is about $200.';
  }

  if (q.includes('credit') || q.includes('card') || q.includes('score')) {
    let reply =
      'Credit card bills come every 15 days. Pay from checking, savings, or charge to credit. Your score improves with on-time payments, low utilization, fewer loans, and longer history. Closing statement is 5 days before due.';
    if (creditScore != null) reply += `\n\nYour credit score: ${creditScore}.`;
    if (creditBill != null) reply += `\nCurrent credit bill: $${creditBill}.`;
    return reply;
  }

  if (q.includes('loan')) {
    return 'Loans can be taken from the Loan screen. Each loan has a monthly payment due every 15 days. Pay on time or use checking, savings, or credit. Loans hurt your credit score if you carry a lot of debt.';
  }

  if (q.includes('food') || q.includes('starv') || q.includes('eat') || q.includes('hungry')) {
    let reply =
      'Each Next Day costs 2 food. If food hits 0 for 3 days in a row, your character dies and the account is deleted. Buy food from the Shop screen.';
    if (!Number.isNaN(food)) reply += `\n\nYour food right now: ${food}.`;
    return reply;
  }

  if (q.includes('bill') || q.includes('due') || q.includes('utilit') || q.includes('tax')) {
    return (
      'Regular bills:\n' +
      '• Rent — every 15 days (if you do not own a house)\n' +
      '• Credit card — every 15 days\n' +
      '• Utilities — every 30 days (~$40)\n' +
      '• Taxes — every 45 days (~$100)\n' +
      'Check Reminders on the home screen for upcoming due dates.'
    );
  }

  if (q.includes('money') || q.includes('balance') || q.includes('cash') || q.includes('checking') || q.includes('savings')) {
    let reply =
      'Your total liquid money is the main balance. Checking and savings are sub-accounts under that total. Use the Bank tab to move money between accounts.';
    if (!Number.isNaN(balance)) reply += `\n\nYour total balance: $${balance}.`;
    return reply;
  }

  if (q.includes('remind')) {
    const reminders = userData?.reminders?.trim();
    if (reminders) return `Your reminders: ${reminders}\n\nOpen the Reminders section on home for full details.`;
    return 'Tap Reminders on the home screen to see upcoming payments and loan due dates.';
  }

  if (q.includes('help') || q.includes('how') || q.includes('play') || q.includes('rule')) {
    return 'This is a finance life sim. Work jobs, pay bills on time, manage credit, avoid starvation, and grow your money. Tap Learn on the home screen for the full rulebook, or ask me about jobs, rent, credit, loans, food, or Next Day.';
  }

  if (q.includes('thank')) {
    return 'You got it! Ask anytime if you need help with the game.';
  }

  return "I'm not sure about that one. Try asking about jobs, rent, credit, loans, food, bills, or how Next Day works. You can also tap Learn on the home screen for the full guide.";
}

export { getSituationalPiggyTip, formatGoalProgress, GAME_GOAL } from './gameGoals';
