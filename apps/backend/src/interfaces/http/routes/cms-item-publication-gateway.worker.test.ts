import { expect, it } from 'vitest';
import { CatalogPriceConflictError } from '../../../application/commerce/catalog-sync';
import type { RuntimeCatalogRecord } from '../../../domain/commerce/repositories/spi';
import { createCmsItemPublicationGateway } from './cms-item-publication-gateway';

const record = { sourceKind: 'distro', sourceId: 'resurrection', cmsSourceId: 'distro-one' } as RuntimeCatalogRecord;
const operator = new Request('https://staff.example/api/internal/variants/variant_one/publication');
const data = { title: 'Resurrection', summary: 'Vinyl edition.', image: { id: 'cover' }, group: null as string | null };

// Serves the CMS item and records native publish calls; `item` changes as the test moves through attempts.
function cms(item: Record<string, unknown>, rev: string) {
  const calls: string[] = [];
  const fetcher = {
    item,
    rev,
    async fetch(input: RequestInfo | URL, init?: RequestInit) {
      const request = new Request(input, init);
      const path = new URL(request.url).pathname;
      calls.push(`${request.method} ${path}`);
      if (path.endsWith('/item-artwork'))
        return Response.json({ _rev: fetcher.rev, imageUrl: 'https://img.example/a' });
      if (path.endsWith('/publish'))
        return Response.json({
          data: {
            _rev: 'after-publish',
            item: { ...fetcher.item, status: 'published', liveRevisionId: 'draft', draftRevisionId: null },
          },
        });
      return Response.json({ data: { _rev: fetcher.rev, item: fetcher.item } });
    },
  };
  return { fetcher, calls };
}

it('a Distro group stored as empty after approval still publishes on retry instead of needing review', async () => {
  const base = { id: 'distro-one', slug: 'resurrection', liveRevisionId: 'live', draftRevisionId: 'draft' };
  const { fetcher, calls } = cms({ ...base, status: 'published', data }, 'rev-1');
  const gateway = createCmsItemPublicationGateway(fetcher as unknown as Fetcher, operator);
  const { sourceFingerprint } = await gateway.approve(record, 'rev-1');

  // The publish hook stored group '' and native publish then failed; the retry sees the same revision.
  fetcher.item = { ...base, status: 'published', data: { ...data, group: '' } };
  await expect(gateway.publish(record, 'rev-1', sourceFingerprint)).resolves.toBe('draft');
  expect(calls.filter((call) => call.endsWith('/publish'))).toHaveLength(1);

  // The publish succeeded but its response was lost; the retry finds it already published.
  fetcher.item = {
    ...base,
    status: 'published',
    liveRevisionId: 'draft',
    draftRevisionId: null,
    data: { ...data, group: '' },
  };
  fetcher.rev = 'rev-2';
  await expect(gateway.publish(record, 'rev-1', sourceFingerprint)).resolves.toBe('draft');
  expect(calls.filter((call) => call.endsWith('/publish'))).toHaveLength(1);

  // Any other content change still needs review.
  fetcher.item = { ...base, status: 'published', data: { ...data, group: '', title: 'Changed' } };
  fetcher.rev = 'rev-1';
  await expect(gateway.publish(record, 'rev-1', sourceFingerprint)).rejects.toBeInstanceOf(CatalogPriceConflictError);
});
