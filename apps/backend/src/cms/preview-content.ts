import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import {
  contentMediaIds,
  isCmsCollection,
  sourceCollectionNames,
  validateCmsContent,
  validateCmsRevisionContent,
  type CmsCollection,
} from '@blackbox/content-model';

export const previewPath = '/_emdash/preview';
const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const recordSchema = z.object({
  id: identifier,
  slug: z.string(),
  status: z.string().optional(),
  liveRevisionId: identifier.nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});
const revisionSchema = z.object({
  id: identifier,
  collection: z.string(),
  entryId: identifier,
  data: z.record(z.string(), z.unknown()),
});
export const previewInputSchema = z
  .object({
    collection: z.string().refine(isCmsCollection),
    id: identifier.optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(200),
    data: z.record(z.string(), z.unknown()),
  })
  .strict();
export type PreviewInput = z.infer<typeof previewInputSchema>;
type Entry = { id: string; collection: string; data: Record<string, unknown> };
type ReadCms = (path: string) => Promise<unknown>;
export type PreviewContext = {
  input: PreviewInput;
  environment: string;
  getCollection(collection: string): Promise<Entry[]>;
};
export const previewContext = new AsyncLocalStorage<PreviewContext>();

export async function readBoundedText(body: ReadableStream<Uint8Array> | null, limit: number) {
  if (!body) throw new Error('Empty preview request.');
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Preview exceeds the size limit.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

export async function createPreviewContext(
  input: PreviewInput,
  environment: string,
  read: ReadCms,
): Promise<PreviewContext> {
  const collection = input.collection as CmsCollection;
  if (collection === 'navigation') {
    input = { ...input, data: { ...input.data } };
    for (const key of ['show_in_header', 'show_in_footer'])
      if (input.data[key] === 0 || input.data[key] === 1) input.data[key] = input.data[key] === 1;
  }
  const issues = validateCmsContent(collection, input.data);
  if (issues.length) throw new Error(issues.join('\n'));
  if (input.id) {
    const current = z.object({ item: recordSchema }).parse(await read(`content/${collection}/${input.id}`)).item;
    if (current.id !== input.id || current.slug !== input.slug)
      throw new Error('Reload this content before previewing.');
  } else if (!['news', 'socials'].includes(collection)) throw new Error('Select saved content before previewing.');

  const collections = new Map<string, Promise<Entry[]>>();
  const images = new Map<string, Promise<Record<string, unknown>>>();
  async function image(id: string) {
    identifier.parse(id);
    if (!images.has(id))
      images.set(
        id,
        (async () => {
          const { item } = z
            .object({
              item: z.object({
                id: identifier,
                storageKey: z.string().regex(/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:png|jpe?g|webp)$/i),
                width: z.number().int().positive(),
                height: z.number().int().positive(),
                mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
              }),
            })
            .parse(await read(`media/${id}`));
          if (item.id !== id || /^(snapshots|backups|drafts)\//.test(item.storageKey))
            throw new Error('Image is unavailable.');
          return {
            src: `/_emdash/api/media/file/${item.storageKey}`,
            width: item.width,
            height: item.height,
            format: item.mimeType === 'image/jpeg' ? 'jpg' : item.mimeType.slice(6),
          };
        })(),
      );
    return images.get(id)!;
  }
  async function field(value: unknown): Promise<unknown> {
    if (Array.isArray(value)) return Promise.all(value.map(field));
    if (!value || typeof value !== 'object') return value;
    const object = value as Record<string, unknown>;
    if (typeof object.id === 'string' && (Object.keys(object).length === 1 || object.provider === 'local'))
      return image(object.id);
    return Object.fromEntries(
      await Promise.all(
        Object.entries(object)
          .filter(([, value]) => value !== null)
          .map(async ([key, value]) => [key, await field(value)]),
      ),
    );
  }
  async function load(name: string): Promise<Entry[]> {
    const source = Object.entries(sourceCollectionNames).find(([, target]) => target === name)?.[0] as
      CmsCollection | undefined;
    if (!source) throw new Error('Unsupported preview context.');
    const records: { id: string; slug: string; data: Record<string, unknown> }[] = [];
    let cursor: string | undefined;
    const seen = new Set<string>();
    do {
      const query = new URLSearchParams({ limit: '100' });
      if (cursor) query.set('cursor', cursor);
      const page = z
        .object({ items: z.array(recordSchema).max(100), nextCursor: z.string().nullable().optional() })
        .parse(await read(`content/${source}?${query}`));
      for (const item of page.items) {
        if (item.id === input.id && source === collection) continue;
        if (item.status !== 'published' || !item.liveRevisionId) continue;
        const revision = z.object({ item: revisionSchema }).parse(await read(`revisions/${item.liveRevisionId}`)).item;
        if (revision.id !== item.liveRevisionId || revision.collection !== source || revision.entryId !== item.id)
          throw new Error('Published content changed. Refresh preview.');
        const { _slug, ...data } = revision.data;
        if (source === 'navigation')
          for (const key of ['show_in_header', 'show_in_footer'])
            if (data[key] === 0 || data[key] === 1) data[key] = data[key] === 1;
        if (validateCmsRevisionContent(source, data).length)
          throw new Error('Published context is invalid. Ask a label administrator to check it.');
        records.push({ id: item.id, slug: String(_slug ?? item.slug), data });
      }
      cursor = page.nextCursor ?? undefined;
      if (cursor && seen.has(cursor)) throw new Error('Content pagination did not advance.');
      if (cursor) seen.add(cursor);
      if (records.length > 500 || seen.size > 5) throw new Error('Preview context exceeds its read budget.');
    } while (cursor);
    if (source === collection) records.push({ id: input.id ?? input.slug, slug: input.slug, data: input.data });
    const entries = [];
    for (const record of records) {
      const { body, ...editorial } = record.data;
      const data = (await field(editorial)) as Record<string, unknown>;
      if (source === 'artists') data.slug = record.slug;
      if (source === 'releases') {
        // Resolve identity through a published Artist; an unrelated Artist draft never leaks into this preview.
        const artistRecord = z
          .object({ item: recordSchema })
          .parse(await read(`content/artists/${identifier.parse(record.data.artist)}`)).item;
        const artists = await get('artists');
        if (!artists.some((artist) => artist.id === artistRecord.slug))
          throw new Error('Publish the linked Artist before previewing this Release.');
        data.artist = { collection: 'artists', id: artistRecord.slug };
      }
      for (const key of ['date', 'release_date']) if (typeof data[key] === 'string') data[key] = new Date(data[key]);
      if (['artists', 'releases', 'news'].includes(source)) {
        data.editorial_body = body ?? [];
        data.content_media = Object.fromEntries(
          await Promise.all(contentMediaIds(body).map(async (id) => [id, await image(id)])),
        );
      }
      entries.push({
        id: ['artists', 'releases', 'news', 'distro', 'navigation', 'socials'].includes(source) ? record.slug : 'site',
        collection: name,
        data,
      });
    }
    return entries;
  }
  function get(name: string) {
    if (!collections.has(name)) collections.set(name, load(name));
    return collections.get(name)!;
  }
  return { input, environment, getCollection: get };
}

export function getCollection(collection: string) {
  const context = previewContext.getStore();
  if (!context) throw new Error('Private preview context is required.');
  return context.getCollection(collection);
}
export async function getEntry(collection: string | { collection: string; id: string }, id?: string) {
  const name = typeof collection === 'string' ? collection : collection.collection;
  const key = typeof collection === 'string' ? id : collection.id;
  return (await getCollection(name)).find((entry) => entry.id === key);
}
