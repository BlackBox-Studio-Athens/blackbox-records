import type { ContentSnapshot } from '@blackbox/content-model';
import {
  deliverPublicCmsImage,
  isPublicImageRequestWidth,
  parsePublicMediaPath,
  type PublicImageConfig,
} from './public-image-transform';
import {
  readPublishedSnapshotMedia,
  type PublicationEnvironment,
  type PublicationPointer,
  type PublishedMedia,
} from './published-storage';

// Workers Caching stores header-less 404s heuristically; a not-found answer must never be reused.
export const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

/**
 * Accepted snapshots besides the live one whose media stays addressable. Open pages and edge-cached HTML keep their
 * images across a few quick publications; older and never-accepted media stays private and cannot spend Images quota.
 */
export const recentPublicSnapshotCount = 3;

type Live = { pointer: PublicationPointer; snapshot: Pick<ContentSnapshot, 'media'> };
type RecentMedia = { media: Map<string, PublishedMedia>; snapshots: Map<string, Set<string>> };

/** Media URLs carry only the media SHA, so a publication keeps every unchanged image URL and transformation. */
export const publicMediaBase = (url: URL) =>
  `${url.pathname.startsWith('/blackbox-records/') ? '/blackbox-records' : ''}/media/content`;

export class PublicMedia {
  private live: { snapshotSha256: string; media: Map<string, PublishedMedia> } | undefined;
  private recent: { snapshotSha256: string; media: Promise<RecentMedia> } | undefined;

  constructor(
    private bucket: R2Bucket,
    private environment: PublicationEnvironment,
    private image: PublicImageConfig,
    private fetchTransformed?: (url: URL, request: Request) => Promise<Response>,
    private recentSnapshots = recentPublicSnapshotCount,
  ) {}

  /** O(1) lookup in the live snapshot; anything else is answered by one bounded index of recent accepted snapshots. */
  async resolve(live: Live, path: { mediaSha256: string; snapshotSha256?: string }) {
    const current = live.pointer.snapshotSha256;
    if (this.live?.snapshotSha256 !== current)
      this.live = { snapshotSha256: current, media: new Map(live.snapshot.media.map((item) => [item.sha256, item])) };
    if (path.snapshotSha256 === undefined || path.snapshotSha256 === current) {
      const item = this.live.media.get(path.mediaSha256);
      if (item || path.snapshotSha256 === current) return item;
    }
    const recent = await this.recentMedia(current);
    if (path.snapshotSha256 !== undefined && !recent.snapshots.get(path.snapshotSha256)?.has(path.mediaSha256))
      return undefined;
    return recent.media.get(path.mediaSha256);
  }

  async media(request: Request, path: string, live: () => Promise<Live>) {
    const parsed = parsePublicMediaPath(path);
    const item = parsed && (await this.resolve(await live(), parsed));
    return item ? this.original(request.method, item) : notFound();
  }

  /** `/_image` for CMS media: only current or recent media, only emitted widths, one canonical Images source. */
  async transformed(request: Request, source: URL, live: () => Promise<Live>) {
    const url = new URL(request.url);
    const parsed = parsePublicMediaPath(source.pathname.replace(/^\/blackbox-records(?=\/)/, ''));
    if (!parsed || source.origin !== url.origin || source.search || source.hash) return notFound();
    const width = url.searchParams.get('w');
    const format = url.searchParams.get('f');
    if (format !== null && (format !== 'jpeg' || width !== '1200')) return notFound();
    const item = await this.resolve(await live(), parsed);
    if (!item || (width !== null && !isPublicImageRequestWidth(width, item.width))) return notFound();
    return deliverPublicCmsImage(
      request,
      item.sha256,
      width === null ? null : Number(width),
      this.image,
      () => this.original(request.method, item),
      this.fetchTransformed,
      format === 'jpeg' ? 'metadata' : 'auto',
    );
  }

  private async original(method: string, item: PublishedMedia) {
    const object = await this.bucket.get(`snapshots/${this.environment}/media/${item.sha256}`);
    if (!object || object.size !== item.size || object.checksums.toJSON().sha256 !== item.sha256) {
      await object?.body.cancel();
      throw new Error('Published media unavailable.');
    }
    if (method === 'HEAD') await object.body.cancel();
    return new Response(method === 'HEAD' ? null : object.body, {
      headers: {
        'Content-Type': item.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  private recentMedia(current: string) {
    if (this.recent?.snapshotSha256 !== current) {
      const media = this.readRecentMedia(current);
      this.recent = { snapshotSha256: current, media };
      // A failed read is not remembered; the next miss retries.
      media.catch(() => {
        if (this.recent?.media === media) this.recent = undefined;
      });
    }
    return this.recent.media;
  }

  private async readRecentMedia(current: string): Promise<RecentMedia> {
    const prefix = `snapshots/${this.environment}/accepted/`;
    const accepted: { sha256: string; uploaded: number }[] = [];
    let cursor: string | undefined;
    // ponytail: one marker per publication; ten pages cover 10,000 publications before ordering needs an index.
    for (let page = 0; page < 10; page++) {
      const listed = await this.bucket.list({ prefix, cursor, limit: 1000 });
      for (const object of listed.objects) {
        const sha256 = object.key.slice(prefix.length);
        if (sha256 !== current && /^[a-f0-9]{64}$/.test(sha256))
          accepted.push({ sha256, uploaded: object.uploaded.getTime() });
      }
      if (!listed.truncated) break;
      cursor = listed.cursor;
    }
    accepted.sort((a, b) => b.uploaded - a.uploaded || a.sha256.localeCompare(b.sha256));
    const recent: RecentMedia = { media: new Map(), snapshots: new Map() };
    for (const { sha256 } of accepted.slice(0, this.recentSnapshots)) {
      const media = await readPublishedSnapshotMedia(this.bucket, this.environment, sha256);
      recent.snapshots.set(sha256, new Set(media.map((item) => item.sha256)));
      for (const item of media) if (!recent.media.has(item.sha256)) recent.media.set(item.sha256, item);
    }
    return recent;
  }
}
