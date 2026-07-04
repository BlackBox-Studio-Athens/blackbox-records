## Context

The distro catalog has three practical sources today:

- Astro distro content under `apps/web/src/content/distro/`
- generated Desired Catalog State and Stripe catalog artifacts
- an operator-maintained full distro table

This change defines the operator table as the primary planning source for future implementation. The table controls membership, item type, release date when provided, and pricing policy. Current site/catalog items not in the table are retained only when explicitly listed as current-site extras.

The current catalog reset workflow can archive UAT/test-mode Stripe objects, but cannot guarantee an empty Stripe Dashboard history. Stripe Price objects are normally made inactive/archived rather than deleted by API. Product deletion is only possible when Stripe accepts deletion for that Product. A truly empty history requires manual cleanup where allowed or a fresh Stripe test/live environment.

## Goals / Non-Goals

**Goals:**

- Define the full distro inventory contract for later implementation.
- Define exact pricing rules, including `ΕΣ` pay-what-you-want behavior and blank-price defaults.
- Define current-site extras to retain.
- Define content/artwork reconciliation rules using `tools/artwork-fetcher`.
- Define later fixed/custom price changes for generated catalog artifacts, public Store Offers, Stripe catalog sync, and hosted Checkout.
- Define safe UAT-first and PRD-later rollout rules.

**Non-Goals:**

- Do not edit distro JSON content in this planning change.
- Do not implement fixed/custom price code in this planning change.
- Do not generate catalog artifacts in this planning change.
- Do not run artwork fetches or copy image files in this planning change.
- Do not mutate Stripe, D1, Worker secrets, GitHub secrets, or provider environments in this planning change.
- Do not promise empty Stripe history inside an existing Stripe environment.

## Decisions

### Source-of-truth precedence

Future implementation MUST use this precedence:

1. Full distro table rows in this design.
2. Explicit current-site extras:
   - `S/T - Spinners`
   - `Three Way Plane - Wreckquiem`
3. Existing Astro content only as a source for current images, summaries, corrected casing, and aliases after row identity is matched.

Existing site entries that are absent from the table and not listed as extras MUST be removed from the current generated distro catalog and checkout eligibility by later implementation. The implementation MAY keep an editorial/source file only if it no longer renders as a current distro Store Item and cannot be selected for checkout.

### Identity and alias policy

The implementation MUST match rows by normalized artist/title identity before creating new content. It MUST preserve current corrected display values when a current content entry clearly represents the same item, while recording the source-table spelling as an alias or source note in the implementation evidence.

Known display/alias decisions:

- `Skinny Peachfuzz - Magic sleazball corrida` maps to existing `Magic Sleazeball Corrida`; display MUST keep `Sleazeball`.
- `Hay Stealthy - Hey Stealthy` maps to existing `Hey Stealthy - Hey Stealthy`; display MUST use `Hey Stealthy`.
- `Maha Sohona - Endless sercher` maps to existing `Endless Searcher`; display MUST keep `Searcher`.
- `Goodbye Kings - Transatlantic // Transiberian` maps to existing `Goodbye, Kings`; display MUST keep the comma.
- `Sadhus - The big fish` and existing `Sadhus, The Smoking Community - Big Fish` are the same vinyl item; do not create a duplicate vinyl Store Item.
- `One Leg Mary` and `One leg Mary` are the same artist for matching.
- `We.own.the.sky` MUST keep the dotted artist spelling unless implementation has an existing canonical display string for that content.
- `Calf - —` replaces the current placeholder `___.json` intent; it is a real item.

### Duplicate policy

The duplicate row `Living Under Drones - Knot On Knot?` MUST be preserved as rejected source evidence and ignored for current catalog output. Future implementation MUST keep exactly one `Living Under Drones - Knot On Knot` Store Item unless a later OpenSpec change defines variants.

Rejected source rows:

| Artist              | Title         | Type          | Source price | Release date | Resolution                               |
| ------------------- | ------------- | ------------- | ------------ | ------------ | ---------------------------------------- |
| Living Under Drones | Knot On Knot? | Vinyl 12-inch | blank        | 2021-11-30   | duplicate of `Knot On Knot`; do not emit |

### Price policy

Prices are EUR-only for this distro catalog slice.

- Numeric table prices become fixed prices in minor units.
- `ΕΣ` means pay-what-you-want.
- Blank prices use type defaults:
  - Vinyl 12-inch: `2000`
  - Vinyl 7-inch: `1500`
  - Vinyl 10-inch: `2000`
  - Tape: `500`
  - CD: `1000`
- Current-site extras use the same blank-price defaults.
- Pay-what-you-want Stripe Prices use:
  - minimum amount: `100`
  - preset amount: `500`
  - maximum amount: `10000`
  - currency: `EUR`

### Inventory source rows

| Artist                             | Title                                | Type          | Source price       | Resolved price policy | Release date        |
| ---------------------------------- | ------------------------------------ | ------------- | ------------------ | --------------------- | ------------------- |
| Skinny Peachfuzz                   | Magic sleazball corrida              | Vinyl 7-inch  | 15                 | fixed 1500 EUR        | 2023-12-27          |
| Zebu / Dead Elephant               | Eat Them Dead Or Alive/Crawl         | Vinyl 7-inch  | ΕΣ                 | pay-what-you-want     | 2017-10-06          |
| Mass Culture                       | Barren point                         | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2023-05-15          |
| Mass Culture                       | Primal \| Ephemeral                  | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2018-08-10          |
| Their Methlab                      | The last second                      | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2019-02-18          |
| Chronoboros                        | Caregivers                           | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2026-03-13          |
| Last Rizla                         | Noise without decay                  | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2023-05-12          |
| Sadhus                             | The big fish                         | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2018-11-15          |
| Killgrave                          | Rise of the black fang               | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2024-11-29          |
| Gun Fever                          | No easy Way                          | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2024-11-26          |
| Living Under Drones                | Knot On Knot                         | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2021-11-30          |
| Mammock                            | Itch                                 | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2020-01-01          |
| One Leg Mary                       | On the quiet                         | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2017-02-01          |
| Coyotes Arrow                      | Medicine                             | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Three Way plane                    | Your Kingdom, my life                | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Steelwitch                         | Steelwitch                           | Vinyl 12-inch | blank              | fixed 2000 EUR        | unknown             |
| We.own.the.sky                     | In your absence                      | Vinyl 12-inch | 25                 | fixed 2500 EUR        | unknown             |
| Unshaped Ahead                     | 8 Cantons                            | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| The You and what army faction      | RITE                                 | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Nothing Thrives                    | Tales of disgrace                    | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Zaperlipopette!                    | Voyage Voyage                        | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Bloed                              | Tranen                               | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Goodbye Kings                      | Transatlantic // Transiberian        | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Indoctrinate                       | aftermaths                           | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2015-10-13          |
| Demikhov                           | The Chemical Bath                    | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Hazarder                           | Against his story, Against leviathan | Vinyl 12-inch | 20                 | fixed 2000 EUR        | 2013-12-07          |
| Speck                              | Unkraut                              | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Olaf Olafsonn and the Big Bad Trip | The Feathers of Oblivion             | Vinyl 12-inch | 30                 | fixed 3000 EUR        | unknown             |
| Olaf Olafsonn and the Big Bad Trip | Selenopolis                          | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Pirate City                        | Fortunate Isles                      | Vinyl 12-inch | 15                 | fixed 1500 EUR        | unknown             |
| Pirate City                        | Πειρατεία                            | Vinyl 12-inch | 15                 | fixed 1500 EUR        | unknown             |
| Pirate City                        | Λωβή                                 | Vinyl 12-inch | 15                 | fixed 1500 EUR        | unknown             |
| We lost the Sea                    | Departure Songs                      | Vinyl 12-inch | 30                 | fixed 3000 EUR        | unknown             |
| We lost the Sea                    | A single flower                      | Vinyl 12-inch | 30                 | fixed 3000 EUR        | unknown             |
| We lost the Sea                    | Triumph & Disaster                   | Vinyl 12-inch | 30                 | fixed 3000 EUR        | unknown             |
| Bipolar Architecture               | Depressionland                       | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Onrust                             | Van Woede Tot Wanhoop                | Vinyl 12-inch | 30                 | fixed 3000 EUR        | unknown             |
| Devided                            | Light will shine                     | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| AFLMSMP                            | I went to the mountain               | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Turpentine Valley                  | Veuel                                | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Aufhebung                          | Luchtbegrafenis                      | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Kokomo                             | Whip                                 | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Huracan                            | 2025 EP                              | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Malämmar                           | Vendetta                             | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Malämmar                           | Mazza                                | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Maserati                           | Live at Dunk! Fest 2024              | Vinyl 12-inch | 25                 | fixed 2500 EUR        | unknown             |
| Ciśnienie                          | Angry Noises                         | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Russian Circles                    | Live at Dunk! Fest 2016              | Vinyl 12-inch | 30                 | fixed 3000 EUR        | unknown             |
| Pelican                            | Live at Dunk! Fest 2016              | Vinyl 12-inch | 30                 | fixed 3000 EUR        | unknown             |
| Allochiria                         | Throes                               | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Allochiria                         | Omonoia                              | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Allochiria                         | Commotion                            | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Maha Sohona                        | Endless sercher                      | Vinyl 12-inch | 20                 | fixed 2000 EUR        | unknown             |
| Calf                               | —                                    | Vinyl 10-inch | 20                 | fixed 2000 EUR        | 2019-09-22          |
| Band in the pit                    | 2016                                 | Tape          | ΕΣ                 | pay-what-you-want     | unknown             |
| Broken Fingers                     | Ego                                  | Tape          | 5                  | fixed 500 EUR         | unknown             |
| The Vagina lips                    | Random Tapes                         | Tape          | ΕΣ                 | pay-what-you-want     | unknown             |
| Magmarus                           | Cassette sessions                    | Tape          | ΕΣ                 | pay-what-you-want     | unknown             |
| Stefan Clor                        | Baltica                              | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Nausea Bomb                        | Slap punkabilly                      | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Granna's House                     | Kuro                                 | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Hay Stealthy                       | Hey Stealthy                         | CD            | ΕΣ                 | pay-what-you-want     | unknown             |
| Dirty ol' dogs                     | Dirty ol' dogs                       | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Dead Elephant                      | Heavy Huge and Rotten                | CD            | ΕΣ                 | pay-what-you-want     | unknown             |
| Dead Flag Blues                    | Traumatique                          | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Sadhus                             | The big fish                         | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Anima Triste                       | Alone                                | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Anima Triste                       | Anima Triste                         | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Anima Triste                       | Humanity                             | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Full Moon Bonzai                   | Reshaping the symbols                | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Salto Mortale                      | Ατελές το ον                         | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Ατοπια                             | Ατοπια                               | CD            | ΕΣ                 | pay-what-you-want     | unknown             |
| Frakhtal                           | plima                                | CD            | 10                 | fixed 1000 EUR        | unknown             |
| Millions of Dead tourists          | Υγειής                               | CD            | 10                 | fixed 1000 EUR        | 2023-03-23          |
| One leg Mary                       | I, a Seawolf, a Madman               | CD            | 10                 | fixed 1000 EUR        | 2014-12-27          |
| One leg Mary                       | On the quiet                         | CD            | 10                 | fixed 1000 EUR        | 2017-02-01          |
| Sun of Nothing                     | The guilt of feeling alive           | CD            | 10                 | fixed 1000 EUR        | unknown             |
| S/T                                | Spinners                             | Vinyl 12-inch | current-site extra | fixed 2000 EUR        | use current content |
| Three Way Plane                    | Wreckquiem                           | Vinyl 12-inch | current-site extra | fixed 2000 EUR        | use current content |

### Catalog model choice

Later implementation MUST introduce a repo-owned inventory/price manifest consumed by catalog artifact generation. It MUST NOT add Stripe IDs, price authority, `ΕΣ` flags, or promotion controls to Decap-authored distro JSON.

Alternative considered: put price fields directly in distro JSON. Rejected because existing project policy keeps Decap distro content editorial-only.

### Fixed/custom price shape

Later implementation MUST represent desired prices as a discriminated shape:

- fixed price: amount minor, currency, revision
- custom price: currency, minimum amount minor, preset amount minor, maximum amount minor, revision

Stripe catalog sync MUST map fixed prices to `unit_amount` Prices and pay-what-you-want prices to `custom_unit_amount` Prices. Checkout MUST continue sending a Stripe Price ID to hosted Checkout; Stripe should collect the custom amount for `ΕΣ` rows.

### Store Offer and snapshot impact

Store Offer public contracts and D1 snapshots currently assume fixed `amountMinor`. Later implementation MUST support browser-safe display of custom prices without exposing Stripe IDs or provider internals. Custom prices MUST be checkout-eligible when catalog, stock, and availability are otherwise ready.

### Artwork policy

Later implementation MUST use `tools/artwork-fetcher` for missing or uncertain distro artwork. It MAY reuse current repo images for already matched content. It MAY use generic fallback art only when the tooling marks artwork as known missing or a human records a verified missing-source decision.

Known existing artwork-fetcher facts:

- Nausea Bomb and Salto Mortale have verified prior tool outputs.
- The Vagina Lips has a known-missing artwork record in prior tool output.

### Rollout policy

UAT MUST be proved before PRD. Existing UAT/test Stripe objects MAY be manually cleaned by the operator before verification. If empty Dashboard history is required, use a fresh Stripe environment and update UAT secrets/configuration before applying catalog state.

PRD MUST NOT use a reset command. PRD provider mutation remains gated by explicit PRD-open approval. If empty live Dashboard history is required, use a fresh live Stripe environment before PRD promotion.

## Risks / Trade-offs

- Existing Stripe Dashboard cannot be made history-empty by automation alone -> document manual cleanup/fresh environment as the only hard-clean option.
- Pay-what-you-want changes touch catalog sync, Store Offer snapshots, public API, frontend display, and smoke expectations -> require a focused implementation slice before content rollout.
- Full table contains typos and aliases -> implementation must match existing entries before creating new slugs.
- Artwork lookup may not find all covers -> fallback allowed only with known-missing evidence.
- Current-site extras can drift if more old items exist later -> only `Spinners` and `Wreckquiem` are approved extras in this change.
