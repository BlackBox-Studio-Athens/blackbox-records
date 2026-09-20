export const staffThumbnailRoutePrefix = '/_emdash/api/blackbox/thumbnails/';
export const staffThumbnailStoragePrefix = 'staff-thumbnails/v1/';
export const staffThumbnailVersion = '1';
export const staffThumbnailMaxDimension = 96;
export const staffThumbnailMaxBytes = 40 * 1024;

const originalStorageKeyPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,159}\.(?:png|jpe?g|webp)$/i;
const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

export type StaffThumbnailDimensions = { width: number; height: number };

export type StaffThumbnailCandidate = StaffThumbnailDimensions & {
  bytes: Uint8Array;
  key: string;
};

export function isStaffThumbnailOriginalKey(value: string): boolean {
  return originalStorageKeyPattern.test(value);
}

export function staffThumbnailStorageKey(originalStorageKey: string): string | null {
  return isStaffThumbnailOriginalKey(originalStorageKey)
    ? `${staffThumbnailStoragePrefix}${originalStorageKey}.png`
    : null;
}

export function staffThumbnailUrl(originalStorageKey: string): string {
  return isStaffThumbnailOriginalKey(originalStorageKey)
    ? `${staffThumbnailRoutePrefix}${encodeURIComponent(originalStorageKey)}`
    : '';
}

export function decodeStaffThumbnailOriginalKey(pathname: string): string | null {
  if (!pathname.startsWith(staffThumbnailRoutePrefix)) return null;
  const encoded = pathname.slice(staffThumbnailRoutePrefix.length);
  if (!encoded || encoded.includes('/')) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(encoded);
  } catch {
    return null;
  }
  return encodeURIComponent(decoded) === encoded && isStaffThumbnailOriginalKey(decoded) ? decoded : null;
}

export function readStaffThumbnailPng(bytes: Uint8Array): StaffThumbnailDimensions | null {
  if (bytes.byteLength === 0 || bytes.byteLength > staffThumbnailMaxBytes) return null;
  if (bytes.byteLength < 33 || pngSignature.some((byte, index) => bytes[index] !== byte)) return null;

  let offset = pngSignature.byteLength;
  let dimensions: StaffThumbnailDimensions | null = null;
  while (offset + 12 <= bytes.byteLength) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
    const length = view.getUint32(0);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > bytes.byteLength) return null;
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (type === 'IHDR') {
      if (length !== 13 || dimensions) return null;
      const header = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 13);
      const width = header.getUint32(0);
      const height = header.getUint32(4);
      if (width < 1 || height < 1 || width > staffThumbnailMaxDimension || height > staffThumbnailMaxDimension)
        return null;
      dimensions = { width, height };
    }
    if (type === 'IEND') return length === 0 && chunkEnd === bytes.byteLength && dimensions ? dimensions : null;
    offset = chunkEnd;
  }
  return null;
}

export function createStaffThumbnailCandidate(
  originalStorageKey: string,
  bytes: Uint8Array,
): StaffThumbnailCandidate | null {
  const key = staffThumbnailStorageKey(originalStorageKey);
  const dimensions = readStaffThumbnailPng(bytes);
  return key && dimensions ? { bytes, key, ...dimensions } : null;
}

export function readStaffThumbnailMetadata(
  metadata: Record<string, string> | undefined,
): StaffThumbnailDimensions | null {
  if (!metadata || metadata.version !== staffThumbnailVersion) return null;
  const width = Number(metadata.width);
  const height = Number(metadata.height);
  return Number.isInteger(width) && Number.isInteger(height) && readStaffThumbnailPngDimensions(width, height)
    ? { width, height }
    : null;
}

function readStaffThumbnailPngDimensions(width: number, height: number): boolean {
  return width >= 1 && width <= staffThumbnailMaxDimension && height >= 1 && height <= staffThumbnailMaxDimension;
}

export function staffThumbnailPutOptions({ width, height }: StaffThumbnailDimensions) {
  return {
    httpMetadata: { contentType: 'image/png', cacheControl: 'private, no-store' },
    customMetadata: { version: staffThumbnailVersion, width: String(width), height: String(height) },
  };
}

export async function serveStaffThumbnail(request: Request, bucket: R2Bucket): Promise<Response> {
  const privateHeaders = { 'Cache-Control': 'private, no-store' };
  if (!['GET', 'HEAD'].includes(request.method))
    return new Response('Method not allowed', { status: 405, headers: privateHeaders });
  const url = new URL(request.url);
  if (url.search) return new Response('Bad request', { status: 400, headers: privateHeaders });
  const originalStorageKey = decodeStaffThumbnailOriginalKey(url.pathname);
  const key = originalStorageKey && staffThumbnailStorageKey(originalStorageKey);
  if (!key) return new Response('Bad request', { status: 400, headers: privateHeaders });

  try {
    const object = request.method === 'HEAD' ? await bucket.head(key) : await bucket.get(key);
    const metadata = object && readStaffThumbnailMetadata(object.customMetadata);
    if (
      !object ||
      object.size > staffThumbnailMaxBytes ||
      object.httpMetadata?.contentType !== 'image/png' ||
      !metadata
    )
      return new Response('Not found', { status: 404, headers: privateHeaders });
    const headers = {
      ...privateHeaders,
      'Content-Length': String(object.size),
      'Content-Type': 'image/png',
      'X-Content-Type-Options': 'nosniff',
    };
    if (request.method === 'HEAD') return new Response(null, { headers });
    if (!('body' in object)) return new Response('Not found', { status: 404, headers: privateHeaders });
    const bytes = new Uint8Array(await (object as unknown as { arrayBuffer(): Promise<ArrayBuffer> }).arrayBuffer());
    const dimensions = readStaffThumbnailPng(bytes);
    if (
      bytes.byteLength !== object.size ||
      !dimensions ||
      dimensions.width !== metadata.width ||
      dimensions.height !== metadata.height
    )
      return new Response('Not found', { status: 404, headers: privateHeaders });
    return new Response(bytes, { headers });
  } catch {
    return new Response('Not found', { status: 404, headers: privateHeaders });
  }
}
