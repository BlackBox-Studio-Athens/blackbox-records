import { openAsBlob } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import sharp from 'sharp';
import { OpsError } from './arguments';

const imageTypes = new Map([
  ['.jpg', { mime: 'image/jpeg', format: 'jpeg' }],
  ['.jpeg', { mime: 'image/jpeg', format: 'jpeg' }],
  ['.png', { mime: 'image/png', format: 'png' }],
  ['.webp', { mime: 'image/webp', format: 'webp' }],
]);

export async function artworkUpload(path: string): Promise<FormData> {
  const filename = basename(path);
  const type = imageTypes.get(extname(filename).toLowerCase());
  if (!type || /^[\\/]{2}|^\w+:\/\//.test(path) || filename.length > 200 || /\p{Cc}/u.test(filename)) {
    throw new OpsError('Choose a local JPG, PNG or WebP image.');
  }
  try {
    if (!(await stat(path)).isFile()) throw new Error();
    const original = await openAsBlob(path, { type: type.mime });
    if (!original.size || original.size > 20 * 1024 * 1024) throw new Error();
    const bytes = await original.arrayBuffer();
    const image = sharp(bytes, { limitInputPixels: 100_000_000 });
    if ((await image.metadata()).format !== type.format) throw new Error();
    const thumbnail = await image
      .autoOrient()
      .resize(96, 96, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .png()
      .toBuffer();
    if (thumbnail.byteLength > 40 * 1024) throw new Error();
    const form = new FormData();
    form.set('file', new Blob([bytes], { type: type.mime }), filename);
    form.set('thumbnail', new Blob([new Uint8Array(thumbnail)], { type: 'image/png' }), 'thumbnail.png');
    form.set('deduplicate', 'true');
    return form;
  } catch {
    throw new OpsError('Artwork must be a readable JPG, PNG or WebP image of at most 20 MiB and 100 megapixels.');
  }
}
