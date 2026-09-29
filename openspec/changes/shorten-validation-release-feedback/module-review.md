# Module development readiness review

This follow-up reviews the Nx migration's execution paths, inputs, test ownership and developer guidance. Graphify supplied module relationships; CodeGraph and exact source reads supplied implementation evidence. Knip supplied unused-code candidates, which were checked against consumers before deletion. Generated outputs and unrelated product implementation were not exhaustively reviewed.

## Findings and corrections

| Finding                                                                                                    | Consequence                                                                                       | Correction                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace contract inputs omitted filesystem-read workflow YAML.                                           | A workflow edit could reuse stale passing tests.                                                  | Repository-wide contracts use one conservative native input, including toolchain values. A disposable Nx fixture demonstrated miss, hit, then miss after a workflow edit. |
| Test projects repeated common input arrays; package libraries lacked module tags.                          | Configuration drift and incomplete cycle checks.                                                  | Shared native named inputs retain module-specific extras; API-client and content-model participate in module-cycle checks.                                                |
| Validation captured output without showing it until completion.                                            | Agents could not react to native progress and diagnostics promptly.                               | Execa streams the same output to the terminal and evidence log. Nx stops queuing new tasks after failure. No custom progress parser or scheduler was added.               |
| Invalidated plans could exit successfully; CLI accepted ineffective combinations.                          | Misleading success and commands that did not do what they implied.                                | Success requires unchanged source and no cancellation. Contradictory modes and obsolete jobs options fail. Changed tests and validation share Nx's default base.          |
| Vitest's inferred watch mode is disabled under agent/CI execution.                                         | A requested watch loop could run once and exit.                                                   | Every watch target requests native `--watch` explicitly; API-client has a watch target.                                                                                   |
| Discovery recognized `.test` but omitted `.spec`; legacy commands chained runners and repeated test lists. | Conventional tests could be silently skipped and package commands could diverge from module runs. | Native TypeScript test/spec patterns and runtime suffixes share ownership checks; app defaults use the module project configuration once.                                 |
| Two staff utilities had no consumers; Knip paths and platform diagnostics referenced old ownership.        | Dead code and misleading maintenance output.                                                      | Remove unused files, update moved paths and name the actual platform module in diagnostics.                                                                               |
| Agent instructions led with affected tests during iteration.                                               | Every small edit could start unrelated consumers.                                                 | Iterate on the owning module or its persistent watcher, then validate affected consumers before completion.                                                               |

The validation wrapper retains one responsibility: source-stable completion evidence around native commands. Nx owns selection, dependencies, scheduling and cache. Vitest owns discovery and runtime isolation. Boundary policy owns architectural permissions; it does not manufacture actual dependency edges. No new orchestration framework, event bus, registry or subagent policy was introduced.

The same accounting used for the initial migration now measures 1,965 production orchestration/configuration-code lines against 2,191 before migration: 226 fewer lines overall, and 19 fewer than the first implementation. Regression tests are separate. Native Nx configuration totals 959 lines across 54 files; package manifests and boundary policy add a net 129 lines, for 1,088 declarative lines overall. The test inventory remains 291 files. Two unused staff files were removed separately. Knip reports no remaining unused-file candidates; public exports and external CLI references still require their existing owner context.

## Verification boundary

Focused regressions cover live subprocess output, retained failure diagnostics, invalidated/cancelled plans, CLI errors, runtime-specific spec discovery and unique ownership. Existing fixtures cover Git file states, illegal imports, private entrypoints and module cycles. First-failure duration remains null when it cannot be measured reliably; whole-command duration is not substituted for it.

The final gate is one full repository validation followed by unchanged-source affected validation. A temporary Stock spec measures native watch startup, failure and repair under `CI=true`; the probe is removed and source identity compared afterward. Cold module execution and warm native cache reuse are measured separately. Exact results and logs belong in ignored `.codex-artifacts/module-review/`, with `final-verification.json` as the completion authority. Tracked notes must precede that gate.

The live Stock probe passed under `CI=true`: startup took 15.159s, an injected failure appeared in 376ms, and the repair passed in 371ms without restarting the runner. Source identity matched after removing the probe. These are individual local observations, not medians or total-task estimates. The first probe incorrectly expected per-file names from Vitest's CI reporter; its retained log showed both files passing and the watcher alive. The corrected probe uses the native file-count summary. Graphify was refreshed once after the code batch; its Astro parser reported partial extraction, so source and executable boundary/build checks remain authoritative for those files. Native cache artifacts orphaned by workspace-metadata maintenance were cleared once before the final timing runs; this is not a routine development step.

This follow-up changes tooling and removes unreferenced UI utilities. Product browser acceptance is not applicable to those edits under the acceptance matrix; the migration's earlier player/navigation observations remain historical evidence. Full builds still verify integration. Hosted provider, release and deployment gates remain required and were not exercised by this local review.

One-shot Stock process timings were 8.022s with cache reuse disabled, 6.051s to populate the cache, and 2.413s with a confirmed native cache hit. A separate direct cold command completed in 6.3s. The disposable timing harness initially left subprocess stdin open and stalled; closing stdin fixed that harness. Production validation already closes stdin, and the ordinary module command passed independently. The watcher remains the measured fast path for repeated edits.

The first full review pass stopped on formatting in two JSON files after 164.8s. A fresh Luna thread formatted only those files; the resumed gate reuses unchanged passing tasks. The failed summary is retained as diagnostic evidence, not counted as a successful validation sample.

## Module-owned backend tests: measured feedback

Evidence is in ignored `.codex-artifacts/perf/` (`baseline.json`, `concurrency.json`, `after-*-p{2,3,4}.log`). Machine: 6-core i5-8600K, 32 GB.

**Baseline.** Full uncached run at parallel 2: Nx run 8m37s, 63 tasks, 1031s summed task time, backend test projects 506s. The wrapper then hung because a freshly started Nx daemon inherited piped stdio; `NX_DAEMON=false` in `scripts/validate.mjs` fixes it, with a regression assertion in `scripts/validate.test.mjs`.

**Affected scenarios** (uncached, summed task seconds). "Before" is estimated from measured baseline per-task durations; "after" is measured.

| Scenario | Before (estimated) | After (measured) |
| -------- | ------------------ | ---------------- |
| stock    | 20 tasks, ≈585s    | 19 tasks, 293s   |
| store    | 25 tasks, ≈656s    | 19 tasks, 325s   |
| frontend | 18 tasks, ≈453s    | 15 tasks, 191s   |

**Nx parallelism** (wall time, uncached affected runs with a real temporary edit):

| Scenario | p2   | p3   | p4   |
| -------- | ---- | ---- | ---- |
| stock    | 151s | 120s | 127s |
| store    | 166s | 120s | 118s |
| frontend | 103s | 80s  | 78s  |

Parallel 4 gave no reliable gain and stretched critical paths (stock 50s to 93s); minimum free RAM at p3 was about 3.7 GB. `nx.json` now sets `parallel` to 3. Vitest `maxWorkers: 1` is unchanged, and the two-implementation-agent limit is a separate policy.

**Worker-suite startup.** Each Worker process costs about 5s for config and Miniflare plus its module-graph import. Every backend Vitest invocation also pays a roughly 2s `@cloudflare/vitest-pool-workers` import floor, because Vitest loads all project configs before `--project` filtering. Config `extends` was tried without gain and reverted.

**Remaining bottlenecks:** `public-commerce-http:test` (about 50s, composition root), `catalog-sync-integration` (about 30s), `@blackbox/backend:lint` (about 27s; type-aware, so an ESLint cache would be unsound), `workspace:test-content` (about 30s, conservative inputs) and Worker startup.

**`pnpm validate` note.** `defaultBase` is `origin/main`; while the migration is uncommitted, local affected selection includes nearly every project. Scenario numbers use `nx affected --files=<file>`, which is what `validate` selects once the base contains the migration.
