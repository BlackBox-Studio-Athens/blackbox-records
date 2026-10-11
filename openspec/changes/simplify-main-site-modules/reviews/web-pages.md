# web-pages — complete received review

Reviewer thread: `01a125ba-1904-7601-a1e7-671f2693ade7`. Review turn: `01a1260f-3b65-72a2-adfc-dab0eeeb11de`.

Immutable source: `.codex-artifacts/simplification/15-web-pages-review-refresh-01.result.json`; raw SHA-256: `f9a02b88bbc06d7195d900a2ece299acda264d88775fcb94b18f81f223a27a0c`.

The complete received report follows. Its historical identities and claims are retained; current implementation decisions, caller drift and acceptance gaps are recorded separately in `../implementations/web-pages.md`.

Module 15/29 web-pages review is complete for the refreshed current source. All five previous findings remain actionable. No additional deletion is justified by the changed gallery test. Expected reductions are **23 production lines and 5 test lines**, across seven existing files, with no file deletion or new abstraction. This corrects the original report’s 27-line aggregate arithmetic.

The [original immutable review](C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/simplification/15-web-pages-review.result.json) retains the detailed unchanged inspection and earlier equivalence-probe evidence. This report supplies the current dispositions and implementation handoff. No repository files, reports, task records or graphs were written; no project checks were run.

**Current scope and changes.** All owned paths below are relative to `apps/web/src/pages/`. The refreshed inventory contains the same **52 files**: 30 production text files, 14 tests, `project.json`, and seven binary assets. Production text remains 3,959 lines; tests remain 1,084 lines. No owned file was added or removed, and no nested module root or generated source entered ownership.

The exact checkout exclusions remain `store/checkout/index.astro`, `store/checkout/return/index.astro`, `store/[slug]/checkout/index.astro`, `store/[slug]/checkout/return/index.astro`, and `withdrawal/index.astro`.

Only `_store-item-detail-gallery.test.ts` differs from the original owned snapshot. Its complete current 156-line body was inspected. Line 25 now requires the absence of `data-store-grid-sizes`, replacing the previous positive assertion. The remaining 51 owned files match the original inspected bytes, so their full inspection was reused.

The pages module remains closed with no provided exports. Its dependencies and workspace interfaces are unchanged. Connected web-store metadata now provides `StoreCrate.astro` instead of `StoreCoverflowControls.astro`; crate implementation remains outside pages ownership and belongs to module 12.

**Numbered actionable findings — all retained after recheck.**

1. **Delete unused optical-scale data from `_demo/header-type-studies.astro`.**

   Evidence: the private member at line 25, candidate values at 70, 76, 82 and 90, projection at 100–105, and baseline value at 310 remain unchanged. Current repository searches found only definitions and copies. The actual browser consumer at 285–305, activation at 385–401, and click handling at 404–413 use IDs, names, font families and missing-font state. Fitting at 322–346 uses measured dimensions rather than `opticalScale`.

   Smaller change: remove the member and its values; remove it from projection destructuring and output. Keep the remaining private JSON projection.

   Preserve candidate order, baseline behavior, font detection, disabled controls, `aria-pressed`, fitting bounds, font-loading handling and fitting delays. Focused verification: web-pages tests and development-route candidate/baseline activation, including missing fonts. **Production reduction: 7 lines; test reduction: 0.**

2. **Select the first upcoming draft model directly in `_demo/release-feature-drafts.astro:71–80`.**

   Evidence: models are built from every `releaseCatalogEntries` object at 42–66 and indexed at 68. The same input feeds `splitReleaseCatalogByAvailability` at 26. The unchanged helper in `apps/web/src/lib/release-feature.ts:36–58` partitions those objects and sorts copies, so every upcoming ID has a completed model. `upcomingModels` is used only for its first element; `isReleaseModel` still has one caller.

   Smaller change: delete the predicate and intermediate map/filter array, replacing them with:

   ```ts
   const primaryUpcomingModel = upcomingReleases[0] ? (releaseModelById.get(upcomingReleases[0].id) ?? null) : null;
   ```

   Preserve first-release ordering, duplicate-ID map behavior, null for an empty upcoming partition, and both template consumers at 150–159 and 281–325. Keep the full `Promise.all` preparation and existing commerce/player calls and rejection behavior. Focused verification: web-pages and release-feature tests; empty and multiple-upcoming draft cases. The original 516-case equivalence probe remains applicable to the unchanged helper and selection inputs; it was not rerun. **Production reduction: 9 lines; test reduction: 0.**

3. **Delete only the five previously proven duplicate/subsumed test lines.**

   | Remove                                                                                                  | Current retained coverage                                                                                                                                                                             |
   | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `_catalog-description-typography.test.ts:69`, negative `font-mono` check on `releaseDetailSummaryClass` | Line 67 requires that same value to equal an exact class string excluding `font-mono`.                                                                                                                |
   | `_store-item-detail-gallery.test.ts:142`, Distro `getEntry` assertion                                   | Line 30 contains the identical assertion against the same immutable source string; 31–34 retain missing-source and gallery checks. The concurrent change at line 25 does not affect this duplication. |
   | `_section-page-identity.test.ts:32–33`, Releases heading and absent-intro checks                        | `_releases-page-layout.test.ts:26–35` retains both checks plus heading count and related CSS constraints.                                                                                             |
   | `_section-page-identity.test.ts:8`, `releasesPage` binding                                              | Becomes unused after the preceding two deletions.                                                                                                                                                     |

   Rename the remaining mixed Releases/Services case to describe Services. Keep its Services assertions and every test case/file. `scripts/module-test-projects.ts:20–41` and unchanged module metadata still select all retained suites in web-pages.

   **Retain the newly changed assertion at gallery-test line 25.** A similar check in web-layouts does not replace coverage when web-pages runs independently. Focused verification: `pnpm test web-pages`, confirming the retained assertions remain selected. **Production reduction: 0; test reduction: 5 lines.**

4. **Flatten the two font-directory wrappers in `_demo/header-type-studies.astro:37–48`.**

   Evidence: each `{ directory: URL }` object has one member; `hasSelfHostedFont` immediately unwraps it at 48. Its sole caller remains the candidate projection at 97. Both current directory choices and the default remain unchanged.

   Smaller change: store the existing URLs directly under the existing keys and pass the selected `fontDirectory` directly to `new URL`. Keep the helper and local binding.

   Preserve URL bases, default-directory selection, filesystem conversion/existence-check order, filenames, missing-font states and disabled controls. Focused verification: compare resolution for both current directories and an absent font, then run web-pages tests. **Production reduction: 4 lines; test reduction: 0.**

5. **Remove the ignored `all` sentinel and extra array copy in `sitemap.xml.ts:14–17`.**

   Evidence: unchanged `apps/web/src/lib/store-categories.ts:64–66` always retains All, BlackBox Releases and Distro; membership controls only Merch. Store route callers already pass memberships directly. Current crate composition does not change category discovery.

   Smaller change:

   ```ts
   const storeCategories = getDiscoverableStoreCatalogCategories(storeEntries.flatMap((entry) => entry.categoryIds));
   ```

   Adjust `_sitemap-output.test.ts:12` to retain the membership-expression check without its removed spread prefix. Keep category-path and standalone-Distro exclusion assertions.

   Preserve exact category/path order, conditional Merch, other sitemap paths, XML, headers and loader/error behavior. Focused verification: web-pages and Store-category tests, comparing empty, Merch-free and Merch-containing sitemap output. The original 729-combination equivalence probe remains source-compatible and was not rerun. **Production reduction: 3 lines; test reduction: 0.**

**Rejected deletions and behavior to retain.**

- **Dynamic readers and source guards:** full detail routes deliberately return null-body 404s, while overlay fragments return `Not found`. Keep supplied-props/content-reader fallbacks. `store/[slug]/index.astro:45–64` still resolves Release/Distro sources separately and throws specific missing-source errors.
- **Async preparation and player/cart shortcuts:** keep current content-read sequencing, complete draft-model preparation, image transforms, cart seeds and embedded-player projection. Changing call counts or concurrency could change errors or mutable preview behavior.
- **Prepared preorder payload trimming:** retain accepted clip IDs, ordered titles/media, replacement/removal handling, missing-photo behavior and delivery-budget tests. The changed connected `StorePreorderShowcase.tsx:218–235,461–467` now plays the first clip and displays all clip titles as spans. Preserve that concurrent behavior and the existing endpoint contract.
- **Demo consolidation or removal:** the three draft directions, development-only route registration and licensed-font placement remain intentional. The draft’s two-digit date formatter at 28–36 differs visibly from the ordinary numeric-day formatter. Neither shared markup nor formatter reuse is justified.
- **Wholesale source-test deletion:** gallery derivatives, cover-first ordering, static single images, lazy shell enhancement, safe partner links, independent listening/editorial/purchase controls, accessibility, motion and asset checks retain distinct value. Finding 3 exhausts the demonstrated removable owned assertions.
- **Holding-page validation or illustration rewrites:** retain Instagram host/protocol and email validation, warning/omission behavior, and current 404 SVG/CSS presentation.
- **Crate integration cleanup in pages:** preserve current card bin/slug attributes, alternate-image accessibility, image sizes, format ordering, Grid fallback and lazy Crate lifecycle. These are live connected contracts, not pages deletion candidates. Module 12 owns their implementation review.

**Inspected scope and connected flows.** The complete original owned inventory remains current: home/404/holding and generated responses; About, Artists, News, Releases and Services sections; full and overlay editorial details; four Store collections and Store Item detail; legacy Distro/Shop redirects; Terms/Privacy; both development pages, route registration and font CSS; all 14 owned suites and asset references.

This refresh additionally inspected the complete changed gallery suite and current `StoreItemCard.astro`, `StoreCollectionPage.astro`, `StoreDistroCatalog.astro`, `StoreCrate.astro`, `crate-bins.ts` and `crate-switch.ts`. Relevant current `StoreDistroSearch.tsx` setup/format/lifecycle calls and `crate-view.ts` card-identity/image-loading spans were inspected. Changed preorder rendering, PurchaseInformation delivery-summary reuse, relevant global CSS, and boundary metadata/spec changes were also reviewed. Unchanged Release detail/gallery consumers, category/splitter helpers and surviving test evidence were fingerprinted and reused. Crate mechanics were inspected only where they consume the page/card contract; their comprehensive review remains module 12’s responsibility.

**Source and caller identity.**

- Original owned fingerprint: `8416b015a62fc5c1d21343f3a8037a88a3de581380f5736f53e18f4e1a062b1e`. Reconstructing the original owned tree from `3355c335226838f996efb5536f55271f819a3e14` reproduced it exactly.
- Current owned fingerprint: `21fdff7ae850fde6ebae85214adf6fc7f43225663a38dd7ba0c5261445c7105f`.
- Current selected caller/config fingerprint, 63 files: `c53dfc431eddebbcafedccd45f43136ec38c4b6dadb8c105bfbce40ef7686608`.
- Refresh starting HEAD: `86309d1baa5bf5ef21bdf467e6f10a53c80963df`; closing HEAD: `54844bd258e2054beee5e951b9b597e13fab50db`. Branch stayed `main`.
- Owned bytes remained stable from 13:51:00 to **14:00:37 UTC on 2026-10-10**. Final comparison found no movement in any owned file or the 63 selected callers/configurations.

Fingerprint construction uses sorted forward-slash paths, lowercase SHA-256 of raw file bytes, and SHA-256 of LF-joined `path SPACE hash` records with no trailing LF. Owned enumeration excludes the five routes above and any nested module roots. Caller selection covers current literal imports/test-source dependencies plus inspected integration and boundary/config files.

| Critical current file                                   | SHA-256                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/src/pages/_store-item-detail-gallery.test.ts` | `1651097cd3b16e7e6c460bb09b53cff3de421356154b63a5b6f29bad2ff7489c` |
| `apps/web/src/components/store/StoreItemCard.astro`     | `1aa39bb583332ab89b9adaf9e0899535c1a2fd96c78f3b829fdea7bd37d7c47c` |
| `apps/web/src/components/store/StoreDistroSearch.tsx`   | `5023f175a1a9e740ff1ac7fde16c91b743dce4a9d608815967574a84294fd811` |
| `apps/web/src/components/store/crate/crate-view.ts`     | `8b0a342b05529202366a1b45764272d6286a684f9c080330d3707eedc7d8571f` |
| `apps/web/src/lib/release-feature.ts`                   | `58445a630e167fefb9df481132063dd4fa8c041b78dca2459e4a8ed0529710be` |
| `apps/web/src/lib/store-categories.ts`                  | `f77c37ede748a7f6bc9b6ca2f8d25cd1d8f9be461050f9b664473fb9cb18b80c` |

**Graph evidence, gaps and verification handoff.** Existing Graphify was used first with budget 2500. Its 371-node query was truncated; focused explains and complete bounded incident-edge reads supplied the pertinent relationships. CodeGraph then supplied current source/caller evidence; omitted anonymous/JSX spans were filled with exact reads. A lexical crate-property query returned neighboring model code, so the actual `readItems` consumer was queried explicitly and inspected. Graphify’s recorded commit predates closing HEAD; current source and tests establish the findings. No index was initialized, enriched or refreshed. No owned inspection gap remains.

No test runner, build, lint/type check, browser acceptance, shared validation or provider operation was executed during this refresh. A fresh implementer should recheck current identities, apply only the accepted owned deletions, run `pnpm test web-pages` and the focused release-feature/category tests, and verify the two development-route behaviors and sitemap output described above. Parent/verifier acceptance remains separate. Concurrent Store functionality and all newly changed gallery coverage must be retained.
