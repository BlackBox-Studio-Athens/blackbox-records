## Context

This change is round two under `../site-performance-program/`. Its predecessor, `improve-site-runtime-performance`, is archived at `../archive/2026-07-12-improve-site-runtime-performance/`, and its requirements are now baseline.

The 2026-07-12 independent audit measured the deployed PRD artifact with the round-one implementation reference `8469799f`. Round one retained clear wins:

- Home's large runtime hero effects are gone.
- Disabled PRD Store uses one capability read, zero Store Offer reads, and zero Store-related 5xx responses.
- Header/footer assets and selected Home hero media are bounded.
- The scoped app-shell closure passes its 95 KiB Brotli budget.
- Static Astro output, shell navigation, player continuity, accessibility, and commerce authority remain intact.

The same audit found these remaining costs:

| Surface              | Fresh evidence                                                                                     | Cause                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Distro first scroll  | 183.3 ms frame p95, 466.7 ms maximum, 26 long tasks                                                | Individual `content-visibility` and strict-containment activation causes large Layout work                                  |
| Distro repeat scroll | 108.3 ms frame p95, 22 long tasks                                                                  | The current card-level strategy keeps exposing rendering work after warm-up                                                 |
| Store first scroll   | 100 ms frame p95, 11 long tasks                                                                    | One-time card rendering activation, with smaller residual island/portal work                                                |
| Brand font           | 312,816 bytes; retained traces show approximately 935 to 969 ms of Layout after `RemoteFontLoaded` | Global stable public CSS uses `font-display: swap` and a revalidated public URL                                             |
| Artists              | 4.364 s desktop LCP median                                                                         | Leading grid image priority plus an oversized selected Ouranopithecus candidate                                             |
| Services             | 2.860 s desktop LCP median                                                                         | First feature image is lazy-loaded despite becoming LCP                                                                     |
| About                | 3.852 s desktop LCP median                                                                         | Direct-load hero is lazy and its width ladder skips 1200w                                                                   |
| Initial JavaScript   | Home first-party eager graph is 124,945 hosted Brotli bytes                                        | `ShellPortalOutlets` eagerly imports Artists, Services, and Store UI; StoreCart pulls Zod into a convenience-state boundary |
| Settled animation    | Hidden hero cue and closed loading bar use about 35.4 ms over two seconds at 4× CPU                | Infinite animation remains active while the owner is visually inactive                                                      |

Current implementation confirms the audit:

- `global.css` applies `contain: strict`, fixed 40 rem block size, and `content-visibility: auto` to each Distro card; Store cards also use `content-visibility: auto` individually.
- `SiteLayout.astro` links `/assets/fonts/brand/veneer.css`; that stylesheet uses `font-display: swap` and the public WOFF2.
- The PRD Holding Page requires the same public font/CSS paths as part of its closed asset set.
- `ShellPortalOutlets.tsx` statically imports all three route-specific portals.
- `store-cart.ts` imports Zod even though StoreCart is browser convenience state and never commerce authority.
- `InternalPageHero.astro` has no explicit first-viewport priority input and uses widths `[720, 1080, 1440, 1800]`.
- The route-loading bar animation is declared on its bar regardless of closed state; the Home scroll cue keeps animating after its parent becomes transparent.

## Goals / Non-Goals

**Goals:**

- Make the first traversal of Store and Distro smooth on realistic desktop and mobile stress profiles.
- Keep initial route load within good LCP and CLS gates while removing deferred scroll work.
- Remove the late Veneer swap without modifying the unlicensed font bytes or weakening the brand hierarchy.
- Bring About, Services, and Artists within the good LCP threshold.
- Make total initial JavaScript route-proportional, not only the scoped shell closure.
- Stop nonessential infinite animation whenever its UI is hidden, closed, or past its useful threshold.
- Preserve every successful round-one behavior and record a complete `PERF-003` report.

**Non-Goals:**

- No Astro, React, router, static-output, or persistent-shell rewrite.
- No Store Offer batch API, cache-authority change, checkout change, Worker change, stock/order/provider mutation, or static price fallback.
- No font subsetting, conversion, glyph removal, outline extraction, or generated derivative without a license.
- No list virtualization, pagination, or infinite scroll in the approved implementation path.
- No service worker, media CDN/DAM, SSR image service, custom telemetry backend, new state library, or performance framework.
- No blanket removal of blur, motion, responsive images, visual texture, or brand typography.
- No field-performance claim from lab evidence.

## Decisions

### 1. First traversal is the primary scroll gate

The previous narrow 390×844 scripted profile reported low p95 values while hiding 299 to 469 ms maxima. The new matrix records first and repeat traversal separately. The first run is never discarded as warm-up.

The fixed matrix is:

| Profile            | Routes                                                        | Viewport | DPR | CPU | Network                   | Cache/state              | Runs      |
| ------------------ | ------------------------------------------------------------- | -------- | --- | --- | ------------------------- | ------------------------ | --------- |
| Desktop cold load  | Home, Store, Distro, Artists, Services, About, Releases, News | 1440×900 | 1   | 1×  | unthrottled               | cleared                  | 5         |
| Mobile stress load | Home, Store, Distro, Artists, Services, About                 | 390×844  | 2   | 4×  | 150 ms RTT, 1.6 Mbps down | cleared                  | 3 minimum |
| Wide scroll        | Home, Store, Distro                                           | 1440×900 | 1   | 4×  | warm after load           | first and repeat         | 3 each    |
| Mobile scroll      | Store, Distro                                                 | 390×844  | 2   | 4×  | warm after load           | first and repeat         | 3 each    |
| Legacy regression  | Store, Distro                                                 | 390×844  | 1   | 4×  | warm after load           | 48 px/rAF for 240 frames | 3         |

The wide and mobile scroll profiles use one documented fixed segment and input cadence. Browser Use performs a matching wheel or touch-like rendered traversal. Chrome tracing supplies frame, main-thread, style, layout, paint, and long-animation-frame data only because Browser Use does not expose those categories.

Both first and repeat traversal must meet:

- p95 frame interval no greater than 16.7 ms at the declared 60 Hz-equivalent profile;
- p95 application-attributable main-thread plus style/layout/paint work no greater than 8 ms;
- no application-attributable task or long animation frame of 50 ms or more;
- no application-attributable main-thread or rendering slice above 16.7 ms;
- no visible jump, blank corridor, late card pop, input stall, horizontal overflow, or focus-order defect.

Chrome documents 16.66 ms as the 60 Hz frame interval and 50 ms as the long-animation-frame threshold: <https://developer.chrome.com/docs/web-platform/long-animation-frames>.

### 2. Replace per-card containment through a measured ladder

The A/B proved the causal relationship: forcing Distro cards visible removed scroll Layout and all long tasks, but moved 1.691 seconds of work upfront at 4× CPU. Store moved 0.695 seconds upfront and still retained one long task. A blanket eager render is therefore not automatically accepted.

Each route and breakpoint follows this ladder, stopping at the first option that passes both load and first/repeat scroll gates:

1. Remove individual `contain: strict` and fixed card block sizing. Move `content-visibility` to the smallest semantic groups or chunks that avoid dozens of independent activation boundaries, with measured intrinsic sizes.
2. If a grouped boundary still activates during user scroll, activate the next bounded corridor ahead of the viewport and keep it activated until route exit. Use one route-owned observer or scheduler, no generic list framework. Yield between groups and stop priming when the route changes or user input needs the main thread.
3. If preactivation still misses first scroll, disable `content-visibility` for the failing route and breakpoint when cold-load LCP/CLS and interaction budgets remain passing. First-scroll quality wins over a synthetic initial-layout saving.
4. If neither selective containment nor eager rendering can pass both sides, stop and amend OpenSpec before introducing pagination or virtualization.

Full server HTML, semantic group headings, links, images, source order, keyboard order, find-in-page, accessibility-tree access, shell scroll reset, and responsive layout remain present. `content-visibility` is a tool, not an invariant. Its purpose is to skip offscreen layout and paint, so activation cost must be measured as part of the user experience: <https://web.dev/articles/content-visibility>.

Store card rendering and Store Offer work remain separate. Activating or pre-rendering a card corridor must not hydrate price islands beyond their tested `client:visible` margin. Disabled PRD remains one capability request, zero offers, and zero Store 5xx.

### 3. Deliver the exact existing font with optional display

No repository license permits modifying Veneer. Round two therefore treats the existing WOFF2 bytes as immutable input:

- record its SHA-256 before work;
- add a byte-identical Astro/Vite-owned copy for the main-site build and enforce hash parity with the stable public copy;
- declare the main-site face from bundled CSS so Vite emits a fingerprinted URL covered by the immutable static cache policy;
- use `font-display: optional` and normal stylesheet discovery; do not preload the main-site font unless a repeated A/B improves LCP and still produces no late layout task;
- keep the stable public WOFF2 and CSS needed by the PRD Holding Page, update that CSS to the same optional-display behavior, and reverify its closed artifact;
- delete the public duplicate only when the temporary Holding Page retires.

This deliberate byte-identical duplication is smaller than rebuilding the active holding artifact pipeline. It changes deploy storage, not the main site's transferred font bytes. A hash-parity test prevents drift.

`optional` uses the fallback for the current navigation when the font arrives too late, avoiding the late swap that causes relayout: <https://web.dev/learn/performance/optimize-web-fonts>. The approved stack remains Veneer, Bebas Neue, Impact, sans-serif. Browser screenshots and geometry checks cover English, Greek, accents/diacritics, long headings, narrow cards, navigation, Store/checkout labels, and the Holding Page at mobile and desktop widths.

Alternatives considered:

- Subset or convert the font: rejected without a modification license.
- Keep `swap` and tune fallback metrics: rejected because the retained trace directly attributes the long layout burst to the late swap.
- Remove Veneer: rejected because the brand face is part of the approved public-title system.
- Preload globally: rejected by the round-one A/B and because the hero image has higher first-load priority.

### 4. Prioritize only actual first-viewport media

Above-fold and LCP images must not be lazy-loaded; `fetchpriority="high"` is reserved for the primary candidate: <https://web.dev/articles/browser-level-image-lazy-loading>.

Implementation is route-specific:

- Add an explicit priority input to `InternalPageHero`. About direct load enables it and adds a 1200w candidate between 1080 and 1440. Overlay or later fragment usages keep normal/lazy behavior.
- Services marks only the first direct-load feature image eager and high priority. Remaining service images stay lazy.
- Artists keeps only the expected first-viewport card set eager, assigns high priority to the expected LCP candidate, and keeps later portraits lazy. Remediate the measured Ouranopithecus source or responsive output through the existing editorial asset workflow until the selected 480w candidate is at most 100 KiB without crop or visible quality loss.
- Releases and News stay unchanged unless the five-run matrix finds a regression.

All images retain explicit dimensions/aspect ratios, alt text, Astro `srcset`, route-appropriate `sizes`, and no more than one high-priority content image per direct page.

### 5. Budget the complete initial JavaScript graph

The scoped shell closure remains useful but is insufficient. Round two adds a total first-party eager-graph budget of 95 KiB hosted Brotli for Home and requires every route to exclude dormant portal chunks owned by other routes.

Implementation uses direct dynamic imports and existing route identity:

- split Artists filters, Services inquiry form, and Store cart button/outlet behind their active route or existing container/intent signal;
- keep navigation interception, route state, focus/scroll reset, minimal event names, and player/session bridges eager;
- move shared cart event names into a tiny dependency-free module so the bridge does not import checkout presentation code;
- keep StoreCart behind its existing local library and native `localStorage`;
- replace Zod in browser-only cart persistence with the smallest explicit unknown-to-domain parser only when characterization tests prove identical acceptance, rejection, normalization, quantity bounds, duplicate-line behavior, version handling, and malformed-storage recovery;
- retain Zod at Worker, API, money, and other true trust boundaries.

No portal registry, loader framework, state library, DI layer, or speculative abstraction is added. The existing direct lazy import pattern is enough.

Third-party analytics is measured separately. Its current `defer` behavior changes only if an A/B attributes material LCP or long-task cost to startup; any accepted change delays initialization until post-load idle with a bounded fallback while preserving required page-view behavior. Bundle size alone does not justify replacing the analytics provider.

### 6. Animate only visible, active feedback

The loading bar owns `route-loading-sweep` only while `data-state="open"`; its closed state has `animation: none`. The Home scroll cue animates only before the coarse scrolled threshold; the scrolled state stops the child animation, not merely the parent's opacity. Returning above the threshold may restore the cue. Reduced-motion continues to disable both.

The goal is zero nonessential infinite animation in settled hidden or closed states. Active loading, visible player feedback, and visible interaction affordances retain their existing semantics.

### 7. Preserve field honesty and program reporting

Before and after values use the same commit-tagged profile. Unlike Local/PRD or desktop/mobile evidence remains separate. Search Console/CrUX or PageSpeed Insights is checked first for representative 28-day field data. If it is absent or undersampled, `PERF-003` says so and makes no field pass claim.

No custom RUM is added in this round. Privacy-approved field instrumentation requires a later child only if standard sources remain insufficient and an operational owner exists.

## Risks / Trade-offs

- **Moving layout work earlier can hurt LCP or INP** -> Apply the route/breakpoint ladder and require both load and first-scroll gates before accepting a strategy.
- **Retained activation can become custom virtualization** -> Keep full HTML and normal layout, use one bounded route observer only, and stop before recycling or removing nodes.
- **`optional` can show fallback type on a first visit** -> Preserve the approved fallback hierarchy and validate brand hierarchy, wrapping, Greek, and mobile/desktop screenshots.
- **Two byte-identical font sources can drift** -> Enforce SHA-256 parity and remove the public copy after the Holding Page retires.
- **Route-specific portal loading can race first intent** -> Reuse existing Suspense/loading feedback and add first-click plus same-document navigation tests.
- **Replacing browser Zod can weaken malformed-storage handling** -> Characterize the current parser first; retain Zod if a smaller parser is not behavior-equivalent or does not materially improve the graph.
- **High-priority images can compete with fonts or each other** -> Permit one primary high-priority content image and confirm request priority/waterfall in traces.
- **Synthetic smoothness can differ from felt smoothness** -> Pair deterministic traces with Browser Use wheel/touch-like traversal and screenshot/interaction checks.

## Migration Plan

1. Record the exact start commit, working-tree exclusions, asset hash, bundle graphs, request behavior, and all fixed-profile baselines.
2. Update the runtime-performance runbook and measurement helper before changing rendering behavior.
3. Fix Distro first traversal through the containment ladder; accept and commit the smallest passing slice.
4. Fix Store first traversal while proving the round-one capability/offer behavior remains exact.
5. Introduce the byte-identical fingerprinted font path and optional display; verify main site plus Holding Page.
6. Correct About, Services, and Artists image priority/candidates/source asset.
7. Split route-specific portal code and isolate the cart event/parser dependency only as far as the total eager-graph budget requires.
8. Stop hidden and closed infinite animations.
9. Re-run every declared load and scroll profile, Browser Use acceptance, focused regressions, `pnpm test:unit`, `pnpm check`, `pnpm build`, cache/asset checks, strict OpenSpec validation, and independent reviews.
10. Append `PERF-003` to `../site-performance-program/performance-report-log.md`, update epic status, then archive this child.

Rollback is slice-based. Restore the preceding containment rule, font stylesheet/path/display value, image priority/candidate source, portal import boundary, cart parser/event import, or animation selector. No data migration, cache purge, Worker deployment, or provider rollback is required.

## Open Questions

None for implementation. Stop and amend OpenSpec before adding pagination, virtualization, custom RUM, a new dependency, a Store batch API, a framework change, or any font-byte modification.
