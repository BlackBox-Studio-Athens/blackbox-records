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

Exact-final-tree acceptance remains pending.
