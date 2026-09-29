import { z } from 'zod';
import { isCmsCollection, publicationReviewSchema } from '@blackbox/content-model';
import type { SelectedPublicationRecord, SelectedPublicationRequest } from '../../lib/backend/content-publication-api';

export const pendingPublicationKey = (base: string) => `blackbox-content-publication-v2:${base}`;
export function restorePublication(base: string): Extract<SelectedPublicationRequest, { records: unknown }> | null {
  const value = localStorage.getItem(pendingPublicationKey(base));
  if (!value) return null;
  const stored = JSON.parse(value);
  if (typeof stored.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(stored.id))
    throw new Error('Saved publication cannot be restored. Check history before starting again.');
  const input = publicationReviewSchema.parse({
    records: stored.records ?? [
      { collection: stored.collection, recordId: stored.recordId, expectedRevision: stored.expectedRevision },
    ],
    ...(stored.baseline ? { baseline: stored.baseline } : {}),
  });
  if (input.records.some((r) => !r.expectedRevision))
    throw new Error('Saved publication is incomplete. Check history.');
  return {
    id: stored.id,
    ...(input.baseline ? { baseline: input.baseline } : {}),
    records: input.records.map((r) => ({ ...r, expectedRevision: r.expectedRevision! })),
  };
}

const selectionSchema = z
  .array(
    z.object({
      collection: z.string().refine(isCmsCollection),
      recordId: z.string().min(1),
      expectedRevision: z.string().min(1),
      title: z.string(),
    }),
  )
  .max(20);
export type PublicationSelectionItem = SelectedPublicationRecord & { title: string };
const selectionKey = (base: string) => `blackbox-website-review:${base}`;
export function readSelection(base: string): PublicationSelectionItem[] {
  const legacy = `blackbox-content-publication-selection:${base}`;
  const value = sessionStorage.getItem(selectionKey(base)) ?? localStorage.getItem(legacy) ?? '[]';
  const selected = saveSelection(base, JSON.parse(value));
  localStorage.removeItem(legacy);
  return selected;
}
export function saveSelection(base: string, items: PublicationSelectionItem[]) {
  const selected = selectionSchema.parse(items);
  sessionStorage.setItem(selectionKey(base), JSON.stringify(selected));
  return selected;
}
