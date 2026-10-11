# App-shell implementation handoff

Assigned implementation and scoped checks completed. Module acceptance remains pending with the persistent verifier; tasks 13.1/13.2 and every shared task marker remain unchanged. Parent explicitly released this same implementer while preceding acceptance was deferred.

## Identity and preserved evidence

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, existing `main`.
- Implementer: `01a1268b-04c8-76c0-949e-28e05b0fb6ae`.
- Reviewer: `01a1259f-6a1c-7473-95fd-07e397a664a9`; refresh turn `01a1260f-3d8e-72d2-9b63-9ce4b9313cb9`.
- Before/after HEAD: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`.
- Full received review is preserved in [reviews/app-shell.md](../reviews/app-shell.md), from [immutable review JSON](../../../../.codex-artifacts/simplification/13-app-shell-review-refresh-01.result.json), raw SHA-256 `51a71334f69526f8db8d7b83e4a71fefae52c73747472b7c56af705f82b0c5fa`.
- [Immutable preparation JSON](../../../../.codex-artifacts/simplification/parallel-high-13-app-shell-preflight.result.json), completed prep turn `01a1268b-1f82-7630-a028-ca6d456932eb`, raw SHA-256 `14a57608aaef15f1f9c645966be0063355c58aa09e3ccf308c2968b0812bb475`, remains unchanged.

Fingerprints are SHA-256 over path-sorted repository-relative path, NUL, file SHA-256 and newline records. [Before inventory](../../../../.codex-artifacts/simplification/13-app-shell-implementation/before.json) and [after inventory](../../../../.codex-artifacts/simplification/13-app-shell-implementation/after.json) retain every owned/caller hash, line count and exact changed path.

| Input                      | Before execution                                                   | After scoped checks                                                |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Owned, 91 files            | `86f6a25084dd681b00f6439a2f5a048ea27fab8ba873661696bafad10ab9af8e` | `dcfb0e1cbb5672ddcdbdfc065889fb97e8cdc18570fcb7c730cd477a58803a4f` |
| Selected callers, 26 files | `0b339d643a5147fad8e6b0623fb78d7a7a8fe492d1f907e2f3bc6bac802441dc` | `0b339d643a5147fad8e6b0623fb78d7a7a8fe492d1f907e2f3bc6bac802441dc` |

All owned bytes matched preparation at entry, so complete prior inspection of 45 production files, 45 test files and project.json was reused. Current finding callers/tests and proofs were retained against those matching bytes. No nested project or generated source was edited. The sole public export, closed boundary and dependencies in project.json remain unchanged.

Two connected inputs changed after preparation: `store/crate/crate-view.ts` removed its duplicate transition argument and reused `land()` for cleanup; `e2e/player-continuity.spec.ts` prepares mobile touch geometry before arming Stop and performs the second touch inside the existing confirmation window. Exact deltas were inspected. Both external edits remain untouched and neither invalidates the accepted findings. No selected caller drift occurred during this implementation/check interval.

## Findings and proof

1. **Accepted and implemented: duplicate idle scheduler.** Root already used the surface scheduler; both implementations used a 2,000 ms idle deadline, 200 ms fallback and matching cancellation. The mount now calls `scheduleShellIdleTask(window, callback)` and the snapshot-specific function/type/constant/import are deleted. Consolidated scheduler tests retain explicit default and 1,500 ms custom deadlines, cancellation and exact fallback delay. Lifecycle coverage retains immediate island-markup capture and cancellation on unmount.
2. **Accepted and implemented: duplicate player view mapping.** One presentation derivation selects the exact prior idle or active input object, omitting optional idle fields; one return copies all eight outputs. Conditional identity values retain the exact empty-string defaults. All view-state and controller tests remain, including idle/loading/interacted/minimized states, provider labels and Close/Minimize rules.
3. **Accepted and implemented: four repeated setters.** After the same nextSession assignment and preference recording, the retained synchronizer applies the identical provider/layout/title/loading values through the root's React setters. Only the preliminary four calls were deleted. Pending-host title setup and load/error callbacks remain, as do retirement, iframe reuse, trigger synchronization, ambient session signal, history and focus handling. No rendering/timing improvement is claimed.
4. **Accepted and implemented: unused internal return members.** Only the owned test called `hasCachedHtml`; production consumes `getCachedHtml`. The test now checks exact HTML through that normalized getter. The unused function/return member and only the transition's returned `clearTimer` entry were removed. Private timer clearing, its internal calls, request arguments, cache deduplication and failure behavior remain.
5. **Accepted and implemented: six server checks in effects.** Deleted only the effect-entry checks identified in preparation, with vacated spacing. Effects run on the client; the sole production mount remains client:load. Every effect body, dependency list, cancellation flag, catch and cleanup remains; render-time guards and standalone/private-preview validation remain. [React useEffect documentation](https://react.dev/reference/react/useEffect).
6. **Accepted and implemented: repeat Store classification.** Both fresh navigation and cached restoration pass kind/pathname from one parsed route. The existing Store-only guard now directly precedes speculative search preload, in the same position before price activation. The source-based regression assertion protects that adjacency. Entrypoint parsing, exact categories, generations, loading delays, warm-up order and silent speculative failure handling remain.
7. **Partially accepted and implemented.** Removed the unused-spy assertion before that spy is passed to production; actual fetch counts, repeated readers and fresh activation reads remain. Replaced motion polling with a direct trigger after awaited warm-up, which installs animate before resolving and invokes it synchronously. Pre-warm no-call and exact opacity-only animation arguments remain. **Rejected obsolete Coverflow assertion deletion:** those assertions no longer exist; all distinct current crate reset expectations remain intact.

Retained rejected alternatives: no cancellation/request identity removal; no cart queue/parser/persistence/storage simplification; no live crate cleanup substitution for inert snapshot reset; no replacement with the behaviorally different search sanitizer; no scroll-facade deletion or general history abstraction; no removal of meaningful loading/lifecycle coverage, reduced motion, inertness, scroll reset or disconnected-focus safeguards. Portal fallbacks and All/Distro scope are unchanged. No cross-root fix or new abstraction was introduced.

## Exact changes and reductions

Paths below are relative to `apps/web/src/components/app-shell`. Positive numbers mean removed lines; negative means added lines. Formatting-only changes and audit Markdown are excluded from the reported code totals.

| Production file                                 | Net removed |
| ----------------------------------------------- | ----------: |
| AppShellRoot.tsx                                |          13 |
| navigation/shell-page-snapshot.ts               |          18 |
| navigation/shell-transition.ts                  |           1 |
| overlay/overlay-fragment-loader.ts              |           5 |
| player-shell/shell-player-session-controller.ts |           4 |
| player-shell/shell-player-view-state.ts         |          16 |
| **Production total**                            |      **57** |

| Owned test file                         | Net removed excluding formatting |
| --------------------------------------- | -------------------------------: |
| app-shell-code-splitting.test.ts        |                               -2 |
| app-shell-document-lifecycle.test.ts    |                                0 |
| navigation/shell-page-snapshot.test.ts  |                               32 |
| navigation/shell-transition.test.ts     |                                4 |
| overlay/overlay-fragment-loader.test.ts |                                0 |
| store-listing-price-activation.test.ts  |                                1 |
| view/shell-surface-loader.test.ts       |                                0 |
| **Test total**                          |                           **35** |

**92 net production/test lines removed excluding formatting. Zero files deleted.** The physical test-line difference is 36; one extra blank line removed by Prettier is excluded above. All 45 owned test files remain. Two scheduler cases were consolidated with retained default/custom/fallback/cancellation regression coverage; no test with distinct behavior was deleted.

## Scoped validation and resources

- `pnpm openspec:guard`, guarded status and instructions apply: exit 0; spec-driven/ready, 10 of 60 tasks marked complete. Every current apply context file was read. Shared-task ownership overrides the skill's task-update step.
- Scoped Prettier write/check for the 13 changed owned files and these two reports: passed. [Formatting log](../../../../.codex-artifacts/simplification/13-app-shell-implementation/format.log) and [final formatting check](../../../../.codex-artifacts/simplification/13-app-shell-implementation/format-check.log).
- `pnpm test app-shell`: exit 0, **45 files / 287 tests passed**, Nx 0/1 cache hits; Vitest duration 15.46 seconds, runner 17.0 seconds. Counts were read from the retained runner output; no repeated run for counts. [Test log](../../../../.codex-artifacts/simplification/13-app-shell-implementation/test.log).
- `pnpm exec eslint <the 13 changed owned files>`: exit 0. Existing boundary-plugin deprecation warnings were recorded; no scoped errors. [Lint log](../../../../.codex-artifacts/simplification/13-app-shell-implementation/lint.log).
- Scoped `git diff --check`: passed. Final source/caller identity matches the checked tree; [check record](../../../../.codex-artifacts/simplification/13-app-shell-implementation/checks.json) links source and results.
- Both existing graphs and full proofs from hash-matched preparation were reused; CodeGraph was consulted for the changed connected browser/crate context. Graphify's prior budget-2,500 query/explains and resolved 38-edge controller inspection remain architectural context. No graph initialization, enrichment or output write occurred. Verifier owns current graph freshness after these edits.
- After required checks, local status showed **0/3 validation slots held**, this checkout's 4321 free, no full Local stack, Chrome lease free and no maintainer grant. Both owned finite check sessions completed; no owned server/browser/watcher was started or left running.

There is no published app-shell typecheck target. No bespoke compiler loader or raw package typecheck was run; mandatory package/global types remain with the verifier. No broader consumer selection, global validation, browser/provider action, commit, push, branch/worktree, deployment or controller launch occurred.

## Acceptance still pending

| Acceptance row               | Remaining verifier evidence                                                                                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell/player/routing         | Final stable-tree shell-navigation, shell-islands and player-continuity checks, including phone projects; direct loads, portals/overlays, All/Distro/category routes, cached Grid/crate restoration, lazy-load failures and player identity/Listen state. |
| Affected consumers           | Combined affected checks, including web-layouts because its crate layout test reads snapshot source.                                                                                                                                                      |
| Integration/boundaries/types | Both-graph freshness, mandatory final package/global types, final-current-tree pnpm validate and strict OpenSpec/task 30 gates.                                                                                                                           |
| Provider/release             | Not performed or inferred. Fixture iframe checks do not establish real-provider playback; no release acceptance is claimed.                                                                                                                               |

Normal Local/runtime/browser union acceptance runs only after source writers are idle. This handoff completes the assigned implementation and scoped checks, not module acceptance. Tasks 13.1/13.2 remain unchecked for the verifier.
