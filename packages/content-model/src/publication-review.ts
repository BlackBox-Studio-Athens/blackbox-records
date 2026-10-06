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
    action: z.enum(['publish', 'withdraw']).optional(),
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
  )
  .refine(
    ({ action, records }) => action !== 'withdraw' || records.every((record) => record.collection === 'distro'),
    'Only Distro entries can be withdrawn.',
  );

export type PublicationRecord = z.infer<typeof publicationRecordSchema>;
export type PublicationReviewInput = z.infer<typeof publicationReviewSchema>;
export type PublicationReviewEntry = PublicationRecord & {
  action?: 'publish' | 'withdraw';
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
export type PublicationComparisonData = Pick<
  PublicationReview,
  'entries' | 'media' | 'referenceTitles' | 'baselineReferenceTitles'
> & { baselineMedia?: PublicationReview['media'] };

export { publicationValueKey, changedPublicationFields } from './publication-values';
