import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import ItemSetupApp, {
  productConditionData,
  releaseDetails,
  setupCommand,
  storedProductCondition,
} from './ItemSetupApp';

const input = {
  identity: 'acbf5c48-f098-4056-af92-d9d46eb3db82',
  kind: 'release' as const,
  existing: null,
  title: 'New record',
  artist: 'artist-one',
  catalogNumber: 'BBR#005',
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
  productCondition: 'new' as const,
};

it('creates one release or distro source with an explicit EUR price and opening stock', () => {
  for (const kind of ['release', 'distro'] as const) {
    const result = setupCommand({ ...input, kind });
    expect(result).toMatchObject({
      openingQuantity: 10,
      zeroStockState: 'sold_out',
      expectedMonth: null,
      itemType: 'Vinyl 12-inch',
      price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2705 },
      confirmLiveSetup: true,
      source: { mode: 'create', sourceKind: kind, data: { title: 'New record' } },
    });
    expect(result.storeItemSlug).toMatch(/^new-record-vinyl-12-inch-/);
    expect(result).toEqual(setupCommand({ ...input, kind }));
  }
  expect(setupCommand({ ...input, zeroStockState: 'coming_soon', expectedMonth: '2026-11' })).toMatchObject({
    zeroStockState: 'coming_soon',
    expectedMonth: '2026-11',
  });
  // Sold Out never carries a month, and an empty month is sent as null.
  expect(setupCommand({ ...input, zeroStockState: 'sold_out', expectedMonth: '2026-11' })).toMatchObject({
    zeroStockState: 'sold_out',
    expectedMonth: null,
  });
  expect(setupCommand({ ...input, zeroStockState: 'repressing', expectedMonth: '' })).toMatchObject({
    zeroStockState: 'repressing',
    expectedMonth: null,
  });
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
    catalog_number: 'BBR#005',
    release_date: input.date,
    summary: input.summary,
    cover_image: { id: input.image },
    cover_image_alt: input.alt,
    formats: [input.format],
  });
});

it('never creates a release without one canonical catalog number', () => {
  for (const catalogNumber of ['', 'BBR#0', 'BBR#000', 'BBR001', 'bbr#001'])
    expect(() => releaseDetails({ ...input, catalogNumber })).toThrow('BBR#001');
  expect(() => setupCommand({ ...input, catalogNumber: '' })).toThrow('BBR#001');
  // Distro and Merch sources never carry a label catalog number.
  expect(JSON.stringify(setupCommand({ ...input, kind: 'distro' }))).not.toContain('catalog_number');
});

it('requires an explicit condition when Add to catalog creates a physical source', () => {
  for (const kind of ['release', 'distro', 'merch'] as const) {
    const format = kind === 'merch' ? ('Clothes' as const) : input.format;
    for (const productCondition of ['', null, undefined] as const)
      expect(() => setupCommand({ ...input, kind, format, productCondition })).toThrow('Choose New or Used');
    expect(setupCommand({ ...input, kind, format, productCondition: 'used' }).source).toMatchObject({
      mode: 'create',
      data: { product_condition: 'used' },
    });
  }
  // An existing source keeps its own stored condition; setup neither requires nor copies one.
  const existing = { id: 'source-existing', slug: 'existing-cd', data: { title: 'Existing CD', group: 'CDs' } };
  expect(setupCommand({ ...input, kind: 'distro', existing, productCondition: '' }).source).toEqual({
    mode: 'existing',
    sourceKind: 'distro',
    id: 'source-existing',
  });
});

it('autosaves and restores only an explicit condition, never a default', () => {
  expect(productConditionData('')).toEqual({});
  expect(productConditionData(undefined)).toEqual({});
  expect(productConditionData('used')).toEqual({ product_condition: 'used' });
  // An explicit clear is sent as null instead of omitting the field.
  expect(JSON.parse(JSON.stringify(productConditionData(null)))).toEqual({ product_condition: null });
  expect(storedProductCondition({ product_condition: 'new' })).toBe('new');
  expect(storedProductCondition({ product_condition: 'used', formats: ['Cassette'] })).toBe('used');
  expect(storedProductCondition({ product_condition: null })).toBeNull();
  for (const product_condition of [undefined, '', 'NEW', 'refurbished'])
    expect(storedProductCondition({ product_condition })).toBe('');
  // The editorial-only release route still builds a draft without a condition.
  expect(releaseDetails(input)).not.toHaveProperty('product_condition');
});

it('shows a blank Physical condition choice in the Add to catalog details', () => {
  const markup = renderToStaticMarkup(<ItemSetupApp backendBaseUrl="" />);
  expect(markup).toContain('Physical condition');
  expect(markup).toMatch(/<select[^>]*id="setup-product-condition"[^>]*required=""/);
  expect(markup).toMatch(/<option value="" selected="">Choose condition<\/option>/);
  expect(markup).toContain('<option value="new">New</option><option value="used">Used</option>');
  expect(markup).not.toContain('setup-product-condition-error"');
});
