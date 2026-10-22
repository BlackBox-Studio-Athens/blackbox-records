# Tasks

Tags: `[Claude]` owns UI/performance implementation and UI tests; `[SOL A]` and `[SOL B]` own the non-UI lanes below; `[Coordinator]` owns review and acceptance; `[Owner]` needs owner facts or provider access. The October 22 extension preserves visible appearance and copy. Historical completed tasks remain source-bound history, not acceptance of new edits.

## 1. Before switch day: sitemap and exclusions

- [x] 1.1 [Claude or Codex] Add every Store Item path to `sitemap.xml.ts` from `listStoreItems()`; extend `_sitemap-output.test.ts`.
- [x] 1.2 [Claude or Codex] Check whether the accepted snapshot has a reliable per-entry change time; add `lastmod` only if it does, otherwise record why it is omitted.
  - Omitted: snapshot records carry `collection`, `id`, `revisionId`, `slug` and `data` only, with no change time.
- [x] 1.3 [Claude or Codex] Mark `/store/checkout/` `noindex`; add `X-Robots-Tag: noindex` for `/app-shell-overlay/*` in `_headers` within the static cache-policy limits.
  - The cart return page is also `noindex`. Hosted HTML comes from the renderer Worker, which `_headers` does not reach, so the overlay pages also set the header on their response.
- [x] 1.4 [Claude or Codex] Check the other non-content outputs (`preorder-showcase.json`, demo routes, legacy redirect pages, 404) and mark or exclude any that can be indexed.
  - 404 is now `noindex`, since a direct request for its document can return 200. JSON outputs are not indexed as pages; demo routes exist only under `astro dev` and are `noindex`; `/shop/` and `/distro/` redirect instantly with a canonical to their target; the holding page is already `noindex`.
- [x] 1.5 [Claude or Codex] Add a build-output check over the Local production fixture: every sitemap URL exists, is not `noindex` and is canonical to itself.
  - `apps/web/scripts/check-sitemap.ts` runs at the end of the web build (`pnpm sitemap:check`); a fresh build listed 121 URLs and passed.

## 2. Store Item `Product` data

- [x] 2.1 [Claude or Codex] Add a structured-data helper in `apps/web` for `Product` and `Offer`, with the availability mapping from the design; unit-test every state, including Coming soon and a failed read producing nothing.
  - `apps/web/src/platform/lib/structured-data.ts`. Every non-ready offer, sold out included, carries no price from the Worker, so it publishes nothing (see design).
- [x] 2.2 [Claude or Codex] Write the `Product` script from `StoreOfferPriceDisplay` after a successful offer read, replacing it if the offer changes; keep exactly one script per page and none on failure.
  - Only the Store Item page passes product facts. The helper loads lazily to keep the Store Item eager bundle within budget; `e2e/store-item-preorders.spec.ts` asserts one `PreOrder` `Product`.

## 3. Site and music entities

- [x] 3.1 [Claude or Codex] Add `WebSite` data to Home.
- [x] 3.2 [Claude or Codex] Add `MusicAlbum` data to release pages and `MusicGroup` data to artist pages through the same helper; unit-test with and without tracklist, artist and links.
  - Content has no release type field, so `albumReleaseType` is omitted.

- [x] 3.3 [Claude or Codex] Correct the MusicAlbum label relationship to nested MusicRelease, omit synthetic SKU from Product JSON-LD, and verify stock/pre-order/no-price rules with focused tests. All 12 affected test projects passed; see [validation.md](validation.md#structured-data-corrections--2026-10-13). The authorized correction release also passes both external validators for five genuine PRD URL cases; the sold-out case remains part of 5.2.

- [x] 3.4 [Claude or Codex] Add the Organization shipping/returns fallback from the published terms and shared delivery quantity bands, serialize it safely, and test exact policies and escaping. See [validation](validation.md#organization-policy-fallback--2026-10-13); hosted Home validators follow promotion.

## 4. Owner

- [x] 4.1 [Owner] After `add-site-analytics` 1.1, set Greece-only shipping and the 14-day return policy in Search Console's shipping and returns settings. If they are not offered, tell Claude or Codex to add them to the `Organization` data instead.
  - 2026-10-13: Search Console offered no Shipping and returns settings. The owner authorized the Organization fallback, implemented by task 3.4; no dashboard policy was changed. [Dashboard evidence](validation.md#owner-shipping-and-returns-dashboard-check--2026-10-13).
- [ ] 4.2 [Owner] Create a Google Business Profile for BlackBox Records with the site URL and the public Athens location details you choose to show.
- [ ] 4.3 [Owner] Point the website link on Bandcamp, Instagram, Facebook, Discogs and Spotify for Artists to the apex, and ask each label artist to link the label or their release page.
- [ ] 4.4 [Owner] Optional, after 5.2 passes: enable Merchant Center free listings from the site's structured data.
- [ ] 4.5 [Owner] Monthly from launch: check Search Console Pages, Product snippets and Merchant listings reports, and Core Web Vitals; send problems to Claude or Codex.

## 5. Acceptance

- [x] 5.1 [Claude or Codex] Run focused tests, strict OpenSpec validation and `pnpm validate`; record evidence.
  - [Validation note](validation.md).
- [ ] 5.2 [Claude or Codex] After promotion (on `pages.dev` before switch day, on the apex after): run Rich Results Test and Schema Markup Validator on one in-stock and one pre-order item, one sold-out item (expect no `Product` data), one release, one artist and Home; record results.
  - Correction release `1ea39f31` / run 566, promoted by PRD run 16: both validators passed the in-stock item, a genuine pre-order item, release, artist and Home. Schema.org reports 0 errors / 0 warnings for all five; Google's SKU warning is gone, with optional shipping/return-policy warnings remaining. The current listing has no sold-out item, so this task remains unchecked. See the [updated matrix and screenshots](validation.md#correction-release-and-external-validators--2026-10-13).

- [ ] 5.3 [Claude or Codex] After switch day, confirm in Search Console that the submitted sitemap's URL count matches the generated sitemap; archive this change.
  - 2026-10-22: GSC Success/122 discovered pages matches the 122-URL production crawl. The count comparison is evidenced in `.codex-artifacts/seo-20261022/gsc-observations.json`; archive remains pending unfinished implementation/provider acceptance.

## 6. October 22: canonical URLs and non-visual navigation metadata

- [x] 6.1 [SOL A] Normalize known document slash variants in gateway and canonical helper; preserve base/query handling and excluded route boundaries; add focused regression checks.
  - Final supported `pnpm validate` passed, including backend-tooling gateway tests. See [combined validation](validation-20261022.md).
- [x] 6.2 [SOL A] Synchronize route-owned social and entity head metadata through existing shell navigation; verify direct/navigation equivalence without changing UI behavior.
  - Snapshot-level regression checks pass. Real-browser final-tree acceptance remains in 9.2.

## 7. October 22: factual metadata, entities and content links

- [x] 7.1 [SOL B] Correct Organization country code and physical-offer availability date mapping; preserve truthful policy/price/stock behavior and test the regression.
- [x] 7.2 [SOL B] Make Home, About, News and Store/release metadata factual and distinctive using accepted content, artist and format facts; retain visible copy and H1s.
- [x] 7.3 [SOL B] Add stable entity references and factual Article/Breadcrumb data where supported; verify sameAs identity claims and do not invent missing facts.
- [x] 7.4 [SOL B] Correct or prepare the exact two old article anchor destinations through their authoritative content owner; preserve labels and image-source URLs; record publication dependency.
  - SOL B return/fingerprints and 99 platform/85 page passing tests are in `.codex-artifacts/seo-implementation-20261022/`. `news-anchor-corrections.json` prepares the two CMS destination-only edits; live correction remains pending Content Publication under 9.3.

## 8. October 22: appearance-preserving performance

- [x] 8.1 [Claude] Rebaseline current source and record the selected delivery outcome without new image transformation profiles.
  - The return records the owner's decision to close this slice as measured with no appearance-safe CSS delivery win; route splitting remains planning-only in `split-route-css`. The unstable baseline cannot establish a load improvement; none is claimed. Review did not approve the rejected footer technique as a delivery improvement.
- [ ] 8.2 [Claude] Reproduce navigation interaction and Store/footer layout-shift outliers; fix established causes with UI tests and player-continuity evidence, or document measured non-reproduction for coordinator review.
  - Card estimates implemented. Coordinator removed the rejected footer measurement reset under the user's explicit minimal-correction override and replaced its test with a direct Store-bottom session-window CLS regression. Menu event latency remains reproduced but unattributed/unfixed; route-stylesheet timing belongs to the separate CSS change. This broader performance task remains open.

## 9. October 22: integration and provider acceptance

- [x] 9.1 [Coordinator] Review both SOL returns and Claude return against exact source; run strict OpenSpec and final policy-permitted validation, update graphs once after the implementation batch, and record evidence.
  - Rejected footer suppression removed under the user's scoped override; supporting tests/measurement corrected. Supported validation and AST refresh passed; documentation-inclusive final receipt is linked in [validation](validation-20261022.md).
- [x] 9.2 [Coordinator] Verify local canonical/metadata/schema and direct/client-navigation behavior with the final tree; preserve noindex and visual/commerce/player acceptance.
  - Chromium: all 55 applicable cases pass, 13 platform skips; WebKit phone: 23 pass, 5 platform skips. Matched middle-card pixels, direct/client head equality, truthful preorder schema and purchase/player/navigation behavior verified. Canonical/exclusion source checks pass in supported validation. Hosted deployment/Google acceptance remains 9.3.
- [ ] 9.3 [Coordinator/Owner] After separately authorized software/content promotion, verify final HTTP responses, Google-rendered entities and corrected article links; leave future ranking/recrawl effects pending actual observation.
- [x] 9.4 [Coordinator/Owner] Account for owned-profile links, secondary-domain intent/access, Google eligibility, image quota and retired GitHub removal; prepare concrete required actions and do not claim provider-pending or owner-dependent work complete.
  - [Provider actions](provider-actions.md) records exact targets, current evidence and completion gates. This completes action accounting only: profile edits, business eligibility, DNS decisions, external outreach and search removal are not marked complete.
