# Runtime performance profile

Use these profiles for performance acceptance. Store raw output under `.codex-artifacts/runtime-performance/<commit-or-run>/`; commit only concise reports.

## Product Environments

- Local: `http://127.0.0.1:4321/blackbox-records/`
- UAT: `https://blackbox-studio-athens.github.io/blackbox-records/`
- PRD: `https://blackbox-records-web.pages.dev/`

Record commit, URL, Product Environment, production build command, browser/version, viewport, DPR, CPU/network throttle, cache state, run count, and method. Exclude browser startup, extensions, tooling, and unrelated network traffic explicitly.

## Matrix

| Profile           | Routes                                                        | Viewport        | CPU | Network                   | Cache/state              | Runs | Report                                                                              |
| ----------------- | ------------------------------------------------------------- | --------------- | --- | ------------------------- | ------------------------ | ---- | ----------------------------------------------------------------------------------- |
| Desktop cold      | Home, Store, Distro, Artists, Services, About, Releases, News | 1440×900, DPR 1 | 1×  | unthrottled               | cleared                  | 5    | median/p75 TTFB, FCP, LCP, CLS, bytes, resources, long tasks, route errors          |
| Mobile stress     | Home, Store, Distro, Artists, Services, About                 | 390×844, DPR 2  | 4×  | 150 ms RTT, 1.6 Mbps down | cleared                  | ≥3   | individual/median LCP and CLS, long tasks, font/image/JavaScript bytes, LCP element |
| Wide scroll       | Home, Store, Distro                                           | 1440×900, DPR 1 | 4×  | warm after load           | first and repeat         | 3+3  | frame/main/style/layout/paint median, p95, maximum, tasks and LoAFs ≥50 ms          |
| Mobile scroll     | Store, Distro                                                 | 390×844, DPR 2  | 4×  | warm after load           | first and repeat         | 3+3  | same as wide scroll                                                                 |
| Legacy regression | Store, Distro                                                 | 390×844, DPR 1  | 4×  | warm after load           | 48 px/rAF for 240 frames | 3    | p95, maximum, and long-task count                                                   |

Store collection runs also record listing-price projection reads, terminal placeholder states, Store Offer reads, and request-settle time. Acceptance is one `/api/store/listing-prices` read per collection activation, zero per-card `/api/store/items/:slug` reads, and no Store 5xx. Store Item detail runs retain one authoritative Store Offer read.

For wide scroll, disable CSS smooth scrolling, start at `scrollY = 0`, and advance 24 CSS pixels per animation frame for 360 frames. Mobile scroll uses 24 CSS pixels per animation frame for 300 frames. Reset directly to the top, wait 500 ms, then repeat the same segment. Never discard the first traversal as warm-up. Legacy regression retains 48 CSS pixels per animation frame for 240 frames.

Build and serve the production output, then run the existing-dependency helper. Use a new browser context per cold run. Set `RUNTIME_PERFORMANCE_COMMIT` to `git rev-parse HEAD` and keep baseline/final URLs and settings identical.

```powershell
$env:RUNTIME_PERFORMANCE_COMMIT = git rev-parse HEAD
pnpm performance:runtime -- '--profile=desktop-load' '--routes=home,store,distro,artists,services,about,releases,news' '--runs=5' '--output=.codex-artifacts/runtime-performance/<commit-or-run>/desktop-load.json'
pnpm performance:runtime -- '--profile=mobile-load' '--routes=home,store,distro,artists,services,about' '--runs=3' '--output=.codex-artifacts/runtime-performance/<commit-or-run>/mobile-load.json'
pnpm performance:runtime -- '--profile=wide-scroll' '--routes=home,store,distro' '--runs=3' '--output=.codex-artifacts/runtime-performance/<commit-or-run>/wide-scroll.json'
pnpm performance:runtime -- '--profile=mobile-scroll' '--routes=store,distro' '--runs=3' '--output=.codex-artifacts/runtime-performance/<commit-or-run>/mobile-scroll.json'
pnpm performance:runtime -- '--profile=legacy-scroll' '--routes=store,distro' '--runs=3' '--output=.codex-artifacts/runtime-performance/<commit-or-run>/legacy-scroll.json'
```

Browser Use is authority for screenshots, responsive layout, focus, keyboard order, scroll reset, overlays, player continuity, and console cleanliness. When Browser Use cannot expose trace categories or throttling, record the missing capability and use DevTools only for those trace metrics.

Never create checkout, mutate stock/order/provider/D1 state, load-test hosted Workers, or print secrets. Hosted diagnostics use one declared Store Item and report only status, cache policy, and browser-safe response category.
