import { extractSafeProblemDetail } from './problem-details';

export type EditorialRecord = {
  id: string;
  slug: string;
  data: Record<string, unknown>;
  liveRevisionId?: string | null;
  draftRevisionId?: string | null;
  collection?: string;
  artistTitle?: string | null;
  publicationState?: 'draft' | 'changes' | 'pending' | 'published' | undefined;
  selling?:
    | {
        variantId: string;
        storeItemSlug: string;
        itemType: string | null;
        quantity: number | null;
        onlineQuantity: number | null;
        amountMinor: number | null;
        currencyCode: string | null;
        catalogAvailability: string;
        freshUntil: string | null;
      }
    | null
    | undefined;
};
export type EditorialMedia = {
  id: string;
  filename: string;
  url?: string;
  storageKey?: string;
  meta?: { storageKey?: string };
  alt: string | null;
  width?: number;
  height?: number;
};
export type EditorialList<T> = { items: T[]; nextCursor?: string };

const staffThumbnailOriginalKeyPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}\.(?:png|jpe?g|webp)$/i;
const nativeMediaPath = '/_emdash/api/media/file/';

export function editorialMediaUrl(item: EditorialMedia, origin: string): string {
  const storageKey = item.storageKey ?? item.meta?.storageKey;
  const path = item.url ?? (storageKey ? `${nativeMediaPath}${encodeURIComponent(storageKey)}` : '');
  if (!path) return '';
  try {
    const url = new URL(path, origin);
    return url.origin === new URL(origin).origin && url.pathname.startsWith(nativeMediaPath) ? url.href : '';
  } catch {
    return '';
  }
}

export function staffThumbnailUrl(item: EditorialMedia, origin: string): string {
  const candidates = [item.storageKey, item.meta?.storageKey];
  const original = editorialMediaUrl(item, origin);
  if (original) {
    try {
      const url = new URL(original);
      if (!url.search && !url.hash) candidates.push(url.pathname.slice(nativeMediaPath.length));
    } catch {
      // Keep the empty fallback below.
    }
  }
  const storageKey = candidates.find(
    (candidate): candidate is string => !!candidate && staffThumbnailOriginalKeyPattern.test(candidate),
  );
  if (!storageKey) return '';
  try {
    const base = new URL(origin).origin;
    return `${base}/_emdash/api/blackbox/thumbnails/${encodeURIComponent(storageKey)}`;
  } catch {
    return '';
  }
}

// Native reads enrich images with delivery metadata; editorial writes accept the media identity only.
export function editorialWriteData(data: Record<string, unknown>): Record<string, unknown> {
  function field(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(field);
    if (!value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    if (record.provider === 'local' && typeof record.id === 'string') return { id: record.id };
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, field(value)]));
  }
  return field(data) as Record<string, unknown>;
}

export class EditorialApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function editorialRequest<T>(
  base: string,
  path: string,
  body?: object | FormData,
  method = body === undefined ? 'GET' : 'POST',
): Promise<T> {
  const multipart = body instanceof FormData;
  const response = await fetch(`${base}/_emdash/api/${path}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'X-EmDash-Request': '1',
      ...(multipart || body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: multipart ? body : body === undefined ? null : JSON.stringify(body),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    const detail = extractSafeProblemDetail(details, '');
    const validation = [400, 422].includes(response.status) && detail ? detail : null;
    throw new EditorialApiError(
      response.status,
      response.status === 409
        ? 'Someone changed this entry. Your text is still here. Load the saved version before saving again.'
        : (validation ?? 'We could not confirm this request. Check your connection and try again.'),
    );
  }
  const result = (await response.json()) as { success: boolean; data: T };
  if (!result.success) throw new Error('We could not read the result. Try again.');
  return result.data;
}

export async function createEditorialDraft(
  base: string,
  collection: 'artists' | 'releases' | 'distro',
  command: { slug: string; data: Record<string, unknown> },
) {
  try {
    return await editorialRequest<{ item: EditorialRecord; _rev: string }>(
      base,
      `content/${collection}/${encodeURIComponent(command.slug)}`,
    );
  } catch (error) {
    if (!(error instanceof EditorialApiError) || error.status !== 404) throw error;
  }
  return editorialRequest<{ item: EditorialRecord; _rev: string }>(base, `content/${collection}`, command);
}

export function editorialSlug(title: string, identity: string): string {
  const name = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
    .replace(/-$/, '');
  return `${name || 'item'}-${identity}`;
}

export async function uploadArtwork(base: string, file: File): Promise<EditorialMedia> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024)
    throw new Error('Choose a JPG, PNG or WebP image smaller than 20 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 96 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image preview is unavailable. Try another browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!thumbnail) throw new Error('We could not prepare this image. Choose another file.');
    const form = new FormData();
    form.set('file', file);
    if (thumbnail.size <= 40 * 1024) form.set('thumbnail', thumbnail, 'thumbnail.png');
    const result = await editorialRequest<{ item: EditorialMedia }>(base, 'media', form);
    return result.item;
  } finally {
    bitmap.close();
  }
}
