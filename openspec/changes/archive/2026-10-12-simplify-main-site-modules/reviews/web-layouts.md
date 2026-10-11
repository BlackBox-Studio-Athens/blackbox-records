# web-layouts — complete received review

Reviewer thread: `01a125aa-c07f-75e2-b40c-1d73544ca9dc`.
Reviewer turn: `01a1260f-455d-7451-b091-f89423b39cec`.
Source: `.codex-artifacts/simplification/14-web-layouts-review-refresh-01.result.json`.
Raw source SHA-256: `9efd0a3e5b38d0590f81dcf98b12dde6ba244d59fa09acb56d163e6d6f3fc447`.
Original detailed proof: `.codex-artifacts/simplification/14-web-layouts-review.result.json`.

**Module 14/29 — web-layouts: updated read-only review complete.** Three behavior-preserving simplifications remain actionable. The test finding now comprises seven redundant assertions across nine physical lines. The production findings remove one redundant browser guard and avoid empty grouping work. No production file or function deletion is justified.

The [original immutable report](/C:/Users/SVall/WebstormProjects/blackbox-records/.codex-artifacts/simplification/14-web-layouts-review.result.json) supplies unchanged detailed proof. Every prior finding and rejection was rechecked against current source and consumers. No repository files, reports, task records, generated outputs or graphs were written; no checks, provider operations or messages to another owner were performed.

**Current source identity and scope**

| Item                           | Current evidence                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Checkout                       | Existing checkout, `main`                                                          |
| Recorded HEAD                  | `54844bd258e2054beee5e951b9b597e13fab50db`                                         |
| Owned inventory                | 11 files: 392 production lines, 353 test lines, 38 configuration lines             |
| Owned SHA-256 fingerprint      | `980f04fd2d1fbf468c49a0fb3054b371dd90cf41d7b53c9177663b5a6e4efc23`                 |
| Selected connected inventory   | 24 page callers plus 39 dependency/test/configuration files                        |
| Connected snapshot fingerprint | `b97f6ab75f387ea0af93e08f053cac6692a762d0f38256023a3f869fca1e59c5` at 14:06:50 UTC |
| Owned stability                | All owned files unchanged between 13:46:45 and 14:06:50 UTC on 2026-10-10          |

Fingerprints use SHA-256 over path-sorted, LF-joined `<normalized relative path> <file SHA-256>` rows, without a trailing newline.

The complete current inventory under `apps/web/src/layouts` is:

| File                               | Lines | Inspection                                                                 |
| ---------------------------------- | ----: | -------------------------------------------------------------------------- |
| `AppShell.astro`                   |    18 | Unchanged complete inspection reused; current wiring rechecked             |
| `SiteLayout.astro`                 |   200 | Unchanged complete inspection reused; public props and fallbacks rechecked |
| `RedirectLayout.astro`             |    47 | Unchanged complete inspection reused; script rechecked                     |
| `StoreListingPricePrefetch.astro`  |    29 | Unchanged complete inspection reused; activation consumers rechecked       |
| `StoreCollectionPage.astro`        |    98 | Entire current source inspected                                            |
| `SiteLayout.test.ts`               |    53 | Unchanged complete inspection reused                                       |
| `StoreCollectionPage.test.ts`      |   152 | Entire current test inspected                                              |
| `catalog-containment.test.ts`      |    43 | Entire current test inspected                                              |
| `distro-format-navigation.test.ts` |    47 | Entire current test inspected                                              |
| `store-crate.test.ts`              |    58 | New; entire current test inspected                                         |
| `project.json`                     |    38 | Entire current metadata inspected; unchanged                               |

`distro-coverflow.test.ts` has been deleted concurrently. Its former findings are superseded; its deletion is not credited to this review. No nested ownership root or additional owned file was found. Routes, generated sources and other implementation roots remain excluded.

The closed [layout boundary](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/layouts/project.json:19) still exports only `SiteLayout`, `RedirectLayout` and `StoreCollectionPage`. The connected web-store boundary now exports `StoreCrate.astro`.

Connected inspection reused unchanged evidence for all 24 page callers and covered current StoreCrate, Distro catalog, card, search/switch/bin contracts, relevant CSS, shell snapshot sanitation and tests, collection grouping, listing-price activation, preview readers and schema deltas. Crate internals were inspected only where they establish layout compatibility; their implementation review belongs to module 12.

**Actionable findings**

1. **Delete redundant assertions; retain the stronger current counterparts.**

   All locations below are owned tests under `apps/web/src/layouts`: [catalog containment](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/layouts/catalog-containment.test.ts:9), [Store collection](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/layouts/StoreCollectionPage.test.ts:37), and [crate integration](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/layouts/store-crate.test.ts:16).

   | Delete                              | Retain and proof                                                                                                                                   |
   | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `catalog-containment.test.ts:14`    | Line 22 forbids every `contain-intrinsic` declaration in the same grid selector body, including the narrower forbidden property.                   |
   | `catalog-containment.test.ts:35–37` | Line 23 requires the identical title selector and font value immediately after the opening brace, subsuming the weaker declaration-anywhere regex. |
   | `catalog-containment.test.ts:39`    | `StoreCollectionPage.test.ts:62` makes the identical price-hook assertion against the same card file.                                              |
   | `StoreCollectionPage.test.ts:63`    | Lines 75–79 extract the actual availability span using the required hook and check its class and pending state.                                    |
   | `StoreCollectionPage.test.ts:64`    | Line 83 requires the same text inside that extracted availability span.                                                                            |
   | `StoreCollectionPage.test.ts:47`    | `store-crate.test.ts:25` requires the actual Collection `<StoreCrate` tag followed by its `binRow` prop.                                           |
   | `store-crate.test.ts:19`            | Its line 25 likewise subsumes this Collection tag-presence assertion.                                                                              |

   Current CSS still supplies the declaration required by both font assertions at `global.css:1196–1197`. The current card still supplies the price hook and availability span at `StoreItemCard.astro:107–124`. The Collection wrapper and `binRow` remain at `StoreCollectionPage.astro:77–80`.

   **Prior disposition:** Five of the original ten proposed assertion removals remain valid; the five located in the deleted Coverflow test are obsolete. Two additional Collection-wrapper assertions are now subsumed. Retain `store-crate.test.ts:17`: it checks the separate Distro wrapper connection.

   **Reduction:** Seven assertions and nine physical test lines; zero production reduction. Delete only these statements, without replacement tests or a shared reader abstraction. **Focused verification:** `pnpm test web-layouts`, followed by reviewing the deletion diff against this table.

2. **Skip grouping altogether on non-All collections.**

   [StoreCollectionPage.astro:27–29](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/layouts/StoreCollectionPage.astro:27) still calls `groupStoreDistroCollectionEntries([])` for every category other than All. Move the existing condition outside the call:

   ```ts
   const distroGroups =
     category.id === 'all' ? groupStoreDistroCollectionEntries(selectStoreCollectionEntries(entries, 'distro')) : [];
   ```

   [The collection helper:92–118](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/store-collection.ts:92) and [Distro grouping:29–36](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/distro-data.ts:29) remain unchanged. Empty input executes no per-entry validation and returns an empty array after constructing seven group objects and seven empty filtered arrays. Both helpers are pure on that path. The owned layout consumes only the resulting groups for format navigation at lines 55–67.

   All four canonical route callers remain unchanged. Distro still supplies its named slot, and `StoreDistroCatalog.astro:21` retains its own real grouping. The new crate format mapping, bin eligibility and card order remain untouched.

   **Prior disposition:** Preserved. **Production reduction:** Two helper calls and their empty grouping allocations avoided per non-All render; no function deletion or measured timing claim. **Retain:** All selection, validation, group order/counts and base-aware format destinations. **Focused verification:** `pnpm test web-layouts`, the existing `store-collection.test.ts` cases, and comparison of All format links versus the other category presentations.

3. **Remove the redundant browser Location truthiness guard.**

   [RedirectLayout.astro:33](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/layouts/RedirectLayout.astro:33) remains `if (window.location && redirectTarget)`. Change only this condition to `if (redirectTarget)`.

   This is a native inline browser script that already accesses `document` and `window`; `window.location` supplies the browser Location object. The nullable script/target checks remain necessary. Current callers are legacy Distro (`pages/distro/index.astro:8–13`), Shop (`pages/shop/index.astro:9`) and empty Merch (`pages/store/merch/index.astro:14–19`). Only Distro opts into fragment preservation; all retain base-aware destinations.

   **Prior disposition:** Preserved; unchanged detailed browser-platform proof is in the original report. **Production reduction:** One property read and truthiness operand, with no line-count reduction. **Retain:** Fragment opt-in, `location.replace`, canonical URL, meta refresh and visible fallback link. **Focused verification:** Layout and redirect source tests, plus Local fragment-preserving Distro and JavaScript-disabled fallback navigation. Existing source tests alone do not execute browser replacement.

**Rejected simplifications and coverage to retain**

- Passing SiteLayout's settings into private AppShell still changes the read point. The unchanged preview regression at `published-reader.test.ts:69–88` requires fresh projection after preview records change. Retain both reads.
- Removing exported layout props or aliases weakens the public interface. Retain metadata precedence, image conversion, URL handling and social URL filtering; current schema changes do not prove every preview value satisfies stronger assumptions.
- Removing listing-price document guards, rejection handling, abort controllers or generation checks remains unsafe. The unchanged activation tests cover direct-load adoption, shell-first execution, wrong document/route rejection and cancellation. Removing old Coverflow sanitation from the connected presentation helper does not invalidate these safeguards.
- Merging RedirectLayout into SiteLayout adds shell output and execution to compatibility redirects. Keep the smaller redirect surface.
- Preserve distinct crate tests for eligible bins, complete server Grid, disabled controls, hidden enhancement before readiness, lazy loading, snapshot cleanup, filter coordination and touch/overscroll rules. Preserve card action, availability/preorder, image-priority, native-link and format-key checks. No blanket test deletion is justified.
- Do not change Distro membership while simplifying. Current collection tests (`store-collection.test.ts:238–247`) and refreshed browser evidence (`store-formats.spec.ts:485`) retain BlackBox-release exclusion, while the concurrent category delta describes mixed sources. Reconciling that discrepancy would change behavior and lies outside this cleanup.
- Do not redesign the crate, alter its thresholds, remove its wrapper, precompute through a new cross-module API or change player/security boundaries. No owned-source proof establishes a safe deletion there.

**Graph, moving-source and verification limitations**

Existing Graphify queries used budget 2500 and were narrowed after truncation. Graphify still shows obsolete Coverflow layout relationships and has no `StoreCrate.astro` node. CodeGraph supplied current source; exact reads filled omitted excerpts and established the new connections. Neither graph was initialized, enriched or refreshed.

HEAD advanced during review, while owned bytes remained stable. The connected browser suite changed to Crate during the closing audit; its relevant order/filter/restoration and no-JavaScript cases were inspected at `store-formats.spec.ts:464–573`. Later changes to connected `crate-view.ts` and `crate.css` were also inspected: switching during animations, sticky-bar visibility bounds and scroll spacing. Their host API, image reuse and owned-test hooks remain compatible. Both hashes matched between the 14:06:50 snapshot and the 14:08:02 read:

- `crate-view.ts`: `ab163816fae7cdfaa8719614561693ea514a21b9d074c651c574509fa54b78fb`
- `crate.css`: `9a1a6b7f1571b68e10739e34283627ecf01afdc550b974bba48160a7547af79e`

There are no uninspected current owned files. These findings are source-bound review evidence, not runtime or visual acceptance. The persistent verification role should run the focused checks on its final source fingerprint and retain browser coverage for canonical order, Grid/Crate filtering and restoration, enhancement failure, no-JavaScript navigation, accessible controls and persistent-player continuity. No checks were executed by this reviewer.
