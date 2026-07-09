const JOB_REJECTION_EXCUSES = [
  'Commute is too far — they want someone who lives closer.',
  'Too inexperienced for this role. Try again later.',
  'They only had room for a personality hire this round.',
  'They went with an internal candidate instead.',
  'Your application was lost in the spam folder.',
  'Budget freeze — no new hires right now.',
  'They said you need more "culture fit" (whatever that means).',
  'Position filled five minutes before you applied.',
  'HR ghosted you. Classic.',
  'They wanted someone with three years of experience in a one-year-old field.',
];

export function getRandomJobRejectionExcuse(): string {
  const index = Math.floor(Math.random() * JOB_REJECTION_EXCUSES.length);
  return JOB_REJECTION_EXCUSES[index];
}

export function jobRejectionAlertTitle(): string {
  return 'Not selected';
}

export function formatJobRejectionMessage(jobLabel: string, excuse: string): string {
  return `You didn't get the ${jobLabel} job.\n\nReason: ${excuse}`;
}
