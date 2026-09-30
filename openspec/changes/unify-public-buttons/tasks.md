# Tasks

## 1. Primitive and tone

- [x] 1.1 Rewrite `apps/web/src/components/ui/button.tsx` (`buttonVariants`: base, sizes sm/default/lg/icon/icon-lg, variants default/outline/ghost/link/chip, `data-variant`/`data-size`, hover under `(hover: hover)`, coarse-pointer halo); verify `pnpm test apps/web/src/components/ui/button.test.ts` (new) passes for `rounded-none`, `min-h-9`, halo classes and `data-variant`.
- [x] 1.2 Add tone inheritance rules and the header cart root reservation to `apps/web/src/styles/global.css` using `--store-accent*` / `--services-accent*`; verify with a CSS string test in `button.test.ts` that both `[data-tone='store']` and `[data-tone='services']` rules exist.
- [x] 1.3 Set `data-tone` on store surfaces (a wrapper inside the `StoreCollectionPage` layout, the root section of store item, checkout and return pages, the cart drawer's sheet content) and on the services page (one wrapper that also covers the portalled inquiry form); attributes on `<main>` do not survive shell navigation. Verify with `src/pages/_section-tone.test.ts` (each surface declares its tone once; no per-button rose accents).

## 2. Callers

- [x] 2.1 Strip per-caller overrides now covered by the base in `pages/index.astro`, `pages/services/index.astro`, `ReleaseDetailContent.astro`, `ArtistDetailContent.astro`, `ServicesInquiryForm.tsx`, `NewsletterSignupForm.tsx`, `CheckoutOfferStatus.tsx`, `StoreItemPurchaseActions.tsx`, `ArtistsRosterFilters.tsx`, `StoreDistroSearch.tsx`, `StoreImageGallery.tsx`, `Footer.astro`; verify `pnpm test` for each touched component file passes and `pnpm build:web` (or the web build target) succeeds.
- [x] 2.2 Move raw controls onto the primitive: `StoreCartDrawer.tsx`, `CheckoutReturnStatus.tsx` (incl. Refresh status, Contact the label), `pages/shop/index.astro`, `Header.astro` menu toggle, `MobileNavigationSheet.tsx`, `ShellOverlayPanel.tsx`, `ShellPlayerSurface.tsx` (close, provider, mini-player), `ShellPortalOutlets.tsx` fallback, `StoreCoverflowControls.astro`, roster chips, `ArtistRosterIndex.astro`, `pages/releases/index.astro`, store back/continue links; verify component tests pass and accessible names are unchanged (grep for each `aria-label` before/after).
- [x] 2.3 404 page: it is standalone HTML without `global.css`, so `.btn`, `.btn.green` and `.btn.ghost` in `public/assets/404/404.css` are rewritten by hand to the family (square, 36px, Bebas 14 caps, ink primary, charcoal secondary, hover gated, 2px focus ring) and Bebas Neue loads like `SiteLayout`; the Home link uses `createProjectRelativeUrl('/')`. Verify the built 404 page's Home link resolves to the site root.

## 3. Cart control

- [x] 3.1 Restyle `StoreCartButton.tsx` (icon size, 1.75 stroke, bubble classes, 200ms mount fade) and update `StoreCartButton.test.tsx`; verify the test passes and the accessible name stays `Cart, N item(s)`.
- [x] 3.2 Gate the portal in `ShellPortalOutlets.tsx` on items or a store route with `isCurrentPath`; add an outlets test for the three cases; verify `app-shell-code-splitting.test.ts` and `scripts/check-runtime-bundle-graphs.ts` still pass.
- [x] 3.3 Return focus on drawer close in `AppShellRoot.tsx` (trigger when rendered, else `main[data-app-shell-main]`) reusing `scheduleOverlayTriggerFocusRestore`; verify with `shell-overlay-focus.test.ts` cases for the trigger present and absent (the target lookup is `findStoreCartFocusReturnTarget`), and confirm the close paths in the browser pass (6.3).
- [x] 3.4 Change `apps/backend/scripts/smoke-content-preview.mjs` hydration wait on non-store pages to the mobile navigation trigger; verify by reading the script's Store page assertion still waits for `Cart, 1 item`.

## 4. In-place feedback

- [x] 4.1 Added state in `StoreItemPurchaseActions.tsx` (4s, draining hairline, polite announcement, width kept); verify with `e2e/store-cart.spec.ts` (reads Added right after the click, focus returns to it when the drawer closes, resets to Add To Cart) and the static render test.
- [x] 4.2 Undo line after Remove (or a quantity below one) and the quoted total in the Checkout action in `StoreCartDrawer.tsx`, fed by `CartDeliverySummary`; verify with `restoreCartLine` cases in `store-cart.test.ts`, drawer static tests (aria-hidden total, name stays Checkout, icon steppers) and `e2e/store-cart.spec.ts` (Remove leaves a focused Undo that restores the line).
- [x] 4.3 Quote-ready fill in `CheckoutOfferStatus.tsx`: charcoal outline "Waiting for shipping quote" (busy, disabled, readable) while the quote loads, ink primary with the Stripe label and the aria-hidden quote total once ready; verify with `createPayControlView` cases in `CheckoutOfferStatus.test.ts` (loading, ready, unavailable, starting).
- [x] 4.4 Armed Stop in `ShellPlayerSurface.tsx` (first press arms Stop? for 3s without the stop attribute, second press routes to the existing Stop, name unchanged, polite hint); provider chips expose `aria-pressed`; verify with `ShellPlayerSurface.test.tsx` and `e2e/player-continuity.spec.ts` (first press keeps the iframe, second removes it).
- [x] 4.5 Roster chips keep their existing counts, now in small mono (zero never occurs because genres come from the roster); cart line Remove recedes on hover-capable devices at an accessible colour; off-site commerce links (release detail, releases feature) carry the ↗ mark; provider chips are player controls, not external, so no mark. Also: the mobile sort select joins the family face at 44px and Subscribe keeps its width while loading. Verify with the web suite (`vitest.modules.config.ts`, 645 tests) and the browser pass (6.3).

## 5. CSS cleanup, Listen and status

- [x] 5.1 Delete superseded and dead button CSS in `global.css` (services CTA and submit, catalog nav, artist detail and roster actions, footer social pill and icon size, releases action link, overlay and player close, mini-player actions, provider look rules and logo lift, coverflow button rules incl. the collection override and pressed inversion, store search toolbar and gallery navigation overrides, the redundant thumbnail radius; 308 lines) and keep Bebas on buttons and status in store item pages; verify with `rg` (no remaining selector for each deleted class), balanced braces, `StoreCollectionPage.test.ts`, `_about-contact-presentation.test.ts` and the full web suite.
- [x] 5.2 Listen label to Bebas (`.music-listen-trigger` gap, label span, tracking pull-back, 1px nudge; standalone `min-height: 2.75rem`) in `MusicStreamingServiceListenTrigger.astro` and `global.css`; verify `music-listen-trigger-css.test.ts` passes with one added assertion for the label rule.
- [x] 5.3 Non-buyable purchase status as a `role="status"` element at 44px × 14rem (Store Blood edge for Sold Out, neutral otherwise) in `StoreItemPurchaseActions.tsx`; verify with its test (no button, no disabled attribute, status text present, geometry classes).

## 6. Docs and validation

- [x] 6.1 Update `DESIGN.md` §5 Buttons, `DESIGN.json` button components and `docs/design-inspiration.md` (Button family study · 2026-09-30 with the canvas link and decisions); verify `pnpm agent:check` passes.
- [ ] 6.2 Run `pnpm test:app-shell` and `pnpm test:e2e`; verify all pass and record `.codex-artifacts/e2e/summary.json`.
- [ ] 6.3 Browser pass on the Local site (Chrome, blackbox profile): header focus rings, cart hidden/visible cases, Added/Undo/Stop?/quote-ready states, 390px taps via halo, reduced motion, no console errors; verify by recording observations and screenshots in `validation.md`.
- [ ] 6.4 Run `pnpm validate` on the final tree and write `validation.md` with the source SHA, summary path, mode and status; verify the summary reports success.
