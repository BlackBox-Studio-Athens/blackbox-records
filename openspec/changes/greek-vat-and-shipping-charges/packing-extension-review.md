# Packing assignment review, 9 October 2026

**Historical review, superseded later on 9 October:** final release authority applies the shared existing assumed profile to every validated PRD variant and charges one order fee: €3 for 1–4 validated cart units, €6 for 5–8 or €10 for 9 or more. Actual parcel selection/count is manual; the old nineteen-unit single-parcel ceiling does not cap new agreements. Stock/cart/configuration guards and historical agreements remain. Measurements stay Unknown; new release/hosted proof is pending. The researched two/six-unit multiple-parcel algorithm is discarded as the desired implementation. Old named-candidate findings are history, not new approval gates.

The closed PRD migration's current reviewed 99-row manifest is the catalogue source for this offline review: `.codex-artifacts/catalog-migration/prd-account-manifest-v2-20261009-current.json`, reviewed hash `32c957fe114321a6ff2381a5c952a161625218a329b7e5fb69d16bfba89d7a2a`. This is reuse of accepted migration evidence, not a fresh hosted read. The current runtime packing source still assigns only Disintegration Black Vinyl LP and Barren Point.

## Findings

The manifest contains 54 `Vinyl 12-inch`, one `Black Vinyl LP`, one `Vinyl 10-inch`, two `Vinyl 7-inch`, 38 CDs and three tapes. Of those 99 options, two have the explicit owner-authorised assumed protected-LP assignment and 97 remain unassigned. The manifest's item types and presentation describe catalogue format, not protected parcel thickness/weight. Its metadata contains no usable packing dimensions, weights or capacity provenance.

Known counterexamples rule out a generic vinyl fallback: Depressionland and The Feathers of Oblivion are described as double LP/double vinyl; A single flower is a gatefold double LP. Russian Circles Live at dunk!fest 2016, Selenopolis and Veuel describe gatefold packaging. Agia Monaxia Analekta has handmade recycled-paper/sandpaper CD packaging. Neither a 180-gram pressing nor a 12-inch format states the complete protected unit's weight/thickness. The smaller record formats do not establish disc count or protected packaging either.

No additional presentation explicitly establishes a **single** LP rather than an unspecified vinyl/LP edition. The obstacle is exact edition/count/packaging identity, not the absence of measurements: once an ordinary single LP is established, the already authorised assumed geometry and weight can be reused with honest provenance. Actual measurements remain Unknown; no new carrier limits or multiplied double-LP approximation are invented. The synthetic CD fixture remains a test fixture. This changes no packing map, stock, price, rate or checkout control.

## Smallest useful extension

The existing map already accepts a named additional variant with the same assumed profile, so a general packing engine or schema change is unnecessary. Before adding one, establish that the exact sellable edition is a single protected unit suitable for the same explicitly assumed 315 × 315 × 8 mm / 220 g profile, and record acceptance of that assumption for the named variant. A format label alone cannot establish this.

These named candidates have relevant LP/12-inch wording and no explicit double/gatefold claim in the reviewed presentation, but **are not established fits**:

| Variant                                                   | Existing presentation fact                   | Remaining fit input                                         |
| --------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `variant_allochiria-throes-vinyl_standard`                | Issued on 12-inch vinyl                      | Exact disc count and protected-pack suitability             |
| `variant_big-fish_standard`                               | Numbered 12-inch vinyl, screen-printed cover | Exact disc count and protected-cover suitability            |
| `variant_kokomo-whip-vinyl_standard`                      | Issued on 12-inch vinyl                      | Exact disc count and protected-pack suitability             |
| `variant_living-under-drones-knot-on-knot-vinyl_standard` | Described as an LP                           | Exact physical edition/count and protected-pack suitability |
| `variant_spinners_standard`                               | Described as an LP                           | Exact physical edition/count and protected-pack suitability |

A prepared implementation, once those named facts/assumptions are accepted, is: add only the accepted variant IDs to `assumedItems`; retain dated assumed provenance; exercise single-unit and mixed existing/new-variant quotes, Small/Medium boundaries, oversized/unassigned rejection and Session parity with the existing focused tests; refresh Graphify; record acceptance. Do not enable a type-wide fallback or revise postage.

The two already supported options can proceed through their own technical/publication/launch gates. Selling those options does not require packing support for all 97 others. The existing nine-per-line input constraint and complete-cart physical limits are technical safeguards, not a new cohort, order-count or end-date restriction. Checkout and the apex remain closed until separately accepted.
