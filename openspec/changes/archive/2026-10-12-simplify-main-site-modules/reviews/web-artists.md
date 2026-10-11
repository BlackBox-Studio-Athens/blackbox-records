# web-artists — module 10/29 read-only review

What this module does: It renders artist cards for Home and Artists, renders artist details for direct pages and shell overlays, and filters the server-rendered roster through an exact-first search adapter. The review found one justified deletion and two smaller behavior-preserving simplifications.

Every owned source and test was inspected. No repository files, OpenSpec records, graphs or generated outputs were written. No tests, builds or mutating checks were run.

## Source identity and ownership

Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`, HEAD `3355c335226838f996efb5536f55271f819a3e14`. Closing checkout inspection: `2026-10-10T11:24:17Z`.

Ownership is `apps/web/src/components/artists`. Its closed boundary exports `ArtistCard.astro`, `ArtistDetailContent.astro` and `ArtistsRosterFilters.tsx`. The search adapter is internal. Dependencies remain `player`, `storefront-catalog`, `ui-foundation`, `web-platform` and the declared content-model interface. No nested module or generated source was found inside the assigned root.

All six owned files had identical SHA-256 values at the initial and closing inspections. The module had no working-tree changes.

| Owned file                     | Lines | SHA-256                                                            |
| ------------------------------ | ----: | ------------------------------------------------------------------ |
| `ArtistCard.astro`             |   108 | `e7a143ceb98d8f3b6baeaeeb1922a16c3a0476d37c95833201d2bf760ab05454` |
| `ArtistDetailContent.astro`    |   367 | `ea188dba1f65aeb20312b780ebe6cb54341d9f4714f11c0890c19819bcaade74` |
| `ArtistsRosterFilters.tsx`     |   127 | `7d84a2edee831a77799076062dcfe64fa50d87195dfe06a56876cd8cf32ab35f` |
| `artist-roster-search.ts`      |    20 | `07fba20770c8b7be5b590fc3c737312c2f7f3f957ff24e5bcaf6674aac01b613` |
| `artist-roster-search.test.ts` |    38 | `57270701373026dae1e20d4cd9b233e36d7dd8d3bf06babfe36b8ddc2ea098fe` |
| `project.json`                 |    27 | `2e545f3f4e9a66139db5c98f8e9e42c232c7b13bc6fd4aab995495d6c8d6f216` |

Ten critical caller/dependency files also matched across the closing fingerprint comparisons: Home, Artists index, both artist detail routes, `ShellPortalOutlets.tsx`, `catalog-data.ts`, `site.ts`, both exact-first search files and `_artist-roster-layout.test.ts`. Other modules had changes in this shared checkout. The implementation thread should recheck the affected source before applying these recommendations.

## Should fix

### 1. Delete the test-only exact-match wrapper and its corresponding test

**Files and lines:** [artist-roster-search.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/artists/artist-roster-search.ts:3), lines 3 and 11–13; [artist-roster-search.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/artists/artist-roster-search.test.ts:14), lines 5 and 14–18.

**What this is:** `getArtistRosterExactMatches` forwards to the shared `getExactFirstMatches`, supplying `item.title` as the text reader.

**Problem and current proof:** Its only caller is the first test in the owned test file. Repository-wide source/reference searches found its declaration, test import and test invocation, with no production caller. The live filter imports and constructs `createArtistRosterSearcher` at `ArtistsRosterFilters.tsx:4,62`; that factory calls the shared searcher directly at `artist-roster-search.ts:19`. The wrapper is also outside the module’s declared public entrypoints.

**Smallest deletion:** Remove `getArtistRosterExactMatches`, its `getExactFirstMatches` import, and the test named `returns only exact substring title matches before fuzzy fallback`. Update the test import to retain only `createArtistRosterSearcher`. Keep the remaining adapter and shared search implementation.

**Behavior and meaningful coverage to retain:** The owned test at lines 20–25 already exercises the live adapter with the same `ch` query and expected `Chronoboros` result. Keep that test, typo fallback at lines 27–31, and empty-query ordering at lines 33–37. Shared [exact-first-search.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/exact-first-search.test.ts:73) additionally verifies that an exact result excludes competing fuzzy results; its lines 22–38 cover synchronous results and the later fuzzy-ready notification. Removing the wrapper test loses coverage of a function that will no longer exist, while retaining coverage of the production path.

**Focused checks:** `pnpm test web-artists` and `pnpm test apps/web/src/lib/exact-first-search.test.ts`. Confirm that no `getArtistRosterExactMatches` references remain.

**Expected reduction:** One unused function, one import entry and one test; approximately 11 lines before any additional import formatting reduction.

**If skipped:** A private function and test continue to maintain a second entrypoint that the application never uses.

## Nice to have

### 2. Calculate the visible-count label directly

**File and lines:** [ArtistsRosterFilters.tsx](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/artists/ArtistsRosterFilters.tsx:27), lines 1 and 27–29; the sole label consumer is line 108.

**What this is:** `useMemo` caches a short string containing the count and its singular or plural noun.

**Problem and current proof:** The calculation reads one number and produces a primitive string. Its only consumer is text inside a `<p>`; it is not an effect dependency or a value whose object identity protects a child from rendering. The calculation performs no search, DOM access or side effect. React describes `useMemo` as a performance optimization for cached calculations. [Official React documentation](https://react.dev/reference/react/useMemo).

**Smaller implementation:** Remove `useMemo` from the import and replace the three-line memo block with:

```tsx
const visibleLabel = `${visibleCount} ${visibleCount === 1 ? 'artist' : 'artists'}`;
```

**Behavior and meaningful coverage to retain:** Preserve the exact labels for zero, one and multiple artists. Leave `visibleCount`, both effects, fuzzy-ready revision handling, Clear search and all DOM updates unchanged. This does not justify a new test that merely asserts the implementation’s choice of hook.

**Focused checks:** `pnpm test web-artists`, followed by the normal affected lint/type checks through the verification thread. If the filter UI is exercised in the browser, retain the same count text during search and clearing.

**Expected reduction:** Two lines and one unnecessary memo hook. No measured speed improvement is claimed.

**If skipped:** The component retains cache and dependency bookkeeping for a trivial string calculation.

### 3. Use the existing artist-detail path helper

**File and lines:** [ArtistCard.astro](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/artists/ArtistCard.astro:21), lines 5–6 and 21.

**What this is:** The card builds its destination from the artist slug and the project-relative URL helper.

**Problem and current proof:** [catalog-data.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/catalog-data.ts:131), lines 131–133, already exports `createArtistDetailPath`, which performs the identical operation:

```ts
return createProjectRelativeUrl(`/artists/${artistProfile.data.slug}/`);
```

The card’s two live callers are Home at `pages/index.astro:72` and Artists at `pages/artists/index.astro:33–39`. Both pass the same artist entry shape and already import catalog data. `catalog-data.ts` is a declared public entrypoint of an existing allowed dependency, so this reuse needs no boundary change.

**Smaller implementation:** Remove the separate `createProjectRelativeUrl` import, extend the existing catalog-data import, and call the existing helper:

```astro
import { createArtistDetailPath, type ArtistRosterReleaseContext } from '@/lib/catalog-data';

const artistUrl = createArtistDetailPath(artist);
```

**Behavior and meaningful coverage to retain:** Preserve the slug, trailing slash and Local base-path prefix. Keep the link element, accessible artist name, prefetch attribute and both card variants exactly as they are. Neither caller needs an edit.

**Focused checks:** `pnpm test web-artists` and `pnpm test apps/web/src/pages/_artist-roster-layout.test.ts`. For browser acceptance, confirm that Home and Artists cards still reach the same artist URL and open the normal shell detail overlay. Existing Home swipe-row coverage remains valuable and should stay.

**Expected reduction:** Approximately one import line and one duplicated route-construction rule. This is a clarity and ownership improvement; no bundle or runtime speed claim is made.

**If skipped:** Artist cards retain their own copy of a route rule already owned by catalog data.

## Rejected simplifications and behavior to preserve

- **Deleting either card variant:** Both are live. Home passes `featured-roster`; Artists passes `roster-detailed`, including release context and image loading/priority inputs. The detailed biography and release metadata are observable output.
- **Removing blurred image copies or changing image geometry:** `ArtistCard.astro:40–64` and `ArtistDetailContent.astro:77–98` render separate decorative fill and informative foreground images. `_artist-roster-layout.test.ts:30–49` explicitly protects the whole-photo framing and blurred fill. Image-markup tests also distinguish the foreground portrait from the decorative copy and check contained-image sizing.
- **Removing filter cleanup, null handling or fuzzy-ready state:** The shell mounts the filter through `ShellPortalOutlets.tsx:92–100`, with the active pathname as its key and `pageKey`. Cleanup restores row visibility and clears the searcher reference. The shared searcher can return exact-only results before its asynchronous fuzzy loader resolves, then invoke `onFuzzyReady`. These paths have distinct lifecycle purposes.
- **Replacing the remaining artist search adapter with direct shared-library calls:** The adapter provides the title-only text reader and keeps artist-specific search tests tied to that rule. Its small size alone does not justify removing it.
- **Changing release selection or discography ordering:** The detail renderer selects the first upcoming release before the first out-now release, then excludes that release by ID from the existing catalog order. The release-feature tests cover availability, UTC date handling and presentation ordering. Choosing a different “latest” release would change behavior.
- **Collapsing editorial-body, biography and pending-profile fallbacks:** `EditorialContent.astro` distinguishes portable editorial content from legacy rendering. Artist detail separately chooses editorial content, biography or pending copy. These are supported content shapes, not interchangeable defensive branches.
- **Changing profile links or player inputs:** Profile links use `resolveLinkAttributes`, including external-link security attributes. Listen data comes from the selected release’s validated provider fields and stable release ID. Artist profile links must remain outbound navigation.
- **Factoring every section class expression or shortening isolated fallbacks:** The repeated section markup names different rendered sections. No demonstrated maintenance or performance problem justifies another helper or broad template rewrite.

There is an existing specification mismatch: `artist-roster-presentation` and parts of `site-images` describe native-aspect prints, while current source and layout tests preserve fixed frames with blurred fill. `artists-search` also describes genre/sort/A–Z features beyond the current text filter. This review preserves current observable behavior and proposes no reconciliation or product changes. Those discrepancies should remain separate from this refactor’s acceptance.

## Inspected connected scope

In addition to all 622 owned implementation lines, the 38-line owned test and module metadata, the review inspected:

- Home and Artists composition, direct artist detail and overlay routes, and the complete `ShellPortalOutlets.tsx` caller.
- Exact-first search implementation and tests; relevant catalog sorting, artist release context, release lookup and route helpers; release availability implementation and tests.
- Editorial rendering, Prose, player-data derivation and Listen-trigger markup, image helpers, Card primitives, class merging and link attributes.
- Relevant artist schema fields, roster layout tests, artist prose styling assertions and image-markup regression cases.
- Home swipe-row browser tests and relevant Artists navigation/player-history test sections.
- Required agent instructions, Ponytail sources, task proposal/design/tasks, applicable domain specs and feedback policy.

## Graph and verification notes

Both required graph tools were used against their existing indexes. Graphify’s initial `--budget 2500` query found 335 nodes and omitted 267. Focused entrypoint explanations and narrowly filtered existing-graph relationships established the relevant direct connections; the broad traversal was not treated as complete. An ambiguous filter-symbol lookup was resolved with its exact node ID. Archived inferred references were not used as deletion proof.

CodeGraph returned current source for the owned files and connected callers. Its artist-detail output still contained gaps after a focused file query; bounded exact reads filled those gaps. One browser test was omitted from the CodeGraph result and was read directly. No index initialization, enrichment, rebuild or paid API was used. Official React documentation was retrieved through Context7 for the memoization finding.

The implementation thread can keep all edits inside the assigned module and its owned test. The persistent verification thread should own shared validation, graph refresh and source-bound acceptance evidence. The focused commands above are recommendations, not passing results. Unit tests do not establish browser acceptance for filter counts, clearing, phone Enter behavior, card navigation or shell/player continuity.

**Verdict:** Review complete. Finding 1 is the clearest deletion; findings 2 and 3 are small, justified simplifications. The card and detail renderer otherwise warrant no larger refactor from this review.

**Lean:** Approximately 14 source/test lines removable across all three findings, before formatter-dependent import collapse.

**Not checked:** Tests, builds, browser execution and performance measurements were not run in this read-only role. No unresolved obstacle prevents implementation from independently verifying these findings.

## Retained source provenance

Complete received review above, preserved from `.codex-artifacts/simplification/10-web-artists-review.result.json`.

- Reviewer thread: `01a1257c-3efc-7171-b973-c8c7db3887f0`.
- Reviewer turn: `01a1257c-5630-7e51-b494-d93b9d784ee9`.
- Raw review JSON SHA-256: `2fab1195ffd76797fc222058cf60934668bbb4a73ff09cdbf8237c71130fa7d1`.
- Original reviewed HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Same fresh implementer: `01a12681-0be2-7293-b52d-81f86384145b`.
- READONLYPREP raw JSON: `.codex-artifacts/simplification/parallel-high-10-web-artists-preflight.result.json`, SHA-256 `b6683d22d1d3236fc373efb2e95d2fa88b9883832a92dc65527226beaed7b792`, turn `01a12681-217c-74a3-b3d9-c3df5ae6ab26`.
- Execution release permits implementation/scoped checks only; task acceptance remains verifier-owned.
