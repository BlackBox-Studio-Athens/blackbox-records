# Nx migration verification

## Scope and inventory

Nx 23.2.1 owns selection, dependencies, scheduling and local caching. The migration retains 291 discovered test files: 112 web, 19 staff, 133 backend TypeScript, one API-client, three root Vitest and 23 Node-runner files. The application inventory guard rejects omissions and duplicates; native runner conventions cover the remaining suites. Obsolete selector tests were replaced by native Git-state selection and wrapper contract tests. The mixed repository suite was split without removing its D1 and transaction assertions.

Source modules and integration suites are separate Nx projects. Dependency-only module test targets reuse integration targets; Nx deduplicates them in a full run. Test helpers and build-tool directories have their own roots so imports do not accidentally depend on every module through package ownership. Package checks explicitly include nested source and tests. Native affected edges are separate from allowed architectural dependencies.

## Selection and timing

The same native task graph was queried for the recorded Store task at `390466c`, a Stock source edit, a player-only frontend edit and a generated API contract edit. Paths moved by this migration were mapped to their current locations. These are selection comparisons, not executed end-to-end timing comparisons.

| Change              | Runner targets | Application test files | Worker test files |
| ------------------- | -------------: | ---------------------: | ----------------: |
| Recorded Store task |             29 |                    256 |                59 |
| Stock               |              9 |                    106 |                53 |
| Frontend player     |             10 |                    153 |                14 |
| Shared API contract |             16 |                    187 |                14 |

The full inventory has 33 runner targets. Root contracts and the API-client suite are additional to the application-file column. Genuine CMS rendering and build-tool relationships still broaden frontend validation. The original Store change crossed many boundaries and remains broad; this migration does not claim that entire task now takes a few seconds.

`pnpm test stock` runs only the Stock suite, with no Worker startup. Observed process wall time was 7.46s with cache disabled, 5.23s to populate the native cache, and 2.09s with a confirmed native cache hit. These are single samples, not medians; the machine was also completing migration work. A focused real-D1 repository-seam run passed in 4.44s after removing the unused Worker application entrypoint. Cache timing uses process wall time, not replayed Vitest duration. The earlier package-level backend run started 60 Worker test files; scoped iteration avoids that package-wide startup.

Native Nx workspace metadata was reset after changing project roots, then the graph was regenerated before these measurements. This is migration maintenance, not a new routine pre-test step.

## Initial migration code accounting

Production orchestration and configuration logic fell from 2,191 to 1,984 lines: a net reduction of 207 lines. This includes replacement helpers, Vitest configuration code, boundary-loader changes, release preparation and benchmark compatibility; regression tests are counted separately. The three validation/watch wrappers alone fell from 772 to 431 lines. No custom dependency walker, scheduler or phase cache remains.

Declarative configuration grew separately: 1,121 lines in 54 native Nx/project files, plus a net 120 lines across package manifests and boundary policy, for 1,241 lines. Generated dependency-lock changes are excluded. Detailed file accounting and exact selected targets are retained in ignored `.codex-artifacts/nx-migration/accounting.json` and `measurements.json`.

These are the initial migration counts. The follow-up [module review](module-review.md) records the current counts, additional corrections and agent watch-loop measurements; its final evidence record supersedes the initial completion record.

## Verification and final evidence

Focused checks passed for native Git selection with staged, unstaged, untracked, deleted, renamed and shared-input changes; missing/duplicate ownership; actual module cycles; illegal private imports, workspace exports and Astro boundaries; failure propagation; and source changes restored before validation ends. Shared-input and generated-contract selection use native Nx inputs and graph dependencies. Cache options retain affected/full mode, and contradictory full/scoped modes fail.

The initial full pass found two migration errors: a moved layout test retained one old relative path, and Astro interpreted a colocated page test as a route. The path was corrected and the page test uses Astro's underscore exclusion convention while remaining in Vitest discovery. That 471.9s failed/invalidated attempt is retained as diagnostic evidence, not a successful performance sample. A subsequent 173.5s pass reached the unchanged bundle budget and caught browser link validation coupled to Zod schema initialization by the cycle cleanup. The pure link helper is separated from schema construction, preserving its public export and behavior. The final pass reuses unaffected native task results and reruns changed checks and uncached builds.

Chrome's blackbox profile verified current-source player persistence across Store/Releases navigation, reopen/minimize/stop, mobile menu navigation, and artist overlay open/close. No console errors were captured. The existing Astro development mode served source while builds remained independent. Provider transactions and hosted deployment were not performed; their existing acceptance gates remain required.

Tracked notes are finalized before the final run. Completion requires a passed `pnpm validate:full` summary, followed by source-unchanged `pnpm validate` to demonstrate normal cache reuse. Exact timings, fingerprints and summary paths belong in ignored `.codex-artifacts/feedback-speed/final-verification.json`; that record is the authority for the final run's outcome. No source edit may follow those runs without invalidating that evidence.
