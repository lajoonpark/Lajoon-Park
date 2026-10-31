import type { Day } from './github';

export const num = (n: number) => n.toLocaleString('en-US');

export const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// "3 days ago" relative to the build time, which is also when the data was fetched.
export function ago(iso: string, now: string): string {
  const s = (new Date(now).getTime() - new Date(iso).getTime()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, sec] of units) if (s >= sec) return rtf.format(-Math.floor(s / sec), unit);
  return 'just now';
}

export function activity(weeks: Day[][], joined: string, until: string) {
  // The calendar spans a year and its last week can run into the future, but the account
  // may be younger: count only from the join date up to the build date.
  const days = weeks.flat().filter((d) => d.date >= joined.slice(0, 10) && d.date <= until.slice(0, 10));
  const active = days.filter((d) => d.count > 0).length;

  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Contributions per calendar month for the most recent six months.
  const byMonth = new Map<string, number>();
  for (const d of days) byMonth.set(d.date.slice(0, 7), (byMonth.get(d.date.slice(0, 7)) ?? 0) + d.count);
  const months = [...byMonth].slice(-6).map(([key, count]) => ({
    count,
    label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }),
  }));
  const peak = Math.max(1, ...months.map((m) => m.count));

  return {
    total: days.length,
    active,
    longest,
    months: months.map((m) => ({ ...m, h: Math.max(0.04, m.count / peak) })),
    sixMonthTotal: months.reduce((n, m) => n + m.count, 0),
  };
}
