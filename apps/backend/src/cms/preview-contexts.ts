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

export type PreviewContextStorage = {
  get(key: string): unknown;
  put(key: string, value: unknown): void;
  delete(key: string): boolean;
  list(options: { prefix: string }): Iterable<[string, unknown]>;
};

const contextPrefix = 'cms-preview:v1:';
const manifestPrefix = `${contextPrefix}manifest:`;
const chunkBytes = 1024 * 1024;
const maxContextBytes = 8 * 1024 * 1024;
const maxPayloadBytes = maxContextBytes + 1024;
const maxContextChunks = Math.ceil(maxPayloadBytes / chunkBytes);
const contextIdPattern = /^[a-f0-9-]{36}$/;

type PreviewContextManifest = {
  bytes: number;
  expires: number;
  payloadBytes: number;
  chunks: number;
};

function isManifest(value: unknown): value is PreviewContextManifest {
  if (!value || typeof value !== 'object') return false;
  const { bytes, expires, payloadBytes, chunks } = value as Partial<PreviewContextManifest>;
  return (
    typeof bytes === 'number' &&
    Number.isSafeInteger(bytes) &&
    bytes >= 0 &&
    bytes <= maxContextBytes &&
    typeof expires === 'number' &&
    Number.isFinite(expires) &&
    typeof payloadBytes === 'number' &&
    Number.isSafeInteger(payloadBytes) &&
    payloadBytes > 0 &&
    payloadBytes <= maxPayloadBytes &&
    typeof chunks === 'number' &&
    Number.isSafeInteger(chunks) &&
    chunks === Math.ceil(payloadBytes / chunkBytes) &&
    chunks <= maxContextChunks
  );
}

function manifestKey(id: string) {
  return `${manifestPrefix}${id}`;
}

function chunkPrefix(id: string) {
  return `${contextPrefix}chunk:${id}:`;
}

function chunkKey(id: string, index: number) {
  return `${chunkPrefix(id)}${String(index).padStart(2, '0')}`;
}

function deleteStoredPreviewContext(
  storage: PreviewContextStorage,
  id: string,
  manifest = storage.get(manifestKey(id)),
) {
  const count = isManifest(manifest) ? manifest.chunks : maxContextChunks;
  for (let index = 0; index < count; index++) storage.delete(chunkKey(id, index));
  storage.delete(manifestKey(id));
}

function storedManifests(storage: PreviewContextStorage, now: number) {
  const active: PreviewContextManifest[] = [];
  for (const [key, value] of storage.list({ prefix: manifestPrefix })) {
    const id = key.slice(manifestPrefix.length);
    if (!contextIdPattern.test(id)) {
      storage.delete(key);
      continue;
    }
    if (!isManifest(value) || value.expires <= now) {
      deleteStoredPreviewContext(storage, id, value);
      continue;
    }
    active.push(value);
  }
  return active;
}

export function pruneStoredPreviewContexts(storage: PreviewContextStorage, now = Date.now()) {
  storedManifests(storage, now);
}

function readStoredPreviewContext(storage: PreviewContextStorage, id: string, now: number) {
  if (!contextIdPattern.test(id)) return undefined;
  const key = manifestKey(id);
  const manifest = storage.get(key);
  if (!isManifest(manifest)) {
    if (manifest !== undefined) deleteStoredPreviewContext(storage, id, manifest);
    return undefined;
  }
  if (manifest.expires <= now) {
    deleteStoredPreviewContext(storage, id, manifest);
    return undefined;
  }

  const payload = new Uint8Array(manifest.payloadBytes);
  let offset = 0;
  for (let index = 0; index < manifest.chunks; index++) {
    const value = storage.get(chunkKey(id, index));
    const chunk =
      value instanceof Uint8Array ? value : value instanceof ArrayBuffer ? new Uint8Array(value) : undefined;
    if (
      !chunk ||
      chunk.byteLength === 0 ||
      chunk.byteLength > chunkBytes ||
      offset + chunk.byteLength > payload.length
    ) {
      deleteStoredPreviewContext(storage, id, manifest);
      return undefined;
    }
    payload.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (offset !== payload.byteLength) {
    deleteStoredPreviewContext(storage, id, manifest);
    return undefined;
  }

  try {
    const context = JSON.parse(new TextDecoder().decode(payload)) as RetainedPreview;
    if (context.requestId !== id || context.expires !== manifest.expires || context.bytes !== manifest.bytes) {
      deleteStoredPreviewContext(storage, id, manifest);
      return undefined;
    }
    return context;
  } catch {
    deleteStoredPreviewContext(storage, id, manifest);
    return undefined;
  }
}

export function prunePreviewContexts(contexts: Map<string, RetainedPreview>, now = Date.now()) {
  for (const [id, context] of contexts) if (context.expires <= now) contexts.delete(id);
}

export function retainPreviewContext(
  contexts: Map<string, RetainedPreview>,
  input: Omit<RetainedPreview, 'expires' | 'bytes'>,
  now = Date.now(),
  storage?: PreviewContextStorage,
) {
  const requestId = input.requestId ?? crypto.randomUUID();
  if (!contextIdPattern.test(requestId)) throw new Error('Preview context is invalid.');
  const snapshot = { ...structuredClone(input), requestId };
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
  prunePreviewContexts(contexts, now);

  if (storage) {
    const manifests = storedManifests(storage, now);
    if (
      manifests.length >= 16 ||
      manifests.reduce((total, manifest) => total + manifest.bytes, bytes) > maxContextBytes
    )
      throw new Error('Preview capacity reached. Close an older preview and retry.');
  } else if (
    contexts.size >= 16 ||
    [...contexts.values()].reduce((total, context) => total + context.bytes, bytes) > maxContextBytes
  ) {
    throw new Error('Preview capacity reached. Close an older preview and retry.');
  }

  if (bytes > maxContextBytes) throw new Error('Preview capacity reached. Close an older preview and retry.');
  const context: RetainedPreview = { ...snapshot, bytes, expires: now + 15 * 60_000 };
  if (storage) {
    const payload = new TextEncoder().encode(JSON.stringify(context));
    if (payload.byteLength > maxPayloadBytes)
      throw new Error('Preview capacity reached. Close an older preview and retry.');
    const manifest: PreviewContextManifest = {
      bytes,
      expires: context.expires,
      payloadBytes: payload.byteLength,
      chunks: Math.ceil(payload.byteLength / chunkBytes),
    };
    try {
      storage.put(manifestKey(requestId), manifest);
      for (let index = 0; index < manifest.chunks; index++)
        storage.put(chunkKey(requestId, index), payload.slice(index * chunkBytes, (index + 1) * chunkBytes));
    } catch (error) {
      deleteStoredPreviewContext(storage, requestId, manifest);
      throw error;
    }
  }
  contexts.set(requestId, context);
  return requestId;
}

export function ownedPreviewContext(
  contexts: Map<string, RetainedPreview>,
  id: string,
  owner: string,
  now = Date.now(),
  storage?: PreviewContextStorage,
) {
  prunePreviewContexts(contexts, now);
  let context = contexts.get(id);
  if (!context && storage) {
    context = readStoredPreviewContext(storage, id, now);
    if (context) contexts.set(id, context);
  }
  if (!context || context.owner !== owner) throw new Error('Preview expired or is unavailable. Refresh preview.');
  return context;
}

export function releasePreviewContext(
  contexts: Map<string, RetainedPreview>,
  id: string,
  storage?: PreviewContextStorage,
) {
  contexts.delete(id);
  if (storage && contextIdPattern.test(id)) deleteStoredPreviewContext(storage, id);
}
