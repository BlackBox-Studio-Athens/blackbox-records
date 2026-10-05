# Design

## Context

See `proposal.md` for motivation. The user approved implementation on October 5 and required the visual direction introduced by the pre-order epic, without a broader redesign. Automatic presentation changes and pragmatic wording for four releases remain requirements. Their subsequent instruction requires illegal state combinations to be unrepresentable where that improves readability and maintainability. Their exact messages were forwarded to the parent chat.

Graphify's broad query was truncated. Targeted `explain` results and a direct path resolved the relevant page, release selection and commerce-link relationships before CodeGraph returned current source. `selectReleasePageEntries` selects the newest dated released entry; `ReleaseStoreLink` independently reads the preorder listing projection. Remaining `ReleaseCard` entries have listening and detail navigation but no commerce action. The commerce projection's `stocked` classification includes buyable preorder allocations, so it cannot by itself mean copies are physically in hand. A ready offer's preorder payload distinguishes that case.

The retained Local catalog has three releases: Disintegration, Anarchotribal and Caregivers. Parent-owned bounded public PRD reads on October 5 confirmed all four releases, LOTUS's canonical native edition and all four current offers. LOTUS and Disintegration have open month-estimate preorders; Caregivers and Anarchotribal have confirmed ordinary buying offers. Anarchotribal's current offer contradicts the future-vinyl review case, so runtime presents the actual offer until Staff corrects the facts. Public reads do not establish accepted CMS revision identities or authorize content publication.

## Goals / Non-Goals

**Goals:** Derive physical presentation changes automatically; give the label a small explicit choice of emphasis; distinguish vinyl fulfilment from digital availability; keep a buying path for older stocked records; preserve the current layout, artwork, detail content, shell navigation and player continuity.

**Non-Goals:** Algorithmic heat scores, countdowns, invented scarcity, automatic campaign ageing, a state-machine framework, a scheduler, duplicated stored commerce state, a new commerce service, cross-format catalog restructuring, or PRD publication/deployment in this phase.

## Decisions

### Label choice determines campaign emphasis

Use one optional positive integer `releases_priority` on a Release, exposed as a simple editorial field through the normal private draft and Content Publication flow. Lower numbers lead among currently buyable physical records. Unranked eligible records follow open-preorder then available-offer order; ties use the current catalog order. The first two eligible records occupy the existing principal region. If an offer becomes unavailable, the next eligible record fills its place automatically. The field contains no stock, price, provider ID or shipping state.

The proposed initial assignments are Sidus priority 1 and Afterwise 2; applying them to live content requires the accepted catalog identity and normal publication authorization. Default remainder ordering is other open preorders, stocked physical records, announced physical editions without an open offer, then other editorial catalog entries. The label can explicitly lead with an older stocked record. Digital dates never confer campaign priority.

A single manual ordering choice is preferable to separate hot/upcoming/latest flags, a weighted score, or an automatic time window: the user's reason for leading with Sidus is marketing intent, which dates cannot infer. The current order selection is date-only; do not change its shared helper globally without checking Store and artist callers.

### Physical facts come from the existing commerce owner

Join accepted Release identity to its canonical physical Store Item and reuse the existing public listing-price projection. `presentationState: ready` plus buyable availability and a preorder payload yields `Vinyl preorder`. The equivalent confirmed offer without a preorder payload yields `Vinyl available` and `Buy vinyl`. Avoid treating the projection's `stocked` flag or an elapsed exact date as independent proof that copies arrived. The authoritative offer is checked at the existing buying step. Unknown, paused, sold-out or missing offers never produce an asserted buyable state or fabricated price.

Use `Pre-order vinyl` for an open vinyl preorder and `Buy vinyl` for a confirmed buyable regular offer. These are links to the existing edition page in the initial implementation proposal; the item page retains Add to Cart, options and checkout authority. Reusing this path avoids adding cart mutations or duplicating variant selection on Releases. Listen remains independent. Shipping estimates come only from the commerce payload.

The existing commerce owner already distinguishes a month estimate from an exact date. `isPreorderOpen` and `deriveShopperPreorder` automatically close an exact-date preorder on that date. A month estimate stays open until Staff ends it; after the month passes, its stale estimate is withheld while preorder remains open. Staff's existing `Copies arrived` action ends preorder immediately and asks Staff to count the actual copies. Reuse these rules unchanged. Releases updates from the resulting public offer rather than adding its own clock, arrival flag or stored lifecycle.

### Preserve the current composition for the small catalog

Keep the current Catalog/Releases identity, dominant artwork-and-copy split, compact supporting column, continuous rules and square lower catalog cards. Sidus leads; Afterwise occupies the supporting position in the same principal region with a complete purchase path. Replace chronological role badges with truthful record states. Do not add `Featured records`, a campaign banner, filters or separate single-record storefront sections. Use the existing `Our releases` heading for all remaining cards, ordered by physical state, with Chronoboros's buying path visible and Ouranopithecus's digital/future-vinyl distinction clear. Each release appears once. Purchase actions lead the action group; Listen and release-detail navigation remain clear and separate.

The earlier Campaign wall and Label bulletin comparison is superseded by the user's preference for the current design. The revised review shows one current-layout wireframe with physical-state scenarios. The original screenshot stays as a native image reference rather than inventing new artwork or prices. Existing Veneer is reused in the wireframe. Internal ordering roles do not require extra shopper-facing section labels.

The Design Library's `PW` Cosmos Public Work record supports artwork-led hierarchy and quiet controls as historical design observations, not measured usability or a grant to reuse images. Actual merchandising precedents below come from the labels' own sites.

### Derive state and placement instead of storing a second lifecycle

A small presentation table over accepted editorial timing and the existing commerce response is enough. Recompute on the normal offer read or refresh. Invalid or stale responses use the neutral fallback; do not continue a previous positive purchase claim after a failed current read. Opening, closing, selling out and restocking need no separate Releases-page edit. Editorial emphasis remains an optional label decision.

The local input type distinguishes native physical editions, announced physical formats and editorial-only records. The presentation is a discriminated union: only the preorder state carries a preorder payload and preorder action; ordinary availability carries a buying action; unavailable and unknown states carry neutral detail actions. There is no independent buyable boolean that could contradict the state. Digital timing remains a separate valid axis, including digital-out music with a physical preorder. Ready-price plus sold-out remains a lawful commerce response and maps to the unavailable presentation. Existing exact-date and Copies arrived transitions remain with their commerce owner.

Cached shell pages must be neutral before insertion, including when their previous offer was buyable. The existing snapshot sanitizer applies the shared neutral presentation to the inert clone and retains live cards and cached geometry. A fresh offer read restores current actions; rejected reads keep neutral detail access. The shared shell dependency must remain small enough for the existing eager bundle budget; positive offer handling belongs to the live Releases connector.

| Source condition                                               | Automatic shopper presentation                                  | Placement                                                                      |
| -------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Confirmed buyable offer with open preorder                     | Vinyl preorder; Pre-order vinyl; current estimate if supplied   | Eligible for principal region; otherwise before regular offers in Our releases |
| Staff presses Copies arrived and the offer remains buyable     | Vinyl available; Buy vinyl; remove preorder estimate            | Retain chosen emphasis while eligible                                          |
| Confirmed exact ship date is reached and offer remains buyable | Commerce ends preorder; Vinyl available; Buy vinyl              | Retain chosen emphasis; do not claim verified receipt from the date alone      |
| Estimated month passes                                         | Keep Pre-order vinyl; withhold stale estimate                   | Keep preorder placement until Staff updates the actual facts                   |
| Accepted confirmed digital release date is reached             | Digital out now                                                 | Do not change physical state or campaign order; do not publish drafts          |
| Announced vinyl gains a confirmed open offer                   | Replace Vinyl coming later with derived buying state and action | Recompute eligibility and remaining-card order automatically                   |
| Offer sells out or is paused                                   | Truthful unavailable state; retain View release and Listen      | Next eligible record fills its principal position automatically                |
| Offer is unconfirmed or cannot be read                         | Neutral detail access; no stock, price or preorder claim        | No buyable principal placement                                                 |
| Stock is replenished and current offer is buyable again        | Restore derived preorder or regular buying action               | Recompute placement using the retained editorial preference                    |

Factual stock receipt, changed manufacturing estimates and deliberate campaign emphasis still require the existing responsible Staff action. The storefront responds automatically to those facts. No automatic release age or campaign-expiry policy was requested.

## October 5 interaction and status refinement

The user accepted the BUY VINYL action and the automatic physical-first algorithm, then requested precise click boundaries, subtle purchase hover feedback on Releases and Store, and better status labels based on the older compact uppercase label. This is a polish pass within the approved composition, not a new merchandising design.

| Surface                                                     | Interaction                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Release artwork and title                                   | Native release-detail navigation; artwork is a pointer link and the visibly linked title is the keyboard detail target   |
| Artist credit                                               | Independent native artist-detail navigation when a profile exists                                                        |
| Buy vinyl / Pre-order vinyl                                 | Existing canonical edition link and authoritative purchase path                                                          |
| Listen                                                      | Existing shell-player control, with its active-session behavior preserved                                                |
| Release detail access                                       | Visible title link; omit the duplicate detail CTA from the principal action row, retaining the artwork caption if useful |
| Summary, date, formats, status labels and unused card space | Selectable inert content, without a stretched link or unrelated hover feedback                                           |

Purchase hover remains square and tonal, with visible keyboard focus and pressed feedback. Only enabled ordinary Buy controls receive the shared purchase hook; loading/disabled controls remain inert, and preorder retains its existing sea-green treatment. No JavaScript motion or layout movement is needed.

Status labels return to compact mono uppercase type, deliberate spacing and restrained neutral surfaces. Digital and physical meanings remain separate; neutral labels should not look like filter buttons. Preorder uses the existing sea green and keeps `Pre-order · ships around October 2026` together as a readable message that can wrap at small widths. Do not restore `Latest out now` as a chronology claim for an editorially chosen lead. Dates sit apart from the status group. Long lead titles must fit or wrap naturally without an orphan final letter.

The user explicitly requested a visible Local preorder example. Use Disintegration's existing Staff preorder control with an October 2026 month estimate, leaving its price and counted quantities unchanged; retain other stocked records so both purchase states are visible together. No new release, hosted write, CMS draft or publication is required.

## Primary research

Observed October 5, 2026. These findings establish presentation patterns, not sales uplift or private selection algorithms.

- [Pelagic homepage](https://pelagic-records.com/) presents Upcoming Releases & Pre-orders with physical formats and purchase paths before wider shop additions. [Rosetta's edition page](https://pelagic-records.com/product/rosetta-temporal-lapse-2lp-gatefold/) explicitly names a November 27, 2026 preorder date and explains combined-order dispatch. Application: sell the active physical campaign and state the wait beside the action.
- [Neurot's Great Falls announcement](https://www.neurotrecordings.com/news/great-falls-seattle-sludgehardcore-trio-to-release-the-bite-that-grows-up-lp-october-16th-nicotine-in-the-spine-and-preorders-posted), published September 3, 2026, pairs a preview track and live preorder links for an October 16, 2026 release in specified formats. [Its homepage](https://www.neurotrecordings.com/) separates release identities from campaign news. Application: listening supports the campaign without determining physical stock.
- [Denovali's preorder category](https://denovali.com/store/denovali-preorder) sits beside Releases in store navigation. Individual products were not exposed by the fetched page, so indexed snippets were not used to assert stock or downloads. Application: name preorder as a distinct physical shopping state.
- Stripe Directory was consulted first with two focused queries. It returned generic checkout/provisioning providers rather than comparable labels; no result was provisioned or purchased. The installed Directory plugin was updated from 0.3.4 to 0.3.5 as its setup instruction required.

## Risks / Trade-offs

- Missing LOTUS in Local retained content → Verify the correct accepted release and canonical physical offer before assigning its priority. Do not manufacture a fixture or publish a draft to satisfy the mockup.
- Editorial date mistaken for physical readiness → Keep digital and vinyl copy separate; derive physical facts from offers and test the mixed-state cases.
- Projection unknown or stale → Use neutral fallback links; revalidate at the existing authoritative purchase path. Do not promise a specific price or shipment from editorial metadata.
- Shared release helper changes Store/artist ordering → Keep the new merchandising selection local to Releases and check named callers before implementation.
- Native Canvas creation is not exposed → Deliver an editable text Page with a sandboxed interactive visual and the source screenshot. Do not describe it as a native Canvas document.
- Browser evidence unavailable → Chrome extension initialized and read the current catalog, then failed on CDP navigation/state reads; DevTools fallback failed because its profile was already in use. Saved Page/HTML checks do not establish visual browser acceptance.

## Migration Plan

The user approved the revised current-layout behavior and runtime ownership was coordinated with parent chat `01a109d2-8fcc-7433-963b-fefa41bfe655`. Add the optional editorial field through the existing publication path, implement Releases-specific derived selection and presentation, then run focused tests, shell/player continuity checks and parent-owned final validation. Initial live priority assignment, factual Anarchotribal changes, Content Publication and Software Release require their separate existing gates. Rollback removes the optional priority presentation and restores the previous Releases view without changing stock or order authority.
