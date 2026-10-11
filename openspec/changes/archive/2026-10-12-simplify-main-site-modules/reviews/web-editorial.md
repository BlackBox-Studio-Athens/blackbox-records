# web-editorial — complete received review

Reviewer thread: `01a12587-0cbd-7cc3-9511-ec5e568117a4`.
Review turn: `01a12587-2f1b-7f90-84aa-48e697c7d449`.
Immutable source: [11-web-editorial-review.result.json](../../../../.codex-artifacts/simplification/11-web-editorial-review.result.json).
Raw source SHA-256: `7ea8cbb0ededcfe0c9260aead09e75cc6e71196cc97d43b9fee49994ffa018b5`.
Review source HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
Preserved by implementer `01a12681-0c97-72e1-8b08-931b36b13745` after execution release; the report below is complete. Its historical observations and verdict do not establish current module acceptance.

## Complete received review

**What this change does:** The web-editorial module renders the homepage hero, News cards/details, and Release cards/details. It also enhances physical-edition presentation from commerce reads and runs the homepage motto animation. This full-module review found two small, proven simplifications. No repository file was changed.

**Review identity and scope**

- Module: **11/29, web-editorial**.
- Role: read-only review of `apps/web/src/components/editorial`, including every owned source and test.
- Thread: `01a12587-0cbd-7cc3-9511-ec5e568117a4`.
- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD at both initial and final inspection: `3355c335226838f996efb5536f55271f819a3e14`.
- Final fingerprint check: `2026-10-10T11:35:56Z`.
- All **17 owned files** matched their initial hashes. The owned directory had no Git changes at either inspection.
- Inspected **11 source files and four test files, totaling 2,245 lines**, plus `project.json` and the referenced image asset. No nested module was present.
- The closed boundary permits the existing player, storefront-catalog, UI, web-platform, web-store, and content-model dependencies. Both proposed edits stay within owned files and preserve the provided interfaces.

The scope fingerprint is `4c60cc7b679b67abbe01bc41db721f5d28293a7274f33668be83d77fe6c7cc3b`. It hashes UTF-8 text containing the sorted relative path, one space, and lowercase file SHA-256 for all 17 files, joined with LF and no trailing LF.

**Should fix**

**1. Reuse the existing artist display-name helper** — [ReleaseCard.astro:43](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/editorial/ReleaseCard.astro:43), lines 43–44.

- **What this is:** ReleaseCard chooses the artist’s authored title when available. Otherwise it converts the referenced artist ID from hyphenated text to display text, with `Artist` as the final fallback.
- **Problem:** These two lines repeat the rule already provided by [resolveReleaseArtistDisplayName:139](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/catalog-data.ts:139). Maintaining both copies creates another place where the same domain rule can drift.
- **Fix:** Add `resolveReleaseArtistDisplayName` to the existing catalog-data import and replace the two local assignments with `const artistName = resolveReleaseArtistDisplayName(release, artist);`.
- **If we skip it:** Current behavior remains correct, but the card continues maintaining its own copy of the shared fallback rule.

**Concrete equivalence proof:** The existing helper computes `release.data.artist.id || 'Artist'`, then returns `artistProfile?.data.title || artistSlugFallbackName.replace(/-/g, ' ')`. For the current plain content records, this produces the same result as the card’s two assignments:

| Input                                         | Current card and existing helper |
| --------------------------------------------- | -------------------------------- |
| Profile title is `Afterwise`                  | `Afterwise`                      |
| Profile is absent; ID is `some-artist`        | `some artist`                    |
| Profile title is empty; ID is `some-artist`   | `some artist`                    |
| ID is empty and no profile title is available | `Artist`                         |

The helper accepts the same Release entry and optional Artist entry types. It is synchronous and performs no content read or external action. Its containing `catalog-data.ts` entrypoint is already imported by ReleaseCard and is a provided storefront-catalog interface in `apps/web/src/project.json`.

**Caller proof:** [releases/index.astro:30](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/pages/releases/index.astro:30) supplies the Artist entry from its ID map for both principal and remaining cards. [ReleaseDetailContent.astro:27](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/editorial/ReleaseDetailContent.astro:27), the Store Item projection in `catalog-data.ts`, and the retained release-feature demo already use the shared display-name helper.

**Behavior to retain:** Keep the exact artist text, artist-link destination, release-card accessible title, and embedded-player display title. Leave the card’s HTML, classes, image handling, provider attributes, and all variant behavior unchanged.

**Focused verification:** Run `pnpm test web-editorial`. The verification thread should also run the existing Releases page-layout check and the relevant release-merchandising browser spec. The browser spec checks the `Afterwise` link and keeps artist, release, purchase, and listening targets independent. No new helper or implementation-mirroring test is needed for this substitution.

**Expected reduction:** Two local assignments become one call to an existing helper. This removes one duplicate rule and approximately one source line before import formatting. No measured performance improvement is claimed.

**Nice to have**

**2. Remove the duplicate CD preorder assertion without deleting its test case** — [ReleaseCatalogPresentation.test.ts:203](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/editorial/ReleaseCatalogPresentation.test.ts:203), lines 203–209.

- **What this is:** The assertion verifies that a native CD edition with the matching preorder record produces `Pre-order CD`.
- **Problem:** The format lifecycle table at [line 238](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/editorial/ReleaseCatalogPresentation.test.ts:238) already performs this assertion for CD with identical inputs. The earlier assertion adds no distinct regression case.
- **Fix:** Delete only lines 203–209. Keep the surrounding test’s editorial-state, stable unranked-order, and empty-catalog assertions. Adjust its title to describe those retained cases if needed.
- **If we skip it:** The suite repeats the same CD check, adding a little maintenance and execution work without additional coverage.

**Concrete coverage proof:** Both assertions construct an entry from `entries[0]` with `{ kind: 'native', format: 'cd', storeSlug: 'lotus-vinyl' }`, pass the same `records[0]` and fixed `today`, and expect `Pre-order CD`. In the retained table, the CD row is `['cd', 'CD', 'CD']`, and line 253 checks the same preorder action.

The retained table also independently covers announcement badges, regular buying actions, and sold-out wording for vinyl, CD, and cassette. The assertions at lines 210–218 retain their separate value: an edition with `kind: 'none'` stays editorial, equal unranked priorities keep catalog order, and an empty catalog returns an empty remainder.

**Focused verification:** Run `pnpm test apps/web/src/components/editorial/ReleaseCatalogPresentation.test.ts`, or use the module check above to cover both findings. Confirm that the three format rows and the surrounding test still execute. This finding alone needs no browser acceptance because it changes only a duplicate assertion.

**Expected reduction:** Seven assertion lines. No complete test case, fixture, public interface, or distinct behavior check needs deletion.

**Rejected simplifications and behavior that must stay**

- **Remove the merchandising `states` map or its `records` parameter:** Rejected. The production Releases page currently destructures only `principal` and `remainder`, but the exported helper returns `states`, and owned tests consume it for unavailable, unknown, announced, and newly opened editions. Removing it changes the helper’s interface and discards useful coverage. See [ReleaseCatalogPresentation.tsx:14](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/editorial/ReleaseCatalogPresentation.tsx:14) and test lines 94–110 and 159–171.
- **Change principal eligibility or reorder cards from live offers:** Rejected. Current source and browser tests intentionally retain server-rendered geometry while offers load, fail, or change. The baseline presentation spec contains different selection language in places; resolving that disagreement would change behavior and belongs to separate work.
- **Delete unknown-state, price-readiness, slug-matching, or neutral-presentation checks:** Rejected. The listing reader returns JSON through a type assertion, so the TypeScript contract alone does not establish runtime validity. These checks prevent positive buying claims for unmatched, unavailable, or unrecognized data. The pure tests and ReleaseStoreLink tests cover distinct cases.
- **Remove shell snapshot sanitization:** Rejected. [shell-page-snapshot.ts:192](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/components/app-shell/navigation/shell-page-snapshot.ts:192) calls the editorial sanitizer before restoring cached markup. The cached-return browser cases verify that stale Buy/Pre-order actions are absent before a fresh unavailable or failed read settles.
- **Remove abort guards or empty failure handlers:** Rejected. Both presentation paths must ignore responses after disposal and retain useful neutral output after failed reads. ReleaseStoreLink explicitly tests failed reads and responses arriving after unmount.
- **Replace the catalog connector’s ID map with positional pairing:** Rejected without a stronger contract. The replacement would change behavior for duplicate IDs because the current map chooses the last card for an ID. A positional loop is not equivalent across the connector’s existing inputs.
- **Delete currently unused card variants or optional props:** Rejected. A lack of current production callers does not establish permission to remove supported component inputs and their rendering behavior under the required interface-preservation constraint.
- **Delete News image/summary guards based only on collection types:** Rejected. The public collection schema requires those fields, but runtime and preview builds substitute a request-scoped content reader. Static Astro types alone do not prove those rendering guards are redundant for every runtime projection.
- **Simplify the motto by removing cached-stage recovery, lifecycle cleanup, metric invalidation, motion-loading fallback, or reduced-motion handling:** Rejected. These paths serve different behaviors. The Home motto browser tests exercise direct and shell entry, cached return, reduced motion, resize, and reuse of tear/waveform nodes. The pure tests protect casing, punctuation, unmatched text, deterministic bounded waveforms, and finite glitch bursts.
- **Delete source-inspection tests as a group:** Rejected. Connected tests protect image priority, gallery projection, typography, target separation, and shell enhancement. Their assertion style does not make their regression value redundant.
- **Merge Astro and React badge/action rendering into a new abstraction:** Rejected. The current paths serve server markup, DOM enhancement, and React rendering. A new layer would add scope and complexity without demonstrated reduction.

**Inspected owned scope**

All source and test content was inspected. SHA-256 prefixes below are for quick comparison; the full scope fingerprint above binds the complete file hashes.

| Owned file                           |        Lines | SHA-256 prefix |
| ------------------------------------ | -----------: | -------------- |
| `HomeHero.astro`                     |           59 | `aad81886351d` |
| `MottoWordCycleLoader.tsx`           |           12 | `9086aa277246` |
| `motto-word-cycle.ts`                |          377 | `6f086343e5d6` |
| `motto-word-cycle.test.ts`           |           44 | `fac8a4fbd98f` |
| `NewsCard.astro`                     |           72 | `7754a8d0d2b8` |
| `NewsDetailContent.astro`            |           64 | `74338843feef` |
| `ReleaseCard.astro`                  |          346 | `94d7d2d6c2bd` |
| `ReleaseDetailContent.astro`         |          314 | `cf160c7b5ff2` |
| `ReleaseCatalogPresentation.tsx`     |           78 | `4d28b84c357a` |
| `ReleaseCatalogPresentation.test.ts` |          259 | `0c937cba686a` |
| `ReleaseStoreLink.tsx`               |           79 | `b373d23d757a` |
| `ReleaseStoreLink.test.tsx`          |          204 | `635d962ea45d` |
| `release-commerce.ts`                |           64 | `3ca1e16ea6ac` |
| `release-commerce.test.ts`           |          100 | `c59c4876382b` |
| `release-presentation.ts`            |          173 | `df956156acee` |
| `project.json`                       |           37 | `af6a6dbefc92` |
| `vinyl-record.webp`                  | Binary asset | `be2adb1a8393` |

Connected inspection covered Home, Releases and News composition; direct Release/News routes; both overlay routes; the retained release-feature demo’s commerce caller; the shell snapshot sanitizer; catalog name, identity, format and Store Item helpers; the listing-price reader; availability and preorder copy; player-data derivation and Listen markup; content schemas and runtime reader substitution; and relevant page, style, release-merchandising, and Home motto regression cases.

Important connected source identities at the final recheck:

- `apps/web/src/lib/catalog-data.ts`: `1e1fe9045c7b9f5041d7e5c59d0ca437c6ae01b321fa274b4c11deb87db405b6`.
- `apps/web/src/project.json`: `a18eb64f2bb5ac6a436ea4ae422aef602924a0318eeecea7fcf66af15576f0c7`.
- `apps/web/src/pages/releases/index.astro`: `c7a4cabe8a52574895a7a0905ccfd9b5ba3267efe05708e3a4f803a686f6787f`.

**Graph evidence and moving-source limitations**

Both required graph tools were used before substantive source investigation. The initial Graphify query used the 2,500-token budget and was truncated, showing 69 of 543 nodes. It was followed by focused explanations of ReleaseCatalogPresentation, ReleaseCard, HomeHero, NewsCard, and the motto module, plus targeted paths. These established extracted relationships through catalog-data to the artist-name helper, from the catalog connector to release-presentation, and from News detail to EditorialContent.

CodeGraph supplied current source, call paths, and consumer/test navigation. Some responses elided source even while labeling it complete; exact bounded reads filled every owned source/test gap. A lookup using the wrong `.tsx` extension for StoreListingPricePresentation was resolved to the actual `.ts` file. The two-line content-reader re-export was inspected directly when it was not returned by the index.

Other web-platform files and generated backend files changed during the review, and CodeGraph reported pending indexing outside this module. The owned editorial files stayed unchanged throughout. Architectural output was used for navigation; the findings rely on current source and test evidence. No graph initialization, rebuild, enrichment, extraction agent, or paid API was used.

**Verification handoff**

No tests, browser sessions, builds, validation commands, or mutating checks were run by this read-only role. Existing test definitions were inspected; their execution is not claimed.

An implementation thread can handle both findings within `ReleaseCard.astro` and `ReleaseCatalogPresentation.test.ts`. It should first recheck the recorded source and run `pnpm openspec:guard`, then make ordinary native patches and run the focused module tests. The persistent verification thread retains ownership of shared page/browser checks, graph refresh after a meaningful code batch, final `pnpm validate`, and OpenSpec task updates.

The main browser recommendation for finding 1 is `pnpm test:e2e e2e/release-merchandising.spec.ts`. Preserve all existing player, shell, motto, image, and typography coverage; broader continuity checks are necessary only if implementation expands into those behaviors.

No source, test, OpenSpec record, report file, graph, generated output, or transient log was saved. Only this review’s required claude-mem progress state was updated and closed.

**Verdict: Ship.** Neither finding is a correctness or security blocker within this cleanup scope. The implementation thread should independently verify findings 1 and 2 before applying them.

**Lean: approximately -8 lines possible**, subject to import formatting. The main benefit is removing one duplicate domain rule and one identical assertion.

**Not checked:** Runtime execution, browser acceptance, measured performance, provider behavior, and release acceptance. This completed source review establishes no passing validation or release evidence.
