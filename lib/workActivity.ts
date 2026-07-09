import CompanyStopwatch from './stopwatch';
import FreelanceStopwatch from './stopwatch_freelance';
import PartTimeStopwatch from './stopwatch_parttime';

export function getTotalWorkMs(): number {
  const company = CompanyStopwatch?.get?.() ?? 0;
  const freelance = FreelanceStopwatch?.get?.() ?? 0;
  const parttime = PartTimeStopwatch?.get?.() ?? 0;
  return company + freelance + parttime;
}

export function hasWorkActivity(): boolean {
  return getTotalWorkMs() > 0;
}
