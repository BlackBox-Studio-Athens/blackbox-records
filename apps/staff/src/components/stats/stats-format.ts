const utcDate = (date: string) => new Date(`${date}T00:00:00Z`);
const regions = new Intl.DisplayNames(['en'], { type: 'region' });

export const formatCount = (value: number) => Math.round(value).toLocaleString('en-GB');
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
