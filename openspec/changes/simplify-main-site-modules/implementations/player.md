# Player implementation — module 6/29

**Status:** Completed scoped implementation and required owned tests/lint. Shared acceptance remains verifier-owned. All three received findings were independently verified and accepted. No unrelated behavior changes or new abstractions were introduced.

**Role:** Fresh implementer `01a1263d-5cf0-7cd2-8995-04aed53dddca`, separate from reviewer `01a12561-133f-7500-b99a-bbd5b0743583`. Work stayed on `main` in the existing `C:/Users/SVall/WebstormProjects/blackbox-records` checkout. Implementation ownership was `apps/web/src/components/music` only, plus this module's reports and ignored evidence. Shared `tasks.md` was not edited.

## Decisions and proof

1. **Accepted: remove the private cross-origin option.** `appendHeadLink` is unexported; its only two calls passed literal `false`. Removing the argument, parameter and assignment cannot change current execution. The public shell controller supplies providers, document and warmed-origin set only. Preconnect precedes DNS-prefetch; duplicate-link and missing-head guards, omitted cross-origin attributes, and `warmedOrigins.add` timing remain unchanged. All four warm-up tests remain.
2. **Accepted: remove the unused Astro mock.** Current `music.ts` imports only content-model provider builders. The current barrel/import closure, package dependencies, module-test configuration and network setup contain no `astro:config/client` consumer. Removed only the mock registration and unused `vi` binding. All provider URL, identity/title, ordering and authored Release fixture assertions remain. The whole owned suite passes without the mock.
3. **Accepted: merge the presentation returns.** The six fields remain in their original order. With no session, readiness and loading stay false, dismissal stays Close, mini-player visibility stays false, and provider copy remains neutral. With a session, each expression reduces to its previous active expression. A fresh probe transpiled the actual saved before and current after sources separately and compared 144 combinations of flags, optional statuses and absent/empty/normal/whitespace/separator labels: zero differences. Added one distinct regression comparing idle input with stale loaded/interacted/minimized flags and a provider label against neutral idle output. Existing direct UI, machine and shell assertions remain intact.

**Rejected/deferred candidates:** No received numbered finding was rejected. Retained the review's rejections: last-provider-wins selection, iframe lifecycle/cache machinery, load-plus-interaction semantics and runtime no-op guards, `includePlayerData`, distinct meaningful tests, and equalizer markup/styles/motion. No evidence authorized changing these contracts. The complete received review and its original source identity are preserved in [reviews/player.md](../reviews/player.md).

## Coverage and source identity

The full-module review was reused only after all 15 original owned file hashes and the committed directory tree matched. Its coverage includes eight production files, six test files and `project.json`, with no nested module or generated root. Independently inspected current edited code, all affected owned tests, current content-model import/configuration closure, shell warm-up and presentation calls, shell presentation assertions, and surface label consumers. Eleven owned files remain byte-identical. Closed boundary metadata, all eight entrypoints and allowed dependencies remain unchanged.

- HEAD before and after: `c97fb060c34575c4119c08b04999eedcd4714cf0`.
- Committed player tree: `391af5965664d4415f9021a4cb8159287e111b75`, matching the review.
- Owned SHA-256 before: `8d7279caec446c77cf27391dc85b8533e1699c0a21c9cdce36c7e8b91194cadd`.
- Owned SHA-256 after: `222f01e25dde6cbff462bd272193ac498333cf6bfc2734c110066874e6e4b16c`.
- Connected-input SHA-256 before/after: `b15c0b2308075a26dcfde5f357b1a0e70e4f254b3ae299369fd9cb0d65f9ae9b`.

Aggregates hash sorted repository-relative `path<TAB>lowercase-sha256` records joined by LF without a trailing LF. The original `before.json` capture initially labeled a basename-path aggregate as `ownedFingerprint`; the summary computes the correct repository-relative aggregate from its immutable individual hashes. `completion.json` uses the corrected convention. Full identities, line counts, exact diff and integrity checks are in [machine evidence](../../../../.codex-artifacts/simplify-main-site-modules/player-implementation/summary.json).

## Exact edits and reductions

| Owned file                  | Production net reduction | Test net reduction |
| --------------------------- | -----------------------: | -----------------: |
| `player-provider-warmup.ts` |                        3 |                  — |
| `player-session-ui.ts`      |                       11 |                  — |
| `music.test.ts`             |                        — |                  5 |
| `player-session-ui.test.ts` |                        — |                -13 |
| **Total**                   |                   **14** |             **-8** |

Positive values mean lines removed. Production: 405 → 391 lines. Tests: 833 → 841 lines. Overall: **6 net lines removed**. Deleted production files: **0**. Deleted test files: **0**. All original tests remain; one regression was added. Formatting, audit Markdown and ignored probes are excluded from code totals. No measured performance improvement is claimed.

## Commands and results

- `pnpm openspec:guard`: passed. Guarded `pnpm openspec -- status --change simplify-main-site-modules --json` and `pnpm openspec -- instructions apply --change simplify-main-site-modules --json`: ready, spec-driven, 10/60 accepted tasks; every returned context file read. Explicit assignment leaves task updates with the verifier.
- Existing Graphify used at budget 2500: complete focused explains for `apps_web_src_components_music_player_provider_warmup` (9 connections), `apps_web_src_components_music_player_session_ui` (10), and `apps_web_src_components_music_music` (18). Initial shorthand names were ambiguous and were replaced with exact node IDs. CodeGraph returned current source/call relationships before edits; omitted test/import/caller excerpts were filled with exact reads. Neither graph was initialized, enriched or rebuilt.
- `pnpm test player`: initial run passed 6 files / 41 tests, uncached. After shortening the added regression, final invocation passed the same 6/41 using Nx's source-keyed cache, 1/1 hit. [Final log](../../../../.codex-artifacts/simplify-main-site-modules/player-implementation/test-final.log) records the restored runner report and canonical JSON path. Only final-source evidence counts toward completion.
- `pnpm exec eslint apps/web/src/components/music --max-warnings=0 --no-warn-ignored`: exit 0. Existing boundaries-plugin configuration deprecation notices remain; no lint failure. [Lint log](../../../../.codex-artifacts/simplify-main-site-modules/player-implementation/lint.log).
- `node .../probe.cjs`: 144 comparisons, zero differences. [Probe](../../../../.codex-artifacts/simplify-main-site-modules/player-implementation/probe.json).
- Supplemental `node .../typecheck.cjs before` and `after`: both exit 1 with the **same single TS2578** in unchanged `packages/content-model/src/prose.ts:3` for an unused `@ts-expect-error`; **zero player diagnostics**. The before run substituted the saved pre-edit owned sources through a compiler host while using the same current dependencies. This ad-hoc compiler-API probe inherits Astro configuration and is not the repository's package type-validation target. It does not establish an actual project typecheck failure or a clean package check. Per parent routing, retain [before diagnostics](../../../../.codex-artifacts/simplify-main-site-modules/player-implementation/typecheck-before.json), [after diagnostics](../../../../.codex-artifacts/simplify-main-site-modules/player-implementation/typecheck-after.json), and their raw logs; defer real package/final-tree type validation without editing content-model. The original failed `typecheck.json` is retained too.
- Scoped Prettier write/check and `git diff --check`: passed; formatting introduced no additional source changes. Final integrity confirms four expected owned changes, matching connected inputs, unchanged task bytes, complete received review, and baseline-identical type diagnostics.

## Acceptance and verifier handoff

| Acceptance row           | This thread                                                                                                      | Required verifier follow-up                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shell/player/routing     | Owned helper tests, lint and source equivalence passed; exact labels, readiness, ordering and contracts retained | Scoped app-shell view-state/controller/surface checks; `pnpm test:e2e e2e/player-continuity.spec.ts` for minimize/reopen/Stop, iframe identity through navigation, Back and phone continuity while implementers are idle |
| Boundaries/task workflow | Metadata and shared tasks unchanged; guard passed                                                                | Coordinated graph refresh, affected/package type checks, strict OpenSpec, and tasks 6.1/6.2 updates only after acceptance                                                                                                |
| Final integration        | Deferred by assignment                                                                                           | Mandatory final-tree `pnpm validate`, source-bound global/type evidence and task 30 gates                                                                                                                                |

Staff/CMS, commerce/provider, publication and release acceptance rows are not selected by these internal player reductions. No shared Local/browser acceptance was run. Local provider fixtures do not prove real playback or embed focus/tap behavior; those remain unverified, as does performance profiling. No shared configuration/tooling/generated files, hosted services, APIs, content or other ownership roots were changed. No commit, push, deployment or publication occurred.
