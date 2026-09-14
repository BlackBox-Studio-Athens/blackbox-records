export type EditorialRecord = { id: string; slug: string; data: Record<string, unknown> };
export type EditorialMedia = { id: string; filename: string; url?: string; storageKey?: string; alt: string | null };
export type EditorialList<T> = { items: T[]; nextCursor?: string };

export function editorialMediaUrl(item: EditorialMedia, origin: string): string {
  const path = item.url ?? (item.storageKey ? `/_emdash/api/media/file/${encodeURIComponent(item.storageKey)}` : '');
  if (!path) return '';
  try {
    const url = new URL(path, origin);
    return url.origin === new URL(origin).origin && url.pathname.startsWith('/_emdash/api/media/file/') ? url.href : '';
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
    const details = (await response.json().catch(() => null)) as { error?: { message?: unknown } } | null;
    const validation =
      [400, 422].includes(response.status) && typeof details?.error?.message === 'string'
        ? details.error.message.slice(0, 1000)
        : null;
    throw new EditorialApiError(
      response.status,
      response.status === 409
        ? 'Someone changed this record. Your text is still here. Load the saved version before saving again.'
        : (validation ?? 'We could not confirm this request. Check your connection and try again.'),
    );
  }
  const result = (await response.json()) as { success: boolean; data: T };
  if (!result.success) throw new Error('We could not read the result. Try again.');
  return result.data;
}

export async function createEditorialDraft(
  base: string,
  collection: 'artists' | 'releases',
  command: { slug: string; data: Record<string, unknown> },
) {
  try {
    return await editorialRequest<{ item: EditorialRecord }>(
      base,
      `content/${collection}/${encodeURIComponent(command.slug)}`,
    );
  } catch (error) {
    if (!(error instanceof EditorialApiError) || error.status !== 404) throw error;
  }
  return editorialRequest<{ item: EditorialRecord }>(base, `content/${collection}`, command);
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
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 20 * 1024 * 1024)
    throw new Error('Choose a JPG, PNG, WebP or AVIF image smaller than 20 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 64 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image preview is unavailable. Try another browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!thumbnail) throw new Error('We could not prepare this image. Choose another file.');
    const form = new FormData();
    form.set('file', file);
    form.set('thumbnail', thumbnail, 'thumbnail.png');
    const result = await editorialRequest<{ item: EditorialMedia }>(base, 'media', form);
    return result.item;
  } finally {
    bitmap.close();
  }
}
