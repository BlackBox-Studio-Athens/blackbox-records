import type { PreviewSelection } from './preview-selection';

export type RetainedPreview = {
  owner: string;
  parentOrigin: string;
  generation: number;
  requestId?: string;
  selection: PreviewSelection;
  expires: number;
  bytes: number;
};

export function prunePreviewContexts(contexts: Map<string, RetainedPreview>, now = Date.now()) {
  for (const [id, context] of contexts) if (context.expires <= now) contexts.delete(id);
}

export function retainPreviewContext(
  contexts: Map<string, RetainedPreview>,
  input: Omit<RetainedPreview, 'expires' | 'bytes'>,
  now = Date.now(),
) {
  prunePreviewContexts(contexts, now);
  const bytes = new TextEncoder().encode(JSON.stringify(input)).byteLength;
  if (
    contexts.size >= 16 ||
    [...contexts.values()].reduce((total, context) => total + context.bytes, bytes) > 8 * 1024 * 1024
  )
    throw new Error('Preview capacity reached. Close an older preview and retry.');
  const id = crypto.randomUUID();
  contexts.set(id, { ...structuredClone(input), bytes, expires: now + 15 * 60_000 });
  return id;
}

export function ownedPreviewContext(
  contexts: Map<string, RetainedPreview>,
  id: string,
  owner: string,
  now = Date.now(),
) {
  prunePreviewContexts(contexts, now);
  const context = contexts.get(id);
  if (!context || context.owner !== owner) throw new Error('Preview expired or is unavailable. Refresh preview.');
  return context;
}
