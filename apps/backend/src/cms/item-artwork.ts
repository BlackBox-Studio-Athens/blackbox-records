import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { ProductEnvironmentProfile } from '../env';
import { approvePublicationImage } from './snapshot-storage';
import { readBytes, readJson } from './publication-routes';
import { cmsStringProblemResponse } from '../interfaces/http/responses';

export const itemArtworkPath = '/_emdash/api/blackbox/item-artwork';
export const publishedMediaPath = '/media/published/';
const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const commandSchema = z
  .object({ collection: z.enum(['releases', 'distro']), entryId: identifier, _rev: z.string().min(1).max(512) })
  .strict();
const entrySchema = z.object({
  _rev: z.string(),
  item: z.object({
    id: identifier,
    status: z.enum(['draft', 'published']),
    data: z.record(z.string(), z.unknown()),
  }),
});
const imageTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;

export async function handleItemArtwork(
  request: Request,
  context: {
    bucket: R2Bucket;
    profile: ProductEnvironmentProfile;
    identity: { role: number };
    fetchCms: (path: string) => Promise<Response>;
  },
) {
  const url = new URL(request.url);
  const reply = async (status: number, error: string) => {
    await request.body?.pipeTo(new WritableStream());
    return cmsStringProblemResponse(status, error);
  };
  if (url.pathname !== itemArtworkPath || url.search) return reply(404, 'NOT_FOUND');
  if (request.method !== 'POST') return reply(405, 'METHOD_NOT_ALLOWED');
  if (
    context.identity.role < 30 ||
    request.headers.get('Origin') !== url.origin ||
    request.headers.get('X-EmDash-Request') !== '1'
  )
    return reply(403, 'FORBIDDEN');
  let command: z.infer<typeof commandSchema>;
  try {
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
      throw new Error('JSON required');
    command = commandSchema.parse(await readJson(request.body, 4096));
  } catch {
    return reply(400, 'INVALID_REQUEST');
  }
  const read = async (path: string) => {
    const response = await context.fetchCms(path);
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error('CMS unavailable');
    }
    return z
      .object({ data: z.object({ item: z.unknown(), _rev: z.string().optional() }) })
      .parse(await readJson(response.body, 4 * 1024 * 1024)).data;
  };
  const current = async () => {
    const entry = entrySchema.safeParse(await read(`/_emdash/api/content/${command.collection}/${command.entryId}`));
    return entry.success && entry.data.item.id === command.entryId && entry.data._rev === command._rev
      ? entry.data.item
      : null;
  };
  try {
    // A newly created native draft has no draftRevisionId yet; _rev still protects its saved content.
    const entry = await current();
    if (!entry) return reply(409, 'REVISION_CHANGED');
    const image = z
      .object({ id: identifier })
      .parse(entry.data[command.collection === 'releases' ? 'cover_image' : 'image']);
    const media = z
      .object({
        id: z.literal(image.id),
        filename: z.string().min(1).max(200),
        mimeType: z.enum(imageTypes),
        size: z
          .number()
          .int()
          .positive()
          .max(20 * 1024 * 1024),
        storageKey: z.string().min(1),
        status: z.literal('ready'),
        contentHash: z.string().regex(/^sha1:[a-f0-9]{40}$/),
      })
      .parse((await read('/_emdash/api/media/' + image.id)).item);
    // Resolve only the native media identity. Never fetch editor-supplied URLs or arbitrary bucket keys.
    const response = await context.fetchCms('/_emdash/api/media/file/' + encodeURIComponent(media.storageKey));
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error('Media unavailable');
    }
    const bytes = await readBytes(response.body, media.size);
    if (
      bytes.byteLength !== media.size ||
      `sha1:${createHash('sha1').update(bytes).digest('hex')}` !== media.contentHash
    )
      throw new Error('Media changed');
    if (!(await current())) return reply(409, 'REVISION_CHANGED');
    const approved = await approvePublicationImage(
      context.bucket,
      context.profile.workerDeploymentTarget,
      new File([bytes], media.filename, { type: media.mimeType }),
    );
    return Response.json(
      {
        _rev: command._rev,
        imageUrl: context.profile.publicBackendOrigin + publishedMediaPath + approved.sha256,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return reply(503, 'ARTWORK_UNAVAILABLE');
  }
}

export async function servePublishedMedia(request: Request, bucket: R2Bucket, profile: ProductEnvironmentProfile) {
  const url = new URL(request.url);
  const sha256 = url.pathname.slice(publishedMediaPath.length);
  const unavailable = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  const validOrigin =
    profile.productEnvironment === 'LOCAL'
      ? url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)
      : url.origin === profile.publicBackendOrigin;
  if (
    !validOrigin ||
    !url.pathname.startsWith(publishedMediaPath) ||
    !/^[a-f0-9]{64}$/.test(sha256) ||
    url.search ||
    !['GET', 'HEAD'].includes(request.method)
  )
    return unavailable();
  const key = `approved-media/${profile.workerDeploymentTarget}/${sha256}`;
  const object = request.method === 'HEAD' ? await bucket.head(key) : await bucket.get(key);
  if (
    !object ||
    object.checksums.toJSON().sha256 !== sha256 ||
    !imageTypes.some((type) => type === object.httpMetadata?.contentType)
  ) {
    if (object && 'body' in object) await (object as R2ObjectBody).body.cancel();
    return unavailable();
  }
  return new Response('body' in object ? (object as R2ObjectBody).body : null, {
    headers: {
      'Content-Type': object.httpMetadata!.contentType!,
      'Content-Length': String(object.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ETag: `"${sha256}"`,
    },
  });
}
