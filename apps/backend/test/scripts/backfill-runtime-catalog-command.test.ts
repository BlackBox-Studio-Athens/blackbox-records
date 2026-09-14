import { expect, it } from 'vitest';
import { readBackfillSources, backfillRuntimeCatalog } from '../../scripts/backfill-runtime-catalog';
import { catalogManifest } from '../../src/application/commerce/catalog-sync';

it('links reviewed CMS source identities and existing physical type policy', () => {
  const catalog = catalogManifest.entries.find((entry) => entry.sourceKind === 'distro')!;
  const identity = `distro/${catalog.sourceId}`;
  const plan = {
    target: 'http://127.0.0.1:8787',
    records: [{ identity, collection: 'distro', slug: catalog.sourceId, data: { group: 'CDs' } }],
  };
  const report = {
    target: plan.target,
    apply: false,
    verifyOnly: true,
    records: 1,
    identities: { [identity]: 'cms-source' },
  };
  expect(readBackfillSources('local', [catalog], plan, report)).toEqual([
    { catalog, cmsSourceId: 'cms-source', itemType: 'CD' },
  ]);
  expect(() => readBackfillSources('uat', [catalog], plan, report)).toThrow('different target');
  expect(() => readBackfillSources('local', [catalog], plan, { ...report, identities: {} })).toThrow('incomplete');
  expect(() =>
    readBackfillSources('local', [catalog], { ...plan, records: [...plan.records, ...plan.records] }, report),
  ).toThrow('duplicate');
  expect(() => readBackfillSources('local', [catalog], plan, { ...report, verifyOnly: false })).toThrow();
  expect(() => readBackfillSources('local', [catalog], plan, { ...report, apply: true })).toThrow();
  expect(() =>
    readBackfillSources('local', [catalog], { ...plan, records: [{ ...plan.records[0], slug: 'foreign' }] }, report),
  ).toThrow('does not match');
});

it('rejects accidental apply before opening files, provider connections, or a database', async () => {
  await expect(
    backfillRuntimeCatalog(['--env', 'uat', '--cms-plan', 'unused', '--cms-report', 'unused', '--apply']),
  ).rejects.toThrow('dry-run first');
  await expect(
    backfillRuntimeCatalog([
      '--env',
      'prd',
      '--cms-plan',
      'unused',
      '--cms-report',
      'unused',
      '--apply',
      '--plan-sha256',
      'a'.repeat(64),
    ]),
  ).rejects.toThrow('one-run');
  await expect(backfillRuntimeCatalog(['--env', 'wrong'])).rejects.toThrow();
});
