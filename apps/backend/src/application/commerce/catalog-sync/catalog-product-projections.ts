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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Adolf plays the Jazz's 2012 form follows function spans nine tracks of experimental rock, post-rock, shoegaze, and post-punk.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/adolf-plays-the-jazz-form-follows-function-cd.jpg',
      ],
      metadata: {
        sourceId: 'adolf-plays-the-jazz-form-follows-function-cd',
        sourceKind: 'distro',
        storeItemSlug: 'adolf-plays-the-jazz-form-follows-function-cd',
        variantId: 'variant_adolf-plays-the-jazz-form-follows-function-cd_standard',
      },
      name: 'BlackBox Records - form follows function - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'adolf-plays-the-jazz-form-follows-function-cd',
    sourceKind: 'distro',
    storeItemSlug: 'adolf-plays-the-jazz-form-follows-function-cd',
    variantId: 'variant_adolf-plays-the-jazz-form-follows-function-cd_standard',
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
        'Nine-track instrumental post-metal and experimental-rock album from Bucharest, led by riffs and progressive turns.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/aflmsmp-i-went-to-the-mountain-vinyl.webp',
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
      description: 'Eleven-track political hardcore and crust record from Austria, issued on 12-inch vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/indoctrinate-aftermaths.jpg',
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
      description: 'Seven-track sludge and stoner-metal debut built on downtuned riffs and raw vocals.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/hazarder-against-leviathan.jpg',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Analekta is the debut album from Athens experimental duo Agia Monaxia, assembled from extended ambient improvisations. This CD edition uses handmade recycled-paper and sandpaper packaging, limited to 100 copies.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/agia-monaxia-analekta-cd-front.jpg',
      ],
      metadata: {
        sourceId: 'agia-monaxia-analekta-cd',
        sourceKind: 'distro',
        storeItemSlug: 'agia-monaxia-analekta-cd',
        variantId: 'variant_agia-monaxia-analekta-cd_standard',
      },
      name: 'BlackBox Records - Analekta - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'agia-monaxia-analekta-cd',
    sourceKind: 'distro',
    storeItemSlug: 'agia-monaxia-analekta-cd',
    variantId: 'variant_agia-monaxia-analekta-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Nine-track progressive post-metal and hardcore album from Athens, issued on heavyweight vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/allochiria-commotion-vinyl.webp',
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
        'Seven-track Athens post-sludge and post-metal album, pressed on 180-gram vinyl for its tenth anniversary.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/allochiria-omonoia-vinyl.webp',
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
        'Six-track progressive and post-black-metal album by Athens band Allochiria, issued on 12-inch vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/allochiria-throes-vinyl.webp',
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
      description:
        "Ouranopithecus' ten-track album channels the Athens trio's psychedelic and punk influences. Recorded at Atavo and Buduzi Studios, it was produced by the band and Marios Adamopoulos and released with BlackBox Records. Digital availability is confirmed by Bandcamp; Vinyl is the label edition.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/releases/ouranopithecus-album-cover-distro-mockup.webp',
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
        "Anima Triste's 2023 album Alone is a nine-track Athens post-punk and gothic rock release, recorded, mixed, and mastered at OHBTT Studio.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/anima-triste-alone-cd-front.webp',
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
        "Anima Triste's 2016 self-titled album is a ten-track Athens post-punk and darkwave set recorded live at The New Fab Liquid and mixed at Top Floor.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/anima-triste-anima-triste-cd-front.webp',
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
        "Humanity is Anima Triste's ten-track 2019 album, rooted in Athens post-punk, darkwave, and gothic rock.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/anima-triste-humanity-cd-front.webp',
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
      description: "Ατοπια's 2012 self-titled album spans 11 tracks, from «Εισαγωγή» through «Υπέροχη Θέα».",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/atopia-atopia-cd.jpg',
      ],
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
      description: 'Six-track mostly instrumental post-metal album exploring ritual, growth, decay, life, and death.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/aufhebung-luchtbegrafenis-vinyl.webp',
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
        'Three long-form instrumental doom and psychedelic-rock tracks, issued as a 50-copy high-bias cassette.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/band-in-the-pit-2016-cassette.jpg',
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
      description: 'Seven-track Athens post-hardcore, post-metal, and sludge album, pressed on 180-gram marbled vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/mass-culture-barren-point.jpg',
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
        'Six-track Athens sludge-and-doom album on numbered 12-inch vinyl with two-color screen-printed covers.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/sadhus-the-big-fish.jpg',
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
      description: 'Nine-track Berlin debut spanning post-metal, blackgaze, and djent, issued as a double LP.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/bipolar-architecture-depressionland-vinyl.webp',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        "Synapses is Blame the Trees' seven-track 2013 debut, blending atmospheric rock, post-rock, trip hop, and drum and bass.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/blame-the-trees-synapses-cd.jpg',
      ],
      metadata: {
        sourceId: 'blame-the-trees-synapses-cd',
        sourceKind: 'distro',
        storeItemSlug: 'blame-the-trees-synapses-cd',
        variantId: 'variant_blame-the-trees-synapses-cd_standard',
      },
      name: 'BlackBox Records - Synapses - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'blame-the-trees-synapses-cd',
    sourceKind: 'distro',
    storeItemSlug: 'blame-the-trees-synapses-cd',
    variantId: 'variant_blame-the-trees-synapses-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Eight-track Belgian metal album by Bloed.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/bloed-tranen.jpg'],
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
      description: 'Eleven-track Athens post-hardcore and screamo album, issued on cassette.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/broken-fingers-ego-cassette.jpg',
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
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/calf-karditsa.jpg'],
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
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'released March 13, 2026 All music written and performed by Chronoboros All lyrics written by Nikos Zalimoglou Recorded live at Ignite Music Studio Jun 2025 Recorded, mixed, and mastered by George Christoforidis Artwork and layout by Healitwithsilver',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/releases/chronoboros-album-cover-distro-mockup.webp',
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
        'Two-track split reflecting on the 2018 Athens wildfires, with Celuta Red on side A and Agia Monaxia on side B, issued in a 100-copy vinyl edition.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl.webp',
      ],
      metadata: {
        sourceId: 'celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl',
        variantId: 'variant_celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl_standard',
      },
      name: 'BlackBox Records - Escape the Blaze only to find another - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl',
    variantId: 'variant_celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl_standard',
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
        "Amoeba is Celuta Red's eight-track 2015 album of Athens alternative and indie rock, produced, engineered, mixed, and mastered by Ottomo at New Fab Liquid Studio Recordings.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/celuta-red-amoeba-cd.jpg',
      ],
      metadata: {
        sourceId: 'celuta-red-amoeba-cd',
        sourceKind: 'distro',
        storeItemSlug: 'celuta-red-amoeba-cd',
        variantId: 'variant_celuta-red-amoeba-cd_standard',
      },
      name: 'BlackBox Records - Amoeba - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'celuta-red-amoeba-cd',
    sourceKind: 'distro',
    storeItemSlug: 'celuta-red-amoeba-cd',
    variantId: 'variant_celuta-red-amoeba-cd_standard',
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
        "Idle Frenzy is Celuta Red's seven-track 2018 alternative-rock album, produced by Ottomo and recorded and mixed at The New Fab Liquid Recording Studios.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/celuta-red-idle-frenzy-cd.jpg',
      ],
      metadata: {
        sourceId: 'celuta-red-idle-frenzy-cd',
        sourceKind: 'distro',
        storeItemSlug: 'celuta-red-idle-frenzy-cd',
        variantId: 'variant_celuta-red-idle-frenzy-cd_standard',
      },
      name: 'BlackBox Records - Idle Frenzy - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'celuta-red-idle-frenzy-cd',
    sourceKind: 'distro',
    storeItemSlug: 'celuta-red-idle-frenzy-cd',
    variantId: 'variant_celuta-red-idle-frenzy-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Four live-recorded instrumental jazz-rock and post-rock pieces by Katowice quintet Ciśnienie.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/cisnienie-angry-noises-vinyl.webp',
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
      description: 'Nine-track Athens mix of punk, garage, heavy, and indie rock, issued on red vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/coyotes-arrow-medicine-vinyl.webp',
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
        "Two-track Athens split 7-inch pairing Zebu's Crawl with Dead Elephant's Eat Them Dead Or Alive across heavy metal, sludge, and stoner rock.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/zebu-dead-elephant-split-7-.jpg',
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
      description: "Heavy, Huge and Rotten is Dead Elephant's six-track 2016 Athens doom and sludge album.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/dead-elephant-heavy-huge-and-rotten-cd.jpg',
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
        'Five-track debut by Athens instrumental post-rock and post-metal band Dead Flag Blues, issued on digipak CD.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/dead-flag-blues-traumatique-cd-front.jpg',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: "Deus Ex Machina's Time Expires on CD from The Lab Records.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/deus-x-machina-time-expires-cd.jpg',
      ],
      metadata: {
        sourceId: 'deus-x-machina-time-expires-cd',
        sourceKind: 'distro',
        storeItemSlug: 'deus-x-machina-time-expires-cd',
        variantId: 'variant_deus-x-machina-time-expires-cd_standard',
      },
      name: 'BlackBox Records - Time Expires - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'deus-x-machina-time-expires-cd',
    sourceKind: 'distro',
    storeItemSlug: 'deus-x-machina-time-expires-cd',
    variantId: 'variant_deus-x-machina-time-expires-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Eight-track Belgian debut blending post-hardcore, post-metal, post-rock, shoegaze, and sludge.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/devided-light-will-shine-vinyl.webp',
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
      description: 'Eight-track self-titled garage-punk album released in 2019.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/dirty-ol-dogs-dirty-ol-dogs-cd.jpg',
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
        "Afterwise's six-track debut album blends instrumental post-rock atmosphere with post-metal weight. Written and performed by the Athens band, it was recorded and mixed at BlackBox Studio and released by BlackBox Records. Digital availability is confirmed by Bandcamp; Black Vinyl LP and CD are label editions.",
      imageUrls: [
        'https://blackbox-records-web.pages.dev/assets/catalog/releases/afterwise-album-cover-distro-mockup.webp',
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
      description: 'Five-track heavy-psych and stoner-rock album blending doom, proto-metal, and space-rock.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/maha-sohona-endless-searcher.jpg',
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
      description: 'Five-track instrumental progressive and post-rock album by Novi Sad trio Frakhtal.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/frakhtal-plima-cd-front.webp',
      ],
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
        'Nine-track indie and math-rock album by Zagreb trio From Another Mother, issued on CD in a digi-sleeve.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/from-another-mother-atatoa-cd.jpg',
      ],
      metadata: {
        sourceId: 'from-another-mother-atatoa-cd',
        sourceKind: 'distro',
        storeItemSlug: 'from-another-mother-atatoa-cd',
        variantId: 'variant_from-another-mother-atatoa-cd_standard',
      },
      name: 'BlackBox Records - ATATOA - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'from-another-mother-atatoa-cd',
    sourceKind: 'distro',
    storeItemSlug: 'from-another-mother-atatoa-cd',
    variantId: 'variant_from-another-mother-atatoa-cd_standard',
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
        'Nine-track Zagreb math-rock and indie-rock album driven by polyrhythmic grooves, sudden breakdowns, and melodic guitar.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/from-another-mother-atatoa-vinyl.webp',
      ],
      metadata: {
        sourceId: 'from-another-mother-atatoa-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'from-another-mother-atatoa-vinyl',
        variantId: 'variant_from-another-mother-atatoa-vinyl_standard',
      },
      name: 'BlackBox Records - ATATOA - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'from-another-mother-atatoa-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'from-another-mother-atatoa-vinyl',
    variantId: 'variant_from-another-mother-atatoa-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Eight-track 2017 experimental black-metal album, issued on a gatefold digipak CD.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/full-moon-bonzai-reshaping-the-symbols-cd-open.jpg',
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
      description: 'Eleven-track psychedelic post-metal and post-rock album from Xanthi, issued on CD.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/granna-s-house-kuro-cd.jpg',
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
      description: 'Six-track Athens Oi!, punk, and hardcore record, pressed on black-and-white marbled vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/gun-fever-no-easy-way-vinyl.webp',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Seven-track post-metal album by Athens band Hedvika, released in 2013.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/hedvika-the-evidence-of-absence-cd.jpg',
      ],
      metadata: {
        sourceId: 'hedvika-the-evidence-of-absence-cd',
        sourceKind: 'distro',
        storeItemSlug: 'hedvika-the-evidence-of-absence-cd',
        variantId: 'variant_hedvika-the-evidence-of-absence-cd_standard',
      },
      name: 'BlackBox Records - The evidence of Absence - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'hedvika-the-evidence-of-absence-cd',
    sourceKind: 'distro',
    storeItemSlug: 'hedvika-the-evidence-of-absence-cd',
    variantId: 'variant_hedvika-the-evidence-of-absence-cd_standard',
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
      description: 'Six-track self-released debut spanning post-rock, post-metal, and melodic hardcore.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/hey-stealthy-hey-stealthy-cd.jpg',
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
        'Four-track Ghent post-hardcore and post-metal EP balancing raw aggression with melody and compact songwriting.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/huracan-2025-ep-vinyl.webp',
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
        "Ten-track third LP expanding the Athens band's progressive post-rock and post-metal around themes of loss and longing, pressed on 180-gram vinyl.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/we-own-the-sky-in-your-absence.jpg',
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
      description: 'Six-track instrumental post-rock album by Duisburg band Kokomo, issued on 12-inch vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/kokomo-whip-vinyl.webp',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Ten-track reissue of Sanatorium, adding two songs to the original eight-track album.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/krav-boca-sanatorium-cd.jpg',
      ],
      metadata: {
        sourceId: 'krav-boca-sanatorium-cd',
        sourceKind: 'distro',
        storeItemSlug: 'krav-boca-sanatorium-cd',
        variantId: 'variant_krav-boca-sanatorium-cd_standard',
      },
      name: 'BlackBox Records - Sanatorium - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'krav-boca-sanatorium-cd',
    sourceKind: 'distro',
    storeItemSlug: 'krav-boca-sanatorium-cd',
    variantId: 'variant_krav-boca-sanatorium-cd_standard',
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
        'Six-track second LP from Athens instrumental noise-rock band Living Under Drones, recorded live and issued on black vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/living-under-drones-knot-on-knot-vinyl.webp',
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
      description: 'Five-track Turin fuzz and garage-punk EP in a 50-copy screen-printed 7-inch edition.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/skinny-peach-fuzz-7-.jpg',
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
        'Four-track live-recorded Athens session spanning instrumental post-rock, ambient, and psychedelic sludge.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/magmarus-cassette-sessions-cassette.jpg',
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
        'Six-track Barcelona instrumental post-metal album built as a direct 33-minute run, pressed in a Dunk!fest edition.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/malammar-mazza-vinyl.webp',
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
      description: 'Six instrumental post-metal and sludge pieces from Badalona, released on vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/malammar-vendetta-vinyl.webp',
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
        'Six-track Athens debut combining noise rock, post-hardcore, post-punk, and art punk, issued with a printed inner sleeve.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/mammock-itch-vinyl.webp',
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
        "Maserati's 2024 Dunk!festival set, mixed and mastered by the band and pressed in two colored-vinyl editions with Error!Design artwork.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/maserati-live-at-dunk-fest-2024-vinyl.webp',
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
        'Four-track electronic and experimental album recorded in Athens and Thessaloniki, issued in a six-panel CD digisleeve.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/millions-of-dead-tourists-ygiis-cd-front.jpg',
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
      description:
        'Blues και ντέρτια collects Μπούγιο & Dirty Johnny tracks including «Ζάλη», «Με τα χάλια μου», and the title song.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/mpugio-dirty-johnny-blues-ntertia-cd.jpg',
      ],
      metadata: {
        sourceId: 'mpugio-dirty-johnny-blues-ntertia-cd',
        sourceKind: 'distro',
        storeItemSlug: 'mpugio-dirty-johnny-blues-ntertia-cd',
        variantId: 'variant_mpugio-dirty-johnny-blues-ntertia-cd_standard',
      },
      name: 'BlackBox Records - Blues & Ντέρτια - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'mpugio-dirty-johnny-blues-ntertia-cd',
    sourceKind: 'distro',
    storeItemSlug: 'mpugio-dirty-johnny-blues-ntertia-cd',
    variantId: 'variant_mpugio-dirty-johnny-blues-ntertia-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Punk and psychobilly release by Paris band Nausea Bomb.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/nausea-bomb-slap-punkabilly-cd-front-mockup.jpg',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Fifteen-track instrumental post-rock and post-metal album by Noise Raid, issued on CD.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/noise-raid-cosmic-radiation-cd-front.jpg',
      ],
      metadata: {
        sourceId: 'noise-raid-cosmic-radiation-cd',
        sourceKind: 'distro',
        storeItemSlug: 'noise-raid-cosmic-radiation-cd',
        variantId: 'variant_noise-raid-cosmic-radiation-cd_standard',
      },
      name: 'BlackBox Records - Cosmic Radiation - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'noise-raid-cosmic-radiation-cd',
    sourceKind: 'distro',
    storeItemSlug: 'noise-raid-cosmic-radiation-cd',
    variantId: 'variant_noise-raid-cosmic-radiation-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Nine-track Athens noise-rock and sludge-punk album, pressed on 200-gram vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/last-rizla-noise-without-decay.jpg',
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
      description: 'Nine-track Athens punk-and-roll debut focused on everyday social pressure, issued on black vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/nothing-thrives-tales-of-disgrace-vinyl.webp',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Six-track loop-driven instrumental math-rock album by Finnish duo NYOS.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/nyos-navigation-cd.jpg',
      ],
      metadata: {
        sourceId: 'nyos-navigation-cd',
        sourceKind: 'distro',
        storeItemSlug: 'nyos-navigation-cd',
        variantId: 'variant_nyos-navigation-cd_standard',
      },
      name: 'BlackBox Records - Navigation - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'nyos-navigation-cd',
    sourceKind: 'distro',
    storeItemSlug: 'nyos-navigation-cd',
    variantId: 'variant_nyos-navigation-cd_standard',
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
        'Seven-track blackened sludge and post-metal debut, issued in a handmade sandpaper-cover CD edition.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/okwaho-okwaho-cd-front.jpg',
      ],
      metadata: {
        sourceId: 'okwaho-okwaho-cd',
        sourceKind: 'distro',
        storeItemSlug: 'okwaho-okwaho-cd',
        variantId: 'variant_okwaho-okwaho-cd_standard',
      },
      name: 'BlackBox Records - Okwaho - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'okwaho-okwaho-cd',
    sourceKind: 'distro',
    storeItemSlug: 'okwaho-okwaho-cd',
    variantId: 'variant_okwaho-okwaho-cd_standard',
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
        'Three live-recorded psychedelic and stoner-rock pieces, paired with Plague on a 180-gram black-vinyl edition.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl.webp',
      ],
      metadata: {
        sourceId: 'olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl',
        sourceKind: 'distro',
        storeItemSlug: 'olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl',
        variantId: 'variant_olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl_standard',
      },
      name: 'BlackBox Records - Chakra Meditations - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl',
    sourceKind: 'distro',
    storeItemSlug: 'olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl',
    variantId: 'variant_olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Ten-track Greek alternative-rock and post-hardcore album, available here on blue vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/onelegmary-on-the-quiet.jpg',
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
      description: 'Eight-track alternative and noise-rock album by One Leg Mary, issued as a limited digipak CD.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/one-leg-mary-i-a-seawolf-a-madman-cd-front.jpg',
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
      description: 'Ten-track alternative rock album by One Leg Mary, co-released on CD in a digipak.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/one-leg-mary-on-the-quiet-cd-open.jpg',
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
        'Eight-track Belgian post-metal and sludge album tracing a spiral from anger into powerlessness and numbness.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/onrust-van-woede-tot-wanhoop-vinyl.webp',
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
      description: 'Ten-track Pelican set recorded at Dunk!Fest in Zottegem, Belgium, on May 6, 2016.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/pelican-live-at-dunk-fest-2016-vinyl.webp',
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
      description: 'Ten-track Galatsi mix of ska-punk, reggae-punk, gypsy punk, and alternative rock.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/pirate-city-fortunate-isles-vinyl.webp',
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
      description: 'Nine-track Galatsi ska-punk, punk-rock, and reggae album.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/pirate-city-lovi-vinyl.webp',
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
      description: 'Ten-track Galatsi punk-rock, ska-punk, and reggae album.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/pirate-city-piratia-vinyl.webp',
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
        'Eight-track Athens post-hardcore, post-metal, and sludge album, pressed on transparent green and violet vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/mass-culture-primal-ephemeral.jpg',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Seven-track hard-rock and stoner-rock album produced by Chris Tsangarides.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/puta-volcano-represent-victory-below-eye-cd.jpg',
      ],
      metadata: {
        sourceId: 'puta-volcano-represent-victory-below-eye-cd',
        sourceKind: 'distro',
        storeItemSlug: 'puta-volcano-represent-victory-below-eye-cd',
        variantId: 'variant_puta-volcano-represent-victory-below-eye-cd_standard',
      },
      name: 'BlackBox Records - Represent Victory Below Eye - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'puta-volcano-represent-victory-below-eye-cd',
    sourceKind: 'distro',
    storeItemSlug: 'puta-volcano-represent-victory-below-eye-cd',
    variantId: 'variant_puta-volcano-represent-victory-below-eye-cd_standard',
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
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/killgrave-rise-of-the-black-fang.jpg',
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
        'Nine-track Athens no-wave, noise-rock, and post-punk album, issued in a 200-copy black-vinyl edition.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/the-you-and-what-army-faction-rite.jpg',
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
        "Russian Circles' nine-track 2016 Dunk!festival headline set, issued as a double 180g colored-vinyl live album in a reverse-printed gatefold sleeve.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/russian-circles-live-at-dunk-fest-2016-vinyl.webp',
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
        'Six-track sludge and doom-metal album by Sadhus, The Smoking Community, issued in a hand-screenprinted CD sleeve.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/sadhus-the-big-fish-cd-front.jpg',
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
      description:
        "Salto Mortale's 2018 full album Ατελές το ον includes «Λάχεση», «(απο)σύνθεση», and «Soundtrack για μια προσμονή».",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/salto-mortale-ateles-to-on-cd-front-mockup.jpg',
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
      description: 'Nine-track Prague psychedelic-rock journey, issued as a gatefold with 180-gram marble-white vinyl.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/olaf-olafsson-and-the-big-bad-trip-selenepolis.jpg',
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
      description:
        "Spinners' self-titled second album is a 12-track indie rock, punk, and post-hardcore LP, self-released in Athens in 2013.",
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/spinners-13.jpg'],
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
      description:
        "Steelwitch's five-track 2020 self-titled release channels the Athens band's heavy, power, and speed metal.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/steelwitch-steelwitch.jpg',
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
        "Stéphane Clor's 17 improvised cello pieces, recorded in Gdańsk and released in a hand-numbered first CD edition of 100.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/stefan-clor-baltica-cd.jpg',
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
      description: 'Five-track avant-garde and post-black-metal album by Sun of Nothing, issued on CD.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/sun-of-nothing-the-guilt-of-feeling-alive-cd-front.jpg',
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
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/demikhov.jpg'],
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description:
        'Nine-track doom and psychedelic stoner-rock album, issued as a two-panel digipak CD with an eight-page booklet.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/the-curf-death-and-love-cd-front.jpg',
      ],
      metadata: {
        sourceId: 'the-curf-death-and-love-cd',
        sourceKind: 'distro',
        storeItemSlug: 'the-curf-death-and-love-cd',
        variantId: 'variant_the-curf-death-and-love-cd_standard',
      },
      name: 'BlackBox Records - Death and Love - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'the-curf-death-and-love-cd',
    sourceKind: 'distro',
    storeItemSlug: 'the-curf-death-and-love-cd',
    variantId: 'variant_the-curf-death-and-love-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Eleven-track stoner and psychedelic rock album recorded in Athens in 2007.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/the-curf-i-cd.jpg'],
      metadata: {
        sourceId: 'the-curf-i-cd',
        sourceKind: 'distro',
        storeItemSlug: 'the-curf-i-cd',
        variantId: 'variant_the-curf-i-cd_standard',
      },
      name: 'BlackBox Records - I - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'the-curf-i-cd',
    sourceKind: 'distro',
    storeItemSlug: 'the-curf-i-cd',
    variantId: 'variant_the-curf-i-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: "The Earthbound's La Guerra Final on CD from The Lab Records.",
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/the-earthbound-la-guerra-final-cd.jpg',
      ],
      metadata: {
        sourceId: 'the-earthbound-la-guerra-final-cd',
        sourceKind: 'distro',
        storeItemSlug: 'the-earthbound-la-guerra-final-cd',
        variantId: 'variant_the-earthbound-la-guerra-final-cd_standard',
      },
      name: 'BlackBox Records - La Guerra Final - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'the-earthbound-la-guerra-final-cd',
    sourceKind: 'distro',
    storeItemSlug: 'the-earthbound-la-guerra-final-cd',
    variantId: 'variant_the-earthbound-la-guerra-final-cd_standard',
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
        'Seventeen-part live field recording made across four seasons on Budeč hill, issued as a double-vinyl set.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/olaf-olafsson-and-the-big-bad-trip-the-feathers-of-oblivion.jpg',
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
        'Five-track Athens instrumental post-rock and post-metal debut, reissued on 300 clear-blue vinyl copies.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/their-methlab-the-last-second.jpg',
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
      description: 'Cassette collection from Thessaloniki post-punk, shoegaze, and dream-pop project The Vagina Lips.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/cassette-tape.jpg'],
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Nine-track Athens post-hardcore and post-rock album, self-released on CD in 2017.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/three-way-plane-your-kingdom-my-life-cd.jpg',
      ],
      metadata: {
        sourceId: 'three-way-plane-your-kingdom-my-life-cd',
        sourceKind: 'distro',
        storeItemSlug: 'three-way-plane-your-kingdom-my-life-cd',
        variantId: 'variant_three-way-plane-your-kingdom-my-life-cd_standard',
      },
      name: 'BlackBox Records - Your Kingdom, my life - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'three-way-plane-your-kingdom-my-life-cd',
    sourceKind: 'distro',
    storeItemSlug: 'three-way-plane-your-kingdom-my-life-cd',
    variantId: 'variant_three-way-plane-your-kingdom-my-life-cd_standard',
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
        'Nine-track Athens post-hardcore and post-rock album, issued on vinyl in 2018 by four collaborating labels.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/three-way-plane-your-kingdom-my-life-vinyl.webp',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Eight-track instrumental post-rock album by Madrid band Toundra, released in 2015.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/toundra-iv-cd.jpg'],
      metadata: {
        sourceId: 'toundra-iv-cd',
        sourceKind: 'distro',
        storeItemSlug: 'toundra-iv-cd',
        variantId: 'variant_toundra-iv-cd_standard',
      },
      name: 'BlackBox Records - IV - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'toundra-iv-cd',
    sourceKind: 'distro',
    storeItemSlug: 'toundra-iv-cd',
    variantId: 'variant_toundra-iv-cd_standard',
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
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/goodbye-kings-transatlantic-trans-siberian.jpg',
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
        'Ten-track instrumental post-metal and sludge album, pressed in two gatefold vinyl variants at dunk!pressing.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/turpentine-valley-veuel-vinyl.webp',
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
      amountMinor: 1000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Eight-track Polish post-punk album blending cold-wave and new-wave textures.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/ukryte-zalety-systemu-s-t-cd.jpg',
      ],
      metadata: {
        sourceId: 'ukryte-zalety-systemu-s-t-cd',
        sourceKind: 'distro',
        storeItemSlug: 'ukryte-zalety-systemu-s-t-cd',
        variantId: 'variant_ukryte-zalety-systemu-s-t-cd_standard',
      },
      name: 'BlackBox Records - s/t - CD',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'ukryte-zalety-systemu-s-t-cd',
    sourceKind: 'distro',
    storeItemSlug: 'ukryte-zalety-systemu-s-t-cd',
    variantId: 'variant_ukryte-zalety-systemu-s-t-cd_standard',
  },
  {
    alignmentStatus: 'checkout_eligible',
    expectedSandboxPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      kind: 'fixed',
    },
    productProjection: {
      description: 'Five-track Vienna instrumental space-kraut and heavy-psych album, presented here on vinyl.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/speck-unkraut.jpg'],
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
      description:
        'Eight-part instrumental album built entirely from violin, with each piece mapping an imagined canton; first LP edition of 350.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/unshaped-ahead-8-cantons-vinyl.webp',
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
      description: 'Eight-track Basel experimental math-rock album by Zaperlipopette!.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/zapetli-popette-voyage-voyage.jpg',
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
      description: 'Six-track Sydney post-rock and post-metal album, issued as a gatefold double LP.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/we-lost-the-sea-a-single-flower-vinyl.webp',
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
        'Five-track third album and first instrumental set from We Lost The Sea, inspired by failed but honourable journeys and issued as a double LP.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/we-lost-the-sea-departure-songs-vinyl.webp',
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
        'Seven-track post-apocalyptic concept album about climate collapse, loss, and letting go, issued as a double LP.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/we-lost-the-sea-triumph-disaster-vinyl.webp',
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
      description: 'Nine-track Athens alternative, noise-rock, and post-hardcore album by Three Way Plane.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/assets/catalog/distro/three-way-plane-your-kingdom-my-life.jpg',
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
