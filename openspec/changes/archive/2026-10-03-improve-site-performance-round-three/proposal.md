## Why

The 2026-10-02 review of `e818b70` ([PERF-004](reports/PERF-004-review-e818b70.md)) measured reproducible user-facing misses on the consolidated Store routes and on every page that hosts the shell. This is the post-commerce remeasurement the closed performance program requires before a new child starts. Local production build, Chromium 141, medians of 3 cold runs; the mobile stress profile is 390×844 DPR 2, 4× CPU, 150 ms RTT, 1.6 Mbps:

- **Store render CPU.** One `listStoreCollectionEntries` call takes 1,281 ms on the real 101-item snapshot, and each Store category page calls it twice, because every card's availability lookup rebuilds the whole StoreItem list. `formatMonthYear` builds a new ICU formatter per call, about 75% of the remaining Store render CPU.
- **Scrolling and idle cost.** Lenis runs perpetual animation-frame loops: 621-1,094 ms of main-thread work per 5 idle seconds at 4× CPU, against 2-60 ms without it. Its class rewrites on `<html>` recalculate all 2,614 Distro elements through two CSS rule groups, a 230-370 ms stall at every scroll start and end. Its non-passive wheel and touch listeners make every page a blocking input region, although it smooths nothing on touch.
- **Fonts and LCP.** Home's mobile LCP is 3.1 s: Veneer is discovered only after the stylesheet, requested at 792 ms and finished at 3,041 ms. The header logo, desktop Home's LCP element, is lazy on every page. Three UI families load from Google Fonts through two extra origins.
- **Store layout shift and interactions.** The Store toolbar and controls mount above the cards after hydration: desktop CLS 0.169 on `/store/` and 0.155 on `/store/distro/`. Each Coverflow step costs 232-496 ms and the first search keystroke 384-464 ms at 4× CPU.
- **Shell surfaces and navigation.** Menu, cart drawer, detail overlay and player are lazy inside a Suspense boundary created on open, so React's 300 ms fallback throttle delays every first open. On the mobile profile the first Menu opens 695-742 ms after the tap, the first player iframe 1.0-1.1 s, the first cart drawer 850-890 ms. Leaving Store snapshots its 600 KB main element inside the click task (52-77 ms at 4×), and one Store prefetch is a 165-174 ms parse.
- **Eager JavaScript.** Every route evaluates the Zod-based StoreCart chunk after hydration (23 KB Brotli, a 38-55 ms task at 4×). Store Item pages ship 120.7 KB Brotli eagerly, 161.9 KB with a gallery, and the bundle-graph check does not cover them. Home sits 812 B under its budget.
- **Bytes and reads.** Cart and checkout thumbnails download the original catalog image: a 1.19 MB median and a 4.66 MB maximum per Add To Cart, and again at checkout. Editorial LCP images fetch the next width up (134-220 KB extra on phones). Each Store Item view makes two Store Offer reads, and the public read passes `apply: true`, against the mutation-free reconciliation requirement.

Field data is unavailable. Every claim above is lab evidence.

## What Changes

- Make the Store listing linear: compute availability per Store Item once per render, pass category data into the category navigation, and hoist date formatters. Parse each snapshot once with a module-level schema, and memoize published-reader projections per snapshot object.
- Make scroll cheap. Remove the two whole-document style invalidation triggers (`lenis.css` and the button icon attribute selectors). Keep Lenis only where it smooths something (fine pointer with hover) and run its frame loop only while a scroll animates. Use native scrolling on touch. Move modal scroll locking to shell body state so it works without Lenis. Drive the Home hero threshold from a scroll signal or an IntersectionObserver instead of per-scroll layout reads. Remove Lenis entirely if measurement shows native desktop scrolling is cheaper.
- Discover fonts early: preload Veneer from the document head, self-host Inter, Geist Mono and Bebas Neue, load the header logo eagerly, and give the 404 page the same font strategy.
- Server-render the Store toolbar and view controls in their final boxes; make Coverflow steps and search keystrokes restyle bounded element sets; start the direct-load listing-price read from the document while keeping it to exactly one read per activation; right-size Store card and gallery candidates and drop motion from the gallery.
- Open shell surfaces from intent-started module promises without a Suspense floor or motion/react, create the player iframe in the Listen handler inside an always-mounted shell host, take snapshots off the click path, parse each section document once, and gate hover prefetch.
- Shrink the eager graph: load the StoreCart parser only when a cart exists or on the first cart event, keep `public-checkout-api` and `tailwind-merge` out of the eager closure, mount the newsletter form through the shell portal, and cover Store Item pages in the bundle-graph check.
- Use 176 px cart and checkout thumbnails, slot-accurate editorial `sizes`, one editorial quality constant, `src` fallbacks that reuse the largest `srcset` transform, 1200 px link-preview images, and a 240 px Holding Page logo.
- Share one Store Offer read per Store Item view, make public Store Offer reads read-only with a short Stripe timeout, debounce delivery quotes, answer CORS preflights in the entry Worker, cache one Prisma client per Durable Object, and render `/terms/` delivery constants without a runtime fetch.
- Remove dead CSS and unused view-transition output, keep demo pages and the trial font out of production builds, and remeasure listing-card `content-visibility` after the invalidation fix.
- Add idle-cost, wheel and touch scroll profiles to the runtime measurements.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: shell surfaces open without a Suspense floor; StoreCart parsing and API clients leave the eager closure; scroll runtime follows input type, idles when still, and locks modals without Lenis; the player iframe starts from the Listen activation; navigation keeps document work off the input path; shell surfaces animate with CSS.
- `frontend-runtime-performance`: settled pages run no animation-frame loops; document-level state changes restyle bounded sets; Store collection chrome causes no layout shift; Store Item pages fall under the eager-JS budget; fonts are self-hosted with the brand font preloaded; the catalog font scenario no longer depends on Google Fonts.
- `site-images`: cart and checkout thumbnails, slot-accurate editorial candidates and quality, link-preview and small brand-mark derivatives, eager header logo.
- `store-listing-price-presentation`: a direct load may start its one listing-price read from the document.
- `commerce-checkout`: one Store Offer read per Store Item view, bounded read-only public reads, settled delivery quotes, and preflights answered by the entry Worker.
- `content-publishing`: published content reads are linear and snapshot-scoped.
- `tooling-validation`: runtime profiles cover idle cost and wheel and touch scrolling.

## Impact

- Web: `apps/web/src/components/app-shell/**`, `components/store/**`, `components/ui/{button,sheet}.tsx`, `layouts/SiteLayout.astro`, `styles/global.css`, editorial image components, `lib/content-reader` and Store data modules, fonts under `src/assets/fonts/`.
- Backend: `read-store-offer.ts` (apply flag and Stripe timeout only), the entry Worker's CORS preflight, Prisma client reuse in the store Durable Object, and snapshot parsing in `emdash-content.ts` and the published reader.
- Tooling: `scripts/measure-runtime-performance.ts`, `scripts/check-runtime-bundle-graphs.ts`, the image-markup check, `check-brand-font.ts`, `docs/runtime-performance.md`.
- Dependencies: self-hosted font files are added, either committed or through `@fontsource` packages. No framework, router, state library, virtualization, service worker or telemetry backend is added.
- Commerce authority is unchanged. D1 owns stock and orders, checkout start revalidates everything, and StoreCart stays browser convenience state.
- Hosted delivery, Free-plan quotas and hosted HTML caching belong to the sibling change `bound-hosted-delivery-cost`.

## Out of scope

No action is taken for these findings, for the reasons given:

- STORE-08 (Store card markup diet): deferred, awaiting `add-store-preorders`. That change adds a `store-item-card__preorder` element and restructures card markup; the diet follows it and is judged by shell snapshot time.
- CSS-01 (backdrop-filter blur under opaque fills): GPU cost not measured. Headless Chromium cannot measure it; it needs a real mid-range device trace first.
- CSS-05 (navigation veil blend): GPU cost not measured; it needs a real-device trace first.
- CSS-07 (blurred artist fill re-raster): raster cost not measured; it needs a real-device trace first.
- PLAYER-09 (minimized modal layers): speculative and not measured; check on a mid-range Android device before changing.

Partial deferrals, kept as task notes rather than separate findings, all awaiting `add-store-preorders`:

- Replacing Zod in the browser StoreCart and money parsers with hand-written guards (task 22.1 loads the parser lazily instead).
- Starting the capabilities read in parallel and folding the five sequential D1 stages of the Store Offer read (task 15.1 does the apply flag and timeout only).
- Server-side parallel delivery quotes with one Stripe client and reuse of the stock read (task 16.1 does the client side only).

Also out of scope: any change to Store Offer, StoreCart, listing-projection or checkout payload shapes; pagination, virtualization or a batch Store Offer API; splitting the global stylesheet per route; a custom RUM backend.
