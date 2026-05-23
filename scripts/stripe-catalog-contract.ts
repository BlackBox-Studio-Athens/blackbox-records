export type StripeCatalogStoreItemContract = {
  amountMinor: number;
  currencyCode: string;
  productName: string;
  sourceId: string;
  sourceKind: 'distro' | 'release';
  storeItemSlug: string;
  variantId: string;
};

export const stripeCatalogStoreItemContracts: StripeCatalogStoreItemContract[] = [
  {
    amountMinor: 2800,
    currencyCode: 'EUR',
    productName: 'BlackBox Records - Disintegration - Black Vinyl LP',
    sourceId: 'barren-point',
    sourceKind: 'release',
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_barren-point_standard',
  },
];
