export const GAME_GOAL = {
  deadlineDay: 60,
  creditScore: 700,
  title: 'Own a house & reach 700 credit by day 60',
};

export type DueItem = {
  label: string;
  days: number | null;
};

export function playerOwnsHouse(userData?: { [k: string]: any } | null): boolean {
  const housing = userData?.housing ?? userData?.housingType ?? '';
  return housing === 'house' || housing === 'own' || userData?.house === true;
}

export function getGoalProgress(userData?: { [k: string]: any } | null) {
  const day = Number(userData?.day) || 0;
  const score = Number(userData?.credit?.creditScore) || 0;
  const house = playerOwnsHouse(userData);
  const won = house && score >= GAME_GOAL.creditScore;
  const lost = day > GAME_GOAL.deadlineDay && !won;
  return {
    day,
    score,
    house,
    won,
    lost,
    daysLeft: Math.max(0, GAME_GOAL.deadlineDay - day),
  };
}

export function formatGoalProgress(userData?: { [k: string]: any } | null): string {
  const p = getGoalProgress(userData);
  if (p.won) return 'Goal complete — house owned & 700+ credit!';
  const houseText = p.house ? 'House ✓' : 'House —';
  const scoreText = p.score >= GAME_GOAL.creditScore ? `Credit ${p.score} ✓` : `Credit ${p.score} / 700`;
  return `Goal: ${houseText}, ${scoreText} · Day ${p.day} / ${GAME_GOAL.deadlineDay}`;
}

export function formatRemindersText(dues: DueItem[]): string {
  const sorted = dues
    .filter((d) => typeof d.days === 'number')
    .sort((a, b) => (a.days ?? 99) - (b.days ?? 99));

  if (sorted.length === 0) return 'No upcoming bills right now.';

  return sorted
    .map((d) => {
      if (d.days === 0) return `${d.label} due today`;
      if (d.days === 1) return `${d.label} tomorrow`;
      return `${d.label} in ${d.days} days`;
    })
    .join(' · ');
}

export function getJobDisplayLabel(jobRaw: unknown): string {
  const jobStr = String(jobRaw || '').toLowerCase();
  if (!jobStr || jobStr === 'none') return 'No job';
  if (jobStr.includes('part')) return 'Part-Time';
  if (jobStr.includes('company')) return 'Company';
  if (jobStr.includes('free') || jobStr.includes('freelance')) return 'Freelance';
  return String(jobRaw);
}

export function computeJobPay(fresh: { [k: string]: any }) {
  const jobStrFresh = fresh?.job ? String(fresh.job).toLowerCase() : '';
  const jobDone = String(fresh.jobDone || '').toLowerCase() === 'yes';
  const dayVal = Number(fresh.day) || 0;
  const minutes = Number(fresh.hoursWorked) || 0;

  let rate = 0;
  let period = 1;
  if (jobStrFresh.includes('part')) {
    rate = 100;
    period = 10;
  } else if (jobStrFresh.includes('company')) {
    rate = 200;
    period = 1;
  } else if (jobStrFresh.includes('free') || jobStrFresh.includes('freelance')) {
    rate = 150;
    period = 1;
  }

  const pay =
    jobDone && period > 0 && dayVal % period === 0 && rate > 0
      ? minutes * rate
      : 0;

  return {
    pay,
    minutes,
    jobDone,
    jobLabel: getJobDisplayLabel(fresh.job),
    rate,
    period,
  };
}

export type PaydaySummaryInput = {
  fresh: { [k: string]: any };
  minutesWorked?: number;
  payEarned?: number;
  billsClear?: boolean;
  afterPaymentFlow?: boolean;
};

export function buildPaydaySummary({
  fresh,
  minutesWorked,
  payEarned,
  billsClear,
  afterPaymentFlow,
}: PaydaySummaryInput): string {
  const day = Number(fresh.day) || 0;
  const food = Number(fresh.food) || 0;
  const payInfo = computeJobPay(fresh);
  const mins = minutesWorked ?? payInfo.minutes;
  const earned = payEarned ?? payInfo.pay;
  const parts: string[] = [`Day ${day}`];

  if (afterPaymentFlow) {
    parts.push('Bills paid — day advanced');
  } else if (earned > 0) {
    parts.push(`Earned $${earned} (${mins} min ${payInfo.jobLabel})`);
  } else if (payInfo.jobDone && mins > 0 && payInfo.period > 1) {
    parts.push(`Worked ${mins} min ${payInfo.jobLabel} — payday hits every ${payInfo.period} days`);
  } else if (mins > 0) {
    parts.push(`Worked ${mins} min — not enough for ${payInfo.jobLabel} shift yet`);
  } else {
    parts.push('No work logged');
  }

  if (billsClear) {
    parts.push('Bills: all clear');
  }

  parts.push(`Food: ${food} left`);
  return parts.join(' — ');
}

export function getSituationalPiggyTip(
  userData: { [k: string]: any } | undefined,
  dues: DueItem[],
): string | null {
  if (!userData) return null;

  const food = Number(userData.food);
  const job = String(userData.job || '').trim();
  const noJob = !job || job.toLowerCase() === 'none';
  const day = Number(userData.day) || 0;
  const score = Number(userData.credit?.creditScore) || 0;
  const house = playerOwnsHouse(userData);
  const progress = getGoalProgress(userData);

  if (progress.won) return 'You hit the goal! House + 700 credit. Keep stacking your savings.';

  if (noJob) return 'No job yet — tap Job → Job Selection to get hired.';

  if (!Number.isNaN(food) && food <= 4) {
    return `Food is low (${food}) — buy food in the Shop before you starve.`;
  }

  const dueToday = dues.filter((d) => d.days === 0);
  if (dueToday.length > 0) {
    return `Due today: ${dueToday.map((d) => d.label).join(', ')} — pay before Next Day.`;
  }

  const dueTomorrow = dues.filter((d) => d.days === 1);
  if (dueTomorrow.length > 0) {
    return `Heads up: ${dueTomorrow.map((d) => d.label).join(', ')} due tomorrow.`;
  }

  if (progress.lost) {
    return 'Day 60 passed — you missed the goal, but you can keep practicing money skills.';
  }

  if (!house && day >= 20) {
    return 'Goal tip: save up and buy a house in the Shop to stop paying rent.';
  }

  if (score < GAME_GOAL.creditScore && day >= 25) {
    return `Credit is ${score} — pay bills on time to reach 700 by day 60.`;
  }

  if (progress.daysLeft <= 10 && !progress.won) {
    return `Only ${progress.daysLeft} days left — you need a house and 700 credit!`;
  }

  return null;
}
