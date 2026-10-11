# web-editorial implementation handoff

**Assigned implementation and scoped checks complete; module acceptance remains deferred.** Tasks 11.1/11.2 and all shared acceptance markers remain verifier-owned and unchanged by this thread.

## Identity and retained evidence

- Module 11/29; ownership: `apps/web/src/components/editorial`, with no nested module.
- Implementer: `01a12681-0c97-72e1-8b08-931b36b13745`; reviewer: `01a12587-0cbd-7cc3-9511-ec5e568117a4`.
- Existing `main` checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`.
- Before/after HEAD: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`; no commit or branch change.
- [Complete received review](../reviews/web-editorial.md), including reviewer/turn identity and immutable source hash. Markdown formatting was normalized without removing review content.
- [Immutable review](../../../../.codex-artifacts/simplification/11-web-editorial-review.result.json): SHA-256 `7ea8cbb0ededcfe0c9260aead09e75cc6e71196cc97d43b9fee49994ffa018b5`; turn `01a12587-2f1b-7f90-84aa-48e697c7d449`.
- [Immutable preparation](../../../../.codex-artifacts/simplification/parallel-high-11-web-editorial-preflight.result.json): SHA-256 `374f20c15dc0c44550fdfd54295fc5a515d0c78474e337f6e9086c01b06969f2`; turn `01a12681-2901-7b92-991c-f90c05a53def`.

## Independently verified decisions

**Finding 1 accepted and implemented:** `ReleaseCard.astro` now imports and calls the existing `resolveReleaseArtistDisplayName(release, artist)`. Both rules prefer a truthy authored title, otherwise replace hyphens in the artist ID, otherwise use `Artist`. Current helper source and the Releases page's artist-ID map preserve the same plain content inputs and optional Artist type. The entrypoint was already imported and remains a provided interface of an allowed dependency. The helper is synchronous and performs no content read or mutation.

Artist text, link destination, accessible card title and embedded-player display title remain identical. Markup, classes, image handling, provider attributes, props and variants are unchanged.

**Finding 2 accepted and implemented:** deleted only the seven-line standalone `Pre-order CD` assertion. The retained CD lifecycle-table row constructs the identical native edition from `entries[0]`, uses `records[0]` and fixed `today`, and expects the identical action. The surrounding test remains, renamed to describe its editorial, unranked-order and empty-catalog checks. All vinyl/CD/cassette announcement, buying, preorder and sold-out checks remain.

Neither numbered finding was rejected. The review's rejected alternatives remain excluded: exported merchandising state/input contracts, selection/order, runtime readiness/slug/unknown validation, neutral cached restoration, abort/error handling, duplicate-ID map semantics, supported props/variants, News guards, motto lifecycle/motion behavior, meaningful source-inspection tests, and a new shared renderer abstraction. Their full reasons remain in the preserved review; no related code was changed.

## Changes and measured reductions

| Changed owned file                           | Added | Removed | Net removed |
| -------------------------------------------- | ----: | ------: | ----------: |
| `ReleaseCard.astro` — production             |     2 |       3 |           1 |
| `ReleaseCatalogPresentation.test.ts` — tests |     1 |       8 |           7 |

Production reduction: **1 line**. Test reduction: **7 lines**. Production/test files deleted: **0/0**. No formatting-only source reduction is included; audit Markdown is excluded. No new abstraction, dependency, fixture or complete test-case deletion was introduced. No measured performance improvement is claimed.

## Source binding and drift

At execution entry, all 17 owned files exactly matched the review/preparation scope, so the completed whole-module inspection was reused. The current finding source/test lines and changed caller delta were rechecked. Only the two intended owned files differ afterward; the other 15 owned files are byte-identical.

| Fingerprint                      | Before                                                             | After                                                              |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Owned 17-file scope              | `4c60cc7b679b67abbe01bc41db721f5d28293a7274f33668be83d77fe6c7cc3b` | `ba1cded71f9758513c633def57c6cae8bb0c8e34e2c4b5a62863b61c2561b2a7` |
| Seven finding/acceptance callers | `cb5b2991c7d18d1b31d2f83c6abf2499b890cc8cf3702deae8bf0c172da35448` | `cb5b2991c7d18d1b31d2f83c6abf2499b890cc8cf3702deae8bf0c172da35448` |

The caller fingerprint differs from preparation because `catalog-data.ts` acquired the other owner's artist-roster sorting simplification. That exact delta was inspected; `resolveReleaseArtistDisplayName` remains unchanged. Its current full-file hash is `6af088ae6a4a323e12e3383773a97e75d90da6bb28df961c71513a860be4ab1d`. Other captured callers match preparation. Existing Crate/sanitizer, listing-reader and logo-export work was preserved.

The [before](../../../../.codex-artifacts/simplification/web-editorial-implementation/before.json) and [after](../../../../.codex-artifacts/simplification/web-editorial-implementation/after.json) records retain complete sorted path/hash manifests, HEAD, timestamp and shared-task hash. Aggregates hash UTF-8 sorted relative path, one space and lowercase SHA-256, joined with LF and no trailing LF. Source capture after focused checks: `2026-10-10T17:37:07Z`.

Both existing graphs and the exact-source proofs were used during preparation. Relevant imported helper, caller and presentation relationships remain valid; graph output was not rewritten. Final both-graph freshness remains verifier-owned.

## Checks and resource state

[Machine results](../../../../.codex-artifacts/simplification/web-editorial-implementation/results.json) retain commands, exits, counts and evidence paths. No passing check was repeated for counts, and no broad consumer selection was started.

- `pnpm openspec:guard`: passed.
- Guarded OpenSpec status/apply reads: passed; `spec-driven`, apply `ready`, 10/60 accepted tasks. Read every current apply context file: proposal, design and tasks.
- `pnpm test web-editorial`: passed, **4 files / 47 tests**, 0/1 Nx cache hits. [Test log](../../../../.codex-artifacts/simplification/web-editorial-implementation/test.log).
- ESLint on the two changed files: passed; existing boundary-plugin deprecation warnings only. [Lint log](../../../../.codex-artifacts/simplification/web-editorial-implementation/lint.log).
- Initial scoped Prettier check: both code files passed; the review required Markdown normalization, applied with native patch. [Original result](../../../../.codex-artifacts/simplification/web-editorial-implementation/format-initial.log). Final own-report format result is recorded in the machine results.
- Scoped `git diff --check`: passed for owned code; final report/source integrity checks are recorded in the machine results.

No module typecheck target exists. Package/global type gates are explicitly deferred to the verifier; no compiler loader or substitute probe was introduced.

Test and lint sessions exited. Final shared resource observation: **0/3 slots held**, primary port 4321 free, no full Local stack, Chrome lease free, no maintainer grant. This thread started no server, browser, controller or provider action.

## Acceptance rows and remaining gates

Frontend display/accessibility and shell/player continuity remain subject to verifier acceptance. The existing Releases page-layout regression and `pnpm test:e2e e2e/release-merchandising.spec.ts` cover artist/title/purchase/Listen target separation and cached neutral restoration. No Home, News, motto, routing or player lifecycle implementation changed.

The verifier owns combined affected/package checks and types, shared e2e/browser/normal Local union acceptance, both-graph freshness, final-current-tree `pnpm validate`, strict OpenSpec task-30 gates and shared task markers. Commerce authority, staff/CMS/publication, hosted/provider and release acceptance are not introduced by this slice. No commits, push, deployment, publication or external-service mutation occurred.
