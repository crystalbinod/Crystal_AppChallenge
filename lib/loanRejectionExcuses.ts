const LOAN_REJECTION_EXCUSES = [
  'Credit score is too low for this loan size right now.',
  'Your debt-to-income ratio looks too high on our end.',
  'We need a longer payment history before approving that amount.',
  'Loan amount is high compared to your credit limit — try a smaller request.',
  'Too many recent credit inquiries on your profile.',
  'Income stability could not be verified for this term.',
  'Existing loan balance is already near your borrowing cap.',
  'Your utilization is too high — pay down credit first.',
  'This term length does not match our current lending policy.',
  'Application flagged for manual review and timed out — please reapply later.',
];

export function getRandomLoanRejectionExcuse(): string {
  const index = Math.floor(Math.random() * LOAN_REJECTION_EXCUSES.length);
  return LOAN_REJECTION_EXCUSES[index];
}

export function formatLoanRejectionMessage(excuse: string): string {
  return `Application denied.\n\nReason: ${excuse}\n\nTry a smaller amount or improve your credit score.`;
}
