import { expect, it } from 'vitest';
import { releaseDetails, setupCommand } from './ItemSetupApp';

const input = {
  identity: 'acbf5c48-f098-4056-af92-d9d46eb3db82',
  kind: 'release' as const,
  existing: null,
  title: 'New record',
  artist: 'artist-one',
  artistOrLabel: 'Label name',
  date: '2026-09-14',
  summary: 'New music',
  image: 'image-one',
  alt: 'Cover artwork',
  format: 'Vinyl 12-inch' as const,
  amount: '27,05',
  minimum: '',
  maximum: '',
  custom: false,
  quantity: '10',
};

it('creates one release or distro source with an explicit EUR price and opening stock', () => {
  for (const kind of ['release', 'distro'] as const) {
    const result = setupCommand({ ...input, kind });
    expect(result).toMatchObject({
      openingQuantity: 10,
      itemType: 'Vinyl 12-inch',
      price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2705 },
      confirmLiveSetup: true,
      source: { mode: 'create', sourceKind: kind, data: { title: 'New record' } },
    });
    expect(result.storeItemSlug).toMatch(/^new-record-vinyl-12-inch-/);
    expect(result).toEqual(setupCommand({ ...input, kind }));
  }
  const merch = setupCommand({ ...input, kind: 'merch', format: 'Clothes', quantity: '0' });
  expect(merch).toMatchObject({ openingQuantity: 0, source: { sourceKind: 'distro', data: { group: 'Clothes' } } });
  expect(JSON.stringify(merch)).not.toContain('category');
});

it('reuses an existing source and its physical format instead of copying or replacing its data', () => {
  const result = setupCommand({
    ...input,
    kind: 'distro',
    existing: {
      id: 'source-existing',
      slug: 'existing-cd',
      data: { title: 'Existing CD', group: 'CDs' },
    },
  });
  expect(result.source).toEqual({ mode: 'existing', sourceKind: 'distro', id: 'source-existing' });
  expect(result.itemType).toBe('CDs');
});

it('does not fabricate prices or permit invalid stock and custom-price bounds', () => {
  for (const patch of [
    { amount: '' },
    { quantity: '-1' },
    { quantity: '1.5' },
    { custom: true, minimum: '30', maximum: '40' },
    { kind: 'merch' as const },
  ])
    expect(() => setupCommand({ ...input, ...patch })).toThrow();
  expect(setupCommand({ ...input, custom: true, minimum: '20', maximum: '30' }).price).toMatchObject({
    kind: 'pay_what_you_want',
    minimumAmountMinor: 2000,
    presetAmountMinor: 2705,
    maximumAmountMinor: 3000,
  });
});

it('keeps an editorial-only release free of price and stock fields', () => {
  expect(releaseDetails(input)).toEqual({
    title: input.title,
    artist: input.artist,
    release_date: input.date,
    summary: input.summary,
    cover_image: { id: input.image },
    cover_image_alt: input.alt,
    formats: [input.format],
  });
});
