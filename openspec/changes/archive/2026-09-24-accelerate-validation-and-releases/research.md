# Research and baseline evidence

Researched 2026-09-19 against source `a66f6755b3f5ca804cc59ae557c4e8b60087d2af`. The working tree was initially clean. Evidence below is discovery, not a controlled before/after experiment or a speed claim. No workflow was dispatched and no hosted application/provider state was changed during research.

## Local validation

The current runner already overlaps `test:unit` with the sequential environment/format/lint/types/boundaries group, then builds after both pass. CLI default is `--jobs 2`; recommending that overlap again would count an existing improvement. `validate:fast` runs selected package tests, types, and all root contracts; it is partial.

Recent successful full summaries:

| Retained run under `.codex-artifacts/validation/` | Total seconds | Tests | Format | Lint | Types | Build |
| ------------------------------------------------- | ------------: | ----: | -----: | ---: | ----: | ----: |
| `2026-09-19T14-15-45-932Z-46516`                  |         214.1 | 178.5 |   51.8 | 42.0 |  27.1 |  32.1 |
| `2026-09-19T13-54-09-010Z-10120`                  |         223.1 | 179.6 |   43.3 | 41.7 |  31.3 |  38.1 |
| `2026-09-19T12-19-12-522Z-43680`                  |         243.2 | 192.4 |   49.9 | 40.9 |  36.6 |  47.1 |

The latest sample records Node `v24.21.0`, pnpm `12.0.0`, source SHA `1eca161bf69c61f13bfefc4bd7994f300988f0c4`, and fingerprint `1da70eadeef35d81ef757df16be6e4d44de15f8a7d8fd9a1404271516f421574`. Phase durations overlap; do not sum them to estimate total time. Other recent samples reached 411.8 seconds, reinforcing the need to control competing workloads and cache state.

Its native logs show:

| Suite                 | Files / assertions | Wall seconds | Interpretation                                                                            |
| --------------------- | ------------------ | -----------: | ----------------------------------------------------------------------------------------- |
| Backend Workers       | 77 / 564           |       151.31 | Main bottleneck; aggregate setup 152.62 seconds is across workers, not additive wall time |
| Backend Node          | 47 / 302           |        12.61 | Existing execution path to reuse for eligible tests                                       |
| Web                   | 109 / 566          |        40.52 | Global MSW setup reports 33.89 aggregate seconds; secondary opportunity                   |
| Staff                 | 14 / 68            |         5.19 | Small contributor                                                                         |
| API client            | 1 / 8              |         1.01 | Small contributor                                                                         |
| Root Vitest contracts | 2 / 17             |        0.322 | Already deduplicated from web collection                                                  |

There are also 69 Node-test assertions in four groups. Preserve the 1,525 Vitest and 69 Node assertion identities at this source, plus subsequently added tests; freeze the actual inventory again at implementation start.

Worker selection currently includes every backend test except architecture, scripts, and four named HTTP files. The Worker setup imports `cloudflare:test` and applies D1 migrations for each selected file. Twenty-one application/domain files are still in this pool; examples are `test/application/commerce/checkout/packing.test.ts`, `test/domain/commerce/value-objects.test.ts`, and application tests built around repository/gateway doubles. Their native assertion durations are milliseconds. **Inference:** moving genuinely platform-independent files can avoid expensive Worker setup. Transitive imports and runtime semantics must be checked before any move; these observations do not establish that all 21 files are safe to move.

Evidence locations: `scripts/validate.mjs`, `scripts/benchmark-validation.mjs`, both backend Vitest configs, `apps/backend/test/setup/apply-d1-migrations.ts`, and the latest run's `0-test-unit.log`, `backend-worker.json`, `backend-node.json`, and `summary.json`.

## CI/CD

The canonical workflow is now `.github/workflows/pages.yml`, **Release BlackBox**. The June CI plan predates this architecture and must not be reused as a current baseline.

| Successful run                                                                                     | Kind                | Latest-attempt execution seconds | Notes                                                                                    |
| -------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------: | ---------------------------------------------------------------------------------------- |
| [35442816678](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35442816678) | UAT push            |                            1,293 | Source `1eca161...`                                                                      |
| [35266201722](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35266201722) | UAT push            |                            1,365 | Source `6260845...`                                                                      |
| [35206932126](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35206932126) | UAT push, attempt 2 |                            1,227 | Created-to-latest-job gap was 930 seconds; it includes rerun delay and is not queue time |
| [35168423316](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35168423316) | UAT push            |                            1,328 | Source `60e1347...`                                                                      |
| [35443924046](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35443924046) | PRD dispatch        |                              207 | Retained-artifact promotion, no rebuild                                                  |

Execution means first non-skipped job start to last non-skipped job completion within the selected attempt. Four UAT observations have a median of **1,310.5 seconds (21m 50.5s)**. This small, selected successful set is not a reliability sample or acceptance baseline. Failures, cancelled runs, and attempts must be collected for the declared implementation window. Raw API responses are retained at `.codex-artifacts/ci-speed-analysis/2026-09-19-planning/`.

For UAT run `35442816678`:

| Work                                                         |      Seconds |
| ------------------------------------------------------------ | -----------: |
| Candidate job                                                |          787 |
| Unit tests, then checks, then unused audit                   | 184 + 80 + 4 |
| Restore UAT / PRD published content                          |      70 / 84 |
| UAT public build / PRD public and staff build                |     108 / 23 |
| Retain/build Workers and renderers                           |           55 |
| Preview browser installation / Chromium and Firefox checks   |      27 / 87 |
| Release bundle upload                                        |           31 |
| Pages inspection / Worker deployment / Pages deployment jobs | 49 / 92 / 59 |
| Smoke job, including 186 seconds of provider/static checks   |          296 |

Findings:

- CI tests and checks remain serial despite the local runner already supporting overlap. Reuse its process/log/cancellation behavior for a checks-only CI mode; do not run a redundant default local build before hosted builds.
- `restorePublishedContent` validates the published snapshot, then awaits each unique media download in a serial loop. Four bounded reads can overlap network waits without increasing successful request counts. CMS request budget currently counts snapshot plus media; the public `release.json` read is separate.
- The first hosted public build is consistently around 101–109 seconds; the later PRD build is 21–24 seconds. **Inference:** reused image work is promising, but target/content differences confound that comparison. Measure the image-generation section and a same-input cold/warm build before accepting a cache.
- Installed Astro 7.3.2 uses `<cacheDir>/assets/` for processed images. Here that is `apps/web/node_modules/.astro/assets/`; sibling `data-store.json` is content state and must not be cached by this change.
- The retained release artifact is **793,112,830 compressed bytes**, downloaded by four UAT jobs and two PRD jobs. `verifyFiles` currently verifies both targets in the complete schema-2 bundle. Selective downloading is not a one-line optimization.
- Pages inspection/deployment jobs and environment-scoped Worker jobs have different credential contexts despite using the same secret variable name. Job consolidation could change which token is resolved. Leave these boundaries intact.
- Dependency installation was 7–8 seconds in the sampled jobs with the existing pnpm store cache. Custom dependency caching is not justified.

## Existing benchmark limitations to fix

`benchmark-validation.mjs` currently compares the legacy three commands with the aggregate runner. Its baseline command arm is hard-coded to `test:unit`, `check`, and `build`. Using it unchanged would falsely credit the new change for previously shipped overlap. Command-mode records also need to validate the embedded summary's status/completeness, not only the outer exit and source equality.

The historical `docs/validation-refresh-report.md` reports approximately 19% command-time gains, while its actual-agent matrix stopped on a Windows output-permission failure. Do not reopen that agent/token campaign, claim its gains again, or alter sandbox permissions. This change measures command latency and release latency; Luna Max is the implementer, not a new benchmarking project.

## Primary-source guidance

- [Cloudflare isolation and concurrency](https://developers.cloudflare.com/workers/testing/vitest-integration/isolation-and-concurrency/): storage isolation is per file; retain isolation for real platform tests. Do not adopt obsolete pool options from older guides.
- [Vitest performance guide](https://vitest.dev/guide/improving-performance.html): environment/setup/pool choices affect overhead; aggregate timings are not elapsed time. Verify any option against installed Vitest 4.1.11 before use.
- [Prettier CLI cache](https://prettier.io/docs/cli#--cache): content-based caching is native, but plugin versions/implementation do not participate in its cache key. The plan adds an outer tool/plugin/configuration identity.
- [Astro image caching](https://docs.astro.build/en/guides/images/#asset-caching): processed-image cache can be preserved between builds. Only the image subdirectory is proposed here.
- [GitHub setup-node](https://github.com/actions/setup-node#caching-global-packages-data): built-in caching covers package-manager data, not installed `node_modules`.
- [GitHub dependency caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching): caches are disposable and must not hold credentials; restored bytes do not replace release evidence.
- [Playwright CI guidance](https://playwright.dev/docs/ci#caching-browsers): browser caching is generally discouraged because restore time can resemble downloading and Linux dependencies still need installation. No browser-cache work is planned.
- [Artifact compression guidance](https://github.com/actions/upload-artifact#altering-compressions-level-speed-v-size): compression trades CPU for bytes. Keep as a future measurement-led option; it does not solve repeated full-bundle verification/downloads.
