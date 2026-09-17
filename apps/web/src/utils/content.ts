const GREECE_TIME_ZONE = 'Europe/Athens';

function getGreeceYear(value: Date) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: GREECE_TIME_ZONE, year: 'numeric' }).format(value));
}

export function calculateYearsActive(establishedYear: number, currentYear = getGreeceYear(new Date())) {
  const normalizedEstablishedYear = Number(establishedYear) || currentYear;
  const yearsActive = currentYear - normalizedEstablishedYear + 1;
  return yearsActive < 1 ? 1 : yearsActive;
}

export function calculateCountryCount(countries: string[]) {
  return new Set(countries.filter(Boolean)).size;
}

export function formatMonthYear(value: Date) {
  return value.toLocaleDateString('en-US', { month: 'short', timeZone: GREECE_TIME_ZONE, year: 'numeric' });
}

export function formatDayMonthYear(value: Date) {
  return value.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: GREECE_TIME_ZONE,
    year: 'numeric',
  });
}

export function formatYear(value: Date) {
  return String(getGreeceYear(value));
}
