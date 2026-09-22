import { contentMediaIds, sourceCollectionNames } from './emdash-content';
import { parseContentSnapshot, type ContentSnapshot } from './content-snapshot';

/** Render input can contain transient editor records; only saved snapshots carry revisions. */
export type PublicContent = Pick<ContentSnapshot, 'media' | 'storeItems'> & {
  records: Omit<ContentSnapshot['records'][number], 'revisionId'>[];
};

/** A selected revision replaces only its own public record. Draft inventories are irrelevant. */
export function replacePublishedRecord(
  previous: ContentSnapshot,
  record: ContentSnapshot['records'][number],
  media: ContentSnapshot['media'],
  storeItems = previous.storeItems,
) {
  const records = previous.records.filter((item) => item.collection !== record.collection || item.id !== record.id);
  records.push(record);
  records.sort((a, b) => `${a.collection}/${a.id}`.localeCompare(`${b.collection}/${b.id}`));
  const referenced = new Set(records.flatMap((item) => contentMediaIds(item.data)));
  const images = new Map([...previous.media, ...media].map((item) => [item.id, item]));
  return parseContentSnapshot(
    JSON.stringify({
      ...previous,
      records,
      media: [...images.values()].filter((item) => referenced.has(item.id)).sort((a, b) => a.id.localeCompare(b.id)),
      ...(storeItems ? { storeItems } : {}),
    }),
    previous.environment,
    record.revisionId,
  );
}

/** Shared mapping for runtime rendering; callers supply only an accepted, validated snapshot. */
export function publishedCollection(
  snapshot: PublicContent,
  collection: string,
  mediaBase: string,
  privateImages: Record<string, { src: string; width: number; height: number; format: string }> = {},
) {
  const images = new Map(snapshot.media.map((item) => [item.id, item]));
  function image(id: string) {
    if (privateImages[id]) return privateImages[id];
    const item = images.get(id);
    if (!item) throw new Error('Published image is unavailable.');
    return {
      src: `${mediaBase}/${item.sha256}`,
      width: item.width,
      height: item.height,
      format: item.mimeType === 'image/jpeg' ? 'jpg' : item.mimeType.slice(6),
    };
  }
  function field(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(field);
    if (!value || typeof value !== 'object') return value;
    const object = value as Record<string, unknown>;
    if (typeof object.id === 'string' && (Object.keys(object).length === 1 || object.provider === 'local'))
      return image(object.id);
    return Object.fromEntries(
      Object.entries(object)
        .filter(([, child]) => child !== null)
        .map(([key, child]) => [key, field(child)]),
    );
  }
  return snapshot.records
    .filter((record) => sourceCollectionNames[record.collection as keyof typeof sourceCollectionNames] === collection)
    .map((record) => {
      const { body, ...editorial } = record.data;
      const data = field(editorial) as Record<string, unknown>;
      if (record.collection === 'artists') data.slug = record.slug;
      if (record.collection === 'releases') {
        const artist = snapshot.records.find((item) => item.collection === 'artists' && item.id === record.data.artist);
        if (!artist) throw new Error('Published Artist is unavailable.');
        data.artist = { collection: 'artists', id: artist.slug };
      }
      for (const key of ['date', 'release_date']) if (typeof data[key] === 'string') data[key] = new Date(data[key]);
      if (['artists', 'releases', 'news'].includes(record.collection)) {
        data.editorial_body = body ?? [];
        data.content_media = Object.fromEntries(contentMediaIds(body).map((id) => [id, image(id)]));
      }
      if (snapshot.storeItems && ['releases', 'distro'].includes(record.collection)) {
        const item = snapshot.storeItems.find(
          (item) =>
            item.sourceKind === (record.collection === 'releases' ? 'release' : 'distro') &&
            item.sourceId === record.slug,
        );
        data.store_item = item ? { storeItemSlug: item.storeItemSlug, variantId: item.variantId } : null;
      }
      return {
        id: ['artists', 'releases', 'news', 'distro', 'navigation', 'socials'].includes(record.collection)
          ? record.slug
          : 'site',
        collection,
        data,
      };
    });
}
