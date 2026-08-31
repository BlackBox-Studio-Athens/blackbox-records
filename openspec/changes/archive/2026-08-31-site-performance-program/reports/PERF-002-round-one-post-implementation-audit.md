# PERF-002: Round-one post-implementation performance audit

## Report identity

- Date: 2026-07-12
- Report type: independent post-implementation audit
- Performance implementation reference: `8469799f`
- Primary target: `https://blackbox-records-web.pages.dev/`
- Product Environment: PRD
- Browser: Chrome 150
- Comparison source: `PERF-001`, the archived round-one implementation report
- Runtime mutations: none
- Field-data status: unavailable; PageSpeed Insights was rate-limited and no representative privacy-approved 28-day sample is connected

## Conclusion

Round one was a material but incomplete improvement. It fixed Home's large continuous hero effects, Store's request fan-out, oversized logos and hero selection, and most dormant app-shell presentation imports. It did not make first traversal consistently smooth on long catalogs, remove the unmodified Veneer font's late layout burst, prioritize all secondary-route LCP images, make the full first-party JavaScript graph route-proportional, or stop every invisible infinite animation.

The most important miss is first scroll. The earlier fixed narrow script under-sampled the wide, realistic traversal that exposes `content-visibility` activation. Store has a costly first traversal and then becomes smooth. Distro remains costly on both first and repeat traversal. The next implementation must treat first traversal as the primary acceptance path, not a warm-up run.

## Method

### Desktop cold load

- 1440×900, DPR 1
- unthrottled CPU and network
- cache cleared between five runs
- reported median and p75 where applicable

### Mobile stress load

- 390×844, DPR 2
- 4× CPU slowdown
- 150 ms round-trip latency, 1.6 Mbps download
- cache cleared between three runs

### Runtime scroll

- wide profile: 1440×900, DPR 1, 4× CPU, warm after load, realistic first and repeat traversal
- legacy profile reproduction: 390×844, DPR 1, 4× CPU, 48 CSS px per animation frame for 240 frames
- frame p95, frame maximum, and tasks of at least 50 ms recorded

Browser Use supplied rendered, accessibility, and console checks. Performance tracing used the documented fallback after Browser Use could not expose the required trace categories and the embedded browser transport failed with classified CDP/webview errors. No checkout, stock, order, provider, D1, or hosted configuration mutation occurred.

## Comparison discipline

`PERF-001` final load numbers came from a Local production preview. `PERF-002` primary numbers come from hosted PRD. They are directional context, not a like-for-like before/after comparison, so no improvement percentage is claimed.

The earlier and current narrow scroll profiles use the same scripted input, but hosted versus Local execution still remains separated. The new wide first-traversal profile has no round-one baseline and exposes a gap in the original validation matrix rather than a direct regression.

## Primary route load results

Five hosted PRD desktop cold runs produced:

| Route  | FCP median | LCP median | LCP p75 | CLS p75 | Transfer median | Requests | Long-task time |
| ------ | ---------: | ---------: | ------: | ------: | --------------: | -------: | -------------: |
| Home   |    0.824 s |    1.240 s | 1.332 s | 0.00023 |       945,868 B |       33 |        1.062 s |
| Store  |    0.648 s |    0.916 s | 0.916 s | 0.00029 |       678,438 B |       32 |        1.221 s |
| Distro |    0.664 s |    0.824 s | 1.132 s | 0.00023 |     1,236,978 B |      103 |        1.109 s |

All three routes meet the existing hosted LCP and CLS budgets. The one-second range of accumulated long-task time on every route is not explained by slow origin response and remains relevant to responsiveness and first interaction.

Five bounded `curl` checks placed median TTFB between 0.216 and 0.269 seconds across representative routes. Backend or static-host latency is not the primary remaining cause.

## Mobile stress results

Three hosted PRD cold runs produced these medians:

| Route  | LCP median |    CLS | Notable trace result                                      |
| ------ | ---------: | -----: | --------------------------------------------------------- |
| Home   |    2.320 s | 0.0060 | one font-related task per run, approximately 5.7 to 7.2 s |
| Store  |    1.340 s | 0.0141 | one approximately 6.2 s font-related outlier              |
| Distro |    3.052 s | 0.0212 | one approximately 4.9 s font-related outlier              |

Distro misses the 2.5-second good LCP threshold under the declared mobile stress profile. Home remains below 2.5 seconds but has little headroom. The font work dominates the worst traces.

## First-scroll results

### Wide 4× CPU profile

| Route  | Traversal | Frame p95 |  Maximum | Long tasks | Long-task total |
| ------ | --------- | --------: | -------: | ---------: | --------------: |
| Home   | first     |   16.6 ms |  41.6 ms |          0 |         0.000 s |
| Store  | first     |  100.0 ms | 316.7 ms |         11 |         1.795 s |
| Store  | repeat    |   16.8 ms |  33.4 ms |          0 |         0.000 s |
| Distro | first     |  183.3 ms | 466.7 ms |         26 |         3.541 s |
| Distro | repeat    |  108.3 ms | 175.0 ms |         22 |         1.925 s |

Home is effectively fixed. Store pays a severe one-time activation cost during the first traversal. Distro remains visibly janky after warming and is the highest-priority runtime defect.

A representative Distro repeat trace attributed approximately:

- 959.8 ms to Layout;
- 174.6 ms to Paint;
- 132.9 ms to Intersection Observer computation;
- 0.3 ms to JavaScript function calls.

This is a browser rendering and containment activation problem, not a JavaScript loop.

### Legacy narrow profile reproduction

Hosted PRD runs showed low p95 work but large outliers:

| Route  | p95 range       | Maximum range | Long-task range |
| ------ | --------------- | ------------- | --------------- |
| Store  | 2.15 to 3.97 ms | 316 to 469 ms | 4 to 10         |
| Distro | 1.58 to 2.01 ms | 299 to 393 ms | 6 to 8          |

Local Distro runs with the same script produced p95 of 1.59 to 8.63 ms, maxima of 15.5 to 59.4 ms, and zero to five long tasks. The original round-one report used too few clean outcomes to expose tail latency reliably. A low p95 alone was not sufficient evidence.

## Containment A/B evidence

### Distro

| Variant                         | Layout during scroll | Frame p95 | Long tasks |
| ------------------------------- | -------------------: | --------: | ---------: |
| Current `content-visibility`    |               991 ms |   66.7 ms |         12 |
| Forced visible before traversal |                 0 ms |   25.0 ms |          0 |

Forcing the cards visible moved approximately 1.691 seconds of layout work to the upfront phase at 4× CPU. This proves individual card activation causes the scroll jank, but a blanket eager render could trade the problem for slower load and worse mobile LCP. Round two must test selective retained activation, coarser grouping, and finally route/breakpoint-specific removal against both load and first-scroll gates.

### Store

Forcing Store cards visible moved approximately 0.695 seconds of layout work upfront at 4× CPU. First-scroll frame p95 improved from about 100 ms to 33.3 ms and long tasks fell from 11 to 1. The remaining miss means Store needs both rendering activation work and a review of route-specific island or portal work during the first corridor.

## Store request behavior

The request fan-out defect is fixed and must stay fixed.

- At the route top after ten seconds, all 82 price labels remained in their stable loading state and no Store Offer read had started outside the visibility margin.
- After scrolling to approximately `scrollY = 3000`, 12 labels resolved unavailable.
- The session issued exactly one `/api/store/capabilities` request, zero Store Offer requests, and zero Store-related 5xx responses.

No batch Store Offer endpoint is justified by the current disabled-PRD evidence. The next change must preserve `client:visible`, listing-lifetime capability deduplication, stable label geometry, fail-closed commerce authority, and zero disabled-environment offer fan-out.

## Font findings

`veneer_regular.woff2` remains 312,816 bytes, is discovered through the global stylesheet, uses `font-display: swap`, and is served from a stable public path with `Cache-Control: public, max-age=0, must-revalidate`.

All five retained round-one final traces show `RemoteFontLoaded` followed within 0.697 to 3.198 ms by approximately 935.08 to 968.57 ms of Layout. Fresh Home A/B runs produced:

| Variant                  | Median font long-task time |    LCP |
| ------------------------ | -------------------------: | -----: |
| Current `swap`           |                   1,151 ms | 724 ms |
| Font request blocked     |                       0 ms | 708 ms |
| `font-display: optional` |                       0 ms | 740 ms |

The repository has no license proving that Veneer may be modified. Round two must preserve the exact font bytes. The license-safe direction is to import the unmodified file through the existing fingerprinted Astro/Vite asset path, apply `font-display: optional`, retain the approved fallback stack, and verify English, Greek, diacritics, headings, wrapping, and layout at mobile and desktop sizes. No subsetting, conversion, glyph removal, or derivative font generation is allowed.

## Secondary-route LCP

Hosted desktop cold-load medians exposed routes omitted from round one's primary matrix:

| Route    | LCP median | Finding                                                                                      |
| -------- | ---------: | -------------------------------------------------------------------------------------------- |
| Artists  |    4.364 s | poor; the first three images load eagerly and the 480w Ouranopithecus candidate is 127,334 B |
| Services |    2.860 s | needs improvement; the first LCP image is 115,210 B but remains lazy-loaded                  |
| About    |    3.852 s | needs improvement; the hero is lazy-loaded and its candidate ladder skips 1200w              |
| Releases |    0.744 s | one-pass diagnostic, no current miss                                                         |
| News     |    0.780 s | one-pass diagnostic, no current miss                                                         |

The next implementation must make only first-viewport/LCP candidates eager and high-priority, keep later media lazy, add the missing About candidate size, and remediate the Artists outlier source or selected candidate without weakening responsive image markup.

## JavaScript graph

The scoped eager app-shell closure is healthy: 14 files, 198,430 raw bytes, and 62,771 bytes using actual hosted Brotli. The older 54,880-byte figure used a local/offline closure calculation, so the two values are not like-for-like. Both remain under the existing 95 KiB scoped shell gate.

The full Home first-party eager graph is larger: 20 files, 391,903 raw bytes, and 124,945 hosted Brotli bytes, plus an analytics graph of 21 files and 126,772 bytes. `ShellPortalOutlets.tsx` still eagerly imports Artists filters, Services form code, and Store cart UI. `store-cart.ts` eagerly pulls a 18,988-byte Zod chunk into a browser-only convenience-state boundary.

Round two should keep shell routing, focus, scroll reset, event bridges, and player continuity eager while loading route-specific portals only for the active route or first intent. It should decouple the Store cart event contract from heavy UI imports and replace or isolate Zod at the non-authoritative browser cart persistence boundary with the smallest explicit parser that preserves malformed-storage handling. No new state or loader framework is justified.

## Residual animation work

After the Home hero threshold, the media and shade layers stop, but the hero scroll cue and the closed route-loading bar keep infinite animations alive. Disabling both reduced settled Home 4× CPU task time over two seconds from approximately 35.4 ms to 0.3 ms.

Round two must pause or remove these animations when their owning UI is hidden or closed, preserve loading feedback while active, retain reduced-motion behavior, and verify that no invisible infinite animation remains in settled route states.

## Accessibility and visual stability

Browser Use confirmed a Home skip link, named navigation, cart and newsletter controls, logical heading hierarchy, and no warning or error console logs. Store's exceptionally large accessibility snapshot exceeded the tool's internal handling limit; this was classified as a tooling failure, not a page accessibility failure.

Performance work must preserve full server HTML, logical source and keyboard order, focus visibility, find-in-page, responsive layouts, shell scroll/focus reset, overlay/player continuity, stable price-label geometry, and reduced-motion behavior. List virtualization, pagination, or infinite scroll is allowed only after simpler first-traversal fixes fail and a separate accessibility-aware design decision is recorded.

## Round-two decision

Create `improve-site-runtime-performance-round-two` and address every remaining measured issue in this order:

1. Fix first traversal on Distro, then Store, with separate first and repeat gates.
2. Eliminate the license-safe font relayout using the unmodified asset, `optional` display, and immutable fingerprinting.
3. Fix About, Services, and Artists LCP discovery, priority, and candidate selection.
4. Make the full first-party eager JavaScript graph route-proportional without weakening shell behavior.
5. Stop invisible infinite animation work.
6. Remeasure all primary and secondary routes, request behavior, accessibility, and available field data; append `PERF-003`.

The implementation should stop at the smallest proven fix inside each slice. It must not add a framework rewrite, SSR, service worker, media CDN/DAM, blanket blur removal, custom telemetry backend, batch Store API, or virtual list unless its explicit escalation gate is met and the OpenSpec design is amended first.

## Reference guidance

- Core Web Vitals remain field metrics evaluated at p75 with good thresholds of LCP at most 2.5 s, INP at most 200 ms, and CLS at most 0.1: <https://web.dev/articles/defining-core-web-vitals-thresholds>
- Chrome documents 60 Hz rendering as approximately 16.66 ms per frame and long animation frames at 50 ms or more: <https://developer.chrome.com/docs/web-platform/long-animation-frames>
- `font-display: optional` avoids a late font swap; it can use the fallback for the first navigation when the font arrives too late: <https://web.dev/learn/performance/optimize-web-fonts>
- Above-fold and LCP images must not be lazy-loaded; `fetchpriority="high"` is appropriate for the primary candidate: <https://web.dev/articles/browser-level-image-lazy-loading>
- `content-visibility` deliberately defers layout and paint, so its initial-load benefit must be balanced against activation during traversal: <https://web.dev/articles/content-visibility>
