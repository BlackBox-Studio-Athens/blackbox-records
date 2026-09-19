import { z } from 'zod';
import { isCmsCollection } from './emdash-content';

export const publicationRecordSchema = z
  .object({
    collection: z.string().refine((value): boolean => isCmsCollection(value)),
    recordId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
    expectedRevision: z.string().min(1).max(256),
  })
  .strict();
export const publicationReviewSchema = z
  .object({
    records: z
      .array(publicationRecordSchema.partial({ expectedRevision: true }))
      .min(1)
      .max(20),
    baseline: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  })
  .strict()
  .refine(
    ({ records }) => new Set(records.map((r) => `${r.collection}/${r.recordId}`)).size === records.length,
    'Select each entry once.',
  );

export type PublicationRecord = z.infer<typeof publicationRecordSchema>;
export type PublicationReviewInput = z.infer<typeof publicationReviewSchema>;
export type PublicationReviewEntry = PublicationRecord & {
  title: string;
  slug: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  issues: string[];
};
export type PublicationReview = {
  baseline: string;
  environment: 'local' | 'uat' | 'prd';
  publicUrl: string;
  entries: PublicationReviewEntry[];
  destinations: { collection: string; recordId: string; slug: string; title: string }[];
  dependencies: { collection: string; recordId: string; title: string; requiredBy: string; available: boolean }[];
  media: Record<string, { src: string; width: number; height: number; format: string }>;
  referenceTitles: Record<string, string>;
  baselineReferenceTitles: Record<string, string>;
};

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
