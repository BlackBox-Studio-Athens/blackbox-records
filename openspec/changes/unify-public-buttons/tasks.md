# Tasks

## 1. Primitive and tone

- [x] 1.1 Rewrite `apps/web/src/components/ui/button.tsx` (`buttonVariants`: base, sizes sm/default/lg/icon/icon-lg, variants default/outline/ghost/link/chip, `data-variant`/`data-size`, hover under `(hover: hover)`, coarse-pointer halo); verify `pnpm test apps/web/src/components/ui/button.test.ts` (new) passes for `rounded-none`, `min-h-9`, halo classes and `data-variant`.
- [x] 1.2 Add tone inheritance rules and the header cart root reservation to `apps/web/src/styles/global.css` using `--store-accent*` / `--services-accent*`; verify with a CSS string test in `button.test.ts` that both `[data-tone='store']` and `[data-tone='services']` rules exist.
- [ ] 1.3 Set `data-tone` on store surfaces (`StoreCollectionPage` layout, store item and checkout pages, `StoreCartDrawer`) and services surfaces (services page, `ServicesInquiryForm`); verify by rendering `StoreCartDrawer` and `ServicesInquiryForm` in their tests and asserting the attribute.

## 2. Callers

- [ ] 2.1 Strip per-caller overrides now covered by the base in `pages/index.astro`, `pages/services/index.astro`, `ReleaseDetailContent.astro`, `ArtistDetailContent.astro`, `ServicesInquiryForm.tsx`, `NewsletterSignupForm.tsx`, `CheckoutOfferStatus.tsx`, `StoreItemPurchaseActions.tsx`, `ArtistsRosterFilters.tsx`, `StoreDistroSearch.tsx`, `StoreImageGallery.tsx`, `Footer.astro`; verify `pnpm test` for each touched component file passes and `pnpm build:web` (or the web build target) succeeds.
- [ ] 2.2 Move raw controls onto the primitive: `StoreCartDrawer.tsx`, `CheckoutReturnStatus.tsx` (incl. Refresh status, Contact the label), `pages/shop/index.astro`, `Header.astro` menu toggle, `MobileNavigationSheet.tsx`, `ShellOverlayPanel.tsx`, `ShellPlayerSurface.tsx` (close, provider, mini-player), `ShellPortalOutlets.tsx` fallback, `StoreCoverflowControls.astro`, roster chips, `ArtistRosterIndex.astro`, `pages/releases/index.astro`, store back/continue links; verify component tests pass and accessible names are unchanged (grep for each `aria-label` before/after).
- [ ] 2.3 404 page: `pages/404.astro` buttons on the primitive, delete `public/assets/404/404.css` button rules, fix the Home `href`; verify the built 404 page's Home link resolves to the site root.

## 3. Cart control

- [x] 3.1 Restyle `StoreCartButton.tsx` (icon size, 1.75 stroke, bubble classes, 200ms mount fade) and update `StoreCartButton.test.tsx`; verify the test passes and the accessible name stays `Cart, N item(s)`.
- [x] 3.2 Gate the portal in `ShellPortalOutlets.tsx` on items or a store route with `isCurrentPath`; add an outlets test for the three cases; verify `app-shell-code-splitting.test.ts` and `scripts/check-runtime-bundle-graphs.ts` still pass.
- [x] 3.3 Return focus on drawer close in `AppShellRoot.tsx` (trigger when rendered, else `main[data-app-shell-main]`) reusing `scheduleOverlayTriggerFocusRestore`; verify with `shell-overlay-focus.test.ts` cases for the trigger present and absent (the target lookup is `findStoreCartFocusReturnTarget`), and confirm the close paths in the browser pass (6.3).
- [x] 3.4 Change `apps/backend/scripts/smoke-content-preview.mjs` hydration wait on non-store pages to the mobile navigation trigger; verify by reading the script's Store page assertion still waits for `Cart, 1 item`.

## 4. In-place feedback

- [ ] 4.1 Added state in `StoreItemPurchaseActions.tsx` (4s, hairline, `aria-live`); verify `StoreItemPurchaseActions.test.tsx` covers add → Added → Add to cart with fake timers.
- [ ] 4.2 Undo line after Remove and subtotal in the Checkout action in `StoreCartDrawer.tsx`; verify `StoreCartDrawer.test.tsx` covers remove → Undo restores the quantity, and the Checkout label contains the formatted subtotal.
- [ ] 4.3 Quote-ready fill in `CheckoutOfferStatus.tsx`; verify its test renders outline "Waiting for shipping quote…" while loading and the primary CTA once `delivery.quote` exists.
- [ ] 4.4 Armed Stop in `ShellPlayerSurface.tsx` (Stop? for 3s, second press stops, accessible name unchanged); verify `ShellPlayerSurface.test.tsx` and update `e2e/player-continuity.spec.ts` (and any spec pressing Stop) to press twice.
- [ ] 4.5 Counts on roster chips in `ArtistsRosterFilters.tsx`, recede-in-rows classes on cart lines, ↗ mark on external text controls (release commerce link, provider buttons); verify component tests and that icon-only social links are unchanged.

## 5. CSS cleanup, Listen and status

- [ ] 5.1 Delete superseded and dead button CSS in `global.css` (`.catalog-nav-button`, `.artist-detail-action*`, `.services-page-intro__cta`, `.services-inquiry-form__submit`, `.releases-latest-feature__action-link`, `.artist-roster-index__action*`, coverflow button rules incl. the ≈5317 override, `.app-shell-content-overlay__close-button`, player close/provider/mini-action rules, footer pill, `.store-coverflow-actions__toggle`, listen `__indicator` and unused modifiers, gallery overrides ≈5478/5490) and exclude `[data-slot='button']` from the `.store-item-page` text rule; verify `rg` finds no remaining selector for each deleted class and `StoreCollectionPage.test.ts` / `_about-contact-presentation.test.ts` still pass.
- [x] 5.2 Listen label to Bebas (`.music-listen-trigger` gap, label span, tracking pull-back, 1px nudge; standalone `min-height: 2.75rem`) in `MusicStreamingServiceListenTrigger.astro` and `global.css`; verify `music-listen-trigger-css.test.ts` passes with one added assertion for the label rule.
- [ ] 5.3 Non-buyable purchase status as a `role="status"` element at 44 × 14rem in `StoreItemPurchaseActions.tsx`; verify its test asserts no button for Sold Out and the status text is present.

## 6. Docs and validation

- [ ] 6.1 Update `DESIGN.md` §5 Buttons, `DESIGN.json` button components and `docs/design-inspiration.md` (Button family study · 2026-09-30 with the canvas link and decisions); verify `pnpm agent:check` passes.
- [ ] 6.2 Run `pnpm test:app-shell` and `pnpm test:e2e`; verify all pass and record `.codex-artifacts/e2e/summary.json`.
- [ ] 6.3 Browser pass on the Local site (Chrome, blackbox profile): header focus rings, cart hidden/visible cases, Added/Undo/Stop?/quote-ready states, 390px taps via halo, reduced motion, no console errors; verify by recording observations and screenshots in `validation.md`.
- [ ] 6.4 Run `pnpm validate` on the final tree and write `validation.md` with the source SHA, summary path, mode and status; verify the summary reports success.
