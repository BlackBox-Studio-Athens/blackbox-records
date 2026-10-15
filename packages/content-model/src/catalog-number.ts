import { z } from 'zod';

declare const catalogNumberBrand: unique symbol;
/** Canonical JSON string, constructed through the validated operations below. */
export type CatalogNumber = string & { readonly [catalogNumberBrand]: true };

export const catalogNumberMessage = 'Enter a catalog number such as BBR#001 (starting at 001).';

export function parseCatalogNumber(input: unknown): CatalogNumber | null {
  if (
    typeof input !== 'string' ||
    input.trim() !== input ||
    !/^BBR#(?:\d{3}|[1-9]\d{3,})$/.test(input) ||
    input === 'BBR#000'
  )
    return null;
  return input as CatalogNumber;
}

export const catalogNumberSchema = z
  .string({ error: catalogNumberMessage })
  .refine((value): value is CatalogNumber => parseCatalogNumber(value) !== null, { error: catalogNumberMessage })
  .transform((value) => parseCatalogNumber(value)!);

export function formatCatalogNumber(value: CatalogNumber): string {
  return value;
}

export function catalogNumberFromOrdinal(ordinal: number): CatalogNumber | null {
  return Number.isSafeInteger(ordinal) && ordinal > 0
    ? parseCatalogNumber(`BBR#${String(ordinal).padStart(3, '0')}`)
    : null;
}

/** Legacy canonical strings may exceed the numeric input's safe integer range. */
export function catalogNumberOrdinal(value: CatalogNumber): number | null {
  const ordinal = Number(value.slice(4));
  return Number.isSafeInteger(ordinal) && ordinal > 0 ? ordinal : null;
}

export function nextFreeCatalogNumber(used: Iterable<CatalogNumber>): CatalogNumber {
  let maximum = 0n;
  for (const value of used) {
    const ordinal = BigInt(value.slice(4));
    if (ordinal > maximum) maximum = ordinal;
  }
  return parseCatalogNumber(`BBR#${String(maximum + 1n).padStart(3, '0')}`)!;
}

export type ReleaseCatalogNumberUsage = {
  catalogNumber: CatalogNumber;
  releaseId: string;
  slug: string;
  title: string;
  status: 'published' | 'draft';
};

export type ReleaseCatalogNumbers = {
  items: ReleaseCatalogNumberUsage[];
  nextFreeNumber: CatalogNumber;
};

export function compareCatalogNumbers(left: CatalogNumber, right: CatalogNumber): number {
  const a = BigInt(left.slice(4));
  const b = BigInt(right.slice(4));
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Owner supplied these identities on 2026-10-15. Never infer numbers from dates, record order or titles. */
export function legacyReleaseCatalogNumber(slug: string): CatalogNumber {
  const numbers: Record<string, string> = {
    caregivers: 'BBR#001',
    anarchotribal: 'BBR#003',
    disintegration: 'BBR#002',
    lotus: 'BBR#004',
  };
  const number = Object.hasOwn(numbers, slug) ? parseCatalogNumber(numbers[slug]) : null;
  if (!number) throw new Error(`Release "${slug}" has no catalog number and no owner-confirmed legacy assignment.`);
  return number;
}

export function releaseCatalogNumberClashes(
  records: readonly { collection: string; id: string; slug: string; data: Record<string, unknown> }[],
): { recordIds: string[]; message: string }[] {
  const releases = new Map<CatalogNumber, { id: string; slug: string }[]>();
  for (const record of records) {
    if (record.collection !== 'releases') continue;
    const number = parseCatalogNumber(record.data.catalog_number);
    if (!number) continue;
    const entries = releases.get(number) ?? [];
    entries.push(record);
    releases.set(number, entries);
  }
  return [...releases]
    .filter(([, entries]) => entries.length > 1)
    .map(([number, entries]) => ({
      recordIds: entries.map((entry) => entry.id),
      message: `Catalog number ${number} is used by releases ${entries.map((entry) => `"${entry.slug}" (${entry.id})`).join(', ')}. Use a unique catalog number for each release.`,
    }));
}
