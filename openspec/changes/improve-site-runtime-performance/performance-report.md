# Runtime performance implementation report

## Scope and baseline

- Implementation-start commit: `e79f99f5d8f37b5186319a6a9b5baafa4769dc45`
- Start tree: clean on `main`; no dirty-tree exclusions.
- Active overlap: `publish-prd-holding-page` owns its isolated artifact. Stable public logo/font inputs were retained; unrelated services content stayed untouched.
- Product Environment URLs follow `docs/runtime-performance.md`.
- Browser: Codex in-app Browser for rendered evidence; DevTools fallback for Performance Timeline traces because Browser Use read-only evaluation did not expose `window.performance`.

Five cache-cleared Local cold loads at 1440×900 DPR 1 produced:

| Route  | Baseline LCP median | Baseline LCP p75 |  CLS | Gate |
| ------ | ------------------: | ---------------: | ---: | ---- |
| Home   |             1.190 s |          1.195 s | 0.00 | pass |
| Store  |             1.382 s |          1.509 s | 0.00 | pass |
| Distro |             1.449 s |          1.455 s | 0.00 | pass |

Raw traces and desktop/mobile hero screenshots are under `.codex-artifacts/runtime-performance/baseline/`. Planning traces recorded Home narrow 4× CPU at 10 frames above 16.7 ms, Store at 83 islands/82 offers/2.24 MB/~5.2 s settle, Store height ~23,197 px, Distro height ~19,537 px, app-shell closure ~130.8 KiB Brotli, Veneer 312,816 bytes, desktop hero ~482 KiB, and footer logo ~101 KiB.

The historical UAT Store Offer failure was 82 HTTP 500 responses. A bounded 2026-07-11 recheck of capability plus `disintegration-black-vinyl-lp` returned 200/no-store for both, so the old deployed data/readiness defect is no longer reproducible. No Worker, D1, provider, checkout, or stock mutation was made; backend behavior was not changed.

## Accepted slices

- Hero: removed infinite Ken Burns, runtime filter, grain/blend layer, and off-home listeners. Existing monochrome source already contains static photographic grain. Coarse threshold now hides fixed decorative layers; returning above it restores the static composition.
- Store: `client:visible` uses a 240 px margin. One listing-lifetime capability promise short-circuits disabled environments and is cleared on rejection or last unmount. Stable label height and one effect cycle prevent CLS and automatic retry storms. Detail/checkout remain eager and authoritative.
- Catalogs: Store and Distro cards use native `content-visibility: auto`; narrow Distro cards add 40 rem size containment and reset it at multi-column breakpoints. The original responsive grids remain direct card containers. Full server HTML, order, links, keyboard order, and find-in-page remain intact.
- Assets: header and footer now use 10,772-byte and 27,435-byte fingerprinted derivatives at twice-or-less rendered size. Desktop hero selection is capped at the 1400w responsive candidate. Inter 300 and global Veneer preload were removed.
- Font fallback: no Veneer license file exists in the repository, so modification/subsetting cannot be proven legal. Original 312,816-byte file remains unchanged and stylesheet-discovered. This is the specified license-safe fallback; no unsupported byte-budget pass is claimed.
- Shell: mobile sheet, cart drawer, detail overlay, and player presentation now load through direct first-intent imports. Navigation/event bridges and route/focus/scroll behavior stay eager.

## Evidence-gated no-actions

No batch Store endpoint, virtualization, pagination, infinite scrolling, global blur removal, partial-document rewrite, service worker, media service, or loader registry was added. Fixed hero positioning, current overlay route contract, and small unrelated decorative effects remain because primary slices address measured causes.

## Field data and rollback

No privacy-approved representative 28-day field Core Web Vitals dataset is connected, so field status is unavailable; lab results do not imply a field pass. Each slice rolls back independently by restoring prior hero rules, eager listing hydration, catalog wrappers, asset references, font preload, or eager presentation imports. No data migration or cache purge is involved.

## Final budgets

Five cache-cleared production-preview loads at 1440×900 DPR 1 produced:

| Route  | Final LCP median | Final LCP p75 |  CLS | Budget | Result |
| ------ | ---------------: | ------------: | ---: | -----: | ------ |
| Home   |          1.100 s |       1.101 s | 0.00 |  2.0 s | pass   |
| Store  |          0.075 s |       0.091 s | 0.00 |  2.5 s | pass   |
| Distro |          0.081 s |       0.087 s | 0.00 |  2.5 s | pass   |

Store's first cold run was 1.007 s; the remaining text-LCP runs were 68–91 ms. No value is discarded. Localhost transfer speed makes Store/Distro absolute times diagnostic only; the fixed budget still passes on every run.

At 390×844 DPR 1 and 4× CPU, three Store traces recorded app-attributable layout/style/paint p95 of 2.03–2.26 ms, maxima of 7.88–12.13 ms, and zero ≥50 ms tasks. Two completed final Distro traces recorded p95 of 2.26–2.32 ms, maxima of 6.20–9.90 ms, and zero ≥50 ms tasks. DevTools transport closed while saving Distro trace three; the equivalent Browser Use run covered a fixed 11,520 px segment, found no overflow or long tasks, and recorded a 10.2 ms p95/10.7 ms maximum frame interval. Raw and intermediate tuning traces remain under `.codex-artifacts/runtime-performance/final/`.

Home's static treatment removes both infinite paint animations and the runtime image filter; the measured reduced-motion narrow trace cut decorative paint by 94% from baseline, with no off-Home listener or animation work. The final eager app-shell closure is 14 files, 198,444 raw bytes and 54,880 Brotli bytes, passing the 95 KiB gate. Generated header/footer logo candidates are 5,728 and 8,100 bytes. The selected 1400w hero candidate is 217,698 bytes, below 350 KiB; the unchanged source and larger generated candidates remain available but are not selected at the declared DPR 1 profile.

## Review and regression evidence

Brooks review found lazy player/overlay readiness races and same-visit capability retry risk. The implementation now queues the first provider until the lazy frame host connects, schedules overlay focus from panel readiness, retains failed capability reads until the last listing consumer releases, and includes regression tests. Brooks re-review marked those findings resolved. Ponytail's final delta pass identified inert Store wrappers and duplicate Distro wrappers; both were deleted so containment lives directly on the cards.
