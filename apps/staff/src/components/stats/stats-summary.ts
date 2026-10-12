import type { SiteAnalytics } from '../../lib/backend/internal-analytics-api';
import { formatCount, formatDay } from './stats-format';
import { deviceNames, mergeDevices, mergeSources } from './stats-labels';

/** Sentence parts; strings are plain text and `{ strong }` parts are emphasised figures. */
export type SummaryPart = string | { strong: string };

const rangeWords = (range: SiteAnalytics['range']) => (range === '7d' ? 'the last 7 days' : 'the last 30 days');
const plural = (count: number, word: string) => `${formatCount(count)} ${Math.round(count) === 1 ? word : `${word}s`}`;
const joinAnd = (items: string[]) =>
  items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
const tied = <T>(rows: T[], value: (row: T) => number) => {
  const top = Math.max(...rows.map(value));
  return { top, rows: rows.filter((row) => Math.round(value(row)) === Math.round(top)) };
};

export function summarySentence(data: SiteAnalytics): SummaryPart[] {
  const visits = data.daily.reduce((total, day) => total + day.visits, 0);
  const lastDay = data.daily.at(-1)?.date;
  const parts: SummaryPart[] = [{ strong: plural(visits, 'visit') }, ` in ${rangeWords(data.range)}.`];

  const busiest = tied(data.daily, (day) => day.visits);
  if (busiest.rows.length <= 2) {
    const days = busiest.rows.map((day) => `${formatDay(day.date)}${day.date === lastDay ? ' (so far)' : ''}`);
    parts.push(busiest.rows.length === 1 ? ' Busiest day was ' : ' Busiest days were ');
    days.forEach((day, index) => parts.push(...(index ? [' and ', { strong: day }] : [{ strong: day }])));
    parts.push(' with ', { strong: formatCount(busiest.top) }, busiest.rows.length === 1 ? '.' : ' each.');
  } else {
    parts.push(' ', { strong: `${busiest.rows.length} days` }, ' shared the busiest count of ');
    parts.push({ strong: formatCount(busiest.top) }, '.');
  }

  const sources = mergeSources(data.topReferrers).filter((row) => row.visits > 0);
  if (sources.length) {
    const top = tied(sources, (row) => row.visits).rows;
    const named = top.filter((row) => row.kind !== 'direct').map((row) => row.name);
    const direct = top.some((row) => row.kind === 'direct');
    if (!named.length) parts.push(' Most visits had no referring site.');
    else {
      parts.push(' Most visitors came from ');
      named.forEach((name, index) =>
        parts.push(...(index ? [index === named.length - 1 ? ' and ' : ', ', { strong: name }] : [{ strong: name }])),
      );
      parts.push(direct ? ', level with visits that had no referring site.' : '.');
    }
  }
  return parts;
}

/** One plain sentence about the device split, or null without device data. */
export function deviceSentence(rows: SiteAnalytics['deviceTypes']): string | null {
  const devices = mergeDevices(rows);
  const total = devices.reduce((sum, row) => sum + row.visits, 0);
  if (!total) return null;
  const [first, second] = devices;
  const share = first!.visits / total;
  if (second && share - second.visits / total < 0.1)
    return `Visits were split about evenly between ${joinAnd([deviceNames[first!.kind].plural, deviceNames[second.kind].plural])}.`;
  if (share === 1) return `All visits came from ${deviceNames[first!.kind].plural}.`;
  const tenths = Math.round(share * 10);
  if (tenths >= 10) return `Almost all visits came from ${deviceNames[first!.kind].plural}.`;
  return `${tenths} in 10 visits came from ${deviceNames[first!.kind].plural}.`;
}
