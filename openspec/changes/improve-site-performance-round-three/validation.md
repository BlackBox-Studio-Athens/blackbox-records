# Validation

Baseline: `e818b709a2364aa29dfd54cadcd0433779a1f263`, measured in the [PERF-004 review](reports/PERF-004-review-e818b70.md). Its historical ignored raw directory was absent from the remote at recovery.
Product Environment: Local. Final production static output is served at `http://127.0.0.1:4371/blackbox-records/`; Playwright Chromium 153.0.8010.12. Hosted UAT/PRD and providers were not contacted.
Final implementation: uncommitted work above `fe099b01cea42266cdf21c2318851af361db1210`. Public measurement source/build fingerprints are `b0425c1c2c0580ca12bcf26b41db58b43adb8ff3ed2e2397d3d742352b9638b6` / `727c26d8d20629d3f62766fa39b1ec595f4ea843535281675e7b27c5d4f3472f`, unchanged before/after all eight final profiles and accepted interaction contexts. The last repository validation pointer and its full-tree fingerprints are in `.codex-artifacts/performance-resume/completion-evidence.json`.

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

Accepted repository run: `pnpm validate --since e818b709a2364aa29dfd54cadcd0433779a1f263`, `mode: local`, PASSED in 93.5 s; 63 selected tasks across 49 projects plus dependencies. Summary: `.codex-artifacts/validation/2026-10-03T06-10-39-963Z-58624-e99ed2/summary.json`. Matching before/after fingerprint `b99b893b7b0ff73d59d32bd82e4fb5b94bf5c17d7619c3bf86125b6222b70823`, 206 files, zero source drift. This precedes final evidence-note reconciliation; the final rerun pointer is kept in the ignored completion record under the agent workflow.

- Static build, unchanged 100 KiB eager budget, font/image checks, isolated apex Holding check and actual local UAT-shaped SSR capture/bundle/image gates pass.
- Six scoped browser specs pass 72 tests, with 13 device-specific exclusions and no failure. They cover shell/navigation/islands/player/cart/formats and the new performance acceptance matrix. The native cart backdrop check retains its original no-scroll assertion.
- Focused shell 269, player 40, newsletter 6 and commerce 391 tests passed during integration; final validation includes their modules plus data/platform/tooling/boundaries/types.
- All eight final profiles pass input/source-integrity checks. Eighteen idle samples have zero recurring rAF, layout and long tasks. Successful profile execution does not turn scroll outliers into budget passes.
- All 33 responsive image samples pass. The portrait gallery now picks 960w/110,422 bytes at 390@3; cart actually requests 176×176 WebP/6,464 bytes, painted 86×86. Cold/cached overlay gallery loops retain the original iframe.
- Forty-two accepted short action traces and 18 inventories record current counters, trusted tap starts, approximate first-paint opportunities and request-phase bytes. The font/frame and commerce isolation is described in the report.
- Both children strict-validate and `pnpm agent:check` passes. Graphify was refreshed locally after the final product batch; its one script parse warning/unavailable edges remain limitations. CodeGraph CLI supplied current worktree source after MCP transport failure. Chrome blackbox binding timed out and DevTools was locked; the saved plan's repository Playwright harness supplied browser evidence.

See [PERF-005](performance-report.md) for measurements and limits. Raw evidence: `.codex-artifacts/performance-resume/{profile-summary.json,profiles-decision/,acceptance/,interactions-raw/,bundles-final.json,holding-check.log,hosted-documents/capture.json}`, the e2e summary, and source-bound validation summaries. Dependency/Nx failures, stale assertions, worker-harness exports and test-only type errors were repaired; only subsequent passing runs establish acceptance.

## Not verified

Unverified: maintainer quality 68 visual approval/broad visual parity; original raw counters and before/after prefetch duration; real-device/GPU attribution, Firefox/Safari and field Core Web Vitals; real provider/checkout and sibling hosted/account/release acceptance. First scripted traversal still has 1–2 median long tasks on Store/Distro; real wheel Distro first p95 is 50 ms and touch Store p95 is 33.3 ms. These residuals remain non-passing or unattributed, with no budget waiver or speculative GPU change. Both children remain unarchived.

## Recovery on 2026-10-03

The user authorized restoring and continuing `claude/upbeat-mayer-2nikhm`. The remote tip and integration base for every resumed slice is `fe099b01cea42266cdf21c2318851af361db1210`; the review baseline remains `e818b709a2364aa29dfd54cadcd0433779a1f263`. The local worktree is `.claude/worktrees/upbeat-mayer-2nikhm`. The guarded OpenSpec command passed with `--allow-worktree`. Dependencies were installed from the unchanged lockfile.

The remote contains these implementation batches, which require fresh acceptance before their tasks can be marked complete:

| Area                               | Existing commits                   | Recorded result at recovery                                                                        |
| ---------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Whole-document CSS invalidation    | `0322cc5a`, `fff53a07`             | Lenis CSS replacement and button icon defaults; modal lock follow-up                               |
| Coverflow and search               | `142f677e`, `4a371089`             | Rail-local ratio, native animation, deferred fuzzy matching and e2e coverage                       |
| Editorial images                   | `dd154f05`, `0e722b13`             | Slot-aware sizing, quality, bounded fallbacks and news container correction                        |
| Navigation scheduling and prefetch | `3453eff4`, `a70bf28a`, `35bf1abf` | Idle snapshots, gated prefetch, fresh requests after abort and joined image warming                |
| Shell surfaces                     | `be2d4adc`, `c2a201db`, `4ccc8534` | Promise-loaded surfaces, CSS sheet/overlay animation and lock regression coverage                  |
| Production hygiene                 | `045fff6a`                         | Demo routes and trial font excluded from production                                                |
| Single-parse snapshots             | `3b997608`, `fe099b01`             | Cached fragments and live-main control safety                                                      |
| Hosted publication/media           | `a56da66b`, `14f98a5b`, `119a9952` | Current purchase-information alias, media-SHA URLs, canonical image source and recent-media checks |

Both task ledgers were wholly unchecked and both validation notes lacked slice evidence. Code already present is audited rather than reimplemented. Work remaining includes linear content reads and snapshot parse reuse, device-aware idle-free scrolling, self-hosted fonts and early discovery, Store chrome and price-read scheduling, bounded cart/gallery images, read-only bounded commerce calls, click-created persistent player hosting, smaller eager dependencies, and hosted gateway/cache/build gates.

All eight overlapping changes named by task 1.2 are present and unarchived in this branch: `adopt-lenis-motion-frontends`, `inert-shell-page-snapshots`, `rehydrate-cached-shell-islands`, `complete-image-delivery`, `reveal-first-screen-images`, `lighten-home-entry`, `clarify-store-sold-out-presentation`, and `show-low-stock-notice`. Their artifacts remain untouched. `add-store-preorders` is absent from this branch and is being developed independently; decision 14 still controls overlap. Cart/offer/listing/checkout payloads remain unchanged, StoreItemCard changes stay limited to image widths, and the specified parser/offer-stage/server-quote deferrals remain.

The original ignored `.codex-artifacts/runtime-performance/review-e818b70/` directory was not preserved on the remote. The tracked PERF-004 report and user-supplied review are historical evidence only; their raw traces cannot be claimed as reproduced. New evidence lives in `.codex-artifacts/performance-resume/` and the existing validation/e2e/runtime artifact directories, labelled with this source and profile. Initial Graphify architecture query failed while the synchronous checkout bootstrap was still building; CodeGraph returned current source from this worktree. Chrome blackbox extension bootstrap succeeded. No hosted request, publication, provider transaction, deployment, push or PRD promotion is authorized by these implementation slices.
