import { enrichImageMetadata } from 'emdash/media';
import { cmsNestedProblemResponse } from '../interfaces/http/responses';

const maxImageBytes = 20 * 1024 * 1024;
const maxThumbnailBytes = 1024 * 1024;

type ValidatedImage = {
  bytes: Uint8Array;
  metadata: Awaited<ReturnType<typeof enrichImageMetadata>>;
};

export type ValidatedUploadThumbnail = {
  bytes: Uint8Array;
  contentType: string;
  width: number;
  height: number;
};

async function readValidatedImage(file: File, limit: number): Promise<ValidatedImage> {
  if (
    !file.size ||
    file.size > limit ||
    file.name.length > 200 ||
    [...file.name].some((character) => character < ' ' || character === '/' || character === '\\')
  )
    throw new Error('INVALID_IMAGE');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const prefix = Array.from(bytes.subarray(0, 12));
  const png = prefix.slice(0, 8).join() === '137,80,78,71,13,10,26,10';
  const jpeg = prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255;
  const webp =
    String.fromCharCode(...prefix.slice(0, 4)) === 'RIFF' && String.fromCharCode(...prefix.slice(8, 12)) === 'WEBP';
  if (!(
    (png && file.type === 'image/png' && /\.png$/i.test(file.name)) ||
    (jpeg && file.type === 'image/jpeg' && /\.jpe?g$/i.test(file.name)) ||
    (webp && file.type === 'image/webp' && /\.webp$/i.test(file.name))
  ))
    throw new Error('INVALID_IMAGE');
  // Read original dimensions without decoding a large image just for a placeholder.
  // EmDash generates the display placeholder from the bounded thumbnail later.
  if (
    (png && String.fromCharCode(...bytes.subarray(-8, -4)) !== 'IEND') ||
    (jpeg && (bytes.at(-2) !== 255 || bytes.at(-1) !== 217)) ||
    (webp && new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) + 8 !== bytes.length)
  )
    throw new Error('INVALID_IMAGE');
  const metadata = await enrichImageMetadata(bytes, file.type, {
    placeholder: { bytes: new Uint8Array(), contentType: 'application/octet-stream' },
  });
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > 100_000_000)
    throw new Error('INVALID_IMAGE');
  return { bytes, metadata };
}

export async function validateImage(file: File, limit = maxImageBytes) {
  return (await readValidatedImage(file, limit)).metadata;
}

export async function validateImageUpload(
  request: Request,
): Promise<Response | { thumbnail?: ValidatedUploadThumbnail }> {
  let size = 0;
  let cancellation: Promise<void> | undefined;
  try {
    if (!request.body) throw new Error('INVALID_IMAGE');
    // Retain at most the upload limit. Drain rejected bodies without retaining
    // them so the forwarding Worker can finish its request stream cleanly.
    const reader = request.clone().body!.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxImageBytes + maxThumbnailBytes + 64 * 1024) {
        cancellation ??= request.body.cancel().catch(() => undefined);
        chunks.length = 0;
        continue;
      }
      chunks.push(value);
    }
    if (cancellation) throw new Error('UPLOAD_TOO_LARGE');
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    chunks.length = 0;
    const form = await new Response(body, { headers: request.headers }).formData();
    const allowed = ['file', 'thumbnail', 'width', 'height', 'deduplicate'];
    if ([...form.keys()].some((key) => !allowed.includes(key) || form.getAll(key).length !== 1))
      throw new Error('INVALID_IMAGE');
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('INVALID_IMAGE');
    const dimensions = await readValidatedImage(file, maxImageBytes);
    let validatedThumbnail: ValidatedUploadThumbnail | undefined;
    const thumbnail = form.get('thumbnail');
    if (thumbnail !== null) {
      if (!(thumbnail instanceof File)) throw new Error('INVALID_IMAGE');
      const preview = await readValidatedImage(thumbnail, maxThumbnailBytes);
      if (preview.metadata.width! * preview.metadata.height! > 1_000_000) throw new Error('INVALID_IMAGE');
      validatedThumbnail = {
        bytes: preview.bytes,
        contentType: thumbnail.type,
        width: preview.metadata.width!,
        height: preview.metadata.height!,
      };
    }
    for (const dimension of ['width', 'height'] as const) {
      const supplied = form.get(dimension);
      if (supplied !== null && supplied !== String(dimensions.metadata[dimension])) throw new Error('INVALID_IMAGE');
    }
    return { thumbnail: validatedThumbnail };
  } catch (error) {
    const code = error instanceof Error && error.message === 'UPLOAD_TOO_LARGE' ? 'UPLOAD_TOO_LARGE' : 'INVALID_IMAGE';
    return cmsNestedProblemResponse(code === 'UPLOAD_TOO_LARGE' ? 413 : 400, { code });
  } finally {
    await cancellation;
  }
}
