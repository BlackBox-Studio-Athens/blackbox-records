const GREECE_TIME_ZONE = 'Europe/Athens';
const yearFormatter = new Intl.DateTimeFormat('en-US', { timeZone: GREECE_TIME_ZONE, year: 'numeric' });
const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: GREECE_TIME_ZONE,
  year: 'numeric',
});
const dayMonthYearFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: GREECE_TIME_ZONE,
  year: 'numeric',
});

function getGreeceYear(value: Date) {
  return Number(yearFormatter.format(value));
}

export function calculateYearsActive(establishedYear: number, currentYear = getGreeceYear(new Date())) {
  const normalizedEstablishedYear = Number(establishedYear) || currentYear;
  const yearsActive = currentYear - normalizedEstablishedYear + 1;
  return yearsActive < 1 ? 1 : yearsActive;
}

export function calculateCountryCount(countries: string[]) {
  return new Set(countries.flatMap((country) => country.split('/').map((name) => name.trim())).filter(Boolean)).size;
}

export function formatMonthYear(value: Date | undefined) {
  if (!value) return 'Date to be announced';
  return monthYearFormatter.format(value);
}

export function formatDayMonthYear(value: Date | undefined) {
  if (!value) return 'Date to be announced';
  return dayMonthYearFormatter.format(value);
}

export function formatYear(value: Date | undefined) {
  if (!value) return 'Upcoming';
  return String(getGreeceYear(value));
}
