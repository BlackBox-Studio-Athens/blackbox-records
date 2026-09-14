import { z } from 'zod';
import {
  CatalogPriceConflictError,
  createStripeCatalogRequestShapeFingerprint,
} from '../../../application/commerce/catalog-sync';
import type { CmsItemPublicationGateway } from '../../../application/commerce/catalog-sync';
import type { RuntimeCatalogRecord } from '../../../domain/commerce/repositories/spi';
import { prepareCmsSetupPresentation } from './cms-item-source-gateway';

const sourceSchema = z.object({
  data: z.object({
    _rev: z.string().min(1),
    item: z.object({
      id: z.string(),
      slug: z.string(),
      status: z.string(),
      liveRevisionId: z.string().nullable(),
      draftRevisionId: z.string().nullish(),
      data: z.record(z.string(), z.unknown()),
    }),
  }),
});

export function createCmsItemPublicationGateway(cms: Pick<Fetcher, 'fetch'>, operatorRequest: Request) {
  const origin = new URL(operatorRequest.url).origin;
  const headers = new Headers({ 'Content-Type': 'application/json', 'X-EmDash-Request': '1', Origin: origin });
  const assertion = operatorRequest.headers.get('Cf-Access-Jwt-Assertion');
  if (assertion) headers.set('Cf-Access-Jwt-Assertion', assertion);
  async function request(path: string, body?: unknown) {
    const response = await cms.fetch(
      new Request(origin + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        redirect: 'manual',
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 409) throw new CatalogPriceConflictError('CMS revision changed.');
      throw new Error(`CMS publication request failed (${response.status}).`);
    }
    return response.json();
  }
  const collection = (record: RuntimeCatalogRecord) => (record.sourceKind === 'release' ? 'releases' : 'distro');
  const path = (record: RuntimeCatalogRecord) => {
    if (!record.cmsSourceId) throw new CatalogPriceConflictError('CMS source is not linked.');
    return `/_emdash/api/content/${collection(record)}/${encodeURIComponent(record.cmsSourceId)}`;
  };
  async function read(record: RuntimeCatalogRecord) {
    const source = sourceSchema.parse(await request(path(record))).data;
    if (
      source.item.id !== record.cmsSourceId ||
      source.item.slug !== record.sourceId ||
      !['draft', 'published'].includes(source.item.status)
    )
      throw new CatalogPriceConflictError('CMS source identity changed.');
    return source;
  }
  const fingerprint = (source: Awaited<ReturnType<typeof read>>) =>
    createStripeCatalogRequestShapeFingerprint({ slug: source.item.slug, data: source.item.data });
  const gateway = {
    async read(record: RuntimeCatalogRecord) {
      const source = await read(record);
      return {
        cmsRevision: source._rev,
        title: source.item.data.title,
        collection: collection(record),
        cmsSourceId: source.item.id,
      };
    },
    async checkRevision(record, revision) {
      if ((await read(record))._rev !== revision) throw new CatalogPriceConflictError('CMS revision changed.');
    },
    async approve(record, revision) {
      const source = await read(record);
      if (source._rev !== revision) throw new CatalogPriceConflictError('CMS revision changed.');
      const approval = z.object({ _rev: z.literal(revision), imageUrl: z.url() }).parse(
        await request('/_emdash/api/blackbox/item-artwork', {
          collection: collection(record),
          entryId: record.cmsSourceId,
          _rev: revision,
        }),
      );
      const projection = await prepareCmsSetupPresentation(source.item);
      return { projection: { ...projection, imageUrls: [approval.imageUrl] }, sourceFingerprint: fingerprint(source) };
    },
    async publish(record, revision, sourceFingerprint) {
      const source = await read(record);
      if (fingerprint(source) !== sourceFingerprint)
        throw new CatalogPriceConflictError('CMS content changed after artwork approval.');
      if (source._rev !== revision) {
        if (
          source.item.status === 'published' &&
          source.item.liveRevisionId &&
          (!source.item.draftRevisionId || source.item.draftRevisionId === source.item.liveRevisionId)
        )
          return source.item.liveRevisionId;
        throw new CatalogPriceConflictError('CMS revision changed.');
      }
      const published = sourceSchema.parse(await request(path(record) + '/publish', { _rev: revision })).data;
      if (
        published.item.id !== record.cmsSourceId ||
        published.item.status !== 'published' ||
        !published.item.liveRevisionId
      )
        throw new Error('CMS publication acknowledgement is incomplete.');
      return published.item.liveRevisionId;
    },
    async publication(id, requestedRevision) {
      return z
        .object({ id: z.literal(id), status: z.enum(['pending', 'live', 'failed']) })
        .parse(await request('/_emdash/api/blackbox/publications', { id, requestedRevision })).status;
    },
  } satisfies CmsItemPublicationGateway & { read: (record: RuntimeCatalogRecord) => Promise<unknown> };
  return gateway;
}
