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

Pending implementation and exact-final-tree acceptance.
