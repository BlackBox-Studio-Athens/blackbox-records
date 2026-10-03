## Context

This is the third bounded child of the site performance program. Round one (`../archive/2026-07-12-improve-site-runtime-performance/`) and round two (`../archive/2026-07-15-improve-site-runtime-performance-round-two/`) are archived, and the program wrapper was closed on 2026-08-31 (`../archive/2026-08-31-site-performance-program/`). The closure rule allows a fresh child only after post-commerce measurement proves a reproducible user-facing miss. The `e818b70` review is that measurement. It is registered as `PERF-004`, and its full text is in [reports/PERF-004-review-e818b70.md](reports/PERF-004-review-e818b70.md).

The review covered the whole main site. Its hosted findings (quota, media addressing, hosted HTML caching, gateway) and the hosted purchase-information bug form the sibling child `bound-hosted-delivery-cost`. The two children add different requirements and can be applied, verified and archived in either order.

Baseline, Local production build of `e818b70`, Chromium 141, medians of 3 cold runs (raw data in `.codex-artifacts/runtime-performance/review-e818b70/`):

| Route        | Desktop LCP | Desktop CLS | Mobile LCP | Mobile long tasks, total / longest | Mobile CLS |
| ------------ | ----------: | ----------: | ---------: | ---------------------------------: | ---------: |
| Home         |      316 ms |           0 |   3,144 ms |                       370 / 126 ms |          0 |
| Store        |      256 ms |       0.169 |   1,360 ms |                     1,895 / 442 ms |      0.067 |
| Store Distro |      260 ms |       0.155 |   1,460 ms |                     2,101 / 533 ms |      0.052 |
| Artists      |      192 ms |           0 |   1,200 ms |                       291 / 123 ms |          0 |
| Services     |      204 ms |       0.002 |     884 ms |                       399 / 136 ms |          0 |
| About        |      148 ms |           0 |     772 ms |                       299 / 131 ms |          0 |

Eager JavaScript (Brotli): Home 101,588 B against the 102,400 B budget; Artists, Services and Store 95,263 B; Store Item pages 120,715 B, or 161,934 B with a gallery, outside the check. One 22,996 B stylesheet serves every page. The Store and Distro documents are 620 KB raw with 2,835 elements.

Limits: Google Fonts could not load in the review environment and no backend ran, so Google-font effects and price arrival times are inferred. The machine was shared, so absolute timings are noisy; mechanism-level counters (style-recalc element counts, request counts, bytes) carry the claims.

Other open changes on the same capabilities stay untouched: `adopt-lenis-motion-frontends`, `inert-shell-page-snapshots`, `rehydrate-cached-shell-islands`, `complete-image-delivery`, `reveal-first-screen-images`, `lighten-home-entry`, `clarify-store-sold-out-presentation`, `show-low-stock-notice`, and the upcoming `add-store-preorders`.

## Goals / Non-Goals

**Goals:**

- Remove every measured high and critical main-site miss: Store render CPU, whole-document restyles during scroll, idle frame loops, the late brand font, Store CLS, slow first opens of shell surfaces, and original-size cart thumbnails.
- Keep idle pages idle and keep scroll-start and scroll-end work bounded on Store and Distro.
- Bring every public route, including Store Item pages, under a checked eager-JavaScript budget.
- Bring commerce reads in line with the existing contract: one authoritative read per Store Item view, mutation-free and bounded.
- Preserve the shell and player continuity contract, commerce authority, accessibility and the monochrome visual language.

**Non-Goals:**

- No change to hosted delivery, Free-plan quota handling or hosted HTML caching (sibling change).
- No Store Offer, StoreCart, listing-projection, cart-seed or checkout payload change; no restructure of code that `add-store-preorders` rewrites.
- No pagination, virtualization, batch Store Offer API, service worker, custom RUM, router or framework change.
- No GPU or raster changes without a real-device trace (CSS-01, CSS-05, CSS-07, PLAYER-09).
- No field Core Web Vitals claim from lab evidence.

## Decisions

### 1. Lenis pays for itself or goes

The maintainer's framing: use Lenis to our advantage if it can be made cheap, otherwise cut it where native scrolling is cheaper. The measured costs are specific: perpetual animation-frame loops on every page, non-passive wheel and touch listeners on `window`, and class rewrites on `<html>` that restyle the whole document through two CSS rule groups. On touch devices Lenis does not smooth scrolling (`syncTouch` is off); it only supplies the modal scroll lock.

Policy:

- **Invalidation first (CSS-N1).** Stop importing `lenis/dist/lenis.css`. Restate only the rules the site needs (stopped-state overflow clip, `[data-lenis-prevent]` overscroll containment, iframe pointer events while smoothing) without `.lenis` descendant selectors. Replace the button icon `[&_svg:not([class*='size-'])]` variants with zero-specificity default sizing. After this, a class change on `<html>` restyles a small constant set of elements, so Lenis's class rewrites stop costing a full-document recalculation even before the runtime changes.
- **Touch and coarse pointers.** On `(hover: none)` and `(pointer: coarse)`, construct no Lenis instance and install no non-passive wheel or touch listeners. Native scrolling and the shell's own scroll API deliver resets, anchors and focus restoration.
- **Desktop.** Construct Lenis on `window` only, with `autoRaf: false` and one shared on-demand loop: it starts on wheel input, keyboard scrolling or a programmatic smooth scroll and stops when every instance reports it is not scrolling. Nested scroll roots stay native unless a measured need appears.
- **Scroll lock.** The player modal, detail overlay, cart drawer and mobile menu lock background scrolling through shell body-state classes (overflow clip plus `overscroll-behavior: contain`). The lock therefore works with or without Lenis, and nested `[data-lenis-prevent]` panes keep scrolling.
- **Scroll-linked work (SHELL-08).** The Home hero flips its coarse threshold from the runtime's scroll signal on desktop and from an IntersectionObserver sentinel elsewhere, never from a per-scroll `requestAnimationFrame` plus `getBoundingClientRect`.
- **Decision rule.** Measure desktop idle cost and wheel-scroll frames with and without Lenis on the same profile, in one session. If on-demand Lenis is within noise of native, keep it on desktop. If it is measurably costlier and cannot be made cheap, remove it and keep native scrolling everywhere. The shell scroll API stays the same either way.

The delta requirement states the planned behaviour (Lenis on fine pointers only, idle when still). Task 24.2 reconciles it with slice C2's measured result. The `adopt-lenis-motion-frontends` change adds the current "one lifecycle-owned Lenis runtime" requirement and is fully implemented but not archived, so this change adds a narrower requirement instead of modifying an unarchived one. Task 24.1 converts it into a modification once that change is archived.

### 2. Bounded restyles for document and Store state changes

Any state change a user triggers repeatedly (scroll start and end, a Coverflow step, a search keystroke) must restyle a bounded set of elements, not the document or a whole Store group. The rules are mechanical and testable in CSS:

- No third-party stylesheet whose selectors descend from a class on `<html>`.
- No `[class*=…]` attribute-substring selectors in shared primitives.
- Inherited custom properties that change per interaction are set on their only reader (the Coverflow rail fill), not on a group ancestor.
- No featureless `:not()` compound in a rule keyed on a frequently changing attribute.

Evidence is the `UpdateLayoutTree` element count from a Chromium trace with invalidation tracking, which does not depend on CPU contention. Slices C1 and D1 record the before and after counts.

### 3. Shell surfaces open without a Suspense floor

React 19 reveals a Suspense boundary no sooner than its 300 ms fallback throttle, even when the lazy chunk is already cached. Surfaces that a tap opens must therefore never suspend:

- One module-promise loader per surface. It starts on intent (pointer over, focus in, pointer down) or at idle, and renders the surface through an ordinary state update once the module resolves. There is no `Suspense` boundary and no `React.lazy` on the open path.
- While a surface is pending, the existing accessible loading status covers the delay. A failed chunk closes the surface (the overlay falls back to its page) instead of throwing out of the shell root.
- Warm-up policy: Menu on trigger intent and at idle below the desktop breakpoint; the cart drawer on cart or Add To Cart intent and at idle on Store routes, item pages or with a non-empty cart; the detail panel at idle and when an overlay link is prefetched; the player surface on Listen intent.
- Sheet, overlay and player transitions use CSS keyframes or transitions on Radix `data-state`, with the same durations and easing and `animation: none` under reduced motion. Radix Presence waits for `animationend`, so exit animations and focus return are unchanged. motion/react leaves these chains.

This narrows the unarchived `adopt-lenis-motion-frontends` rule that coordinated public transitions use Motion. Motion stays acceptable where it still earns its bytes, for example the navigation veil through `motion/mini`, loaded on the first navigation intent. Task 24.1 reconciles the wording.

### 4. The player iframe starts from the click

The first Listen click currently waits for the lazy player surface chain before the iframe exists. The shell keeps an always-mounted, never re-parented iframe host. The Listen handler creates the provider iframe there synchronously, and the presentation (modal chrome, minimized bar) loads in parallel and attaches around the existing host. The continuity contract is unchanged:

- The minimized player appears only after iframe load and real embed interaction.
- Closing before that destroys the session, minimizing keeps it, and Stop destroys it.
- Back closes the open modal without routing.
- Same-document navigation never re-parents or reloads a live iframe.

Provider preconnects drop `crossorigin` so the credentialed iframe navigation can reuse them, and Store Listen triggers join the intent selector (PLAYER-04). The `robot3` machine becomes a pure reducer with the same transitions (PLAYER-07). Listen trigger synchronisation writes only changed values (PLAYER-08).

### 5. Shell navigation keeps document work off the input path

- The routing effect runs once. Player modal state is read through a ref, so opening or closing the player never re-snapshots `<main>`, re-binds listeners or aborts navigation (SHELL-04).
- The click task does no snapshot. The leaving page is snapshotted after the veil's two frames, and only when no snapshot exists for that path. The mount snapshot runs at idle (SHELL-02).
- The uncached fetch starts before the frame wait, and the scroll reset and first-screen image wait run together (SHELL-09).
- Mouse hover prefetch waits a 60-100 ms dwell with cancellation, uses `priority: 'low'`, is skipped on Save-Data or 2G, and warms only the first eager image. Focus and touch or pen pointer-down still prefetch at once (SHELL-06).
- A fetched section document is parsed once, sanitised in place, and its eager images are collected before serialisation. The cached result is applied with `replaceChildren` and cloned when it can be applied more than once (SHELL-03). The guarantees of `inert-shell-page-snapshots` and `rehydrate-cached-shell-islands` hold: snapshots stay inert, cloning never fetches lazy images, and islands rehydrate after cached returns.

### 6. Eager JavaScript is budgeted on every public route class

- **StoreCart.** The bridge keeps only listeners and event names eager. The Zod-based parser loads when a stored cart key exists, on Store or checkout routes, or on the first cart event. Replacing Zod with hand-written guards is deferred, awaiting `add-store-preorders`, which is expected to add StoreCart line fields.
- **API client.** The two helpers the listing-price presentation needs move into a dependency-free module, and the API client loads at submit time (SHELL-10). `motion/mini` loads on the first navigation intent.
- **tailwind-merge.** It leaves the eager closure: static class strings for eager shell UI, or `twJoin` where an audit shows no className overrides need merging (PLAYER-05).
- **Newsletter.** The form mounts through the shell portal pattern. `client:visible` and `client:idle` are not used, because only the load directive is inlined and those would never hydrate after shell navigation (PAGES-06).
- **Store Item pages.** The bundle-graph check covers a single-image item page and a gallery item page. If they still exceed the public budget after the gallery drops motion (STORE-06) and the cart parser goes lazy, the check sets an explicit item-page budget with its reason. Raising a budget silently to pass is not allowed. Task 24.4 records the result.

### 7. Fonts are self-hosted and the brand font is discovered early

- **Veneer.** Preloaded from `SiteLayout` through a `?url` import (`rel=preload as=font type=font/woff2 crossorigin`), so its request starts with the document rather than after the stylesheet. `check-brand-font.ts` keeps the preload, the fingerprinted URL and the asset in step. The baseline font requirement allows a preload only with at least three equivalent A/B runs that improve LCP without delaying primary media or reintroducing layout work, so slice C3 records that A/B on the mobile-load profile. The font bytes follow `lighten-home-entry`'s owner-approved simplified derivative; this change does not alter them.
- **UI faces.** Inter (400/500/600), Geist Mono (400/500) and Bebas Neue (400) are self-hosted (committed WOFF2 or `@fontsource`; the build must work offline), declared in the bundled stylesheet, and only above-the-fold faces are preloaded. The Google preconnects and the async `onload` stylesheet swap go, including on 404. Each face's `font-display` is chosen for a same-document shell: with `optional`, a face that misses the first document's block window stays on the fallback for the whole session yet still downloads, so a self-hosted, preloaded or `swap` face is preferred unless a measured layout cost argues otherwise. The baseline catalog scenario that names "optional Google font display" is modified to name self-hosted UI fonts.
- **Header logo.** Loads eagerly on every page; it is the desktop Home LCP element (PAGES-10).
- **404.** Same font strategy, and its decorative infinite SVG animations stop under reduced motion and when offscreen (CSS-09).

### 8. Store browsing: no shift, bounded interactions

- **Toolbar and controls (STORE-03).** The search toolbar, view controls and mobile artist picker are server-rendered inside the existing portal targets in their final boxes, disabled until the island is ready, and enhanced in place. Coverflow capability is decided in CSS, and the result total stays hidden from the server render. This works after direct load and after shell navigation.
- **Coverflow and search.** Steps use native `element.animate()` with the same easing, and Fuse loads on the first non-empty query (STORE-07). The non-passive stage wheel listener attaches only in preview mode (STORE-05). The artist picker is memoised and commits once per keystroke (STORE-11).
- **Card candidates and gallery.** Card widths become 240, 360, 480, 640 and 720 (STORE-09). The gallery uses a CSS crossfade with pointer events instead of motion, mounts the shell way, and gets 144/216w thumbnails (STORE-06).
- **content-visibility (CSS-06).** Listing-card `content-visibility` is remeasured only after the invalidation fix. It stays unless A/B evidence shows it costs more than it saves; any removal needs the evidence and a delta against "Long catalog pages skip offscreen rendering".

### 9. The listing-price read may start from the document

On a direct load, a tiny inline module script on collection pages starts exactly one listing-price fetch and parks it on a window slot. The shell consumes it through `getPreparedStoreListingPriceReader`, so the read stays exactly one per activation, and shell navigations still start it at activation. Endpoint, payload, `no-store` freshness and failure semantics are unchanged; `add-store-preorders` changes the projection fields, not when the read starts.

### 10. Image delivery

- **Cart and checkout thumbnails (DATA-05).** A 176 px WebP per Store Item from `getImage`, with width and height 88 and `decoding="async"`. The cart seed keeps its field names and types. Existing localStorage lines keep their URL until rewritten, with no storage migration.
- **Editorial images.** `sizes` follow the real CSS slots (gutters, padding, frames, grid columns), and a dist check verifies the candidates picked at 390@2, 390@3 and 1440@1 (PAGES-01). One editorial WebP quality constant of 68, subject to a maintainer visual check on the grainy monochrome art (PAGES-03). The artist hero is sized from image aspect against frame aspect (PAGES-02). `src` reuses the largest `srcset` transform (PAGES-04).
- **Link previews and the Holding Page.** Link previews use a 1200 px JPEG (PAGES-11), and the Holding Page logo is a 240 px WebP (PAGES-08).

### 11. Commerce reads stay authoritative and bounded

- **One read per view (COMMERCE-02).** One module-level in-flight Store Offer promise per slug, cleared on settle, so a Store Item view makes exactly one `/api/store/items/:slug` request while every read stays `no-store` and fresh per view.
- **Read-only public reads (COMMERCE-03).** Public reads use `apply: false`, as the existing mutation-free reconciliation requirement already demands, and a short Stripe timeout with the existing failure semantics. Folding the D1 stages and parallelising the capabilities read is deferred, awaiting `add-store-preorders`.
- **Delivery quotes (COMMERCE-04).** The client debounces about 250 ms and aborts stale requests, latest wins. Server-side parallelisation is deferred unless it touches nothing `add-store-preorders` changes. Checkout start still revalidates everything.
- **Preflights and Prisma (COMMERCE-08).** The entry Worker answers CORS preflights with the same headers, and one Prisma client is cached per Durable Object instance.
- **Terms (COMMERCE-10).** `/terms/` renders delivery constants from a shared browser-safe module at build or SSR time.

### 12. Content reads are linear and snapshot-scoped

Listing availability uses the pure `createStoreItemAvailability(storeItem)` per item, and category navigation receives the already computed category data (DATA-01). `Intl.DateTimeFormat` instances are module-level, and one `formatMonthYear` remains (DATA-04). The snapshot schema is built once at module scope, with a `Set` for the store-item source check; one full parse of the final publication candidate stays, with the same validation errors (DATA-03). Published-reader projections are memoised per snapshot object through a `WeakMap` with an id index for `getEntry`, and bypassed whenever preview overrides are present (DATA-02). The catalog asset endpoint reuses the memoised loader (DATA-06). Nothing is memoised in module state that could outlive a publication.

### 13. Measurement plan

Before and after use the same profile, method and build mode; comparisons across unlike profiles are labelled directional. The baseline is `review-e818b70`; each slice records its own A/B in one session because the machine is shared.

| Profile               | Routes                                                        | Settings                                                            | Runs                   |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| `desktop-load`        | Home, Store, Distro, Artists, Services, About, Releases, News | 1440×900 DPR 1, unthrottled, cache cleared                          | 5 (3 accepted for A/B) |
| `mobile-load`         | Home, Store, Distro, Artists, Services, About                 | 390×844 DPR 2, 4× CPU, 150 ms RTT, 1.6 Mbps                         | 3                      |
| `wide-scroll`         | Home, Store, Distro                                           | 1440×900 DPR 1, 4× CPU, first and repeat                            | 3 each                 |
| `mobile-scroll`       | Store, Distro                                                 | 390×844 DPR 2, 4× CPU, first and repeat                             | 3 each                 |
| idle (new)            | Home, About, Distro                                           | 5 settled seconds at 4× CPU, desktop and touch emulation            | 3                      |
| wheel and touch (new) | Store, Distro                                                 | real wheel events on a fine pointer; touch drag on coarse emulation | 3 each                 |
| bundles               | every route class including two Store Item pages              | `pnpm performance:bundles` after a web build                        | 1 (deterministic)      |

Mechanism counters (style-recalc element counts, request counts, transferred bytes, eager-graph bytes) are preferred over absolute timings. Timings are reported with their profile, run count and spread. Tap-to-visible for Menu, cart drawer, overlay and player uses the mobile profile with chunks cold and warm.

### 14. Coexistence with `add-store-preorders`

That change adds a pre-order availability state, a Stock pre-order field, a separate `store-item-card__preorder` element, and pre-order handling across the purchase control, StoreCart lines, checkout, offers and paid-order delivery. It modifies "Listing-price projection is browser-safe and bounded". Here, the slices touching those areas change only how and when code loads or runs:

- Listing availability is computed per item without changing what it returns.
- The StoreCart parser loads lazily, with unchanged validation.
- The cart seed shape is unchanged; only the image URL differs.
- Store Offer reads are de-duplicated, read-only and bounded.
- Delivery quotes are debounced on the client.
- The listing read starts earlier with the same payload.
- `StoreItemCard` edits are limited to the image widths attribute.

The deltas here modify only "Store collection prices use one projection read", which `add-store-preorders` does not touch.

### 15. Report ledger

The program ledger stays at `../archive/2026-08-31-site-performance-program/performance-report-log.md`, append-only. At closure this child appends `PERF-004` (the review, stored here) and its own implementation report as `PERF-005`. The sibling records `PERF-006`. Entries already in the ledger are never rewritten.

## Risks / Trade-offs

- **Removing Lenis on touch changes the modal lock path.** The body-state lock is tested with the player-continuity, shell-navigation and store-cart e2e specs, including nested scrolling panes, before Lenis construction is gated.
- **Rendering a surface without Suspense could flash an empty frame.** The surface renders only once its module has resolved; until then the accessible loading status is shown, and e2e click-task checks cover first opens.
- **An always-mounted iframe host could leak a session.** The host owns at most one iframe; Stop and pre-interaction close remove it, and the player-continuity spec runs on every change to it.
- **Preloading Veneer competes with the hero image.** The A/B gate in decision 7 decides whether it stays, and the hero keeps `fetchpriority="high"`.
- **Self-hosting fonts adds deploy bytes.** Only above-the-fold faces are preloaded; the rest are discovered from CSS with `unicode-range` where the source provides it.
- **The document-started listing read could double-fire.** Tests assert exactly one request per activation on direct load and after shell navigation, as the existing requirement demands.
- **Quality 68 could visibly degrade grainy art.** A maintainer visual check is a task; a per-image override stays possible.
- **Absolute timings are noisy on a shared machine.** Claims rest on counters and in-session A/B.

## Migration Plan

1. Record the baseline identity (`e818b70`), the integration base, and the open-change overlaps.
2. Apply slices lane by lane in the order of `tasks.md`. Each slice runs its focused tests, the relevant e2e spec and `pnpm validate --since <base>`, and records its A/B evidence in `validation.md`.
3. Reconcile the deltas with measured slice results and with archived predecessors (group 24).
4. Re-run the declared profiles on the final tree, append the report entries, strict-validate, and archive.

Rollback is per slice: revert its commit. No data, storage or provider migration is involved. Existing localStorage cart lines keep their original image URLs and stay valid.

## Open Questions

- Does desktop Lenis survive the cost test (decision 1)? Slice C2 answers it; task 24.2 records the outcome in the delta.
- Which `font-display` does each self-hosted UI face use? Slice C3 decides from measurement; task 24.3 records it.
- Do Store Item pages need their own eager budget after slices P3 and D4? Task 24.4 records it.

## Recovered implementation decisions, 2026-10-03

These measured decisions supersede the provisional choices above. Evidence and remaining acceptance are in [performance-report.md](performance-report.md).

- Public scrolling is native on every pointer. The on-demand desktop candidate had zero idle callbacks but, even with card paint skipping, used 2,261 ms main-thread work on the repeat Distro wheel pass versus 1,605 ms for native (three runs per arm, 4× CPU). Its better frame cadence does not meet the original within-noise CPU rule. The public API names remain stable; smooth anchors, immediate resets, nested panes and body-owned locks stay native.
- Listing-card `content-visibility: auto` is restored with `contain-intrinsic-block-size: auto 520px`. The restored branch and the inspectable baseline stylesheet had no such card rule despite the review wording. The explicit experimental A/B compared this setting against current eager paint: first traversal p95 was 16.8 ms versus 33.3–33.4 ms on Store/Distro, with about 42–43% less main-thread work. This is current-build decision evidence, not a recreation of lost review traces.
- Inter, Geist Mono and Bebas Neue use `font-display: swap` to keep the already rendered controls legible while local faces load. Fingerprinted Latin Inter and Veneer preload in the shell; Releases adds Latin Geist Mono, and 404 adds Latin Bebas Neue. Other subsets are discovered by their Unicode ranges. Veneer already uses swap.
- Keep the Veneer preload for measured discovery: median request start 26.9 ms versus 793.5 ms without it. Mobile Home median LCP was 1,312 versus 1,372 ms, with the tagline paragraph as LCP. Three shared-machine samples do not establish a causal LCP improvement; CLS was about 0.010 versus 0.005. Final load observations are recorded separately.
- All public routes, including single and gallery Store Items, retain the same 102,400-byte Brotli eager budget. No item-specific exception is needed.
- Gallery images describe their contained painted slot, not the surrounding square. The 390@3 regression selected a 1,200w/146,322-byte portrait unnecessarily; the existing aspect-aware sizes helper corrects it. Gallery enhancement reruns after fetched overlay HTML arrives, preserving the mounted player iframe.
- No pagination, virtualization, batch Store Offer API, payload migration, service worker, custom RUM or framework change is introduced. The `add-store-preorders` overlap exclusions remain in force.
