import type { StoreItemOptionRecord } from '../../../domain/commerce/repositories/spi';
import type { StripeCatalogEnvironment, StripeCatalogExpectedPrice, StripeCatalogProductProjection } from './types';

export type CatalogProductProjectionAlignmentStatus = 'checkout_eligible' | 'future_buyable' | 'unavailable';

export type CatalogProductProjectionEntry = {
  alignmentStatus: CatalogProductProjectionAlignmentStatus;
  expectedSandboxPrice: StripeCatalogExpectedPrice | null;
  productProjection: StripeCatalogProductProjection;
  sourceId: string;
  sourceKind: StoreItemOptionRecord['sourceKind'];
  storeItemSlug: string;
  variantId: string;
};

export type CatalogProductProjectionReader = {
  findByStoreItem(storeItem: StoreItemOptionRecord): StripeCatalogProductProjection | null;
};

export const currentCatalogProductProjectionEntries: CatalogProductProjectionEntry[] = [
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of I went to the mountain by AFLMSMP. Source metadata identifies it as a 9-track release, released February 27, 2025.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/aflmsmp-i-went-to-the-mountain-vinyl.webp',
      ],
      metadata: {
        sourceId: 'aflmsmp-i-went-to-the-mountain-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'aflmsmp-i-went-to-the-mountain-vinyl',
        variantId: 'variant_aflmsmp-i-went-to-the-mountain-vinyl_standard',
      },
      name: 'BlackBox Records - I went to the mountain - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'aflmsmp-i-went-to-the-mountain-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'aflmsmp-i-went-to-the-mountain-vinyl',
    variantId: 'variant_aflmsmp-i-went-to-the-mountain-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'A raw Croatian hardcore punk record from Indoctrinate, direct in delivery and stripped of unnecessary polish.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/indoctrinate-aftermaths.jpg',
      ],
      metadata: {
        sourceId: 'aftermaths',
        sourceKind: 'distro',
        storeItemSlug: 'aftermaths',
        variantId: 'variant_aftermaths_standard',
      },
      name: 'BlackBox Records - Aftermaths - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'aftermaths',
    sourceKind: 'distro',
    storeItemSlug: 'aftermaths',
    variantId: 'variant_aftermaths_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Hazarder's Zagreb sludge, stoner, and doom metal leans on downtuned guitars and raw vocals from start to finish.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/hazarder-against-leviathan.jpg',
      ],
      metadata: {
        sourceId: 'against-his-story-against-leviathan',
        sourceKind: 'distro',
        storeItemSlug: 'against-his-story-against-leviathan',
        variantId: 'variant_against-his-story-against-leviathan_standard',
      },
      name: 'BlackBox Records - Against His-Story, Against Leviathan! - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'against-his-story-against-leviathan',
    sourceKind: 'distro',
    storeItemSlug: 'against-his-story-against-leviathan',
    variantId: 'variant_against-his-story-against-leviathan_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Commotion by Allochiria. Source metadata identifies it as a 9-track release, released April 23, 2023.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/allochiria-commotion-vinyl.webp',
      ],
      metadata: {
        sourceId: 'allochiria-commotion-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'allochiria-commotion-vinyl',
        variantId: 'variant_allochiria-commotion-vinyl_standard',
      },
      name: 'BlackBox Records - Commotion - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'allochiria-commotion-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'allochiria-commotion-vinyl',
    variantId: 'variant_allochiria-commotion-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Omonoia by Allochiria. Source metadata identifies it as a 7-track release, released January 4, 2014.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/allochiria-omonoia-vinyl.webp',
      ],
      metadata: {
        sourceId: 'allochiria-omonoia-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'allochiria-omonoia-vinyl',
        variantId: 'variant_allochiria-omonoia-vinyl_standard',
      },
      name: 'BlackBox Records - Omonoia - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'allochiria-omonoia-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'allochiria-omonoia-vinyl',
    variantId: 'variant_allochiria-omonoia-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Throes by Allochiria. Source metadata identifies it as a 6-track release, released March 17, 2017.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/allochiria-throes-vinyl.webp',
      ],
      metadata: {
        sourceId: 'allochiria-throes-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'allochiria-throes-vinyl',
        variantId: 'variant_allochiria-throes-vinyl_standard',
      },
      name: 'BlackBox Records - Throes - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'allochiria-throes-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'allochiria-throes-vinyl',
    variantId: 'variant_allochiria-throes-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: "Ouranopithecus' Anarchotribal joins the BlackBox Records store as a vinyl release.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/ouranopithecus-album-cover-distro-mockup.webp',
      ],
      metadata: {
        sourceId: 'anarchotribal',
        sourceKind: 'release',
        storeItemSlug: 'anarchotribal-vinyl',
        variantId: 'variant_anarchotribal-vinyl_standard',
      },
      name: 'BlackBox Records - Anarchotribal - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'anarchotribal',
    sourceKind: 'release',
    storeItemSlug: 'anarchotribal-vinyl',
    variantId: 'variant_anarchotribal-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of Alone by Anima Triste. Source metadata identifies it as a 9-track release, released January 27, 2023.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/anima-triste-alone-cd.jpg',
      ],
      metadata: {
        sourceId: 'anima-triste-alone-cd',
        sourceKind: 'distro',
        storeItemSlug: 'anima-triste-alone-cd',
        variantId: 'variant_anima-triste-alone-cd_standard',
      },
      name: 'BlackBox Records - Alone - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'anima-triste-alone-cd',
    sourceKind: 'distro',
    storeItemSlug: 'anima-triste-alone-cd',
    variantId: 'variant_anima-triste-alone-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of Anima Triste by Anima Triste. Source metadata identifies it as a 10-track release, released December 7, 2016.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/anima-triste-anima-triste-cd.jpg',
      ],
      metadata: {
        sourceId: 'anima-triste-anima-triste-cd',
        sourceKind: 'distro',
        storeItemSlug: 'anima-triste-anima-triste-cd',
        variantId: 'variant_anima-triste-anima-triste-cd_standard',
      },
      name: 'BlackBox Records - Anima Triste - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'anima-triste-anima-triste-cd',
    sourceKind: 'distro',
    storeItemSlug: 'anima-triste-anima-triste-cd',
    variantId: 'variant_anima-triste-anima-triste-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of Humanity by Anima Triste. Source metadata identifies it as a 10-track release, released September 19, 2019.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/anima-triste-humanity-cd.jpg',
      ],
      metadata: {
        sourceId: 'anima-triste-humanity-cd',
        sourceKind: 'distro',
        storeItemSlug: 'anima-triste-humanity-cd',
        variantId: 'variant_anima-triste-humanity-cd_standard',
      },
      name: 'BlackBox Records - Humanity - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'anima-triste-humanity-cd',
    sourceKind: 'distro',
    storeItemSlug: 'anima-triste-humanity-cd',
    variantId: 'variant_anima-triste-humanity-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      maximumAmountMinor: 10000,
    },
    productProjection: {
      description: 'CD edition of Ατοπια by Ατοπια in the BlackBox Records distro catalog.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/atopia-atopia-cd.jpg'],
      metadata: {
        sourceId: 'atopia-atopia-cd',
        sourceKind: 'distro',
        storeItemSlug: 'atopia-atopia-cd',
        variantId: 'variant_atopia-atopia-cd_standard',
      },
      name: 'BlackBox Records - Ατοπια - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'atopia-atopia-cd',
    sourceKind: 'distro',
    storeItemSlug: 'atopia-atopia-cd',
    variantId: 'variant_atopia-atopia-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Luchtbegrafenis by Aufhebung. Source metadata identifies it as a 6-track release, released February 26, 2026.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/aufhebung-luchtbegrafenis-vinyl.webp',
      ],
      metadata: {
        sourceId: 'aufhebung-luchtbegrafenis-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'aufhebung-luchtbegrafenis-vinyl',
        variantId: 'variant_aufhebung-luchtbegrafenis-vinyl_standard',
      },
      name: 'BlackBox Records - Luchtbegrafenis - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'aufhebung-luchtbegrafenis-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'aufhebung-luchtbegrafenis-vinyl',
    variantId: 'variant_aufhebung-luchtbegrafenis-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      maximumAmountMinor: 10000,
    },
    productProjection: {
      description:
        'Cassette edition of 2016 by Band in the pit. Source metadata identifies it as a 3-track release, released November 21, 2016. Cassette case artwork mockup. Actual cassette shell and labels may vary.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/band-in-the-pit-2016-cassette.jpg',
      ],
      metadata: {
        sourceId: 'band-in-the-pit-2016-cassette',
        sourceKind: 'distro',
        storeItemSlug: 'band-in-the-pit-2016-cassette',
        variantId: 'variant_band-in-the-pit-2016-cassette_standard',
      },
      name: 'BlackBox Records - 2016 - Cassette',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'band-in-the-pit-2016-cassette',
    sourceKind: 'distro',
    storeItemSlug: 'band-in-the-pit-2016-cassette',
    variantId: 'variant_band-in-the-pit-2016-cassette_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Mass Culture's Barren Point keeps the Greek band's post-hardcore and metal pressure direct and physical.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/mass-culture-barren-point.jpg',
      ],
      metadata: {
        sourceId: 'barren-point',
        sourceKind: 'distro',
        storeItemSlug: 'barren-point',
        variantId: 'variant_barren-point_standard',
      },
      name: 'BlackBox Records - Barren Point - LP',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'barren-point',
    sourceKind: 'distro',
    storeItemSlug: 'barren-point',
    variantId: 'variant_barren-point_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Sadhus, The Smoking Community bring Athens sludge and crust together with brutal vocals across their second full-length release.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/sadhus-the-big-fish.jpg',
      ],
      metadata: {
        sourceId: 'big-fish',
        sourceKind: 'distro',
        storeItemSlug: 'big-fish',
        variantId: 'variant_big-fish_standard',
      },
      name: 'BlackBox Records - Big Fish - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'big-fish',
    sourceKind: 'distro',
    storeItemSlug: 'big-fish',
    variantId: 'variant_big-fish_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Depressionland by Bipolar Architecture. Source metadata identifies it as a 9-track release, released June 24, 2022.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/bipolar-architecture-depressionland-vinyl.webp',
      ],
      metadata: {
        sourceId: 'bipolar-architecture-depressionland-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'bipolar-architecture-depressionland-vinyl',
        variantId: 'variant_bipolar-architecture-depressionland-vinyl_standard',
      },
      name: 'BlackBox Records - Depressionland - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'bipolar-architecture-depressionland-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'bipolar-architecture-depressionland-vinyl',
    variantId: 'variant_bipolar-architecture-depressionland-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Belgian metal from three siblings in Oostend, carrying the blood, sweat, and tears behind Tranen into the grooves.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/bloed-tranen.jpg'],
      metadata: {
        sourceId: 'bloed-tranen',
        sourceKind: 'distro',
        storeItemSlug: 'bloed-tranen',
        variantId: 'variant_bloed-tranen_standard',
      },
      name: 'BlackBox Records - Tranen - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'bloed-tranen',
    sourceKind: 'distro',
    storeItemSlug: 'bloed-tranen',
    variantId: 'variant_bloed-tranen_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 500,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Cassette edition of Ego by Broken Fingers. Source metadata identifies it as an 11-track release, released November 29, 2019. Cassette case artwork mockup. Actual cassette shell and labels may vary.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/broken-fingers-ego-cassette.jpg',
      ],
      metadata: {
        sourceId: 'broken-fingers-ego-cassette',
        sourceKind: 'distro',
        storeItemSlug: 'broken-fingers-ego-cassette',
        variantId: 'variant_broken-fingers-ego-cassette_standard',
      },
      name: 'BlackBox Records - Ego - Cassette',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'broken-fingers-ego-cassette',
    sourceKind: 'distro',
    storeItemSlug: 'broken-fingers-ego-cassette',
    variantId: 'variant_broken-fingers-ego-cassette_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "CALF's noise rock and post-hardcore from Karditsa follows the trail of Unwound, Melvins, and Slint without losing its own weight.",
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/calf-karditsa.jpg'],
      metadata: {
        sourceId: 'calf-vinyl-10-inch',
        sourceKind: 'distro',
        storeItemSlug: 'calf-vinyl-10-inch',
        variantId: 'variant_calf-vinyl-10-inch_standard',
      },
      name: 'BlackBox Records - — - Vinyl 10-inch',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'calf-vinyl-10-inch',
    sourceKind: 'distro',
    storeItemSlug: 'calf-vinyl-10-inch',
    variantId: 'variant_calf-vinyl-10-inch_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'released March 13, 2026 All music written and performed by Chronoboros All lyrics written by Nikos Zalimoglou Recorded live at Ignite Music Studio Jun 2025 Recorded, mixed, and mastered by George Christoforidis Artwork and layout by Healitwithsilver',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/chronoboros-album-cover-distro-mockup.webp',
      ],
      metadata: {
        sourceId: 'caregivers',
        sourceKind: 'release',
        storeItemSlug: 'caregivers-vinyl',
        variantId: 'variant_caregivers-vinyl_standard',
      },
      name: 'BlackBox Records - Caregivers - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'caregivers',
    sourceKind: 'release',
    storeItemSlug: 'caregivers-vinyl',
    variantId: 'variant_caregivers-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Caregivers by Chronoboros. Source metadata identifies it as a 7-track release, released March 13, 2026.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/chronoboros-caregivers-vinyl.webp',
      ],
      metadata: {
        sourceId: 'chronoboros-caregivers-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'chronoboros-caregivers-vinyl',
        variantId: 'variant_chronoboros-caregivers-vinyl_standard',
      },
      name: 'BlackBox Records - Caregivers - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'chronoboros-caregivers-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'chronoboros-caregivers-vinyl',
    variantId: 'variant_chronoboros-caregivers-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of Angry Noises by Ciśnienie. Source metadata identifies it as a 4-track release.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/cisnienie-angry-noises-vinyl.webp',
      ],
      metadata: {
        sourceId: 'cisnienie-angry-noises-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'cisnienie-angry-noises-vinyl',
        variantId: 'variant_cisnienie-angry-noises-vinyl_standard',
      },
      name: 'BlackBox Records - Angry Noises - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'cisnienie-angry-noises-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'cisnienie-angry-noises-vinyl',
    variantId: 'variant_cisnienie-angry-noises-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of Medicine by Coyotes Arrow in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/coyotes-arrow-medicine-vinyl.webp',
      ],
      metadata: {
        sourceId: 'coyotes-arrow-medicine-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'coyotes-arrow-medicine-vinyl',
        variantId: 'variant_coyotes-arrow-medicine-vinyl_standard',
      },
      name: 'BlackBox Records - Medicine - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'coyotes-arrow-medicine-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'coyotes-arrow-medicine-vinyl',
    variantId: 'variant_coyotes-arrow-medicine-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      maximumAmountMinor: 10000,
    },
    productProjection: {
      description:
        'A Greek split seven-inch from Zebu and Dead Elephant, pushing experimental rock and math-rock into heavier edges.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/zebu-dead-elephant-split-7-.jpg',
      ],
      metadata: {
        sourceId: 'crawl-eat-them-dead-or-alive-split-7',
        sourceKind: 'distro',
        storeItemSlug: 'crawl-eat-them-dead-or-alive-split-7',
        variantId: 'variant_crawl-eat-them-dead-or-alive-split-7_standard',
      },
      name: 'BlackBox Records - Crawl / Eat Them Dead Or Alive, Split 7" - Vinyl 7-inch',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'crawl-eat-them-dead-or-alive-split-7',
    sourceKind: 'distro',
    storeItemSlug: 'crawl-eat-them-dead-or-alive-split-7',
    variantId: 'variant_crawl-eat-them-dead-or-alive-split-7_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      maximumAmountMinor: 10000,
    },
    productProjection: {
      description:
        'CD edition of Heavy Huge and Rotten by Dead Elephant. Source metadata identifies it as a 6-track release, released February 13, 2016.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/dead-elephant-heavy-huge-and-rotten-cd.jpg',
      ],
      metadata: {
        sourceId: 'dead-elephant-heavy-huge-and-rotten-cd',
        sourceKind: 'distro',
        storeItemSlug: 'dead-elephant-heavy-huge-and-rotten-cd',
        variantId: 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard',
      },
      name: 'BlackBox Records - Heavy Huge and Rotten - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'dead-elephant-heavy-huge-and-rotten-cd',
    sourceKind: 'distro',
    storeItemSlug: 'dead-elephant-heavy-huge-and-rotten-cd',
    variantId: 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of Traumatique by Dead Flag Blues. Source metadata identifies it as a 5-track release, released February 3, 2021.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/dead-flag-blues-traumatique-cd.jpg',
      ],
      metadata: {
        sourceId: 'dead-flag-blues-traumatique-cd',
        sourceKind: 'distro',
        storeItemSlug: 'dead-flag-blues-traumatique-cd',
        variantId: 'variant_dead-flag-blues-traumatique-cd_standard',
      },
      name: 'BlackBox Records - Traumatique - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'dead-flag-blues-traumatique-cd',
    sourceKind: 'distro',
    storeItemSlug: 'dead-flag-blues-traumatique-cd',
    variantId: 'variant_dead-flag-blues-traumatique-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Light will shine by Devided. Source metadata identifies it as an 8-track release, released March 29, 2024.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/devided-light-will-shine-vinyl.webp',
      ],
      metadata: {
        sourceId: 'devided-light-will-shine-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'devided-light-will-shine-vinyl',
        variantId: 'variant_devided-light-will-shine-vinyl_standard',
      },
      name: 'BlackBox Records - Light will shine - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'devided-light-will-shine-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'devided-light-will-shine-vinyl',
    variantId: 'variant_devided-light-will-shine-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "CD edition of Dirty ol' dogs by Dirty ol' dogs. Source metadata identifies it as a 8-track release, released March 9, 2019.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/dirty-ol-dogs-dirty-ol-dogs-cd.jpg',
      ],
      metadata: {
        sourceId: 'dirty-ol-dogs-dirty-ol-dogs-cd',
        sourceKind: 'distro',
        storeItemSlug: 'dirty-ol-dogs-dirty-ol-dogs-cd',
        variantId: 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard',
      },
      name: "BlackBox Records - Dirty ol' dogs - CD",
      taxCode: 'txcd_99999999',
    },
    sourceId: 'dirty-ol-dogs-dirty-ol-dogs-cd',
    sourceKind: 'distro',
    storeItemSlug: 'dirty-ol-dogs-dirty-ol-dogs-cd',
    variantId: 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'The first release of the band is a mix of post rock elements. Engineering, recording, and mixing by Jim Spanos at BlackBox Studio, Athens, Greece. Mastered by Nikos Dimitrakakos and Jim Spanos at Unreal Studio, Athens, Greece.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/releases/afterwise-album-cover-distro-mockup.webp',
      ],
      metadata: {
        sourceId: 'disintegration',
        sourceKind: 'release',
        storeItemSlug: 'disintegration-black-vinyl-lp',
        variantId: 'variant_disintegration-black-vinyl-lp_standard',
      },
      name: 'BlackBox Records - Disintegration - Black Vinyl LP',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'disintegration',
    sourceKind: 'release',
    storeItemSlug: 'disintegration-black-vinyl-lp',
    variantId: 'variant_disintegration-black-vinyl-lp_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Maha Sohona carry northern Sweden's fuzz rock and doom metal through a full, heavy run on Endless Searcher.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/maha-sohona-endless-searcher.jpg',
      ],
      metadata: {
        sourceId: 'endless-searcher',
        sourceKind: 'distro',
        storeItemSlug: 'endless-searcher',
        variantId: 'variant_endless-searcher_standard',
      },
      name: 'BlackBox Records - Endless Searcher - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'endless-searcher',
    sourceKind: 'distro',
    storeItemSlug: 'endless-searcher',
    variantId: 'variant_endless-searcher_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of plima by Frakhtal. Source metadata identifies it as a 5-track release, released April 10, 2022.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/frakhtal-plima-cd.jpg'],
      metadata: {
        sourceId: 'frakhtal-plima-cd',
        sourceKind: 'distro',
        storeItemSlug: 'frakhtal-plima-cd',
        variantId: 'variant_frakhtal-plima-cd_standard',
      },
      name: 'BlackBox Records - plima - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'frakhtal-plima-cd',
    sourceKind: 'distro',
    storeItemSlug: 'frakhtal-plima-cd',
    variantId: 'variant_frakhtal-plima-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of Reshaping the symbols by Full Moon Bonzai. Source metadata identifies it as a 8-track release, released December 1, 2017.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/full-moon-bonzai-reshaping-the-symbols-cd.jpg',
      ],
      metadata: {
        sourceId: 'full-moon-bonzai-reshaping-the-symbols-cd',
        sourceKind: 'distro',
        storeItemSlug: 'full-moon-bonzai-reshaping-the-symbols-cd',
        variantId: 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard',
      },
      name: 'BlackBox Records - Reshaping the symbols - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'full-moon-bonzai-reshaping-the-symbols-cd',
    sourceKind: 'distro',
    storeItemSlug: 'full-moon-bonzai-reshaping-the-symbols-cd',
    variantId: 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "CD edition of Kuro by Granna's House. Source metadata identifies it as a 11-track release, released May 8, 2023.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/granna-s-house-kuro-cd.jpg',
      ],
      metadata: {
        sourceId: 'granna-s-house-kuro-cd',
        sourceKind: 'distro',
        storeItemSlug: 'granna-s-house-kuro-cd',
        variantId: 'variant_granna-s-house-kuro-cd_standard',
      },
      name: 'BlackBox Records - Kuro - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'granna-s-house-kuro-cd',
    sourceKind: 'distro',
    storeItemSlug: 'granna-s-house-kuro-cd',
    variantId: 'variant_granna-s-house-kuro-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of No easy Way by Gun Fever. Source metadata identifies it as a 6-track release, released November 26, 2024.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/gun-fever-no-easy-way-vinyl.webp',
      ],
      metadata: {
        sourceId: 'gun-fever-no-easy-way-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'gun-fever-no-easy-way-vinyl',
        variantId: 'variant_gun-fever-no-easy-way-vinyl_standard',
      },
      name: 'BlackBox Records - No easy Way - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'gun-fever-no-easy-way-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'gun-fever-no-easy-way-vinyl',
    variantId: 'variant_gun-fever-no-easy-way-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      maximumAmountMinor: 10000,
    },
    productProjection: {
      description:
        'CD edition of Hey Stealthy by Hey Stealthy. Source metadata identifies it as a 6-track release, released November 1, 2024.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/hey-stealthy-hey-stealthy-cd.jpg',
      ],
      metadata: {
        sourceId: 'hey-stealthy-hey-stealthy-cd',
        sourceKind: 'distro',
        storeItemSlug: 'hey-stealthy-hey-stealthy-cd',
        variantId: 'variant_hey-stealthy-hey-stealthy-cd_standard',
      },
      name: 'BlackBox Records - Hey Stealthy - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'hey-stealthy-hey-stealthy-cd',
    sourceKind: 'distro',
    storeItemSlug: 'hey-stealthy-hey-stealthy-cd',
    variantId: 'variant_hey-stealthy-hey-stealthy-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of 2025 EP by Huracan. Source metadata identifies it as a 4-track release, released September 18, 2025.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/huracan-2025-ep-vinyl.webp',
      ],
      metadata: {
        sourceId: 'huracan-2025-ep-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'huracan-2025-ep-vinyl',
        variantId: 'variant_huracan-2025-ep-vinyl_standard',
      },
      name: 'BlackBox Records - 2025 EP - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'huracan-2025-ep-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'huracan-2025-ep-vinyl',
    variantId: 'variant_huracan-2025-ep-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2500,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'we.own.the.sky keep their progressive post-rock atmosphere intact on In Your Absence, their third full-length album.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/we-own-the-sky-in-your-absence.jpg',
      ],
      metadata: {
        sourceId: 'in-your-absence',
        sourceKind: 'distro',
        storeItemSlug: 'in-your-absence',
        variantId: 'variant_in-your-absence_standard',
      },
      name: 'BlackBox Records - In Your Absence - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'in-your-absence',
    sourceKind: 'distro',
    storeItemSlug: 'in-your-absence',
    variantId: 'variant_in-your-absence_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Whip by Kokomo. Source metadata identifies it as a 6-track release, released May 16, 2026.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/kokomo-whip-vinyl.webp',
      ],
      metadata: {
        sourceId: 'kokomo-whip-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'kokomo-whip-vinyl',
        variantId: 'variant_kokomo-whip-vinyl_standard',
      },
      name: 'BlackBox Records - Whip - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'kokomo-whip-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'kokomo-whip-vinyl',
    variantId: 'variant_kokomo-whip-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Knot On Knot by Living Under Drones. Source metadata identifies it as a 6-track release, released November 30, 2021.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/living-under-drones-knot-on-knot-vinyl.webp',
      ],
      metadata: {
        sourceId: 'living-under-drones-knot-on-knot-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'living-under-drones-knot-on-knot-vinyl',
        variantId: 'variant_living-under-drones-knot-on-knot-vinyl_standard',
      },
      name: 'BlackBox Records - Knot On Knot - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'living-under-drones-knot-on-knot-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'living-under-drones-knot-on-knot-vinyl',
    variantId: 'variant_living-under-drones-knot-on-knot-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1500,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Skinny Peachfuzz bring fast guitars, heavy fuzz, and Italian garage punk energy to their first full-length album.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/skinny-peach-fuzz-7-.jpg',
      ],
      metadata: {
        sourceId: 'magic-sleazeball-corrida',
        sourceKind: 'distro',
        storeItemSlug: 'magic-sleazeball-corrida',
        variantId: 'variant_magic-sleazeball-corrida_standard',
      },
      name: 'BlackBox Records - Magic Sleazeball Corrida - Vinyl 7-inch',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'magic-sleazeball-corrida',
    sourceKind: 'distro',
    storeItemSlug: 'magic-sleazeball-corrida',
    variantId: 'variant_magic-sleazeball-corrida_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      maximumAmountMinor: 10000,
    },
    productProjection: {
      description:
        'Cassette edition of Cassette sessions by Magmarus. Source metadata identifies it as a 4-track release, released July 21, 2017. Cassette case artwork mockup. Actual cassette shell and labels may vary.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/magmarus-cassette-sessions-cassette.jpg',
      ],
      metadata: {
        sourceId: 'magmarus-cassette-sessions-cassette',
        sourceKind: 'distro',
        storeItemSlug: 'magmarus-cassette-sessions-cassette',
        variantId: 'variant_magmarus-cassette-sessions-cassette_standard',
      },
      name: 'BlackBox Records - Cassette sessions - Cassette',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'magmarus-cassette-sessions-cassette',
    sourceKind: 'distro',
    storeItemSlug: 'magmarus-cassette-sessions-cassette',
    variantId: 'variant_magmarus-cassette-sessions-cassette_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Mazza by Malämmar. Source metadata identifies it as a 6-track release, released April 30, 2021.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/malammar-mazza-vinyl.webp',
      ],
      metadata: {
        sourceId: 'malammar-mazza-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'malammar-mazza-vinyl',
        variantId: 'variant_malammar-mazza-vinyl_standard',
      },
      name: 'BlackBox Records - Mazza - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'malammar-mazza-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'malammar-mazza-vinyl',
    variantId: 'variant_malammar-mazza-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Vendetta by Malämmar. Source metadata identifies it as a 6-track release, released December 1, 2016.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/malammar-vendetta-vinyl.webp',
      ],
      metadata: {
        sourceId: 'malammar-vendetta-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'malammar-vendetta-vinyl',
        variantId: 'variant_malammar-vendetta-vinyl_standard',
      },
      name: 'BlackBox Records - Vendetta - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'malammar-vendetta-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'malammar-vendetta-vinyl',
    variantId: 'variant_malammar-vendetta-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Itch by Mammock. Source metadata identifies it as a 6-track release, released January 1, 2020.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/mammock-itch-vinyl.webp',
      ],
      metadata: {
        sourceId: 'mammock-itch-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'mammock-itch-vinyl',
        variantId: 'variant_mammock-itch-vinyl_standard',
      },
      name: 'BlackBox Records - Itch - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'mammock-itch-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'mammock-itch-vinyl',
    variantId: 'variant_mammock-itch-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2500,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Live at Dunk! Fest 2024 by Maserati. Source metadata identifies it as released May 23, 2025.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/maserati-live-at-dunk-fest-2024-vinyl.webp',
      ],
      metadata: {
        sourceId: 'maserati-live-at-dunk-fest-2024-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'maserati-live-at-dunk-fest-2024-vinyl',
        variantId: 'variant_maserati-live-at-dunk-fest-2024-vinyl_standard',
      },
      name: 'BlackBox Records - Live at Dunk! Fest 2024 - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'maserati-live-at-dunk-fest-2024-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'maserati-live-at-dunk-fest-2024-vinyl',
    variantId: 'variant_maserati-live-at-dunk-fest-2024-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of Υγειής by Millions of Dead tourists. Source metadata identifies it as a 4-track release, released March 23, 2023.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/millions-of-dead-tourists-ygiis-cd.jpg',
      ],
      metadata: {
        sourceId: 'millions-of-dead-tourists-ygiis-cd',
        sourceKind: 'distro',
        storeItemSlug: 'millions-of-dead-tourists-ygiis-cd',
        variantId: 'variant_millions-of-dead-tourists-ygiis-cd_standard',
      },
      name: 'BlackBox Records - Υγειής - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'millions-of-dead-tourists-ygiis-cd',
    sourceKind: 'distro',
    storeItemSlug: 'millions-of-dead-tourists-ygiis-cd',
    variantId: 'variant_millions-of-dead-tourists-ygiis-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'CD edition of Slap punkabilly by Nausea Bomb in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/nausea-bomb-slap-punkabilly-cd-front-mockup.jpg',
      ],
      metadata: {
        sourceId: 'nausea-bomb-slap-punkabilly-cd',
        sourceKind: 'distro',
        storeItemSlug: 'nausea-bomb-slap-punkabilly-cd',
        variantId: 'variant_nausea-bomb-slap-punkabilly-cd_standard',
      },
      name: 'BlackBox Records - Slap punkabilly - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'nausea-bomb-slap-punkabilly-cd',
    sourceKind: 'distro',
    storeItemSlug: 'nausea-bomb-slap-punkabilly-cd',
    variantId: 'variant_nausea-bomb-slap-punkabilly-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Last Rizla lean into Athens sludge and noise-rock on Noise Without Decay, keeping the sound heavy and frayed.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/last-rizla-noise-without-decay.jpg',
      ],
      metadata: {
        sourceId: 'noise-without-decay',
        sourceKind: 'distro',
        storeItemSlug: 'noise-without-decay',
        variantId: 'variant_noise-without-decay_standard',
      },
      name: 'BlackBox Records - Noise Without Decay - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'noise-without-decay',
    sourceKind: 'distro',
    storeItemSlug: 'noise-without-decay',
    variantId: 'variant_noise-without-decay_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of Tales of disgrace by Nothing Thrives in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/nothing-thrives-tales-of-disgrace-vinyl.webp',
      ],
      metadata: {
        sourceId: 'nothing-thrives-tales-of-disgrace-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'nothing-thrives-tales-of-disgrace-vinyl',
        variantId: 'variant_nothing-thrives-tales-of-disgrace-vinyl_standard',
      },
      name: 'BlackBox Records - Tales of disgrace - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'nothing-thrives-tales-of-disgrace-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'nothing-thrives-tales-of-disgrace-vinyl',
    variantId: 'variant_nothing-thrives-tales-of-disgrace-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'One Leg Mary balance alternative post-hardcore with layered melodies and sharp instrumental turns.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/onelegmary-on-the-quiet.jpg',
      ],
      metadata: {
        sourceId: 'on-the-quiet',
        sourceKind: 'distro',
        storeItemSlug: 'on-the-quiet',
        variantId: 'variant_on-the-quiet_standard',
      },
      name: 'BlackBox Records - On The Quiet - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'on-the-quiet',
    sourceKind: 'distro',
    storeItemSlug: 'on-the-quiet',
    variantId: 'variant_on-the-quiet_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of I, a Seawolf, a Madman by One leg Mary. Source metadata identifies it as a 8-track release, released December 27, 2014.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/one-leg-mary-i-a-seawolf-a-madman-cd.jpg',
      ],
      metadata: {
        sourceId: 'one-leg-mary-i-a-seawolf-a-madman-cd',
        sourceKind: 'distro',
        storeItemSlug: 'one-leg-mary-i-a-seawolf-a-madman-cd',
        variantId: 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard',
      },
      name: 'BlackBox Records - I, a Seawolf, a Madman - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'one-leg-mary-i-a-seawolf-a-madman-cd',
    sourceKind: 'distro',
    storeItemSlug: 'one-leg-mary-i-a-seawolf-a-madman-cd',
    variantId: 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of On the quiet by One leg Mary. Source metadata identifies it as a 10-track release, released February 1, 2017.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/one-leg-mary-on-the-quiet-cd.jpg',
      ],
      metadata: {
        sourceId: 'one-leg-mary-on-the-quiet-cd',
        sourceKind: 'distro',
        storeItemSlug: 'one-leg-mary-on-the-quiet-cd',
        variantId: 'variant_one-leg-mary-on-the-quiet-cd_standard',
      },
      name: 'BlackBox Records - On the quiet - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'one-leg-mary-on-the-quiet-cd',
    sourceKind: 'distro',
    storeItemSlug: 'one-leg-mary-on-the-quiet-cd',
    variantId: 'variant_one-leg-mary-on-the-quiet-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 3000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Van Woede Tot Wanhoop by Onrust. Source metadata identifies it as an 8-track release.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/onrust-van-woede-tot-wanhoop-vinyl.webp',
      ],
      metadata: {
        sourceId: 'onrust-van-woede-tot-wanhoop-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'onrust-van-woede-tot-wanhoop-vinyl',
        variantId: 'variant_onrust-van-woede-tot-wanhoop-vinyl_standard',
      },
      name: 'BlackBox Records - Van Woede Tot Wanhoop - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'onrust-van-woede-tot-wanhoop-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'onrust-van-woede-tot-wanhoop-vinyl',
    variantId: 'variant_onrust-van-woede-tot-wanhoop-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 3000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Live at Dunk! Fest 2016 by Pelican. Source metadata identifies it as a 10-track release.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/pelican-live-at-dunk-fest-2016-vinyl.webp',
      ],
      metadata: {
        sourceId: 'pelican-live-at-dunk-fest-2016-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'pelican-live-at-dunk-fest-2016-vinyl',
        variantId: 'variant_pelican-live-at-dunk-fest-2016-vinyl_standard',
      },
      name: 'BlackBox Records - Live at Dunk! Fest 2016 - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'pelican-live-at-dunk-fest-2016-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'pelican-live-at-dunk-fest-2016-vinyl',
    variantId: 'variant_pelican-live-at-dunk-fest-2016-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1500,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of Fortunate Isles by Pirate City in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/pirate-city-fortunate-isles-vinyl.webp',
      ],
      metadata: {
        sourceId: 'pirate-city-fortunate-isles-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'pirate-city-fortunate-isles-vinyl',
        variantId: 'variant_pirate-city-fortunate-isles-vinyl_standard',
      },
      name: 'BlackBox Records - Fortunate Isles - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'pirate-city-fortunate-isles-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'pirate-city-fortunate-isles-vinyl',
    variantId: 'variant_pirate-city-fortunate-isles-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1500,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of Λωβή by Pirate City in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/pirate-city-lovi-vinyl.webp',
      ],
      metadata: {
        sourceId: 'pirate-city-lovi-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'pirate-city-lovi-vinyl',
        variantId: 'variant_pirate-city-lovi-vinyl_standard',
      },
      name: 'BlackBox Records - Λωβή - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'pirate-city-lovi-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'pirate-city-lovi-vinyl',
    variantId: 'variant_pirate-city-lovi-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1500,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of Πειρατεία by Pirate City in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/pirate-city-piratia-vinyl.webp',
      ],
      metadata: {
        sourceId: 'pirate-city-piratia-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'pirate-city-piratia-vinyl',
        variantId: 'variant_pirate-city-piratia-vinyl_standard',
      },
      name: 'BlackBox Records - Πειρατεία - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'pirate-city-piratia-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'pirate-city-piratia-vinyl',
    variantId: 'variant_pirate-city-piratia-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Primal | Ephemeral catches Mass Culture in a post-hardcore and metal mode, with the band's Greek underground roots intact.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/mass-culture-primal-ephemeral.jpg',
      ],
      metadata: {
        sourceId: 'primal-ephemeral',
        sourceKind: 'distro',
        storeItemSlug: 'primal-ephemeral',
        variantId: 'variant_primal-ephemeral_standard',
      },
      name: 'BlackBox Records - Primal | Ephemeral - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'primal-ephemeral',
    sourceKind: 'distro',
    storeItemSlug: 'primal-ephemeral',
    variantId: 'variant_primal-ephemeral_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Killgrave's Athens death metal brings melodic death metal and punk hardcore edges into Rise Of The Black Fang.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/killgrave-rise-of-the-black-fang.jpg',
      ],
      metadata: {
        sourceId: 'rise-of-the-black-fang',
        sourceKind: 'distro',
        storeItemSlug: 'rise-of-the-black-fang',
        variantId: 'variant_rise-of-the-black-fang_standard',
      },
      name: 'BlackBox Records - Rise Of The Black Fang - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'rise-of-the-black-fang',
    sourceKind: 'distro',
    storeItemSlug: 'rise-of-the-black-fang',
    variantId: 'variant_rise-of-the-black-fang_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'The You and What Army Faction pair experimental no-wave and post-punk ideas on RITE, their sixth full-length album.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/the-you-and-what-army-faction-rite.jpg',
      ],
      metadata: {
        sourceId: 'rite',
        sourceKind: 'distro',
        storeItemSlug: 'rite',
        variantId: 'variant_rite_standard',
      },
      name: 'BlackBox Records - RITE - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'rite',
    sourceKind: 'distro',
    storeItemSlug: 'rite',
    variantId: 'variant_rite_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 3000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Live at Dunk! Fest 2016 by Russian Circles. Source metadata identifies it as a 9-track release, released April 7, 2017.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/russian-circles-live-at-dunk-fest-2016-vinyl.webp',
      ],
      metadata: {
        sourceId: 'russian-circles-live-at-dunk-fest-2016-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'russian-circles-live-at-dunk-fest-2016-vinyl',
        variantId: 'variant_russian-circles-live-at-dunk-fest-2016-vinyl_standard',
      },
      name: 'BlackBox Records - Live at Dunk! Fest 2016 - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'russian-circles-live-at-dunk-fest-2016-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'russian-circles-live-at-dunk-fest-2016-vinyl',
    variantId: 'variant_russian-circles-live-at-dunk-fest-2016-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of The big fish by Sadhus. Source metadata identifies it as a 6-track release, released November 15, 2018.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/sadhus-the-big-fish-cd.jpg',
      ],
      metadata: {
        sourceId: 'sadhus-the-big-fish-cd',
        sourceKind: 'distro',
        storeItemSlug: 'sadhus-the-big-fish-cd',
        variantId: 'variant_sadhus-the-big-fish-cd_standard',
      },
      name: 'BlackBox Records - The big fish - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'sadhus-the-big-fish-cd',
    sourceKind: 'distro',
    storeItemSlug: 'sadhus-the-big-fish-cd',
    variantId: 'variant_sadhus-the-big-fish-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'CD edition of Ατελές το ον by Salto Mortale in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/salto-mortale-ateles-to-on-cd-front-mockup.jpg',
      ],
      metadata: {
        sourceId: 'salto-mortale-ateles-to-on-cd',
        sourceKind: 'distro',
        storeItemSlug: 'salto-mortale-ateles-to-on-cd',
        variantId: 'variant_salto-mortale-ateles-to-on-cd_standard',
      },
      name: 'BlackBox Records - Ατελές το ον - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'salto-mortale-ateles-to-on-cd',
    sourceKind: 'distro',
    storeItemSlug: 'salto-mortale-ateles-to-on-cd',
    variantId: 'variant_salto-mortale-ateles-to-on-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: "Selenopolis keeps Olaf Olafsonn and the Big Bad Trip in Prague's psych and kraut rock'n'roll lane.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/olaf-olafsson-and-the-big-bad-trip-selenepolis.jpg',
      ],
      metadata: {
        sourceId: 'selenopolis',
        sourceKind: 'distro',
        storeItemSlug: 'selenopolis',
        variantId: 'variant_selenopolis_standard',
      },
      name: 'BlackBox Records - Selenopolis - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'selenopolis',
    sourceKind: 'distro',
    storeItemSlug: 'selenopolis',
    variantId: 'variant_selenopolis_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Spinners keep their Athens indie rock, punk, and post-hardcore sound direct and unvarnished.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/spinners-13.jpg'],
      metadata: {
        sourceId: 'spinners',
        sourceKind: 'distro',
        storeItemSlug: 'spinners',
        variantId: 'variant_spinners_standard',
      },
      name: 'BlackBox Records - Spinners - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'spinners',
    sourceKind: 'distro',
    storeItemSlug: 'spinners',
    variantId: 'variant_spinners_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Steelwitch bring Athens heavy and power metal into a clean, direct first full-length album.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/steelwitch-steelwitch.jpg',
      ],
      metadata: {
        sourceId: 'steelwitch',
        sourceKind: 'distro',
        storeItemSlug: 'steelwitch',
        variantId: 'variant_steelwitch_standard',
      },
      name: 'BlackBox Records - Steelwitch - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'steelwitch',
    sourceKind: 'distro',
    storeItemSlug: 'steelwitch',
    variantId: 'variant_steelwitch_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'CD edition of Baltica by Stefan Clor. Source metadata identifies it as a 17-track release, released October 20, 2017.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/stefan-clor-baltica-cd.jpg',
      ],
      metadata: {
        sourceId: 'stefan-clor-baltica-cd',
        sourceKind: 'distro',
        storeItemSlug: 'stefan-clor-baltica-cd',
        variantId: 'variant_stefan-clor-baltica-cd_standard',
      },
      name: 'BlackBox Records - Baltica - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'stefan-clor-baltica-cd',
    sourceKind: 'distro',
    storeItemSlug: 'stefan-clor-baltica-cd',
    variantId: 'variant_stefan-clor-baltica-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'CD edition of The guilt of feeling alive by Sun of Nothing in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/sun-of-nothing-the-guilt-of-feeling-alive-cd-front-mockup.jpg',
      ],
      metadata: {
        sourceId: 'sun-of-nothing-the-guilt-of-feeling-alive-cd',
        sourceKind: 'distro',
        storeItemSlug: 'sun-of-nothing-the-guilt-of-feeling-alive-cd',
        variantId: 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard',
      },
      name: 'BlackBox Records - The guilt of feeling alive - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'sun-of-nothing-the-guilt-of-feeling-alive-cd',
    sourceKind: 'distro',
    storeItemSlug: 'sun-of-nothing-the-guilt-of-feeling-alive-cd',
    variantId: 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Demikhov's fuzzcore power trio from Desenzano del Garda gathers six unreleased tracks on The Chemical Bath.",
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/demikhov.jpg'],
      metadata: {
        sourceId: 'the-chemical-bath',
        sourceKind: 'distro',
        storeItemSlug: 'the-chemical-bath',
        variantId: 'variant_the-chemical-bath_standard',
      },
      name: 'BlackBox Records - The Chemical Bath - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'the-chemical-bath',
    sourceKind: 'distro',
    storeItemSlug: 'the-chemical-bath',
    variantId: 'variant_the-chemical-bath_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 3000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "The Feathers of Oblivion keeps the Big Bad Trip lineup moving through Prague psych and kraut rock'n'roll.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/olaf-olafsson-and-the-big-bad-trip-the-feathers-of-oblivion.jpg',
      ],
      metadata: {
        sourceId: 'the-feathers-of-oblivion',
        sourceKind: 'distro',
        storeItemSlug: 'the-feathers-of-oblivion',
        variantId: 'variant_the-feathers-of-oblivion_standard',
      },
      name: 'BlackBox Records - The Feathers of Oblivion - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'the-feathers-of-oblivion',
    sourceKind: 'distro',
    storeItemSlug: 'the-feathers-of-oblivion',
    variantId: 'variant_the-feathers-of-oblivion_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Their Methlab's second full-length album keeps the Athens instrumental rock and post-metal project in wide, heavy motion.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/their-methlab-the-last-second.jpg',
      ],
      metadata: {
        sourceId: 'the-last-second',
        sourceKind: 'distro',
        storeItemSlug: 'the-last-second',
        variantId: 'variant_the-last-second_standard',
      },
      name: 'BlackBox Records - The Last Second - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'the-last-second',
    sourceKind: 'distro',
    storeItemSlug: 'the-last-second',
    variantId: 'variant_the-last-second_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      currencyCode: 'EUR',
      kind: 'pay_what_you_want',
      minimumAmountMinor: 100,
      presetAmountMinor: 500,
      maximumAmountMinor: 10000,
    },
    productProjection: {
      description:
        'Cassette edition of Random Tapes by The Vagina lips. Artwork is known-missing from the verified source, so this item uses the distro cassette fallback.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/cassette-tape.jpg'],
      metadata: {
        sourceId: 'the-vagina-lips-random-tapes-cassette',
        sourceKind: 'distro',
        storeItemSlug: 'the-vagina-lips-random-tapes-cassette',
        variantId: 'variant_the-vagina-lips-random-tapes-cassette_standard',
      },
      name: 'BlackBox Records - Random Tapes - Cassette',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'the-vagina-lips-random-tapes-cassette',
    sourceKind: 'distro',
    storeItemSlug: 'the-vagina-lips-random-tapes-cassette',
    variantId: 'variant_the-vagina-lips-random-tapes-cassette_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of Your Kingdom, my life by Three Way plane in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/three-way-plane-your-kingdom-my-life-vinyl.webp',
      ],
      metadata: {
        sourceId: 'three-way-plane-your-kingdom-my-life-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'three-way-plane-your-kingdom-my-life-vinyl',
        variantId: 'variant_three-way-plane-your-kingdom-my-life-vinyl_standard',
      },
      name: 'BlackBox Records - Your Kingdom, my life - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'three-way-plane-your-kingdom-my-life-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'three-way-plane-your-kingdom-my-life-vinyl',
    variantId: 'variant_three-way-plane-your-kingdom-my-life-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Goodbye, Kings extend their Italian linear post-rock approach across Transatlantic // Transiberian.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/goodbye-kings-transatlantic-trans-siberian.jpg',
      ],
      metadata: {
        sourceId: 'transatlantic-transiberian',
        sourceKind: 'distro',
        storeItemSlug: 'transatlantic-transiberian',
        variantId: 'variant_transatlantic-transiberian_standard',
      },
      name: 'BlackBox Records - Transatlantic // Transiberian - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'transatlantic-transiberian',
    sourceKind: 'distro',
    storeItemSlug: 'transatlantic-transiberian',
    variantId: 'variant_transatlantic-transiberian_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Veuel by Turpentine Valley. Source metadata identifies it as a 10-track release, released March 6, 2026.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/turpentine-valley-veuel-vinyl.webp',
      ],
      metadata: {
        sourceId: 'turpentine-valley-veuel-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'turpentine-valley-veuel-vinyl',
        variantId: 'variant_turpentine-valley-veuel-vinyl_standard',
      },
      name: 'BlackBox Records - Veuel - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'turpentine-valley-veuel-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'turpentine-valley-veuel-vinyl',
    variantId: 'variant_turpentine-valley-veuel-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: "Speck keep UnKraut's Austrian space-kraut and heavy-psych energy locked into a long-form record.",
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/speck-unkraut.jpg'],
      metadata: {
        sourceId: 'unkraut',
        sourceKind: 'distro',
        storeItemSlug: 'unkraut',
        variantId: 'variant_unkraut_standard',
      },
      name: 'BlackBox Records - UnKraut - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'unkraut',
    sourceKind: 'distro',
    storeItemSlug: 'unkraut',
    variantId: 'variant_unkraut_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Vinyl edition of 8 Cantons by Unshaped Ahead in the BlackBox Records distro catalog.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/unshaped-ahead-8-cantons-vinyl.webp',
      ],
      metadata: {
        sourceId: 'unshaped-ahead-8-cantons-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'unshaped-ahead-8-cantons-vinyl',
        variantId: 'variant_unshaped-ahead-8-cantons-vinyl_standard',
      },
      name: 'BlackBox Records - 8 Cantons - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'unshaped-ahead-8-cantons-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'unshaped-ahead-8-cantons-vinyl',
    variantId: 'variant_unshaped-ahead-8-cantons-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Zaperlipopette! keep their Swiss experimental rock and math-rock focus sharp on Voyage Voyage.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/zapetli-popette-voyage-voyage.jpg',
      ],
      metadata: {
        sourceId: 'voyage-voyage',
        sourceKind: 'distro',
        storeItemSlug: 'voyage-voyage',
        variantId: 'variant_voyage-voyage_standard',
      },
      name: 'BlackBox Records - Voyage Voyage - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'voyage-voyage',
    sourceKind: 'distro',
    storeItemSlug: 'voyage-voyage',
    variantId: 'variant_voyage-voyage_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 3000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of A single flower by We lost the Sea. Source metadata identifies it as a 6-track release, released July 4, 2025.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/we-lost-the-sea-a-single-flower-vinyl.webp',
      ],
      metadata: {
        sourceId: 'we-lost-the-sea-a-single-flower-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'we-lost-the-sea-a-single-flower-vinyl',
        variantId: 'variant_we-lost-the-sea-a-single-flower-vinyl_standard',
      },
      name: 'BlackBox Records - A single flower - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'we-lost-the-sea-a-single-flower-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'we-lost-the-sea-a-single-flower-vinyl',
    variantId: 'variant_we-lost-the-sea-a-single-flower-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 3000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Departure Songs by We lost the Sea. Source metadata identifies it as a 5-track release.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/we-lost-the-sea-departure-songs-vinyl.webp',
      ],
      metadata: {
        sourceId: 'we-lost-the-sea-departure-songs-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'we-lost-the-sea-departure-songs-vinyl',
        variantId: 'variant_we-lost-the-sea-departure-songs-vinyl_standard',
      },
      name: 'BlackBox Records - Departure Songs - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'we-lost-the-sea-departure-songs-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'we-lost-the-sea-departure-songs-vinyl',
    variantId: 'variant_we-lost-the-sea-departure-songs-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 3000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Vinyl edition of Triumph & Disaster by We lost the Sea. Source metadata identifies it as a 7-track release.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/we-lost-the-sea-triumph-disaster-vinyl.webp',
      ],
      metadata: {
        sourceId: 'we-lost-the-sea-triumph-disaster-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'we-lost-the-sea-triumph-disaster-vinyl',
        variantId: 'variant_we-lost-the-sea-triumph-disaster-vinyl_standard',
      },
      name: 'BlackBox Records - Triumph & Disaster - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'we-lost-the-sea-triumph-disaster-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'we-lost-the-sea-triumph-disaster-vinyl',
    variantId: 'variant_we-lost-the-sea-triumph-disaster-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Three Way Plane carry their Athens alternative, punk, and noise-rock line into Wreckquiem.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/three-way-plane-your-kingdom-my-life.jpg',
      ],
      metadata: {
        sourceId: 'wreckquiem',
        sourceKind: 'distro',
        storeItemSlug: 'wreckquiem',
        variantId: 'variant_wreckquiem_standard',
      },
      name: 'BlackBox Records - Wreckquiem - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'wreckquiem',
    sourceKind: 'distro',
    storeItemSlug: 'wreckquiem',
    variantId: 'variant_wreckquiem_standard',
  },
];

export function createCurrentCatalogProductProjectionReader(): CatalogProductProjectionReader {
  return {
    findByStoreItem: findCurrentCatalogProductProjection,
  };
}

export function findCurrentCatalogProductProjection(
  storeItem: StoreItemOptionRecord,
): StripeCatalogProductProjection | null {
  return findCurrentCatalogProductProjectionEntry(storeItem)?.productProjection ?? null;
}

export function findCurrentCatalogProductProjectionEntry(
  storeItem: StoreItemOptionRecord,
): CatalogProductProjectionEntry | null {
  return (
    currentCatalogProductProjectionEntries.find(
      (entry) =>
        entry.storeItemSlug === storeItem.storeItemSlug &&
        entry.variantId === storeItem.variantId &&
        entry.sourceKind === storeItem.sourceKind &&
        entry.sourceId === storeItem.sourceId,
    ) ?? null
  );
}

export function createCurrentCatalogExpectedProductProjectionMap(): Map<string, StripeCatalogProductProjection> {
  return new Map(currentCatalogProductProjectionEntries.map((entry) => [entry.variantId, entry.productProjection]));
}

export function createCurrentCatalogExpectedSandboxPriceMap(
  environment: StripeCatalogEnvironment,
): Map<string, StripeCatalogExpectedPrice> {
  if (environment !== 'uat') {
    return new Map();
  }

  return new Map(
    currentCatalogProductProjectionEntries.flatMap((entry) =>
      entry.expectedSandboxPrice ? [[entry.variantId, entry.expectedSandboxPrice] as const] : [],
    ),
  );
}
