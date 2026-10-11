# Storefront catalog received review

Reviewer thread: `01a12571-e0ac-78b2-a414-70b3e9ae7dc2`.
Reviewer turn: `01a12571-fb3e-7410-898d-638f5628304a`.
Immutable source: `.codex-artifacts/simplification/09-storefront-catalog-review.result.json`.
Raw SHA-256: `172fc65792eafa48fdf8d221944cf99c1315d5db871f39a49bc19ef7b9384fa9`.
Historical source HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
Historical 73-file source/test/metadata fingerprint: `5429142b7bc934c78385c2c93538e9834b454a27deb637e599a0bd4184288581`.
The complete received report follows; current-source decisions belong to the separate implementation record.

**What this change does:** This is a completed read-only review of module 9/29, `storefront-catalog`. The module prepares catalog data and provides shared site components, inquiry/newsletter forms, editorial rendering, and styles. Seven concrete simplifications are supported by current source and coverage evidence; this thread changed no files or task records.

**Source identity and review limits**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Final identity recorded at `2026-10-10 11:23:09 UTC`.
- All **367 files** under the assigned root, excluding nested Nx modules, had identical SHA-256 hashes at the beginning and end of the review. No owned files were added or deleted.
- The fingerprint for the **72 owned source/test files plus `apps/web/src/project.json`** was `5429142b7bc934c78385c2c93538e9834b454a27deb637e599a0bd4184288581`. It hashes UTF-8 records consisting of each path, NUL, lowercase file SHA-256, and LF, ordered with PowerShell `Sort-Object -CaseSensitive`.
- Other threads changed shared dependencies. At the final check, `web-platform` had changes to `PurchaseInformation.tsx`, deletion of its backend API adapter and test, and a new purchase-information equivalence test. Earlier `web-content-files`, content-model, and API-client changes were also present. No passing verification is claimed for this moving shared tree.
- Repository tests, validation, builds, browser checks, and hosted/provider operations were not run. Read-only source analysis and one isolated in-memory comparator check were performed. Nothing was saved to `.codex-artifacts` or OpenSpec.

**Should fix**

1. **Remove the unused private tax-code implementation and its tests.**

   Location: [store-tax-category.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/store-tax-category.ts:1), lines 1–21; [store-tax-category.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/store-tax-category.test.ts:1), lines 1–30.

   **Problem and proof:** Production code imports only the `StoreItemTaxCategory` type, at `catalog-data.ts:8`. Graphify, CodeGraph, and repository-wide reference searches found no production consumers of the two tax-code constants, the three dependent code types, the mapping table, or the two mapping functions. The runtime functions are exercised only by this test file. `store-tax-category.ts` is absent from the module's declared public entrypoints.

   The executing catalog setup path uses its separate `STRIPE_PHYSICAL_GOODS_TAX_CODE` in `scripts/stripe-catalog-contract.ts:107`, applied to Release and Distro projections at lines 245 and 302. Its retained contract test checks projected tax codes at `apps/backend/test/scripts/stripe-catalog-contract.test.ts:195–299`. This deletion does not reach that implementation or its checks.

   **Smaller implementation:** Keep this file as `export type StoreItemTaxCategory = 'physical_goods';`. Delete its unused runtime declarations and dependent unused types, then delete its owned test file. Keep `StoreItem.taxCategory`, the `'physical_goods'` values emitted by both catalog constructors, and every declared public entrypoint unchanged.

   **Coverage to retain:** Catalog tests already verify the tax-category fields in Release, Distro, and combined Store Item projections at `catalog-data.test.ts:287–305`, `420–449`, and `488–501`. Keep the separate catalog setup and backend tax validation coverage. The deleted tests would otherwise continue testing code that no production path invokes; their compile-time mapping case also builds and asserts its own local table.

   **Focused checks:** `pnpm test storefront-catalog`; the verification owner should also run `pnpm test apps/backend/test/scripts/stripe-catalog-contract.test.ts` against the implementation fingerprint. Recheck references immediately before deleting, because other modules are moving.

   **Expected reduction:** About **50 source/test lines** and one test file. No browser bundle or runtime saving is claimed: the production import is already type-only.

2. **Consolidate three tests whose exact cases remain covered.**

   Locations: [catalog-data.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/catalog-data.test.ts:472), lines 472–485, 503–518, and 537–562; [item-availability.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/item-availability.test.ts:145), lines 145–151.

   **Problem and proof:** The catalog test at 537–545 repeats the same Caregivers Release fixture and canonical-slug assertions already exercised at 480–485. Its rejection of the legacy `caregivers` lookup is already asserted at line 517. The test at 547–562 repeats the two Release fixtures and native Store paths from 472–485; its additional Caregivers `sourceId` assertion can be moved into the retained expectation.

   The availability test at 145–151 checks the Disintegration primary price placeholder. The retained test at 92–107 specifies the complete list record, including that exact price object, and the retained test at 182–187 verifies that the primary record equals that list record. Together they retain the same primary-price assertion.

   **Smaller implementation:** Delete the two repeated catalog tests, add `sourceId: 'caregivers'` to the retained Caregivers expectation at 480–485, and delete the repeated primary-price test. No production changes are needed.

   **Coverage to retain:** Keep canonical lookup and legacy-slug rejection, both native Release paths, source identity, full placeholder shape, primary/list agreement, structured-price exclusion, reserved routes, slug collisions, all three distinct artwork override cases, and provider identity tests. Similar-looking tests with different source IDs or boundary cases are not part of this deletion.

   **Focused checks:** `pnpm test apps/web/src/lib/catalog-data.test.ts` and `pnpm test apps/web/src/lib/item-availability.test.ts`.

   **Expected reduction:** About **34 test lines**, with every distinct assertion transferred or retained. Leaving these tests costs repeated fixtures and assertions without adding a regression case.

**Nice to have**

3. **Remove the projection's unreachable second uniqueness check and unused Map values.**

   Location: [store-item-ownership.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/store-item-ownership.ts:21), especially lines 26–34, 52–61, and 83–98.

   **Problem and proof:** Every variant ID is generated as `variant_${storeItemSlug}_standard` at line 56. The slug uniqueness assertion runs first at line 60. Distinct slug strings necessarily produce distinct generated variant strings, so the variant-ID assertion at line 61 cannot report an additional failure. Its helper is private and has no other callers.

   The source-tuple Map likewise uses only `has` and `set`; its stored candidate values are never read. It represents membership, not a lookup table.

   **Smaller implementation:** Remove only the variant-ID assertion. Make the private uniqueness helper specific to `storeItemSlug`, preserving its exact duplicate-slug error text. Replace the source-tuple Map with a `Set<string>` using the same keys, duplicate check, and insertion order.

   **Behavior and coverage to retain:** Preserve the empty-input fast path, duplicate-source detection, cross-source physical-duplicate detection, slug validation, reserved-segment rejection, deterministic variant IDs, and the order and wording of every reachable error. Retain [store-item-ownership.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/store-item-ownership.test.ts:35), particularly the generated variant at 36–44 and duplicate/reserved errors at 47–87. The connected catalog constructor at `catalog-data.ts:255–290` and operational caller at `scripts/stripe-catalog-contract.ts:129–144` still receive the same projection.

   **Focused checks:** `pnpm test apps/web/src/lib/store-item-ownership.test.ts`, the catalog test file, and the connected catalog contract test through the verification owner.

   **Expected reduction:** One complete redundant O(n) uniqueness pass and its Map allocation, unused candidate values in the source membership structure, and a few private implementation lines. No wall-clock improvement was measured.

4. **Remove the collection constructor's invariant scan after its inputs have already established both invariants.**

   Location: [store-collection.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/store-collection.ts:125), specifically line 157.

   **Problem and proof:** `listStoreItems()` returns a projection whose slugs have already passed `createValidatedStoreItemProjection` uniqueness validation. The constructor then creates each membership through `classifyStoreCatalogMembership`, which returns a nonempty membership array for either supported source kind or throws before construction completes. The scan at line 157 therefore cannot discover duplicate slugs or empty memberships in this locally constructed array.

   **Smaller implementation:** Delete that one assertion call. Keep the subsequent `selectStoreCollectionEntries(entries, categoryId)` call and its validation. Keep validation inside the public selector and artist sorter, whose callers can supply their own arrays.

   **Behavior and coverage to retain:** Preserve source-entry and Distro-facet errors, category classification, selection order, returned array copying, gallery preview choice, availability, and public duplicate rejection. The public-selector failure at `store-collection.test.ts:233–235` and sorter failure at line 282 remain meaningful and must stay. The constructor tests at 94–169 and grouping tests at 301–373 remain intact.

   Connected consumers include `pages/store/index.astro:6–15`, `layouts/StoreCollectionPage.astro:26–28`, and the real purchase flow at `apps/web/test/commerce/StorePurchaseFlow.test.ts:119–137`.

   **Focused checks:** `pnpm test apps/web/src/lib/store-collection.test.ts`; `pnpm test apps/web/test/commerce/StorePurchaseFlow.test.ts`; Store format/category browser acceptance if this slice is implemented.

   **Expected reduction:** **One line**, one full collection traversal, and one temporary Set per constructor call. This does not authorize removing the checks on public array inputs.

5. **Sort the newly created release buckets without copying them again.**

   Location: [release-feature.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/release-feature.ts:17), lines 17–29 and 40–57.

   **Problem and proof:** Both private sort helpers call `slice().sort(...)`. Their only calls pass `outNowReleases` and `upcomingReleases`, arrays freshly created inside `splitReleaseCatalogByAvailability`. Neither array is externally reachable before the sorted result is returned. The caller's `releaseEntries` array is separately traversed and never passed to those helpers.

   **Smaller implementation:** Remove `.slice()` from both private helpers and sort those private buckets in place. Keep the public functions and comparators unchanged.

   **Behavior and coverage to retain:** Preserve input-array order and element identity, UTC-day classification, explicit upcoming-stage handling, undated handling, date/title ordering, featured fallback, and remaining-catalog order. Keep [release-feature.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/release-feature.test.ts:20), including its grouping, role-selection, date-boundary, and ordering cases. Production use of these buckets was read at `ArtistDetailContent.astro:31–53`; the demo caller at `release-feature-drafts.astro:23–26` also remains compatible. `isReleaseOutNow` consumers and behavior are untouched.

   **Focused checks:** `pnpm test apps/web/src/lib/release-feature.test.ts`. An input snapshot assertion can be added to the existing split-order case if the implementer wants direct protection against accidentally sorting the caller's array.

   **Expected reduction:** **Two array allocations and copies** per split. The textual change is two removed `.slice()` expressions, not a meaningful line-count reduction.

6. **Replace the Distro group's single-value alias arrays with direct equality.**

   Location: [distro-data.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/distro-data.ts:3), lines 3–10 and 29–35.

   **Problem and proof:** Every private group configuration has exactly one `sourceGroups` member, and that member is identical to `groupName`. No group has an alias or combined source group. The filtering callback nonetheless invokes `some` over that one-element array for every entry.

   **Smaller implementation:** Remove `sourceGroups` from the seven private configurations and filter with `entry.data.group === groupName`. Keep the same table order, intro keys, sorting, and empty-group filter.

   **Behavior and coverage to retain:** Keep all seven exact physical groups, separate 7-inch and 10-inch vinyl, ascending content order, title tie-breaks, unchanged item identity, and omitted empty groups. `catalog-data.test.ts:228–252` covers the grouping helper; `store-collection.test.ts:301–373` covers all seven groups, intro keys, heading IDs, counts, and title ties. Callers include `catalog-data.ts`'s re-export and `store-collection.ts:95–118`; the layout and Distro component use their unchanged results.

   **Focused checks:** The catalog and collection test files; `pnpm test:e2e e2e/store-formats.spec.ts` through the verification owner if implemented.

   **Expected reduction:** Seven unnecessary private arrays and the nested membership callback. This simplifies expressions and configuration without changing the grouping contract.

7. **Stop repeating alphabetical comparisons in the roster's second sort.**

   Location: [catalog-data.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/catalog-data.ts:68), lines 68–77.

   **Problem and proof:** `listArtistProfiles()` already returns a copied array sorted by name. `listArtistRosterProfiles()` then sorts that array by activity and compares names again whenever activity is equal. The second name comparison repeats work already established by the first sort.

   **Smaller implementation:** Keep the existing `await listArtistProfiles()` call and use only `Number(right.data.is_active ?? true) - Number(left.data.is_active ?? true)` as the second comparator. Stable sorting preserves the established alphabetical order within equal-activity groups. This keeps the collection read, copy, and await structure unchanged. The stability requirement is defined by the [ECMAScript sorting specification](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-sortindexedproperties).

   A separate, non-writing Node check compared the current and proposed ordering for **6,144 cases**: all 24 permutations of four records, all combinations of true/false/undefined/null activity, and names including equal and accented values. Every result matched. This was an in-memory equivalence check, not a repository test-suite pass.

   **Behavior and coverage to retain:** Keep active-before-inactive ordering, missing activity treated as active, name ordering, stable equal-name ties, empty input, and source-array preservation. Retain `catalog-data.test.ts:175–225`. The Home caller at `pages/index.astro:14–17` selects the first three records, and the Artists caller at `pages/artists/index.astro:7–39` assigns order-dependent presentation, so their ordering must remain exact.

   **Focused checks:** `pnpm test apps/web/src/lib/catalog-data.test.ts`; focused Home/Artists direct-load and shell-navigation acceptance through the verification owner.

   **Expected reduction:** About two lines and all repeated name comparisons in the second pass. Two sorts remain; this recommendation does not replace the existing async call structure or claim measured route-speed gains.

**Rejected changes and retained protections**

- Do not remove `hasStructuredItemPrice`, `isPricedItemAvailability`, the availability API types, or other unused-looking exports from `item-availability.ts`. That file is a declared public entrypoint; preserving interfaces takes precedence over current caller counts.
- Do not remove reserved-slug checks, duplicate-source checks, cross-source duplicate detection, or validation on public collection selectors. They protect different inputs and preserve specific error behavior. The empty projection fast path also avoids entering the remaining pipeline for an empty catalog.
- Do not replace cross-source duplicate detection with a differently ordered index as part of this pass. Its first reported conflict depends on Release order, Distro order, and edition-key order. No measured slowdown justified changing that algorithm here.
- Do not cache search text inside `createExactFirstSearcher` merely to reduce normalization work. The exported reader callback and mutable item inputs make that a behavioral change unless their broader contract is narrowed. Keep lazy Fuse loading, retry reset, exact-first results, per-term intersections, and notification behavior.
- Keep the content snapshot cache key, rejected-load retry, guarded cache clearing, parse-before-store-clear order, required configuration checks, and explicit missing-entry errors. They protect snapshot isolation, recovery, and publication boundaries.
- Keep inquiry pending-submission protection, native field bounds, adaptive details, safe errors, focus/reset behavior, dataset consumption during lazy mount, and event cleanup. Keep newsletter consent, hydration disabling, pre-mounted live regions, safe error copy, and state reset. Connected shell portal and browser regression sources establish distinct lifecycle cases; no form simplification was selected.
- Keep rich-text/link/video validation, empty-body versus absent-body handling, ordered-list starts, quote grouping, media requirements, alt text, and image priority inputs. Their overlap across rendering paths is not evidence of equivalent removable code.
- Keep the owned CSS tests. They protect concrete motion, overflow, focus, touch, typography, player geometry, and shell lifecycle rules. Source assertions are not automatically useless. No new shared CSS-test parser or rendering abstraction is proposed.
- No CSS, font, artwork, layout, navigation, or product changes are recommended. Source/spec presentation differences were not treated as permission to change current behavior.

**Inspected scope**

The review covered all **42 owned production source files and 30 owned test files**, plus the module's boundary metadata.

- `lib/`: `catalog-data`, `content-loader`, `content-reader`, `distro-data`, `exact-first-search`, `item-availability`, `page-identity`, `preorder-showcase`, `published-purchase-browser`, `release-feature`, `site-data`, `store-categories`, `store-collection`, `store-item-ownership`, and `store-tax-category`.
- All 16 owned `lib/*.test.ts` files, including schema, editorial validation, category authority, and tracklist tests; `utils/content.ts` and its test.
- `Header.astro`, `Footer.astro`, all three header components, all four icon components, `InternalPageHero.astro`, `NewsletterSignup.astro`, `NewsletterSignupForm.tsx` and its test, `Prose.astro`, both Services sources and their form test, and all six `detail/Editorial*.astro` components.
- `content.config.ts`, `env.d.ts`, and `project.json`.
- `fonts.css`, `prose.css`, `global.css`, and all 11 owned CSS test files. The complete stylesheet AST scan examined **1,278 rules and 4,146 declarations** across the three stylesheets. It found no empty rules, exact repeated rules within the same container, or repeated identical declarations within a rule. All 19 authored global keyframes had explicit animation references. Global CSS review also covered section annotations, conditional structure, custom-property references, owned CSS regression assertions, and connected markup. This was source analysis, not rendered visual acceptance.

Connected reads included Home/Artists/Store pages, artist detail and release presentation, Store collection and Distro composition, the purchase flow, checkout API submission/error paths, shell portal outlets, pre-order showcase generation, catalog setup projection and its tests, published content-reader overrides, and public-build override tests. Nested modules, CMS/staff implementation, operational tooling, generated contracts, migrations, content, and media were not edited. Content/media/font files under the owned root were included in the before/after identity check.

The required harness instructions, archived Ponytail skills, project workflow/reference documents, current change proposal/design/task context, relevant domain requirements, and module `project.json` were read. Domain evidence included module boundaries, project language, codebase simplification, catalog categories, Distro formats/search, release presentation, pre-orders, newsletter and inquiry behavior, publication, shell/player continuity, images, and performance evidence requirements.

**Graph and tool evidence**

Graphify used the existing graph with the required **2,500-token query budget**. The initial broad traversal was truncated at 68 of 644 nodes; it was not treated as complete evidence. Focused `explain` queries covered catalog data, collections, site data, tax mapping, release grouping, and Distro grouping, and a focused path established the shell's lazy inquiry-form import. Graphify lacked a directed `SiteLayout.astro → global.css` path; the exact import at `SiteLayout.astro:2` resolved that source relationship.

CodeGraph supplied current source and symbol/caller context. Elided imports or source gaps were filled with bounded exact reads. Its late freshness note concerned files outside this module. No graph initialization, synchronization, refresh, enrichment, or paid API call was performed by this thread.

**Verification handoff**

A fresh implementation thread should independently verify each selected finding against the current checkout, edit only this module and its owned tests, and record accepted/rejected findings. The persistent verification thread owns shared task updates, graph refreshes, source-bound validation, and browser acceptance. Suggested browser coverage is Store format/category behavior and Home/Artists ordering plus shell navigation; provider and hosted mutation checks are unnecessary for these proposed internal deletions.

The parent can retain this full report at `openspec/changes/simplify-main-site-modules/reviews/storefront-catalog.md`. This reviewer did not create that file.

**Verdict:** Review complete. Findings 1–7 are ready for separate implementation verification; none requires a visual or product change.

**Lean:** Approximately **90 source/test lines** are removable if all findings are accepted, plus smaller expressions and redundant allocations/comparisons. The estimate is not a deletion target.

**Not checked:** Repository test execution, final shared-tree validation, browser/visual acceptance, measured runtime performance, and hosted/provider behavior. Concurrent dependency changes require fresh verification before implementation completion.
