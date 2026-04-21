import { getCatalogItemBySlug, type CatalogItem } from './catalog-data';

export type CatalogItemSlug = CatalogItem['slug'];
export type VariantAvailabilityStatus = 'available' | 'sold_out';

export type VariantSnapshot = {
  variantId: string;
  catalogItemSlug: CatalogItemSlug;
  title: string;
  optionLabel: string | null;
  price: {
    amountMinor: number;
    currencyCode: string;
    display: string;
  };
  availability: {
    status: VariantAvailabilityStatus;
    label: string;
  };
  canPurchase: boolean;
};

// Phase 6 keeps temporary offer-state fixtures in code so editorial collections remain presentation-only.
const variantSnapshotsByCatalogItemSlug: Record<CatalogItemSlug, VariantSnapshot[]> = {
  'barren-point': [
    {
      variantId: 'variant_barren-point_standard',
      catalogItemSlug: 'barren-point',
      title: 'Disintegration',
      optionLabel: 'Black Vinyl LP',
      price: {
        amountMinor: 2800,
        currencyCode: 'EUR',
        display: '€28.00',
      },
      availability: {
        status: 'available',
        label: 'Available',
      },
      canPurchase: true,
    },
  ],
  'afterglow-tape': [
    {
      variantId: 'variant_afterglow-tape_standard',
      catalogItemSlug: 'afterglow-tape',
      title: 'Afterglow Tape',
      optionLabel: 'Cassette',
      price: {
        amountMinor: 1400,
        currencyCode: 'EUR',
        display: '€14.00',
      },
      availability: {
        status: 'sold_out',
        label: 'Sold Out',
      },
      canPurchase: false,
    },
  ],
};

function createFallbackVariantSnapshot(catalogItem: CatalogItem): VariantSnapshot {
  return {
    variantId: `variant_${catalogItem.slug}_standard`,
    catalogItemSlug: catalogItem.slug,
    title: catalogItem.title,
    optionLabel: null,
    price: {
      amountMinor: 0,
      currencyCode: 'EUR',
      display: 'Price soon',
    },
    availability: {
      status: 'sold_out',
      label: 'Unavailable',
    },
    canPurchase: false,
  };
}

export async function listVariantSnapshotsForCatalogItem(slug: CatalogItemSlug): Promise<VariantSnapshot[]> {
  const explicitVariantSnapshots = variantSnapshotsByCatalogItemSlug[slug];

  if (explicitVariantSnapshots) {
    return explicitVariantSnapshots;
  }

  const catalogItem = await getCatalogItemBySlug(slug);
  return catalogItem ? [createFallbackVariantSnapshot(catalogItem)] : [];
}

export async function getPrimaryVariantSnapshotForCatalogItem(
  slug: CatalogItemSlug,
): Promise<VariantSnapshot | null> {
  const variantSnapshots = await listVariantSnapshotsForCatalogItem(slug);
  return variantSnapshots[0] || null;
}
