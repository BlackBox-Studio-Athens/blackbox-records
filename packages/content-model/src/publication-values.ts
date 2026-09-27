import type { PublicationReviewEntry } from './publication-review';

/** Compare editorial values, ignoring object key order while retaining list order and formatting. */
export function publicationValueKey(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(publicationValueKey).join(',')}]`;
  if (value && typeof value === 'object' && 'provider' in value && value.provider === 'local' && 'id' in value)
    return publicationValueKey({ id: value.id });
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${publicationValueKey(child)}`)
      .join(',')}}`;
  return JSON.stringify(value ?? null);
}
export function changedPublicationFields(entry: Pick<PublicationReviewEntry, 'before' | 'after'>) {
  return [...new Set([...Object.keys(entry.before ?? {}), ...Object.keys(entry.after)])].filter(
    (key) => !key.startsWith('_') && publicationValueKey(entry.before?.[key]) !== publicationValueKey(entry.after[key]),
  );
}
