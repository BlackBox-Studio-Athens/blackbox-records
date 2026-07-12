# PERF-003: Runtime performance round-two implementation

## Report identity

- Date: 2026-07-12
- Change: `improve-site-runtime-performance-round-two`
- Implementation start: `aa0516bafe31ccb6355b15607512b5bd0b5e3bf5`
- Baseline measurement tree: `72f4ab46`
- Baseline environment: Local production build at `http://127.0.0.1:4321/blackbox-records/`
- Browser: Playwright Chromium 148.0.7778.96; Browser Use used the Codex in-app browser
- Raw baseline evidence: `.codex-artifacts/runtime-performance/72f4ab46-round-two-baseline/`
- Pre-existing excluded work: `openspec/changes/catalog-discovery-and-information-architecture/`; later concurrent `openspec/changes/skip-docs-only-static-deploys/`

Local baseline and final runs use the same production preview, browser, viewport, DPR, CPU/network settings, cache rules, cadence, and helper. Hosted PRD diagnostics are reported separately. Browser startup, extensions, unrelated network traffic, and machine contention are excluded only when trace evidence makes that attribution clear; slow valid application runs remain retained.

## Baseline

### Cold load

| Route    | Desktop LCP median / p75 | Desktop CLS p75 | Mobile-stress LCP median / p75 | Mobile CLS p75 | Desktop transfer median |
| -------- | -----------------------: | --------------: | -----------------------------: | -------------: | ----------------------: |
| Home     |          0.612 / 1.188 s |         0.00023 |                2.052 / 2.152 s |        0.00596 |               952,578 B |
| Store    |          0.152 / 0.176 s |         0.00024 |                1.032 / 1.052 s |        0.02757 |             2,106,113 B |
| Distro   |          0.100 / 0.100 s |         0.00024 |                2.340 / 2.488 s |        0.02115 |             1,235,642 B |
| Artists  |          0.088 / 0.100 s |         0.09114 |                1.764 / 1.812 s |        0.18981 |               670,368 B |
| Services |          0.160 / 0.268 s |         0.00122 |                2.580 / 2.628 s |        0.01669 |               943,998 B |
| About    |          0.396 / 0.528 s |         0.00024 |                1.136 / 1.164 s |        0.00064 |               515,483 B |
| Releases |          0.144 / 0.228 s |         0.00024 |                            n/a |            n/a |               673,919 B |
| News     |          0.088 / 0.140 s |         0.00037 |                            n/a |            n/a |               544,529 B |

Desktop values use five cache-cleared 1440×900 DPR-1 runs. Mobile values use three cache-cleared 390×844 DPR-2 runs at 4× CPU, 150 ms RTT, and 1.6 Mbps download. Services misses the 2.5 s mobile LCP gate and Artists misses the 0.1 CLS gate. Raw evidence retains every individual run, LCP element, font event, transfer/resource count, task count/time, and route error.

### Store request authority

Browser Use plus CDP on disabled PRD retained 82 stable price labels at route top. After the declared first-scroll segment, 12 labels resolved unavailable and 70 remained pending. The complete session issued exactly one `GET /api/store/capabilities` response with status 200, zero Store Offer reads, and zero Store-related 5xx responses. No checkout, stock, order, D1, Stripe, or provider mutation occurred.

### Font

- Stable request: `/assets/fonts/brand/veneer_regular.woff2`
- Discovery: `/assets/fonts/brand/veneer.css` linked by `SiteLayout.astro`
- SHA-256: `F02B74CB53A1640C6CBFC9A2AA5F5CE0609FA358231A9B30B93C1E0072622939`
- Bytes: 312,816
- Display: `swap`
- Hosted cache: `public, max-age=0, must-revalidate`
- Trace: repeated `BeginRemoteFontLoad`/`RemoteFontLoaded` events with retained layout maxima near one second

### JavaScript graph

The current local build-output graph contains 20 first-party eager Home files, 391,739 raw bytes, and 108,378 bytes with local quality-11 Brotli. The scoped shell contains 14 files, 198,464 raw bytes, and 54,880 bytes Brotli. The StoreCart module contributes 68,763 raw bytes and 16,539 bytes Brotli. The comparable hosted audit measured 124,945 Brotli bytes for Home and 62,771 for the scoped shell; those hosted values remain separate from local compression. Glancelytics is reported as a third-party graph and is not included in first-party totals.

### Browser Use baseline

Desktop and mobile reference screenshots cover Home, Store, Distro, Artists, Services, About, Store/Distro first scroll, mobile navigation, empty cart, detail overlay, and player open state. All representative direct routes retained their H1, source content, links, responsive images, and zero horizontal overflow or console warnings/errors. First-scroll screenshots showed no blank corridor or overlap. Accessibility snapshots retained the skip link, named navigation/dialogs, logical headings, and focusable close controls.

## Traversal baseline

| Profile | Route  | Traversal | Frame p95 | Frame maximum |  Work p95 | Layout p95 | Long tasks median / max |
| ------- | ------ | --------- | --------: | ------------: | --------: | ---------: | ----------------------: |
| Wide    | Home   | first     |   23.1 ms |      217.9 ms |  0.826 ms |       0 ms |                   2 / 3 |
| Wide    | Home   | repeat    |   24.6 ms |      165.8 ms |  0.927 ms |       0 ms |                   1 / 1 |
| Wide    | Store  | first     |   32.0 ms |      281.0 ms | 12.639 ms |  73.624 ms |                   6 / 7 |
| Wide    | Store  | repeat    |   26.4 ms |      217.1 ms |  3.032 ms |   8.840 ms |                   3 / 4 |
| Wide    | Distro | first     |   45.9 ms |    2,193.9 ms | 16.667 ms | 152.387 ms |                 16 / 17 |
| Wide    | Distro | repeat    |   43.1 ms |    1,533.0 ms | 16.667 ms |  65.480 ms |                  9 / 13 |
| Mobile  | Store  | first     |   26.8 ms |      478.9 ms | 16.667 ms | 153.967 ms |                   6 / 9 |
| Mobile  | Store  | repeat    |   28.1 ms |      833.2 ms |  1.899 ms |   2.702 ms |                   4 / 6 |
| Mobile  | Distro | first     |   26.0 ms |      301.5 ms | 16.667 ms | 169.716 ms |                   4 / 4 |
| Mobile  | Distro | repeat    |   18.8 ms |      228.2 ms |  0.835 ms |   3.941 ms |                   0 / 0 |
| Legacy  | Store  | first     |   30.4 ms |      427.3 ms | 16.667 ms |  78.034 ms |                   6 / 6 |
| Legacy  | Distro | first     |   31.8 ms |      633.2 ms | 16.667 ms | 110.718 ms |                   5 / 8 |

Each row reports the median run's p95 and the worst retained maximum across three runs. Work is bucketed into 16.667 ms trace windows from application script, style, layout, and paint slices. The large Home frame/LoAF outliers have no matching layout and sub-millisecond median work p95; they remain retained as host/browser/tooling contention rather than being silently discarded. Store and Distro misses have matching large layout slices and are application-attributable.

## Round-two results

### Distro containment ladder

Raw evidence:

- grouped chunks: `.codex-artifacts/runtime-performance/distro-grouped/`
- retained activation: `.codex-artifacts/runtime-performance/distro-retained/`
- eager/native rendering: `.codex-artifacts/runtime-performance/distro-eager/`

The 79-card catalog now remains fully server rendered in source order inside 16 bounded six-card-or-smaller chunks. Card-level `contain: strict`, fixed 40 rem card sizing, and per-card `content-visibility` are gone. Five semantic headings, all links, responsive images, keyboard/source order, shell focus/scroll reset, and mobile/desktop overflow behavior passed Browser Use. Group-level containment was rejected after wide first traversal retained 333.108 ms of layout work and mobile first traversal retained 270.308 ms. The tested 200% retained route-owned activation was also rejected after wide first traversal retained a 242.566 ms layout slice and 24.7 ms frame p95.

Eager/native Distro rendering is the safest retained implementation because it removes traversal layout activation entirely:

| Profile | Traversal | Baseline frame p95 | Eager frame p95 | Eager work p95 | Eager work max | Eager layout p95 | Eager long tasks |
| ------- | --------- | -----------------: | --------------: | -------------: | -------------: | ---------------: | ---------------: |
| Wide    | first     |            45.9 ms |         19.9 ms |       2.846 ms |       6.312 ms |             0 ms |                0 |
| Wide    | repeat    |            43.1 ms |         20.0 ms |       0.950 ms |       8.099 ms |             0 ms |                1 |
| Mobile  | first     |            26.0 ms |         18.1 ms |       0.623 ms |       4.478 ms |             0 ms |                0 |
| Mobile  | repeat    |            18.8 ms |         17.9 ms |       0.382 ms |       1.560 ms |             0 ms |                0 |
| Legacy  | first     |            31.8 ms |         19.3 ms |       2.479 ms |       7.879 ms |             0 ms |                0 |

Cold load remains inside the declared route gates: desktop LCP 152 ms with CLS 0.000237; mobile-stress LCP 1.648 s with CLS 0.021031. No route errors occurred.

The eager rung still misses the absolute 16.7 ms frame-interval p95 gate despite having no matching layout work and application work below both the 8 ms p95 and 16.7 ms maximum gates. Wide first is 19.9 ms and mobile first is 18.1 ms. Under task 2.10 this blocks Distro acceptance inside the approved scope: grouped, retained, and eager strategies are exhausted, and pagination/virtualization are prohibited without an OpenSpec amendment. The Distro item stops here while independent slices continue. `pnpm test:unit` passed (93 web files/419 tests, 32+34 backend files/407 tests, one API-client file/6 tests); `pnpm build` plus cache and image checks passed. `pnpm check` reached formatting and then stopped on the unrelated untracked `openspec/changes/catalog-discovery-and-information-architecture/specs/catalog-discovery/spec.md`, which this change does not modify.

### Store containment ladder

Raw evidence:

- grouped chunks: `.codex-artifacts/runtime-performance/store-grouped/`
- retained activation: `.codex-artifacts/runtime-performance/store-retained/`
- eager/native rendering: `.codex-artifacts/runtime-performance/store-eager/`
- Browser request evidence: `.codex-artifacts/runtime-performance/store-authority/`

All three approved Store strategies were measured and rejected. Six-card grouped containment kept mobile LCP at 1.012 s but retained a 310.555 ms mobile layout slice. Route-owned 300% retained activation reduced that layout p95 to 8.317 ms, but still produced 11.163 ms work p95 and a 32.425 ms application slice. Eager/native rendering moved too much work into load: mobile LCP rose to 3.672 s and first-scroll work p95 remained 10.834 ms. No Store rendering experiment is retained; the original Store rendering path remains in place pending an OpenSpec amendment.

| Strategy | Desktop LCP | Mobile LCP | Wide first frame/work p95 | Mobile first frame/work p95 |    Mobile layout p95/max |
| -------- | ----------: | ---------: | ------------------------: | --------------------------: | -----------------------: |
| Baseline |     0.152 s |    1.032 s |          32.0 / 12.639 ms |            26.8 / 16.667 ms | 153.967 / 478.9 ms frame |
| Grouped  |     0.116 s |    1.012 s |          22.0 / 11.279 ms |            18.3 / 16.667 ms |     310.555 / 310.555 ms |
| Retained |     0.112 s |    1.060 s |          20.8 / 13.204 ms |            22.1 / 11.163 ms |        8.317 / 11.081 ms |
| Eager    |     2.176 s |    3.672 s |          29.6 / 13.333 ms |            28.5 / 10.834 ms |         3.128 / 3.128 ms |

Browser Use preserved 82 server-rendered cards, 82 stable price frames, cart access, source/keyboard order, the last catalog item, and no horizontal overflow. Disabled PRD first/repeat traversal plus route exit produced exactly one 200 capability read, zero Store Offer reads, and zero Store 5xx. Bounded enabled UAT at 390×844 found two price islands inside the 240 px visibility margin and exactly two fresh 200 Store Offer reads; the other 80 labels stayed pending. Checkout was not started. The Worker `startCheckout` use case independently rereads current availability and online stock, reconciles the catalog price, rejects drift, and only then creates a hosted Checkout Session. No batch endpoint, static price, cached commerce authority, checkout, Worker, D1, stock, order, Stripe, or provider mutation was introduced.

Under task 3.10 the Store item stops inside approved scope. Pagination, batching, and virtualization require an amended change.

### License-safe Veneer delivery

The existing 312,816-byte Veneer WOFF2 remains byte-for-byte unchanged. Both the stable Holding Page copy and the new Astro-owned source have SHA-256 `F02B74CB53A1640C6CBFC9A2AA5F5CE0609FA358231A9B30B93C1E0072622939`. Normal routes now discover only the fingerprinted `/_astro/veneer_regular.*.woff2` asset from bundled CSS with `font-display: optional`; they no longer link or request `/assets/fonts/brand/veneer.css`. The generated asset is covered by the immutable `_astro` cache rule. The stable public CSS/font pair remains owned by the PRD Holding Page and also uses `optional`.

The Holding Page preload was retained after three mobile-stress A/B runs. With preload, LCP was 576/568/532 ms and CLS stayed zero. Without preload, LCP was 1,828/468/452 ms and CLS stayed zero. The retained preload avoided the cold outlier; neither variant produced a 50 ms font-attributed task or late layout shift. Main-route current-versus-optional traces likewise produced no repeatable 50 ms Veneer-attributed task or long animation frame and removed the prior late-swap layout burst. Raw traces are under `.codex-artifacts/runtime-performance/font-optional/`.

Browser Use checks with the Veneer request blocked and cached covered Home, Distro, Store checkout, and the Holding Page at mobile and desktop widths. English, Greek, accents/diacritics, long headings, navigation, cards, labels, and calls to action stayed visible without horizontal overflow or geometry loss. Cached main routes loaded the fingerprinted asset and `document.fonts.check('900 48px Veneer')` returned true. Evidence screenshots are under `.codex-artifacts/runtime-performance/font-optional/browser-use/`. `pnpm brand-font:check`, cache policy validation, the production build, `pnpm prd:holding:prepare`, and `pnpm prd:holding:check` passed.

### Direct-route image priority

About now exposes a direct-load-only first-viewport priority input and a 1200w candidate. Services makes only its first feature image eager/high; the remaining two stay lazy/auto. Artists keeps its three mobile first-viewport portraits eager, makes only the first high priority, and uses the existing Astro image pipeline at quality 68 for card candidates. The Ouranopithecus 480w candidate fell from 127,334 bytes to 101,596 bytes without changing the source, crop, dimensions, subject placement, or alt text. The filter portal slot reserves its measured 7rem footprint, reducing mobile Artists CLS from 0.18981 to a repeatable 0.095615.

| Route    | Desktop LCP median / max | Desktop CLS max | Mobile LCP median / max | Mobile CLS max | LCP element            |
| -------- | -----------------------: | --------------: | ----------------------: | -------------: | ---------------------- |
| About    |          0.108 / 0.184 s |         0.00024 |         0.712 / 0.720 s |        0.00064 | Direct hero image      |
| Services |          0.108 / 0.116 s |         0.00122 |         0.880 / 1.028 s |        0.01669 | First service image    |
| Artists  |          0.092 / 0.104 s |         0.09114 |         1.228 / 1.244 s |        0.09562 | First roster portrait  |
| Releases |          0.096 / 0.172 s |         0.00024 |                     n/a |            n/a | Latest feature artwork |
| News     |          0.076 / 0.104 s |         0.00037 |                     n/a |            n/a | First news card image  |

Five cache-cleared desktop and three mobile-stress runs use the final image tree at `http://127.0.0.1:4322/blackbox-records/`; raw results are under `.codex-artifacts/runtime-performance/images-final/`. Browser Use direct and shell-managed checks at 390×844 and 1440×900 retained crop, explicit geometry, zero horizontal overflow, one high-priority content image, lazy below-fold Services media, focus/scroll reset, and clean route content. Focused markup/CSS tests, `pnpm assets:check`, and the production build pass. Full `pnpm check` remains blocked only by the unrelated untracked catalog-discovery spec's existing Prettier warning.

### Route-proportional JavaScript

Artists filters, the Services inquiry form, Store cart button presentation, the cart bridge, and StoreCart behavior now sit behind direct dynamic imports owned by the existing route/container or cart signal. Shared cart event strings live in a dependency-free module, so the bridge no longer imports checkout presentation. Each portal provides an accessible loading status and a bounded error fallback while Astro server content remains usable. The app shell now receives the direct-load pathname from Astro, avoiding a server/client blank-path interval before route-owned effects attach.

| Graph                         |   Baseline local Brotli | Final local Brotli |             Change |
| ----------------------------- | ----------------------: | -----------------: | -----------------: |
| Home complete eager graph     |               108,378 B |           81,167 B | -27,211 B (-25.1%) |
| Scoped shell                  |                54,880 B |           17,266 B | -37,614 B (-68.5%) |
| Artists complete eager graph  | not separately retained |           67,214 B |            Passing |
| Services complete eager graph | not separately retained |           67,214 B |            Passing |
| Store complete eager graph    | not separately retained |           67,214 B |            Passing |

The repeatable graph check enforces the 97,280-byte Home/shell budget and fails if any representative eager graph contains `ArtistsRosterFilters`, `ServicesInquiryForm`, or `StoreCartButton`. Glancelytics remains reported separately as third party. StoreCart's existing Zod characterization suite passed, but replacing its parser did not shrink the graph because the required money boundary still owns Zod. The manual parser experiment was reverted; Zod remains unchanged at every trust boundary and in StoreCart.

Three mobile-stress Home runs with current deferred analytics had 1.652 s median LCP versus 1.644 s with the Glancelytics URL blocked. The 8 ms difference is immaterial and trace work was not repeatably attributable to the third-party script, so startup remains deferred and no provider or page-view behavior changed. Raw graph and A/B evidence is under `.codex-artifacts/runtime-performance/javascript-final/`. Browser Use proved first-use Artists filtering, Services form loading/input, persisted cart count, drawer open, quantity update, and server-content continuity.

### Hidden and closed animation

The route-loading bar now computes `animation-name: none` while closed and `route-loading-sweep` only while open. The Home cue still runs while visible, but the coarse scrolled owner stops its child animation instead of only making the parent transparent. Returning above the existing threshold restores the unchanged cue animation. Reduced motion continues to disable both.

At 4× CPU, a two-second settled Home sample with the cue hidden and loading closed recorded 1.668 ms total task duration, 0 ms script, 0 ms layout, and 0 ms style recalculation. The round-two baseline attributed about 35.4 ms over the same settled interval to the two infinite animation owners. Browser Use confirmed `hero-scroll-cue` at the visible top state, no cue animation with the scrolled class, closed loading `none`, open loading `route-loading-sweep`, closed completion, `pointer-events: none`, focus on `MAIN`, scroll reset, and reduced-motion `none`. Browser Use's raw CDP bridge rejected new-document console instrumentation; the required DevTools fallback found no application errors or warnings, only three expected local Glancelytics CORB issues from `https://www.glancelytics.com/api/event`.

## Exact-final-tree acceptance

Raw evidence: `.codex-artifacts/runtime-performance/2b96bbd7-final/`. The five profiles ran sequentially against the same production preview after an initial overlapped attempt was discarded. A Brooks review then found that trace aggregation mixed threads and overlapping intervals. Commit `33d1f89d` made the runner select the active Chromium renderer main thread and merge nested work before bucketing; the complete matrix below was rerun after that fix. No route errors occurred.

### Final cold load

| Route    | Desktop LCP median / p75 | Desktop CLS p75 | Desktop transfer / requests median | Mobile LCP median / p75 | Mobile CLS p75 | Mobile transfer / requests median | LCP element             |
| -------- | -----------------------: | --------------: | ---------------------------------: | ----------------------: | -------------: | --------------------------------: | ----------------------- |
| Home     |          1.164 / 1.200 s |         0.00024 |                     906,318 B / 34 |         1.648 / 1.656 s |        0.00064 |                  1,099,244 B / 33 | Hero tagline            |
| Store    |          0.092 / 0.104 s |         0.00024 |                  2,081,815 B / 101 |         1.056 / 1.076 s |        0.01412 |                 4,471,155 B / 101 | First Store card image  |
| Distro   |          0.136 / 0.136 s |         0.00024 |                   1,211,476 B / 98 |         1.484 / 1.484 s |        0.02103 |                  4,261,680 B / 98 | First Distro card image |
| Artists  |          0.064 / 0.064 s |         0.04633 |                     634,340 B / 30 |         1.212 / 1.216 s |        0.09503 |                    875,882 B / 29 | First roster portrait   |
| Services |          0.088 / 0.096 s |         0.00122 |                     935,192 B / 30 |         0.800 / 0.808 s |        0.01669 |                    703,234 B / 29 | First service image     |
| About    |          0.076 / 0.088 s |         0.00024 |                     498,896 B / 30 |         0.716 / 0.724 s |        0.00064 |                    487,890 B / 29 | Direct hero image       |
| Releases |          0.092 / 0.096 s |         0.00024 |                     649,615 B / 24 |                     n/a |            n/a |                               n/a | Latest feature artwork  |
| News     |          0.064 / 0.072 s |         0.00037 |                     520,229 B / 21 |                     n/a |            n/a |                               n/a | First news card image   |

All declared load gates pass: LCP is at most 2.5 s and CLS is at most 0.1. Mobile Distro transfers more responsive media because the accepted eager/native rung removes deferred rendering activation; its LCP remains 1.484 s. Trace files retain task/LoAF counts and time, font events, every run, selected LCP URL, status, and resource detail. Corrected desktop median renderer-main long-task counts are one on normal routes and four on Distro; mobile medians range from four to six on normal routes and 59 on eager Distro load. Those load tasks remain inside the accepted LCP/CLS outcome and are not combined with traversal work.

### Final traversal

| Profile | Route  | Traversal | Frame p95 / max |     Work p95 / max | Layout p95 | Long tasks median / time |
| ------- | ------ | --------- | --------------: | -----------------: | ---------: | -----------------------: |
| Wide    | Home   | first     |  18.0 / 18.6 ms |   0.380 / 3.260 ms |   0.410 ms |                 0 / 0 ms |
| Wide    | Home   | repeat    |  18.1 / 18.8 ms |   0.370 / 2.240 ms |   0.390 ms |                 0 / 0 ms |
| Wide    | Distro | first     |  18.0 / 18.8 ms |   4.280 / 5.340 ms |       0 ms |                 0 / 0 ms |
| Wide    | Distro | repeat    |  18.0 / 20.3 ms |   1.290 / 5.040 ms |       0 ms |                 0 / 0 ms |
| Wide    | Store  | first     | 18.3 / 218.3 ms | 16.670 / 16.670 ms | 107.700 ms |             6 / 641.1 ms |
| Wide    | Store  | repeat    |  18.1 / 21.3 ms |   2.270 / 9.620 ms |   5.100 ms |                 0 / 0 ms |
| Mobile  | Distro | first     |  18.0 / 18.6 ms |   0.200 / 3.650 ms |       0 ms |                 0 / 0 ms |
| Mobile  | Distro | repeat    |  17.9 / 18.5 ms |   0.170 / 0.230 ms |       0 ms |                 0 / 0 ms |
| Mobile  | Store  | first     | 18.2 / 335.2 ms | 16.670 / 16.670 ms | 216.860 ms |             8 / 978.6 ms |
| Mobile  | Store  | repeat    |  18.0 / 18.5 ms |   1.710 / 2.670 ms |   1.610 ms |                 0 / 0 ms |
| Legacy  | Distro | first     |  18.0 / 18.8 ms |   2.070 / 2.620 ms |       0 ms |                 0 / 0 ms |
| Legacy  | Store  | first     | 19.5 / 344.3 ms | 16.670 / 16.670 ms |  97.660 ms |           9 / 1,117.9 ms |

The exact-tree runner's cadence floor is about 18 ms: even Home first/repeat, with sub-millisecond layout and no long task, reports 18.0–18.1 ms frame p95. Distro retains zero traversal layout activation and no long tasks, but still misses the literal 16.7 ms frame gate. A Ponytail review proposed deleting its bounded six-card grid wrappers; the measured A/B regressed wide first traversal to 360.15 ms layout p95 and three long tasks, so those wrappers are retained. Store remains application-attributable and fails first traversal through large layout, 16.67 ms work p95, and six to nine long tasks. These results confirm the previously documented task 2.10 and 3.10 blockers; neither is reclassified as passing.

### Authority, field confidence, and rendered UX

Disabled PRD Store direct load plus first/repeat full traversal produced exactly one 200 `GET /api/store/capabilities`, zero Store Offer reads, and zero Store-related 5xx. The final local implementation created no checkout or mutation. Earlier bounded UAT evidence remains the enabled diagnostic: only two price islands inside the 240 px margin started two fresh 200 Offer reads, and checkout authority independently rereads current availability, stock, and price.

No representative 28-day Search Console, CrUX, or PageSpeed Insights field result was available for the Pages origin in this session. Search Console access was unavailable, PageSpeed did not expose an indexed report for the origin, and CrUX documentation notes that absent origins may be undersampled. Field confidence is therefore unavailable; this report makes lab claims only and adds no custom RUM. See <https://developer.chrome.com/docs/crux/guides/crux-api>.

Browser Use final coverage retained 79 Distro and 82 Store cards with no blank or zero-height card, full first/repeat traversal, source order, Greek text, last items, and zero horizontal overflow. Mobile menu navigation, header/footer shell navigation, focus on `MAIN`, scroll reset, detail overlay open/close, persisted cart count/drawer/quantity update, checkout presentation, player open/minimize/reopen/stop, reduced motion, font blocked/cached states, and direct/shell image behavior passed. DevTools was used only for console inspection after Browser Use rejected the required new-document CDP hook; no application error or warning was found.

### Independent review and closure status

Brooks review found the trace aggregation defect, the cart bridge rejection gap, and missing template-literal dynamic-import accounting. All three were fixed and covered. The corrected bundle report finds 12 shell dynamic imports, a 19,655-byte StoreCart closure, an 81,262-byte Home eager graph, a 17,361-byte shell closure, and no dormant portal diagnostic. Ponytail review removed an unused checkout event re-export; its Distro simplification was measured, rejected, and reversed as documented above.

Exact-final-tree acceptance remains blocked. Tasks 2.11, 3.11, 4.11, 5.10, 6.13, 7.7, 8.6, and 8.12 remain open: Distro misses the literal frame gate at the runner cadence floor, Store misses application-work and long-task gates, and the repository-wide `pnpm check` is blocked only by Prettier on the unrelated untracked `openspec/changes/catalog-discovery-and-information-architecture/specs/catalog-discovery/spec.md`. Round two is not archived; the performance epic remains open.
