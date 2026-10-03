# PERF-005: Resumed round-three implementation

Date: 2026-10-03. Review baseline: `e818b709a2364aa29dfd54cadcd0433779a1f263`. Recovered remote branch and integration base: `claude/upbeat-mayer-2nikhm`, `fe099b01cea42266cdf21c2318851af361db1210`. Implementation remains uncommitted in the explicitly authorized worktree. Twelve `gpt-6.1-sol` agents at high reasoning assisted bounded slices, integration, browser acceptance and interaction measurement.

## Recovery and scope

The remote already contained CSS invalidation, Coverflow/search, editorial-image, scheduling/prefetch, shell-surface, production-hygiene and single-parse snapshot batches. Both child task ledgers were unchecked and their validation notes had no implementation evidence. The recovery table in [validation.md](validation.md) identifies those commits. Existing code was audited and retained before completing missing mechanisms.

The original ignored review traces were absent from the remote. PERF-004 remains historical evidence. Chromium 141, unreachable Google Fonts, an absent backend and a shared machine make historical absolute browser timings incomparable to fresh Chromium 153 samples. No field Core Web Vitals result is claimed.

Completed local mechanisms:

- Linear catalog projection and category reuse; cached snapshot parse/projection/media indexes with private-preview bypass; shared Athens date formatter and preserved validation failures.
- Static Store chrome enhanced in place, document-started listing reads adopted exactly once, native gallery crossfade/keyboard/swipe, bounded thumbnails, and corrected contained image sizes.
- Native public scrolling, shell body locks, cached hero geometry, intent/idle surface loading, single-parse inert snapshots and lazy route/cart/newsletter presentation.
- Click-created, continuously mounted player iframe; explicit reducer; smaller eager dependencies and the same budget on single/gallery items.
- Self-hosted licensed font subsets, fingerprinted head discovery, eager header logo, 404 motion gates, dead CSS cleanup, production demo/trial exclusion and apex Holding artifact verification.
- One cached 176 px cart derivative (hosted rung 240), mutation-free Store Offer reads, a 3 s/zero-retry public provider bound, in-flight offer sharing, latest-wins 250 ms delivery quotes, entry OPTIONS bypass, lazy instance-scoped Prisma, and static delivery constants.

Hosted delivery is reported separately in [PERF-006](../bound-hosted-delivery-cost/performance-report.md). No hosted request, provider transaction, publication, deployment, push or promotion was performed.

## Mechanism measurements

The Node 24 benchmark uses the real 100-item fixture: 98 Distro items, one Release and one Merch item. It compares the recovered HEAD implementation with the resumed data implementation, not a reconstructed browser baseline. Four listing-output hashes and generated sitemap XML are identical; Athens month-boundary and validation parity regressions pass.

| Measurement                | Recovered HEAD | Resumed implementation | Runs |
| -------------------------- | -------------: | ---------------------: | ---: |
| Warm snapshot parse        |     140.613 ms |               6.039 ms |   15 |
| Listing projection         |   4,439.990 ms |               2.259 ms |    5 |
| 1,000 month/year formats   |     208.310 ms |               1.609 ms |   10 |
| Warm collection projection |       0.427 ms |              0.0006 ms |   15 |

Cold parse was 219.967 to 145.471 ms in one sample; cold index construction was slightly more expensive. These are microbenchmarks on a shared machine, not browser or provider latency.

Three-run decisions on one production artifact:

| Comparison                                                    | Observed result                                                               | Decision                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Veneer preload on/off, mobile stress                          | Font start 26.9/793.5 ms; Home LCP 1,312/1,372 ms; CLS about 0.010/0.005      | Keep earlier discovery; the 60 ms LCP difference is not causal proof          |
| Card paint skipping/eager, catalog traversal                  | Store/Distro first p95 16.8/33.3–33.4 ms; main-thread work about 42–43% lower | Restore native card paint skipping with remembered 520 px initial estimate    |
| On-demand Lenis/native with card paint skipping, Distro wheel | Repeat main-thread work 2,261/1,605 ms; repeat p95 16.8/33.4 ms               | Native everywhere follows the planned CPU rule despite Lenis's better cadence |

The on-demand candidate had zero recurring rAF callbacks, zero idle layout and no idle long tasks in all eighteen five-second desktop/touch samples. Desktop idle task medians for Home/About/Distro were 104.1/28.5/81.2 ms; touch medians were 94.7/34.4/41.9 ms. Final native profiles are recorded separately.

Decision raw files, build/source hashes and trace paths are preserved under `.codex-artifacts/performance-resume/`; final runtime files declare their own before/after fingerprints. Source that changed after a sample is not retrospectively relabelled as that sample's identity.

## Final production observations

All eight final profiles completed with unchanged public source/build fingerprints `b0425c1c2c0580ca12bcf26b41db58b43adb8ff3ed2e2397d3d742352b9638b6` / `727c26d8d20629d3f62766fa39b1ec595f4ea843535281675e7b27c5d4f3472f`. Feature-decision runs are preserved separately in `profiles-decision/`.

| Route    | Desktop LCP / CLS | Mobile LCP / CLS |
| -------- | ----------------: | ---------------: |
| Home     |        300 ms / 0 | 1,472 ms / 0.010 |
| Store    |    292 ms / 0.001 | 1,264 ms / 0.005 |
| Distro   |        344 ms / 0 | 1,460 ms / 0.004 |
| Artists  |        168 ms / 0 |     1,460 ms / 0 |
| Services |        192 ms / 0 | 1,228 ms / 0.015 |
| About    |        168 ms / 0 | 1,184 ms / 0.002 |

These are fresh lab medians, not like-for-like historical browser improvements. Store load samples include the isolated preview's missing listing API described below. Releases/News desktop LCP medians are 284/248 ms. No production page requests a Google Fonts origin.

Home/Artists/Services/Store eager JavaScript is **84,923 bytes Brotli**; single and gallery Store Items are **100,063 bytes**, both below 102,400. The review's 101,588/120,715/161,934-byte figures are historical references. The final static artifact has 1,733 files, 1,320 image files and 346,128,879 total bytes; the completed build encodes 1,072 images. No before-size/encode parity claim is made without its original artifact.

All eighteen final five-second native idle windows have zero recurring rAF callbacks, zero layout and zero long tasks. Desktop Home/About/Distro median task work is 148.6/36.5/70.0 ms; touch is 91.4/18.4/35.8 ms. Final scripted Store/Distro first/repeat p95 frame intervals are 16.7–16.8 ms at both wide and mobile widths. First scripted traversal still has 1–2 median long tasks; real wheel Distro first p95 is 50 ms, and touch Store first/repeat p95 is 33.3 ms. Those input/long-task residuals remain non-passing or unattributed, with no numerical waiver or field/GPU claim.

Inspection of retained first-run wheel/touch/scripted traces is in `.codex-artifacts/performance-resume/residual-trace-attribution.json`. Sampled long tasks contain document painting, layout and layer creation: the first scripted Distro sample includes a 67.9 ms task with 32.3 ms Paint and 15.6 ms Layout. One wheel Distro task contains a 2,328.9 ms Commit while its application/measurement callbacks remain short. This identifies rendering work in those samples without establishing GPU causality, the cause of the unusually long commit, or a real-device fix. The recorded non-passing input results remain unchanged.

The 42 accepted short interaction traces use three fresh contexts per surface at mobile CPU4/network150 ms/1.6 Mbps. First use includes normal idle/intent warming; warm means same-document reopening, not a new network cache. Font/frame isolation and tracing add limitations. Medians approximate the first visible paint opportunity:

| Surface                 |       First use |    Warm reopen |
| ----------------------- | --------------: | -------------: |
| Menu                    |        258.0 ms |       110.5 ms |
| Cart                    |        210.8 ms |       194.7 ms |
| Overlay panel / content | 64.7 / 347.1 ms | 44.2 / 44.3 ms |
| Player visible frame    |        111.7 ms |        47.8 ms |

Player iframe DOM creation is 45.7 ms; all three continuity loops retain that same iframe. Short desktop/narrow-width synthetic HTML class traces restyle at most one element per event. Coverflow Next maximum per event is 72/9 elements, and the first search keystroke maximum is 277/208; sums over repeated passes are recorded separately. Search adds 9,706 local JavaScript transfer bytes in its named action. Counters cover affected feature elements, not whole-document invalidation, and historical comparisons remain directional.

The gallery correction saves 35,900 bytes for the reproduced 390@3 portrait (960w/110,422 rather than 1200w/146,322). The cart requests a 176×176 WebP of 6,464 bytes, painted 86×86 at the sampled widths. All 33 responsive samples and both cold/cached overlay gallery loops now pass within the **72 passing browser checks**; 13 exclusions are device-specific.

## Verification and final evidence

Final repository, build, browser and profile evidence is reconciled in [validation.md](validation.md). The ignored `.codex-artifacts/performance-resume/completion-evidence.json` points to the last source-bound validation summary and final artifacts; it is updated after the tracked note so the final validation itself remains unchanged.

Browser acceptance uses production static output at `http://127.0.0.1:4371/blackbox-records/`, Chromium 153.0.8010.12. Desktop load is 1440×900/DPR1/CPU1, five fresh contexts per route. Mobile load is 390×844/DPR2/CPU4/150 ms RTT/1.6 Mbps, three fresh contexts. Scroll/input/idle runs are CPU4, three first/repeat samples per route. Analytics/extensions/startup are excluded; provider/commerce acceptance uses local mock responses.

The isolated static Store load has one listing API 404 per run because no backend serves that preview. Its Store load/CLS observations describe that degraded static context. Separate mocked browser request-count checks and real Worker tests establish the application contract; these traces do not establish successful provider price latency.

Responsive browser checks record actual `currentSrc`, painted slots, intrinsic aspect, DPR, response bytes and resource timing for editorial/Store/gallery routes at 390@2, 390@3 and 1440@1. They reproduced and drove two fixes: the portrait gallery overpick and gallery enhancement before overlay HTML arrival. Original failed traces remain retained.

## Remaining acceptance

- The maintainer's visual check of quality68 grainy artwork and broader visual parity remain open. Headless behavior checks do not substitute for that approval or real-device raster/GPU evidence.
- Real-input frame outliers and first-traversal long tasks remain reported residuals. Successful profile execution establishes measurement integrity, not a blanket performance-budget pass.
- Historical before/after traces, initial restyle counters and exact old surface timings are unavailable. Fresh counters/timings are reported with current source identity; historical comparisons stay directional or incomparable.
- Firefox/Safari, representative phones and field Core Web Vitals remain unverified.
- Conditional reconciliation waits for the eight overlapping predecessors and any independently landing `add-store-preorders` work. Their artifacts were left untouched.
- Hosted native tag-purge acceptance, cross-zone quota-failure crawler fallback, account-wide cost/cache pilot, owner release and apex smoke remain in the sibling ledger. Runtime activation wiring and its Local compatibility are implemented and tested.

Both children remain unarchived while those acceptance gates are open. No pagination, virtualization, batch Store Offer API, cart/checkout/offer/listing payload change, service worker, custom RUM or framework migration entered this diff.
