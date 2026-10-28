import { expect, it } from 'vitest';
import type { ContentSnapshot } from '@blackbox/content-model';
import { createStockQuantity, parseStoreItemSlug, parseVariantId } from '../../../domain/commerce';
import type { StockRecord } from '../../../domain/commerce/repositories/spi';
import type { StoreOffer } from '../checkout';
import { createMerchantProductInput } from './product';

const item = {
  sourceKind: 'distro' as const,
  sourceId: 'public-album',
  storeItemSlug: 'public-vinyl',
  variantId: 'variant_public',
};
const sha = 'a'.repeat(64);
function fixture() {
  const snapshot: ContentSnapshot = {
    schemaVersion: 1,
    environment: 'uat',
    storeItems: [item],
    records: [
      {
        collection: 'distro',
        id: 'cms-public',
        revisionId: 'accepted-revision',
        slug: item.sourceId,
        data: {
          title: 'Public album',
          summary: 'Accepted description',
          image: { id: 'cover' },
          artist_or_label: 'Artist is not a brand',
          catalog_number: 'NOT-AN-MPN',
          product_safety: { product_identifier: 'NOT-A-GTIN', manufacturer: { name: 'Not verified as a brand' } },
        },
      },
    ],
    media: [
      { id: 'cover', sha256: sha, filename: 'cover.png', mimeType: 'image/png', size: 20, width: 800, height: 800 },
    ],
  };
  const offer: StoreOffer = {
    storeItemSlug: parseStoreItemSlug(item.storeItemSlug),
    variantId: parseVariantId(item.variantId),
    availability: { status: 'available', label: 'Available' },
    canCheckout: true,
    catalogStatus: 'ready',
    preorder: null,
    price: { amountMinor: 1999, currencyCode: 'EUR', kind: 'fixed', display: '€19.99' },
  };
  const stock: StockRecord = {
    variantId: parseVariantId(item.variantId),
    quantity: createStockQuantity(2),
    onlineQuantity: createStockQuantity(1),
    revision: 1,
    zeroStockState: 'sold_out',
    expectedMonth: null,
    showLowStock: false,
    preorder: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  return { snapshot, offer, stock };
}
const origin = 'https://public.example/';

it('maps only accepted editorial fields, fixed EUR price and stable variant identity', () => {
  const { snapshot, offer, stock } = fixture();
  const product = createMerchantProductInput(snapshot, item, offer, stock, origin);
  expect(product).toEqual({
    offerId: item.variantId,
    contentLanguage: 'en',
    feedLabel: 'GR',
    productAttributes: {
      title: 'Public album',
      description: 'Accepted description',
      link: 'https://public.example/store/public-vinyl/',
      imageLink: `https://public.example/media/content/${sha}`,
      availability: 'IN_STOCK',
      price: { amountMicros: '19990000', currencyCode: 'EUR' },
    },
  });
  expect(JSON.stringify(product)).not.toMatch(/identifierExists|condition|gtin|mpn|brand|NOT-A|NOT-AN/);
});

it('uses accepted rich summary text, release cover and trusted origin base path', () => {
  const { snapshot, offer, stock } = fixture();
  const release = { ...item, sourceKind: 'release' as const };
  snapshot.storeItems = [release];
  snapshot.records[0]!.collection = 'releases';
  snapshot.records[0]!.data = {
    title: 'Accepted release',
    cover_image: { id: 'cover' },
    summary: 'Old plain text',
    summary_rich: [{ _type: 'block', _key: 'p', children: [{ _type: 'span', _key: 's', text: 'Accepted rich text' }] }],
  };
  const product = createMerchantProductInput(snapshot, release, offer, stock, 'https://uat.example/base');
  expect(product?.productAttributes.description).toBe('Accepted rich text');
  expect(product?.productAttributes.link).toBe('https://uat.example/base/store/public-vinyl/');
  expect(product?.productAttributes.imageLink).toBe(`https://uat.example/base/media/content/${sha}`);
});

it('excludes uncleared raw pre-orders even when the shopper exact date has elapsed', () => {
  const { snapshot, offer, stock } = fixture();
  for (const shipEstimate of [
    { kind: 'date' as const, date: '2020-01-01' },
    { kind: 'month' as const, month: '2020-01', part: null },
  ]) {
    stock.preorder = { startedAt: '2019-12-01T00:00:00Z', shipEstimate };
    expect(createMerchantProductInput(snapshot, item, offer, stock, origin)).toBeNull();
  }
  stock.preorder = null;
  expect(createMerchantProductInput(snapshot, item, offer, stock, origin)).not.toBeNull();
});

it('excludes verified unavailable stock and custom-price offers', () => {
  const { snapshot, offer, stock } = fixture();
  stock.onlineQuantity = createStockQuantity(0);
  expect(createMerchantProductInput(snapshot, item, offer, stock, origin)).toBeNull();
  stock.onlineQuantity = createStockQuantity(1);
  const soldOut: StoreOffer = {
    ...offer,
    catalogStatus: 'sold_out',
    canCheckout: false,
    availability: { status: 'sold_out', state: 'coming_soon', label: 'Coming Soon' },
    price: null,
  };
  expect(createMerchantProductInput(snapshot, item, soldOut, stock, origin)).toBeNull();
  offer.price = {
    kind: 'pay_what_you_want',
    currencyCode: 'EUR',
    display: 'Pay what you want',
    minimumAmountMinor: 100,
    maximumAmountMinor: 10000,
    presetAmountMinor: 1000,
  };
  expect(createMerchantProductInput(snapshot, item, offer, stock, origin)).toBeNull();
});

it('treats missing inputs, mismatched identity and catalog drift as uncertainty', () => {
  const { snapshot, offer, stock } = fixture();
  expect(() => createMerchantProductInput(snapshot, item, null, stock, origin)).toThrow('identity or stock');
  expect(() => createMerchantProductInput(snapshot, item, offer, null, origin)).toThrow('identity or stock');
  expect(() =>
    createMerchantProductInput(snapshot, { ...item, variantId: 'variant_other' }, offer, stock, origin),
  ).toThrow('identity or stock');
  stock.variantId = parseVariantId('variant_other');
  expect(() => createMerchantProductInput(snapshot, item, offer, stock, origin)).toThrow('identity or stock');
  stock.variantId = offer.variantId;
  const drift: StoreOffer = {
    ...offer,
    catalogStatus: 'catalog_drift',
    canCheckout: false,
    availability: { status: 'unavailable', label: 'Checkout Paused' },
    price: null,
  };
  expect(() => createMerchantProductInput(snapshot, item, drift, stock, origin)).toThrow('requires reconciliation');
  stock.onlineQuantity = createStockQuantity(0);
  expect(createMerchantProductInput(snapshot, item, drift, stock, origin)).toBeNull();
});

it('preserves the full application variant identity for the provider adapter', () => {
  const { snapshot, offer, stock } = fixture();
  const longItem = { ...item, variantId: `variant_${'a'.repeat(43)}` };
  snapshot.storeItems = [longItem];
  offer.variantId = parseVariantId(longItem.variantId);
  stock.variantId = offer.variantId;
  expect(createMerchantProductInput(snapshot, longItem, offer, stock, origin)?.offerId).toBe(longItem.variantId);
});

it('treats malformed raw pre-order state as uncertainty', () => {
  const { snapshot, offer, stock } = fixture();
  stock.preorder = {
    startedAt: 'not-a-date',
    shipEstimate: { kind: 'date', date: '2026-01-01' },
  };
  expect(() => createMerchantProductInput(snapshot, item, offer, stock, origin)).toThrow('pre-order');
  stock.preorder.startedAt = '2025-01-01T00:00:00Z';
  stock.preorder.shipEstimate = { kind: 'date', date: '2026-02-31' };
  expect(() => createMerchantProductInput(snapshot, item, offer, stock, origin)).toThrow();
});

it('rejects invalid price, missing accepted media/content and unsafe origins', () => {
  const { snapshot, offer, stock } = fixture();
  for (const amountMinor of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    offer.price = { ...offer.price, kind: 'fixed', amountMinor };
    expect(() => createMerchantProductInput(snapshot, item, offer, stock, origin)).toThrow('fixed price');
  }
  offer.price = { kind: 'fixed', amountMinor: 1999, currencyCode: 'USD', display: '$19.99' };
  expect(() => createMerchantProductInput(snapshot, item, offer, stock, origin)).toThrow('fixed price');
  offer.price.currencyCode = 'EUR';
  for (const badOrigin of [
    'http://public.example/',
    'https://user:pass@public.example/',
    'https://public.example/?draft=1',
  ])
    expect(() => createMerchantProductInput(snapshot, item, offer, stock, badOrigin)).toThrow('origin');
  snapshot.media = [];
  expect(() => createMerchantProductInput(snapshot, item, offer, stock, origin)).toThrow('image');
  snapshot.records = [];
  expect(() => createMerchantProductInput(snapshot, item, offer, stock, origin)).toThrow('content');
});
