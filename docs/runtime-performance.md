# Runtime performance profile

Use these profiles for performance acceptance. Store raw output under `.codex-artifacts/runtime-performance/<commit-or-run>/`; commit only concise reports.

The public eager JavaScript graph budget is 102 KiB Brotli; the user approved raising it from 100 KiB on 6 October 2026 because Store Item pages sat 24 bytes under the old limit and any shared byte failed a release. Home alone has a user-approved 104 KiB limit: 103 KiB for the preorder and inquiry release, raised on 7 October 2026 for the swipe-row dots island, which must load with `client:load` because the shell runs no page scripts. Shell, Store Item and other routes use 102 KiB; dormant surfaces must remain lazy. Page-specific code belongs in that page's island, not the layout or shell. `scripts/check-runtime-bundle-graphs.ts` enforces and reports both limits.

## Product Environments

- Local: `http://127.0.0.1:4321/blackbox-records/`
- UAT: `https://blackbox-records-web-uat.pages.dev/`
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

## Idle and real input profiles

For local feature comparisons, `--veneer-preload=enabled|disabled` and `--content-visibility=enabled|disabled` intercept documents identically in both arms. The disabled arm removes only the Veneer preload or overrides Store card containment visibility; the enabled card arm sets native paint skipping with a remembered 520 px initial block-size estimate. Non-document requests fall through to other interceptors, including the native Lenis comparison. Keep the same production build, device, routes and run count (at least three per arm), save separate outputs, and record the declared switches. The default `build` uses the emitted document unchanged. These comparisons measure the current build; they do not reconstruct the missing review-baseline traces.

`desktop-idle` and `touch-idle` trace five settled seconds at 4× CPU after five seconds of load settling. Run Home, Who We Are (About), and Store Distro three times per device. Idle tracing creates no measurement animation-frame loop. Reports include renderer main-thread task time, recurring `FireAnimationFrame` callbacks, style/layout work and long tasks. Touch profiles use 390×844 DPR 2 with mobile/touch emulation and assert a coarse, hoverless pointer; desktop profiles use 1440×900 DPR 1 and assert a fine pointer with hover.

`wheel-scroll` dispatches browser wheel events; `touch-scroll` sends interpolated CDP touch drags. Both scroll the Grid from the top, record first and repeat separately, reset immediately, and run at least three times. Reports retain frame intervals, `UpdateLayoutTree` element counts, layout, long tasks, input type and raw traces. The real-input profiles add one measurement animation-frame observer per frame; their callback counts must not be interpreted as idle scroll-runtime loops. Never combine their results with scripted scroll profiles.

`crate-wheel` and `crate-touch` open the Store Crate on Distro, record the time from the press until the covers land, then send one sideways wheel notch or one downward touch drag per sleeve. They fail when a gesture turns more or fewer than one sleeve or the page scrolls, and report frame intervals, long tasks, `UpdateLayoutTree` element counts and the sleeve images loaded.

`mobile-load` and other mobile-load derivatives use mobile/touch browser contexts, not just a narrow viewport. For Home input comparisons, `touch-home-input` opens a fresh Home context under the mobile-load 390×844 DPR-2, 4× CPU and slow-network settings, swipes before the page settles, times a Menu tap separately, then traces settled first and repeat touch drags. Its local listing-price fixture declares `--home-showcase=empty|populated` (one real built preorder candidate for the populated state) and checks the declared section state. Each run retains raw traces, browser touch/pointer/click/scroll and frame-callback timestamps, renderer long-task slices, tap-to-menu time, and requests. `firstScrollEventMs` is the delay to a dispatched `scroll` event; `nextFrameCallbackAfterScrollEventMs` is a callback timestamp. Neither measures the first visible frame or field scrolling latency. The diagnostic probe records event and frame timestamps without reading `scrollY` inside those callbacks: such a read forced layout and invalidated calibration traces on 10 October 2026. Use the same build and flags for at least three sequential before/after runs; `--cpu=6 --dpr=3` supplies an additional stress pass. Tap-to-menu time includes browser automation scheduling and is not field INP. Keep 4× and 6× evidence separate, retain slow outliers, and identify fixture-backed results as local evidence rather than PRD commerce behavior.

`touch-home-menu` isolates a settled Home Menu tap from cold loading. Run at least five fresh contexts each with `--menu-swipe=none --menu-delay=0` and `--menu-swipe=swipe` at `--menu-delay=0|250|750|1500`. The output retains the requested delay, actual touch-end-to-pointerdown interval, scroll-event activity in the preceding 200 ms, whether the browser dispatched `click`, and whether Menu opened. `--menu-tap=held` tests an 80 ms CDP press instead of Playwright's locator tap. A pointerdown/up without `click` is not a shell navigation failure; retain such misses instead of discarding them. The profile is a synthetic browser diagnostic, not Messenger acceptance.

For the older-browser hero path, repeat `touch-home-input` with `--hero-fallback=forced` and an otherwise identical normal arm. The forced arm overrides the scroll-timeline capability check and injects paused fallback animation CSS for this local document only. Compare settled first/repeat traces and the four saved hero opacity samples; cold-load timings between intercepted and normal documents are not a controlled A/B. Neither arm changes production hero CSS.

```powershell
pnpm performance:runtime -- '--profile=touch-home-input' '--home-showcase=populated' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/home-populated.json'
pnpm performance:runtime -- '--profile=touch-home-input' '--home-showcase=empty' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/home-empty.json'
pnpm performance:runtime -- '--profile=touch-home-menu' '--menu-swipe=none' '--menu-delay=0' '--runs=5' '--output=.codex-artifacts/runtime-performance/<run>/menu-control.json'
pnpm performance:runtime -- '--profile=touch-home-menu' '--menu-swipe=swipe' '--menu-delay=250' '--runs=5' '--output=.codex-artifacts/runtime-performance/<run>/menu-after-swipe.json'
```

```powershell
pnpm performance:runtime -- '--profile=desktop-idle' '--routes=home,who-we-are,store/distro' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/desktop-idle.json'
pnpm performance:runtime -- '--profile=touch-idle' '--routes=home,who-we-are,store/distro' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/touch-idle.json'
pnpm performance:runtime -- '--profile=wheel-scroll' '--routes=store,store/distro' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/wheel-scroll.json'
pnpm performance:runtime -- '--profile=touch-scroll' '--routes=store,store/distro' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/touch-scroll.json'
pnpm performance:runtime -- '--profile=crate-wheel' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/crate-wheel.json'
pnpm performance:runtime -- '--profile=crate-touch' '--runs=3' '--output=.codex-artifacts/runtime-performance/<run>/crate-touch.json'
```

For a same-session native A/B, repeat the same profile/build/routes with `--scroll-runtime=native` and a separate output. This intentionally aborts the production `lenis*.js` chunk so the existing native fallback runs, records blocked asset URLs, and rejects a sample if Lenis is still present. Record that intentional failure separately from product console errors. A production build with a differently named Lenis chunk needs its actual asset match verified before native evidence is accepted; an already-native touch run needs no blocked asset. Keep the default `enabled` result separate and use those same-session measurements to decide whether desktop Lenis stays. No such measurement or decision is established by unit tests.

The round-three implementation selects native public scrolling on every pointer from the recorded CPU comparison. On that build, `enabled` already uses native input and has no Lenis chunk to abort; only an earlier on-demand build provides a Lenis/native A/B. Report the build hash with each decision. Public legacy scroll function names remain stable for callers.

## Local Home scrolling check

`pnpm test:e2e e2e/home-scroll.spec.ts --project=chromium-mobile --workers=1` checks that the decorative hero crops cannot become nested scroll containers, then waits for fonts and 15 seconds before native touch drags traverse Home to its bottom and back. The complete traversal is skipped in CI. Only the fast crop regression runs there (590 ms in the recorded production-preview check).

Without extra configuration this uses Chromium mobile emulation. To exercise an actual Android WebView, run a debuggable WebView on a device or hardware-backed AVD, reverse this checkout's Local port with ADB, and forward the WebView's observed DevTools socket to a free host port. Set `BLACKBOX_ANDROID_WEBVIEW_CDP` to that local HTTP CDP endpoint before running the same command. The test attaches to the existing page and records its actual user agent, viewport/DPR and scroll-timeline support as `scroll-browser`; it does not launch or authenticate Messenger. Clear the variable after use. This option is Local only and introduces no Android installation or emulator job in CI.

For a reported Android in-app freeze, retain first and repeat native ADB input traces separately from the automated functional check. Use hardware graphics, keep the same build, viewport and input cadence, and wait for fonts and at least 15 seconds. A Messenger user-agent string in desktop Chromium does not reproduce Android embedding. Record the actual Android/WebView version and graphics backend, and retain the affected phone's manual acceptance separately. The `fix-home-scroll-frame-scheduling` change records the Pixel 6a / Android 17 follow-up and its Android 16 / WebView 151 control.

The Holding artifact checker expects apex-relative assets. When validating an isolated apex production build, `pnpm --filter web prd:holding:prepare --dist=<build-root>` accepts its explicit output directory; omitting the argument retains the normal `apps/web/dist` input. Run the existing Holding artifact check afterward.
