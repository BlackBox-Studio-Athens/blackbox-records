## 1. Preconditions And Baseline

- [ ] 1.1 Record the baseline identity `e818b709a2364aa29dfd54cadcd0433779a1f263`, the integration base of each slice, and the raw evidence in `.codex-artifacts/runtime-performance/review-e818b70/`.
- [x] 1.2 Confirm the open changes on the same capabilities (`adopt-lenis-motion-frontends`, `inert-shell-page-snapshots`, `rehydrate-cached-shell-islands`, `complete-image-delivery`, `reveal-first-screen-images`, `lighten-home-entry`, `clarify-store-sold-out-presentation`, `show-low-stock-notice`) are untouched, and record their archive state before group 24.
- [x] 1.3 Record the `add-store-preorders` overlap policy from design decision 14 and keep each slice touching its areas contract-neutral.

## 2. Linear Store Listing And Hoisted Date Formatters

- [x] 2.1 DATA-01: Use the pure `createStoreItemAvailability(storeItem)` in `listStoreCollectionEntries`, `createStorePageStaticPaths` and `getStorePageEntryBySlug`, and pass computed category data into `StoreCategoryNavigation` so each Store category page lists once.
- [x] 2.2 DATA-04: Hoist module-level `Intl.DateTimeFormat` instances for `formatMonthYear` and keep one implementation.
- [x] 2.3 Prove identical Store listing output for `/store/`, `/store/distro/`, `/store/blackbox-releases/`, `/store/merch/` and `sitemap.xml`, cover the last day of a month in Europe/Athens, and record the Node 24 benchmark before and after.

## 3. Snapshot Parse And Published Reader

- [x] 3.1 DATA-03: Build the snapshot revision-image schema once at module scope, use a `Set` for the store-item source check, and keep one full parse of the final publication candidate with the same validation errors.
- [x] 3.2 DATA-02: Memoize published-reader projections per snapshot object (`WeakMap` to a map of collection and media base, plus an id index for `getEntry`), bypassed whenever preview overrides are present.
- [x] 3.3 DATA-06: Reuse the memoized snapshot loader in the catalog asset endpoint.
- [x] 3.4 Test identical parse results and failures, per-snapshot invalidation and preview bypass; record cold and warm parse and `getCollection`/`getEntry` benchmarks.

## 4. Bounded Html Class Restyles

- [x] 4.1 CSS-N1: Stop importing `lenis.css`, restate only the needed Lenis rules without `.lenis` descendant selectors, and replace the button icon `[&_svg:not([class*='size-'])]` variants with zero-specificity default sizing.
- [ ] 4.2 Record the style-recalc element count after an `<html>` class toggle on `/store/distro/` before and after, and prove icon sizes inside buttons are unchanged on the main routes at 1440 and 390 px.

## 5. Lenis That Pays For Itself

- [x] 5.1 PLAYER-01: After evaluating the on-demand desktop candidate, construct no public Lenis on any pointer; preserve native smooth anchors/resets and shell body modal/overlay locks; add idle, wheel and touch profiles to `scripts/measure-runtime-performance.ts`.
- [x] 5.2 SHELL-08: Flip the Home hero threshold from the runtime scroll signal or an IntersectionObserver sentinel instead of per-scroll layout reads.
- [x] 5.3 Measure idle main-thread time over 5 s at 4× CPU on Home, About and Distro (desktop and touch emulation) and Distro scroll frames with and without Lenis in one session; record whether desktop Lenis is kept or removed and why.
- [x] 5.4 Prove native desktop wheel, in-page smooth scroll, immediate navigation resets, nested panes and the modal lock with the shell-navigation, player-continuity and store-cart e2e specs.

## 6. Fonts And First-Viewport Discovery

- [x] 6.1 CSS-02: Preload Veneer from `SiteLayout` through a fingerprinted `?url` import and keep `check-brand-font.ts` in step.
- [x] 6.2 CSS-03: Self-host Inter, Geist Mono and Bebas Neue, preload only above-the-fold faces, choose and record each `font-display`, and remove the Google preconnects and the async stylesheet swap.
- [x] 6.3 PAGES-10: Load the header logo eagerly on every page.
- [x] 6.4 CSS-09: Give the 404 page the site font strategy and stop its decorative infinite animations under reduced motion and offscreen.
- [x] 6.5 Record mobile Home LCP, the LCP element and font request start times before and after on `mobile-load` (at least three equivalent A/B runs for the preload), and prove no page requests a Google Fonts origin.

## 7. Dead CSS, View-Transition Output And Content-Visibility

- [x] 7.1 CSS-04: Delete the dead rules and the malformed selector without splitting the stylesheet.
- [x] 7.2 CSS-08: Remove the unused `transition:name` attributes and update `_releases-page-layout.test.ts`.
- [x] 7.3 CSS-06: Remeasure listing-card `content-visibility` on `/store/` and `/store/distro/` after group 4; keep it unless A/B evidence shows a net cost, and report any needed delta instead of removing it silently.
- [ ] 7.4 Prove no visual change on the main routes and no `transition:name` output in dist.

## 8. Coverflow Steps And Search Keystrokes

- [x] 8.1 STORE-10: Set the Coverflow ratio property on its rail fill, sanitize it there in snapshots, read styles only for positioned cards, and skip `sizes` rewrites outside preview changes.
- [x] 8.2 STORE-05: Attach the non-passive stage wheel listener only in preview mode.
- [x] 8.3 STORE-11: Memoize the artist picker so a keystroke commits once.
- [x] 8.4 STORE-07: Replace motion's single-value animate with `element.animate()` using the same timing, and load Fuse on the first non-empty query.
- [x] 8.5 Record style-recalc element counts for a Coverflow Next and the first keystroke, and Store activation lazy-JS bytes, before and after; run the Store e2e specs.

## 9. Store Chrome Without Layout Shift

- [x] 9.1 STORE-03: Server-render the Store toolbar, view controls and mobile artist picker in their final boxes inside the portal targets, disabled until ready, enhanced in place, with Coverflow capability decided in CSS and the result total hidden from the server render.
- [x] 9.2 Record desktop and mobile CLS for `/store/` and `/store/distro/` before and after, and prove the toolbar works after direct load and shell navigation.

## 10. Listing-Price Read From The Document

- [x] 10.1 STORE-04: Start the one direct-load listing-price read from an inline module script on collection pages and consume it through `getPreparedStoreListingPriceReader`.
- [x] 10.2 Assert exactly one listing-price request per activation on direct load, shell navigation and cached activation, and record the request start time before and after hydration.

## 11. Store Card And Gallery Candidates

- [x] 11.1 STORE-09: Use Store card widths 240, 360, 480, 640 and 720 with accurate `sizes`, editing only the image widths in `StoreItemCard`.
- [x] 11.2 STORE-06: Replace motion in `StoreImageGallery` with a CSS crossfade and pointer events, mount it the shell way, and give thumbnails a 144/216w `srcset`.
- [x] 11.3 Prove picked candidates at 390@2 and 1440@1, gallery keyboard, thumbnail and swipe behaviour, and item-page eager bytes without motion.

## 12. Shell Navigation Scheduling

- [x] 12.1 SHELL-04: Read player modal state through a ref so the routing effect runs once.
- [x] 12.2 SHELL-02: Snapshot the leaving page after the veil's frames only when no snapshot exists for the path, and take the mount snapshot at idle.
- [x] 12.3 SHELL-09: Start the uncached fetch before the frame wait and run the scroll reset and first-screen image wait together.
- [x] 12.4 SHELL-06: Add a hover dwell with cancellation, low fetch priority, a Save-Data and 2G skip, and first-image-only warming, keeping immediate prefetch on focus and touch.
- [x] 12.5 Run `pnpm test:app-shell` and the shell-navigation, shell-islands and player-continuity e2e specs.

## 13. One Parse Per Section Document

- [x] 13.1 SHELL-03: Parse each fetched section document once, sanitize in place, collect eager images before serialising, and apply a cached fragment with `replaceChildren`, cloned when reused.
- [ ] 13.2 Prove island rehydration after cached returns and inert snapshots still hold, and record the Store prefetch task duration before and after.

## 14. Cart And Checkout Thumbnails

- [x] 14.1 DATA-05: Pass a 176 px WebP thumbnail per Store Item to the cart seed and checkout summary with width and height 88 and `decoding="async"`, keeping the seed shape unchanged.
- [x] 14.2 Prove cart and checkout request the small derivative and the store-cart e2e spec passes.

## 15. One Bounded Store Offer Read Per View

- [x] 15.1 COMMERCE-03: Make public Store Offer reads read-only (`apply: false`) with a short Stripe timeout and the existing failure semantics. Folding the D1 stages and the parallel capabilities read stay deferred, awaiting `add-store-preorders`.
- [x] 15.2 COMMERCE-02: Share one in-flight Store Offer read per slug, cleared on settle.
- [x] 15.3 Prove with a backend test that a public read cannot mutate catalog state and that the timeout is bounded, and with a web test or e2e that a Store Item view makes exactly one `/api/store/items/:slug` request.

## 16. Settled Delivery Quotes

- [x] 16.1 COMMERCE-04: Debounce delivery quotes about 250 ms on the client and abort stale requests (latest wins). Server-side parallel quotes stay deferred, awaiting `add-store-preorders`, unless they touch nothing that change needs.
- [x] 16.2 Prove one request per settled change with stale requests aborted, and that checkout start still revalidates.

## 17. Commerce Entry And Terms

- [x] 17.1 COMMERCE-08: Answer CORS preflights in the entry Worker and cache one Prisma client per Durable Object instance.
- [x] 17.2 COMMERCE-10: Render `/terms/` delivery constants from a shared browser-safe module at build or SSR time.
- [x] 17.3 Prove preflights skip the Durable Object, one Prisma client per object, and `/terms/` constants without a runtime fetch.

## 18. Editorial Images

- [x] 18.1 PAGES-01: Write editorial `sizes` from the real CSS slots, give the first `/news/` card high priority, and check picked candidates at 390@2, 390@3 and 1440@1 in dist.
- [x] 18.2 PAGES-02: Size the artist hero from image aspect against frame aspect with 360 and 480 rungs, keeping the contain-over-blur look.
- [x] 18.3 PAGES-03: Apply one editorial WebP quality constant of 68.
- [x] 18.4 PAGES-04: Make `src` reuse the largest `srcset` transform, including the gallery `getImage` call.
- [x] 18.5 PAGES-11: Emit 1200 px JPEG link-preview images for Content Image metadata.
- [x] 18.6 PAGES-08: Serve the Holding Page logo as a 240 px WebP.
- [ ] 18.7 Record encode count, dist size and picked-candidate bytes before and after, and obtain a maintainer visual check of quality 68 on the grainy monochrome art.

## 19. Production Build Hygiene

- [x] 19.1 PAGES-12: Exclude demo pages from production builds and move the trial font out of `public/`, keeping both available in development and the Holding Page build intact.
- [x] 19.2 Prove dist has no `/demo/` pages or trial font and the Holding Page artifact check passes.

## 20. Shell Surfaces Without Suspense Or Motion

- [x] 20.1 SHELL-N1: Open Menu, cart drawer, detail overlay and player surface from intent-started module promises without a Suspense boundary.
- [x] 20.2 PLAYER-03: Animate the sheet with CSS keyframes on Radix `data-state` with a reduced-motion override, and warm Menu at idle.
- [x] 20.3 COMMERCE-06: Warm the cart drawer chunks at idle on Store and item routes or with a non-empty cart, with immediate feedback on the first Add To Cart.
- [x] 20.4 SHELL-07: Replace motion in the detail overlay panel with CSS transitions, and warm and pre-resolve the panel when an overlay link is prefetched.
- [x] 20.5 Record tap-to-visible for Menu, cart drawer and overlay on the mobile profile cold and warm, lazy-chain bytes, and pass the mobile navigation, overlay, store-cart and focus/escape e2e checks.

## 21. Player From The Click

- [x] 21.1 PLAYER-02: Create the provider iframe in the Listen handler inside an always-mounted, never re-parented shell host, with CSS transitions on `data-state` instead of motion.
- [x] 21.2 PLAYER-04: Preconnect providers without `crossorigin` and include Store Listen triggers in the intent selector.
- [x] 21.3 PLAYER-07: Replace the `robot3` player machine with a pure reducer with the same transitions.
- [x] 21.4 PLAYER-08: Write Listen trigger state only when it differs.
- [x] 21.5 Record tap-to-iframe on the mobile profile before and after, and pass `pnpm test:app-shell` and the player-continuity e2e spec.

## 22. Smaller Eager Graph

- [x] 22.1 SHELL-01: Keep only StoreCart listeners eager and load the Zod-based parser when a cart key exists, on Store or checkout routes, or on the first cart event. Replacing Zod with hand-written guards stays deferred, awaiting `add-store-preorders`.
- [x] 22.2 STORE-N1: Add a single-image and a gallery Store Item page to the bundle-graph check, with an explicit item-page budget and reason if they still exceed the public budget.
- [x] 22.3 SHELL-10: Move the listing-price presentation helpers into a dependency-free module, load the API client at submit time, and load `motion/mini` on the first navigation intent.
- [x] 22.4 PLAYER-05: Remove `tailwind-merge` from the eager closure through static class strings or audited `twJoin`.
- [x] 22.5 Record eager-graph bytes per route before and after, and prove zod and the cart parser do not load on routes with no cart key before any cart event.

## 23. Newsletter Form Through The Shell Portal

- [x] 23.1 PAGES-06: Render the newsletter note and privacy link statically and mount the form through the shell portal pattern.
- [x] 23.2 Prove the Home eager graph shrinks and the form works after direct load and after shell navigation.

## 24. Spec Reconciliation

- [ ] 24.1 When `adopt-lenis-motion-frontends` is archived, convert this change's scroll-runtime and shell-transition requirements into modifications of its "Public shell scrolling uses one lifecycle-owned Lenis runtime" and "Public coordinated transitions use Motion without changing shell ownership" requirements, and its gallery scenario, then strict-validate.
- [x] 24.2 Reconcile the scroll-runtime delta with slice C2's measured result: Lenis kept on fine pointers or removed everywhere.
- [x] 24.3 Reconcile the font delta with slice C3's result: each UI face's `font-display` and the Veneer preload A/B outcome; confirm the `lighten-home-entry` font requirement and this delta agree.
- [x] 24.4 Reconcile the Store Item eager-budget delta with slices P3 and D4: shared public budget or an explicit item-page budget with its reason.
- [x] 24.5 Reconcile the catalog rendering requirement with slice C4's `content-visibility` decision.
- [ ] 24.6 Reconcile the listing-price delta with `add-store-preorders` if it lands first, keeping one read per activation.

## 25. Final Verification And Closure

- [x] 25.1 Re-run `desktop-load`, `mobile-load`, `wide-scroll`, `mobile-scroll` and the new idle, wheel and touch profiles on the final tree, with like-for-like comparisons against `review-e818b70` labelled as such.
- [x] 25.2 Run `pnpm test:app-shell` and the shell-navigation, shell-islands, player-continuity and store-cart e2e specs, plus the Store specs touched by groups 8-11, on the final tree.
- [x] 25.3 Run `pnpm validate` on the final tree and record the summary path, mode and fingerprint in `validation.md`.
- [x] 25.4 Run `pnpm openspec -- validate improve-site-performance-round-three --type change --strict`.
- [x] 25.5 Write the round-three implementation report and append `PERF-004` (this review) and `PERF-005` (the implementation) to `../2026-08-31-site-performance-program/performance-report-log.md` without rewriting earlier entries.
- [x] 25.6 Confirm no pagination, virtualization, batch Store Offer API, payload-shape change, service worker, custom RUM or framework change entered the diff; then archive.

## Final local evidence and open gates

The recovered implementation, final measurements, strict validations and 72 passing scoped browser checks are recorded in validation.md and PERF-005. Profile execution/source integrity passes; first-traversal long tasks and real-input frame outliers remain reported residuals, not numerical passes. Current style/action counters and historical review figures are explicitly directional; the original raw traces cannot be reconstructed.

Open tasks: 1.1 lacks original raw evidence; 4.2 has current bounded counters/icon inventories but no equivalent before-state visual proof; 7.4 and18.7 retain maintainer visual acceptance; 13.2 proves cached island/inert behavior but lacks equivalent before/after Store-prefetch task timing. Conditional predecessor/preorder reconciliations (24.1,24.6) remain pending. No hosted/provider release was performed.

## Archive disposition on 2026-10-03

The user explicitly requested local commit, rebase, merge and archival. Task25.6 closes the completed scope audit and archive operation. The seven unchecked tasks above remain evidence, visual-acceptance or future overlap follow-ups; archival does not waive them or change performance budgets. The sibling hosted archive retains its own release and account gates. Current delta requirements are synced to main specs without archiving unrelated predecessor changes.
