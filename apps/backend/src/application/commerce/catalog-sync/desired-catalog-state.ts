import type { DesiredCatalogEntry, DesiredCatalogEnvironment, DesiredCatalogState, DesiredPrice } from './types';

export type { DesiredCatalogEntry, DesiredCatalogEnvironment, DesiredCatalogState, DesiredPrice };

export const currentDesiredCatalogEntries: DesiredCatalogEntry[] = [
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 1200,
      currencyCode: 'EUR',
      revision: 'afterglow-tape-1200-eur',
    },
    productProjection: {
      description:
        'Exactly the kind of cassette we still want around: small-run, hand-carried, and more at home on a distro table than in a feed.',
      imageUrls: ['https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/cassette-tape.jpg'],
      metadata: {
        sourceId: 'afterglow-tape',
        sourceKind: 'distro',
        storeItemSlug: 'afterglow-tape',
        variantId: 'variant_afterglow-tape_standard',
      },
      name: 'BlackBox Records - Afterglow Cassette - Cassette',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'afterglow-tape',
    sourceKind: 'distro',
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'afterglow-tape',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_afterglow-tape_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'aftermaths-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'aftermaths',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_aftermaths_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'against-his-story-against-leviathan-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'against-his-story-against-leviathan',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_against-his-story-against-leviathan_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'anarchotribal-vinyl-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'anarchotribal-vinyl',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_anarchotribal-vinyl_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'barren-point-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'barren-point',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_barren-point_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'big-fish-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'big-fish',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_big-fish_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'bloed-tranen-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'bloed-tranen',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_bloed-tranen_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'caregivers-vinyl-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'caregivers-vinyl',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_caregivers-vinyl_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'crawl-eat-them-dead-or-alive-split-7-2800-eur',
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
      name: 'BlackBox Records - Crawl / Eat Them Dead Or Alive, Split 7" - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'crawl-eat-them-dead-or-alive-split-7',
    sourceKind: 'distro',
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'crawl-eat-them-dead-or-alive-split-7',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_crawl-eat-them-dead-or-alive-split-7_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'disintegration-black-vinyl-lp-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'disintegration-black-vinyl-lp',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_disintegration-black-vinyl-lp_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'endless-searcher-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'endless-searcher',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_endless-searcher_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'in-your-absence-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'in-your-absence',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_in-your-absence_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'magic-sleazeball-corrida-2800-eur',
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
      name: 'BlackBox Records - Magic Sleazeball Corrida - Vinyl',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'magic-sleazeball-corrida',
    sourceKind: 'distro',
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'magic-sleazeball-corrida',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_magic-sleazeball-corrida_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'noise-without-decay-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'noise-without-decay',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_noise-without-decay_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'on-the-quiet-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'on-the-quiet',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_on-the-quiet_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'primal-ephemeral-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'primal-ephemeral',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_primal-ephemeral_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2000,
      currencyCode: 'EUR',
      revision: 'rehearsal-room-tee-2000-eur',
    },
    productProjection: {
      description:
        'A BlackBox Studio shirt for keeping the collective visible beyond the rehearsal room and record table.',
      imageUrls: [
        'https://blackbox-studio-athens.github.io/blackbox-records/admin/media/distro/485959560_1089455589866031_1642364305898457824_n.jpg',
      ],
      metadata: {
        sourceId: 'rehearsal-room-tee',
        sourceKind: 'distro',
        storeItemSlug: 'rehearsal-room-tee',
        variantId: 'variant_rehearsal-room-tee_standard',
      },
      name: 'BlackBox Records - BlackBox Studio T-Shirt - T-Shirt',
      taxCode: 'txcd_99999999',
    },
    sourceId: 'rehearsal-room-tee',
    sourceKind: 'distro',
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'rehearsal-room-tee',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_rehearsal-room-tee_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'rise-of-the-black-fang-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'rise-of-the-black-fang',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_rise-of-the-black-fang_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'rite-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'rite',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_rite_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'selenopolis-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'selenopolis',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_selenopolis_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'spinners-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'spinners',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_spinners_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'steelwitch-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'steelwitch',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_steelwitch_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'the-chemical-bath-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'the-chemical-bath',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_the-chemical-bath_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'the-feathers-of-oblivion-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'the-feathers-of-oblivion',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_the-feathers-of-oblivion_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'the-last-second-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'the-last-second',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_the-last-second_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'transatlantic-transiberian-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'transatlantic-transiberian',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_transatlantic-transiberian_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'unkraut-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'unkraut',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_unkraut_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'voyage-voyage-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'voyage-voyage',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_voyage-voyage_standard',
  },
  {
    availability: 'published',
    desiredPrice: {
      amountMinor: 2800,
      currencyCode: 'EUR',
      revision: 'wreckquiem-2800-eur',
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
    stockInitialization: {
      initialOnlineQuantity: null,
    },
    storeItemSlug: 'wreckquiem',
    targetEnvironments: ['sandbox'],
    variantId: 'variant_wreckquiem_standard',
  },
];

export const currentDesiredCatalogState: DesiredCatalogState = {
  revision: 'desired-catalog-0734b631',
  entries: currentDesiredCatalogEntries,
};

export function createCurrentDesiredCatalogEntriesForEnvironment(
  environment: DesiredCatalogEnvironment,
): DesiredCatalogEntry[] {
  return currentDesiredCatalogEntries.filter((entry) => entry.targetEnvironments.includes(environment));
}

export function createCurrentDesiredPriceMap(environment: DesiredCatalogEnvironment): Map<string, DesiredPrice> {
  return new Map(
    createCurrentDesiredCatalogEntriesForEnvironment(environment).flatMap((entry) =>
      entry.desiredPrice ? [[entry.variantId, entry.desiredPrice] as const] : [],
    ),
  );
}

export function findCurrentDesiredCatalogEntry(variantId: string): DesiredCatalogEntry | null {
  return currentDesiredCatalogEntries.find((entry) => entry.variantId === variantId) ?? null;
}
