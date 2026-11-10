export function athensToday(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function selectUpcomingShow<T extends { data: { date: string; title: string } }>(
  shows: readonly T[],
  now: Date,
): T | null {
  const today = athensToday(now);
  return (
    shows
      .filter((show) => show.data.date >= today)
      .sort((a, b) => a.data.date.localeCompare(b.data.date) || a.data.title.localeCompare(b.data.title))[0] ?? null
  );
}
