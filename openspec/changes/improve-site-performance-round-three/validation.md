# Validation

Baseline: `e818b709a2364aa29dfd54cadcd0433779a1f263`, measured in the [PERF-004 review](reports/PERF-004-review-e818b70.md). Raw data in `.codex-artifacts/runtime-performance/review-e818b70/` (ignored).
Product Environment: Local. The production static build is served by `astro preview` at `http://127.0.0.1:4321/blackbox-records/`, or a linked worktree's own port. Chromium 141 through Playwright. Hosted UAT and PRD are not contacted by this change.
Final tree: not yet recorded.

## Acceptance rows

From the [acceptance matrix](../../../docs/agent-workflow.md#acceptance-matrix):

- **Shell/player/routing:** groups 4, 5, 12, 13 and 20-23. `pnpm test:app-shell` plus the shell-navigation, shell-islands, player-continuity and store-cart e2e specs; Menu at 390 px; player minimize, reopen and stop; console errors.
- **Commerce/checkout/stock:** groups 14-17. Focused backend and web tests prove Worker authority, read-only public Store Offer reads, one read per Store Item view, and that checkout start still revalidates. No hosted or provider scenario runs.
- **Boundaries/tooling/instructions:** profile and bundle-check changes in groups 5 and 22, plus this change's strict OpenSpec validation.
- **CMS/schema/publication:** groups 2 and 3 only, as reader and parser equivalence (same entries, same validation failures, preview bypass). No publication runs.
- **Staff/editor:** not applicable. No staff code changes.
- **Release/environment:** not applicable. Hosted delivery is in `bound-hosted-delivery-cost`; nothing here is promoted or released.

## Baseline (e818b70)

| Measure                                  | Value                                                          | Method                              |
| ---------------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| Home mobile LCP                          | 3,144 ms (hero tagline repainting in Veneer)                   | `mobile-load`, median of 3          |
| Store / Distro desktop CLS               | 0.169 / 0.155                                                  | `desktop-load`, median of 3         |
| Store / Distro mobile long tasks         | 1,895 / 2,101 ms total, 442 / 533 ms longest                   | `mobile-load`, median of 3          |
| Distro restyle per `<html>` class change | 2,614 elements, 230-370 ms at 4× CPU                           | trace with invalidation tracking    |
| Idle main thread over 5 s at 4× CPU      | Home 1,094 ms, Distro 714 ms, About 621 ms (with Lenis)        | A/B trace, Lenis aborted as control |
| First open, mobile profile               | Menu 695-742 ms, player iframe 1,018-1,129 ms, cart 848-893 ms | tap to visible, chunks cold         |
| Eager JS (Brotli)                        | Home 101,588 B; Store Item 120,715 B; gallery item 161,934 B   | `pnpm performance:bundles`          |
| `listStoreCollectionEntries`             | 1,281 ms per call, two calls per Store category page           | Node 24, real 101-item snapshot     |
| Cart thumbnail bytes                     | median 1.19 MB, maximum 4.66 MB per Add To Cart                | dist scan of 101 cart seeds         |

## Slice evidence

One entry per slice as it integrates: commit, `pnpm validate --since <base>` summary path, focused tests, e2e specs, and A/B evidence with method and run count.

## Final runs

Not yet run.

## Not verified

Not yet recorded. Expected to include field Core Web Vitals (no representative sample), GPU and raster cost (headless only), real mid-range phones, Firefox and Safari, and hosted behaviour.
