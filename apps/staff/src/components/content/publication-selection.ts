import { z } from 'zod';
import { isCmsCollection } from '@blackbox/content-model';
import type { SelectedPublicationRecord } from '../../lib/backend/content-publication-api';

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
  const selected = selectionSchema.parse(JSON.parse(value));
  saveSelection(base, selected);
  localStorage.removeItem(legacy);
  return selected;
}
export function saveSelection(base: string, items: PublicationSelectionItem[]) {
  sessionStorage.setItem(selectionKey(base), JSON.stringify(selectionSchema.parse(items)));
}
