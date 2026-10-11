# web-store — received review

Reviewer thread: `01a12592-5a19-7743-8825-0cbe625812b8`. Reviewer turn: `01a125fd-fa72-77a2-923b-8397d7c23232`.

Immutable source: `.codex-artifacts/simplification/12-web-store-review-refresh-01.result.json`, raw SHA-256 `b53420e5c5ae40b9ea9b8aa912ad3bfacb876f5f0bd7df873d01cb66d8c92fbd`. The complete received report follows. Historical review conclusions are preserved; current implementation decisions live in `../implementations/web-store.md`.

**Module 12/29 — web-store: complete current read-only review**

The review is complete for the source snapshot captured at **2026-10-10 14:11:05 UTC / 17:11:05 local**. Every current owned file is covered by either unchanged prior inspection or inspection of its new/changed contents. All observed concurrent changes were preserved. No repository, source, test, report, OpenSpec, task-record, generated or graph files were written, and no tests, validation commands or provider operations were run.

**Crate belongs to web-store. It is not a new closed module.** The complete current project-file inventory under `apps/web/src/components/store` contains only the root `web-store` project and the nested `cart` and `checkout` projects. There is no `crate/project.json`. Consequently, all ten crate files, including their tests and CSS, are owned by this review.

The [current root project.json](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/project.json:24) remains closed. Its eleven exported entrypoints now include `StoreCrate.astro` in place of `StoreCoverflowControls.astro`. Its allowed dependencies remain `player`, `store-cart`, `checkout-web`, `storefront-catalog`, `ui-foundation` and `web-platform`; its workspace interfaces remain API-client `./public` and content-model `.`. The current collection layout consumes the exported wrapper; crate implementation files remain internal. The intermediate external deep-import concern observed during the refactor is resolved.

The [immutable original full report](C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/simplification/12-web-store-review.result.json) supplies unchanged detailed inspection evidence. It was preserved byte-for-byte, with SHA-256 `ed6eb2f47855362142bd7b6aeb27d6b6a7aad1ff85256e724f633d42f7083d8b`. The findings and dispositions below replace its earlier current-tree conclusions.

**Current source identity and scope**

| Evidence                                          | Identity                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| Checkout                                          | Existing checkout, branch `main`                                   |
| Current HEAD                                      | `54844bd258e2054beee5e951b9b597e13fab50db`                         |
| Original review HEAD                              | `3355c335226838f996efb5536f55271f819a3e14`                         |
| Original 35-file owned fingerprint                | `046eec4aef5c8044b908813c44a23c80bff864ea1bdc5ffc719d7713fbede1d1` |
| Current 43-file owned fingerprint                 | `1d8989965d02436033b2cdf4fcd75da53a10af7cef1fc1487edf0b40bd5ec823` |
| Current 35-file connected-source/test fingerprint | `1d31b5007f7dd0881247f8c7561ede65fc491933c52cb86f43a0fb8d1d435027` |
| Root project.json SHA-256                         | `ad274f34345f92c7e36126237657143e4f1d6fa9b254d3f5d922da3193883c34` |

Each aggregate hashes UTF-8 records of `<normalized repository path> <lowercase file SHA-256>`, ordered using PowerShell `Sort-Object`, joined with LF and no trailing LF. It includes the on-disk contents, including concurrent uncommitted changes; HEAD alone is insufficient to reproduce this review.

The final owned inventory is **43 files: 23 production text files / 5,512 lines; nine tests / 2,801 lines; ten SVG assets / 267 lines; and project.json / 47 lines**. Total: 8,627 lines. Ownership excludes the complete nested `cart/` and `checkout/` roots. No additional nested project or generated implementation source was found in the owned inventory.

All names below are relative to `apps/web/src/components/store/`:

- Root production files: `preorder-showcase-schema.ts`, `store-artist-options.ts`, `store-chrome.css`, `store-image-gallery.css`, `store-page-data.ts`, `StoreBrowsePane.astro`, `StoreBuyIcon.tsx`, `StoreCategoryNavigation.astro`, `StoreCrate.astro`, `StoreDistroCatalog.astro`, `StoreDistroSearch.tsx`, `StoreImageGallery.tsx`, `StoreItemCard.astro`, `StoreListingPricePresentation.ts`, `StoreOfferPriceDisplay.tsx`, `StorePreorderShowcase.tsx`.
- Root tests: `store-page-data.test.ts`, `StoreDistroSearch.test.ts`, `StoreImageGallery.test.tsx`, `StoreListingPricePresentation.test.ts`, `StoreOfferPriceDisplay.test.tsx`, `StorePreorderShowcase.test.tsx`.
- Crate production files, thoroughly inspected: `crate/crate-bins.ts` (39 lines), `crate/crate-input.ts` (237), `crate/crate-model.ts` (426), `crate/crate-pose.ts` (248), `crate/crate-switch.ts` (87), `crate/crate-view.ts` (1,285), `crate/crate.css` (484).
- Crate tests, thoroughly inspected: `crate/crate-input.test.ts` (186), `crate/crate-model.test.ts` (267), `crate/crate-pose.test.ts` (130).
- SVG assets: `buy-icons/cassette-base.svg`, `cassette-spin-left.svg`, `cassette-spin-right.svg`, `cassette-top.svg`, `cd-base.svg`, `cd-spin.svg`, `cd-top.svg`, `vinyl-base.svg`, `vinyl-spin.svg`, `vinyl-top.svg`.
- Boundary metadata: `project.json`.

Relative to the original review, three owned files were removed by the concurrent task, eleven current files were added, eight surviving baseline files changed, and 24 surviving baseline files remained unchanged. The changed baseline files are project.json, store-chrome.css, StoreDistroCatalog, StoreDistroSearch, StoreItemCard, StoreListingPricePresentation and its test, and StorePreorderShowcase. Their changed contents were inspected; unchanged prior portions were reused. Intermediate controls and source revisions inspected during development are not counted as current files.

**Numbered findings and current dispositions**

1. **Original Coverflow bookkeeping finding — superseded; no remaining action or credited reduction.**

   The original recommendation concerning `setFocusedGroup` and `lastActiveIndex` no longer applies. The current inventory and exact caller search confirm that `StoreCoverflowController.ts`, its owned test, and `StoreCoverflowControls.astro` were removed by the concurrent refactor. Do not recreate their API, restore their tests, or independently apply their old cleanup. Their retirement contributes **zero additional production/test reduction** to this review.

2. **Retain: reuse the existing identical cart-seed type declaration.**

   [store-page-data.ts:11](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/store-page-data.ts:11), lines 11–17, declares the same property types as the exported `StoreItemCartSeed` in [StoreItemPurchaseActions.tsx:20](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/checkout/StoreItemPurchaseActions.tsx:20), lines 20–26. That checkout entrypoint is an allowed dependency and is already consumed by owned StoreListingPricePresentation.

   Replace only the duplicate declaration with a type-only import and `export type StorePagePricedCartSeed = StoreItemCartSeed`. Preserve the exported name and retain the `CartLineItemSnapshot` import used elsewhere. Seed creation, thumbnail caching, nullable results and runtime serialization remain unchanged.

   Current caller proof includes listing-card serialization at StoreItemCard lines 126–137, item-detail seed construction and purchase-action props, and the purchase action's authoritative offer refresh. Keep the priceless-static-data, seed-field and thumbnail/promise-deduplication regressions in store-page-data.test.ts, including lines 249–338.

   Focused verification: web-store module/type checks and store-page-data tests; retain checkout integration evidence that the Worker supplies current offer authority. Expected net reduction: **about five production lines; zero test lines**.

3. **Retain: remove unused partial-mock overrides and assertions already implied by a null result.**

   [store-page-data.test.ts:32](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/store-page-data.test.ts:32), lines 32–41, overrides `hasStructuredItemPrice` and `isPricedItemAvailability`. Current store-page-data calls `createStoreItemAvailability`; its real implementation in lib/item-availability.ts does not call those mocked exports. Exact source/caller inspection establishes that these overrides add no behavior to this suite.

   Remove those two overrides. Retain `importOriginal`, the actual-module spread, the primary price-lookup spy and its assertions. Also remove the four JSON-content assertions at lines 212–215: line 211 has already established that the result is literally null, so those serialization checks add no independent regression coverage.

   Keep both null-producing scenarios, known-slug/path behavior, seed-field assertions, thumbnail output and image-call deduplication. Focused verification: store-page-data.test.ts, with the meaningful retained assertions unchanged. Expected reduction: **zero production lines; about fourteen test lines**.

4. **Original selected-artist membership option — still source-backed, deferred from the removal batch.**

   [store-artist-options.ts:21](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/store-artist-options.ts:21), lines 21–25, builds the selected labels and repeatedly uses `ticked.includes` while partitioning the same sorted label list. A Set built from those selected labels can provide membership checks; existing size checks at lines 45, 47 and 49 would use `.size`. Preserve the current insertion/iteration order and DOM moves.

   StoreDistroSearch still calls this helper at line 355. Current phone and desktop artist-filter browser cases retain meaningful coverage for selection, combined filtering and ordering.

   This changes membership work from repeated array scans to Set lookups, but provides **no expected net line reduction and no measured latency evidence**. It remains an optional bounded performance change, not part of the suggested deletion batch. Production/test reduction: **approximately zero / zero**.

5. **Original repeated gallery parsing option — still source-backed, deferred from the removal batch.**

   [StoreImageGallery.tsx:28](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/StoreImageGallery.tsx:28), lines 28–33, computes the thumbnail source. The thumbnail map at lines 159–181 calls that same pure helper separately for `src` and `srcSet` at lines 171–172.

   Computing its result once inside the existing map callback would preserve the current outputs and avoid a second parse per thumbnail. Retain thumbnail candidate selection, full-image sources, button order, alt/ARIA attributes, loading/fetch priorities and swipe behavior. Owned gallery tests and the current item-detail gallery contract test remain valuable.

   The smaller amount of parsing is proven by the call sites; a user-visible performance improvement has not been measured. This likely **adds about three production lines and removes no test lines**, so it is deferred from the deletion-focused batch.

6. **New: remove one subsumed crate-input assertion.**

   [crate-input.test.ts:96](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/crate/crate-input.test.ts:96) asserts the complete emitted type sequence `['tip', 'letGo']`. The immediately following assertion at line 97 checks only that the second emitted object has `type: 'letGo'`.

   The input implementation emits ordinary intent object literals, and no intervening mutation occurs. The complete sequence assertion already proves the second object's type. Delete only line 97; retain the test and its sequence assertion.

   Keep the distinct drag/drop, jitter, button, rack-axis, spine, wheel and keyboard cases. Focused verification: crate-input.test.ts. Expected reduction: **zero production lines; one test line**.

7. **New: remove the duplicate transition argument from the private DOM writer.**

   [crate-view.ts:629](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/crate/crate-view.ts:629) accepts both `next: Written` and a separate `transition` string. Both private calls in renderBin supply the identical local value in `next.transition` and again as the positional argument: object fields at lines 713/736 and duplicate arguments at lines 721/744.

   Remove the separate parameter and both duplicate argument lines. At line 632 compare and assign `next.transition` directly. The same string is then written under the same cached comparison. Both current call sites were inspected; there is no external/public caller of this closure-local function.

   Retain `Written.transition`, the cache, the separate numeric opacity and shade transition, tape-face writes, visibility, z-order, pointer events, shade layers, ARIA labels, behind state, image loading and will-change behavior. No helper, abstraction or interface change is needed.

   Focused verification: current model/input/pose suites and the crate browser suite, especially flips, board/end state, Grid round trips and reduced motion. There is no dedicated owned DOM-writer unit suite; do not claim the pure pose tests alone prove DOM rendering. Expected reduction: **two production lines; zero test lines**.

8. **New: use the existing animation-cancellation helper in destroy.**

   [crate-view.ts:1122](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/store/crate/crate-view.ts:1122), lines 1122–1125, defines `land()` as exactly two operations: cancel each flying animation, then replace `flying` with an empty array. Destroy repeats those same operations at lines 1271–1272.

   Replace just those two destroy statements with `land()` in their existing position. The existing helper introduces no additional effect: it does not write history, alter attributes, clear timers or invoke rendering. Preserve both timer clears before it and every subsequent disposal/reset operation.

   Retain browser round-trip/Back behavior and teardown/late-import protections. Focused verification: current crate browser navigation and switching cases, with exact cleanup-order review. Expected reduction: **one production line; zero test lines**.

The suggested deletion batch is findings **2, 3, 6, 7 and 8**: approximately **eight net production lines and fifteen net test lines removed**, separately counted. Findings 4–5 are deferred options and are excluded from those totals. No whole test case or test file is recommended for deletion.

**Behavior and valuable coverage to retain**

The new crate code supplies distinct current functionality. Its size or recent introduction is not proof of redundancy. Retain the seven-item bin eligibility rule and bin ordering; separate flip/rack state and geometry; per-bin positions; back-board transitions; identity-preserving no-op reductions; animation timing; pointer capture and one-frame gesture flushing; synthetic-click suppression; wheel units, thresholds and vertical/zoom exceptions; keyboard/letter navigation; lazy imports and late-disposal guards; responsive geometry; image-window loading; focus/ARIA/live-status behavior; and history validation/restoration.

The latest view/CSS revisions were inspected, including delayed history writes with input flushing, the animation-completion fallback, cancelling flights before switching, immediate stage scrolling, the sticky bar, card scroll margin and choosing visible artwork below that bar. Preserve these current behaviors. Do not restore earlier intermediate implementations.

`filtered` and `hasFilters` in StoreDistroSearch remain distinct: text/artist/preorder filtering suppresses crate use, while format selection also contributes to Clear filters. The latest loader's third sync argument and comparison with the open crate's format serve current format changes, including Clear filters; they are not redundant.

Retain the static nullable page-data helper and its live item/listing callers. Preserve authoritative Worker offer refresh, boundary validation, unavailable/stale/error paths, price-free static content, persistence behavior, preorder schema/retry/abort handling and the externally authorized preorder-title revision. Retain all ten SVG assets and their visuals.

The initial browser-migration gap was resolved during this review: `e2e/store-formats.spec.ts` now uses current crate behavior, and the complete new `e2e/store-crate.spec.ts` was read through its final 306-line revision. Its cases cover desktop price/Buy visibility, image reuse/loading bounds, drag/wheel/key behavior, bin memory, Grid round trips, ineligible formats, search suppression, back-board restart, Back restoration, reduced motion, All Store bin controls, touch and narrow-phone overflow. The real DevTools touch case is explicitly Chromium-only; do not present it as cross-browser touch evidence. The external touch CSS contract, layout wrapper tests and shell snapshot cleanup regression also remain valuable.

Rejected approaches include deleting the presently ineligible tape mechanic, merging unlike flip/rack paths, removing history/DOM/input guards, flattening async cleanup, collapsing the two filter booleans, restoring retired Coverflow code, deleting distinct browser/unit regressions, or redesigning styles and presentation. These lack a behavior-preserving deletion proof.

**Connected inspection and current fingerprints**

The connected fingerprint covers the following 35 files. For files under `apps/web/src`, paths below use that prefix:

- `components/app-shell/`: `AppShellRoot.tsx`, `navigation/shell-page-snapshot.ts`, `navigation/shell-page-snapshot.test.ts`, `view/ShellPortalOutlets.tsx`.
- `components/editorial/`: `ReleaseCatalogPresentation.tsx`, `ReleaseDetailContent.astro`, `ReleaseStoreLink.tsx`; `components/store/checkout/`: `public-checkout-api.ts`, `StoreItemPurchaseActions.tsx`; `components/ui/button.tsx`.
- `layouts/`: `project.json`, `StoreCollectionPage.astro`, `StoreCollectionPage.test.ts`, `StoreListingPricePrefetch.astro`, `store-crate.test.ts`.
- `lib/`: `exact-first-search.ts`, `item-availability.ts`, `store-collection.ts`.
- `pages/`: `_store-item-detail-gallery.test.ts`, `index.astro`, `preorder-showcase.json.ts`, `store/[slug]/index.astro`, `store/[slug]/checkout/index.astro`, `store/[slug]/checkout/return/index.astro`.
- `platform/lib/`: `editorial-image.ts`, `lenis-scroll.ts`, `preorder-estimate.ts`; `styles/`: `global.css`, `touch-ergonomics-css.test.ts`.
- Other repository paths: `apps/web/test/commerce/StorePurchaseFlow.test.ts`, `apps/web/vitest.modules.config.ts`, `e2e/home-preorders.spec.ts`, `e2e/store-formats.spec.ts`, `e2e/store-crate.spec.ts`, `openspec/specs/module-boundaries/module-boundaries.manifest.json`.

This is connected-call/contract inspection, not a claim to have reviewed every unrelated implementation in those modules. Relevant new/changed source and test portions were read; unchanged previously inspected evidence was reused.

Selected full file identities for adopting the recommendations:

| File                                  | SHA-256                                                            |
| ------------------------------------- | ------------------------------------------------------------------ |
| store-page-data.ts                    | `5020ec49e5e8f08c6f6dd1aa735e733611163017966d8b5e97bf75250f4bff03` |
| store-page-data.test.ts               | `2366ba332a94d704559281ba24253f11c3bfe485337d06d976e28166fcb114c5` |
| checkout/StoreItemPurchaseActions.tsx | `0d7338386e484e5c07e67f7b8217ce69dc5ac3cb98da4d3b7675faf1b7e341a8` |
| store-artist-options.ts               | `65923faf34b52a3d845776b964d006856602d73d92305cba308d450d27f784b2` |
| StoreImageGallery.tsx                 | `3bed94a723f0da2f05c24e16344bed7e5cd297b8dc6847b150f8eaa3e74015c1` |
| crate/crate-input.test.ts             | `05302e1cdccbd95e946e240cc3c27f6d7d0ab41507ce35bc2817acd023b15e2e` |
| crate/crate-view.ts                   | `ab163816fae7cdfaa8719614561693ea514a21b9d074c651c574509fa54b78fb` |
| crate/crate.css                       | `9a1a6b7f1571b68e10739e34283627ecf01afdc550b974bba48160a7547af79e` |
| e2e/store-crate.spec.ts               | `c76f644464f35e74954be178027f7833b8ef5d6e0b3a9733e2f4c346f7c9f2e8` |
| e2e/store-formats.spec.ts             | `dbe17bc28a36f283060160a849f33347ae69e8aa08a01fe6a646d9f5894de772` |

**Graph, movement and verification limits**

Existing Graphify was queried with budget 2500 before substantive investigation. Broad truncation was narrowed with focused file/concept queries. It supplied the available crate model/input/pose/bin relationships but did not resolve the latest view, loader and StoreCrate wrapper. Current CodeGraph queries plus exact source/caller reads supplied those gaps. CodeGraph source elisions were filled with bounded exact reads; ambiguous generic-name relationships were not accepted as caller proof. Neither graph was initialized, refreshed, rebuilt or enriched.

Concurrent work repeatedly changed source and advanced main during the review. Every observed current owned revision was inspected. The final owned aggregate matched from **14:05:10 through 14:11:05 UTC**; the final 35-file caller aggregate matched from **14:06:35 through 14:11:05 UTC**. The complete inventory, boundary metadata and connected crate/Coverflow reference search were refreshed at closeout. The final owned dirty files were crate-view.ts and crate.css, both external changes included in the reviewed fingerprint and preserved.

No unresolved source-coverage or ownership obstacle remains for this snapshot. These captures do not freeze concurrent work or certify later revisions. Before implementation, compare current source identities with the report; changed inputs require a delta recheck.

No test or browser pass is claimed. Earlier shared validation predates these current revisions and cannot establish acceptance for this fingerprint. The persistent verifier retains ownership of policy-approved checks and task updates. After any adopted simplification, use the declared `pnpm test web-store` target and the relevant current browser suites through the approved feedback workflow, bind evidence to the resulting source fingerprint, and retain all distinct behavior coverage described above.
