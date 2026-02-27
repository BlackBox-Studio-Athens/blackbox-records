import { labelSettings } from '@/data/settings';

export function calculateYearsActive(currentYear = new Date().getUTCFullYear()) {
  const establishedYear = Number(labelSettings.established_year) || currentYear;
  const yearsActive = currentYear - establishedYear + 1;
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

export function sortByDateDescending<T extends { date?: Date; release_date?: Date }>(items: T[]) {
  return items.slice().sort((left, right) => {
    const leftDate = left.date || left.release_date;
    const rightDate = right.date || right.release_date;
    if (!leftDate || !rightDate) return 0;
    return rightDate.getTime() - leftDate.getTime();
  });
}
