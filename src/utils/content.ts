export function calculateYearsActive(establishedYear: number, currentYear = new Date().getUTCFullYear()) {
  const normalizedEstablishedYear = Number(establishedYear) || currentYear;
  const yearsActive = currentYear - normalizedEstablishedYear + 1;
  return yearsActive < 1 ? 1 : yearsActive;
}

export function calculateCountryCount(countries: string[]) {
  return new Set(countries.filter(Boolean)).size;
}

export function formatMonthYear(value: Date) {
  return value.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatYear(value: Date) {
  return String(value.getUTCFullYear());
}
