# Runtime performance profile

Use this profile for Home, Store, and Distro. Store raw output under `.codex-artifacts/runtime-performance/<commit-or-run>/`; commit only concise reports.

## Product Environments

- Local: `http://127.0.0.1:4321/blackbox-records/`
- UAT: `https://blackbox-studio-athens.github.io/blackbox-records/`
- PRD: `https://blackbox-records-web.pages.dev/`

Record commit, URL, Product Environment, production build command, browser/version, viewport, DPR, CPU/network throttle, cache state, run count, and method. Exclude browser startup, extensions, tooling, and unrelated network traffic explicitly.

## Matrix

| Profile        | Routes              | Viewport        | CPU | Network | Cache           | Runs | Report                                                                      |
| -------------- | ------------------- | --------------- | --- | ------- | --------------- | ---- | --------------------------------------------------------------------------- |
| Cold load      | Home, Store, Distro | 1440×900, DPR 1 | 1×  | none    | cleared         | 5    | median and p75 TTFB/FCP/LCP/CLS, bytes, resources, long tasks, route errors |
| Settled scroll | Home, Store, Distro | 390×844, DPR 1  | 4×  | none    | warm after load | 3    | median, p95, maximum main/paint work, tasks ≥50 ms                          |

Store runs also record hydrated price islands, capability reads, Store Offer reads/statuses, and request-settle time. Disabled Store acceptance is one capability read, zero offers, and zero Store 5xx. Enabled Store acceptance is visible-margin offer reads only.

For settled scroll, disable CSS smooth scrolling, start at `scrollY = 0`, and advance 48 CSS pixels per animation frame for 240 frames. This fixed 11,520 px segment is long enough to cross multiple containment boundaries without making route length change the input speed.

Browser Use is authority for screenshots, responsive layout, focus, keyboard order, scroll reset, overlays, player continuity, and console cleanliness. When Browser Use cannot expose trace categories or throttling, record the missing capability and use DevTools only for those trace metrics.

Never create checkout, mutate stock/order/provider/D1 state, load-test hosted Workers, or print secrets. Hosted diagnostics use one declared Store Item and report only status, cache policy, and browser-safe response category.
