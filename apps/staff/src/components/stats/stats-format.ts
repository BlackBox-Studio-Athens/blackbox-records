const utcDate = (date: string) => new Date(`${date}T00:00:00Z`);
const regions = new Intl.DisplayNames(['en'], { type: 'region' });

export const formatCount = (value: number) => Math.round(value).toLocaleString('en-GB');
export const plural = (count: number, word: string) =>
  `${formatCount(count)} ${Math.round(count) === 1 ? word : `${word}s`}`;
/** Whole euros without cents, otherwise two decimals: €184, €18.50. */
export const formatEuro = (minor: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: minor % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
export const formatPosition = (value: number) =>
  value.toLocaleString('en-GB', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
/** Paid orders per 100 visits: one decimal below 10, never a rounded-away zero. */
export function formatRate(rate: number) {
  if (rate < 0.1) return 'under 0.1';
  return rate < 10 ? rate.toFixed(1) : String(Math.round(rate));
}
export const formatDay = (date: string) =>
  utcDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
export const formatDayTick = (date: string) =>
  utcDate(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const formatReadTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Athens' }).format(
    new Date(value),
  );

export function countryLabel(code: string) {
  if (!code || code === 'XX') return 'Unknown';
  if (code === 'T1') return 'Tor network';
  try {
    const name = regions.of(code);
    return name && name !== code && name !== 'Unknown Region' ? name : code;
  } catch {
    return code;
  }
}
