# Tasks

## 1. Phone item buy bar (Claude)

- [x] 1.1 Render the buy bar from `StoreItemPurchaseActions` below 40rem when an actionable cart item exists, reusing the inline handler, label, Adding/Added and status line; verify with component tests for pre-order, Buy and status-only items (no bar for status-only or ≥40rem).
- [x] 1.2 Drive shown/hidden from one IntersectionObserver zone (inline action top to page end), one-way "before reaching" behaviour, `inert` while hidden, no entrance on first paint; verify with a test that simulates below/visible/above and a fling from below to above.
- [x] 1.3 Add CSS: transform/opacity transitions (300 ms ease-out-expo in, 195 ms ease-in out, explicit `translateY(0)` resting), reduced-motion instant state, 44px control, flat Deep Border surface; verify at 390 × 844 that transitions record zero layouts (Performance LayoutCount) and reduced motion has no transition.
- [x] 1.4 Keep `--buy-bar-height` on the document element and lift the open mini player with `:root:has(.store-buy-bar[data-shown='true'])` (the bar renders inside the page, so shell navigation removes it); verify in the browser that the minimized player sits fully above the bar, returns when the bar leaves, and that no bar or lift remains after shell navigation.
- [x] 1.5 Record the buy bar in DESIGN.md (component rules, motion, approval date and preview path); verify `pnpm agent:check` stays green.

## 2. Forms and copy (Claude)

- [x] 2.1 Reorder `NewsletterSignupForm` to email, consent, Subscribe at all widths and render the consent error directly under the checkbox; update `NewsletterSignupForm.test.tsx` for DOM order, error placement and no request without consent.
- [x] 2.2 Services: Send Inquiry uses the ink face; General renders no details field and its submission omits `serviceDetails`; update `ServicesInquiryForm.test.tsx` and the General scenario fixtures.
- [x] 2.3 Cart drawer: visible description removed, screen-reader description "Review your items before checkout.", empty detail "Nothing here yet."; update `StoreCartDrawer.test.tsx` and any copy fixtures.

## 3. Drawer pending rows (Claude)

- [x] 3.1 In the drawer presentation, reserve Items/Delivery/Total rows while pending, show the local subtotal for Items when fixed-price single-currency, `…` otherwise, keep `aria-busy` and the calculating name; update `DeliverySummary.test.tsx` for subtotal, pay-what-you-want and quote replacement without row movement.

- [x] 3.2 Production bug found in acceptance: a cart holding a pre-order keeps the Sea Green Checkout face (owner choice B); verify with the CSS rule test in `touch-ergonomics-css.test.ts` and the browser colour check in `e2e/store-buy-bar.spec.ts`.

## 4. Reading widths (Claude)

- [x] 4.1 News article card max 46rem with 16px body from 640px, About text column max 46rem, running paragraphs capped at 34rem (owner choice after measurement); verify at 1280px that body lines measure 60–75 characters and at 390px that layouts are unchanged, and that the About contact directory does not overflow.

## 5. Speed and redirect (Codex)

- [x] 5.1 First delivery quote requested immediately, later edits keep the 250 ms settle; extend `DeliveryQuote.test.ts` (immediate first request, debounced edits, one request per cart state, stale results ignored, retry, unmount).
- [x] 5.2 Add `[data-store-card-buy]` to the app-shell intent-warm selector; verify with a shell test that card pointer/focus starts the cart and summary loads and that the initial closure budget check still passes.
- [x] 5.3 Remove duplicate D1 reads and overlap independent reads in the Worker quote path, keeping the final stock/hold read after the provider read; add backend tests asserting D1 and provider call counts, stock rejection, merged lines, tariff boundaries, provider failure and a hold arriving during the provider wait.
- [x] 5.4 Add the permanent redirect `/news/lorem-ipsum/` → `/news/caregivers/` in the public gateway, sequenced or conditioned so it never points at a missing page; add a gateway test and state the chosen sequencing in this change.

## 6. Integration and acceptance

- [x] 6.1 Run `pnpm validate` on the final tree and record the summary path, source SHA and fingerprint in a validation note in this change.
- [x] 6.2 Run the browser checks for the selected acceptance rows at 390 × 844 and 1280 × 900 (item page bar with and without the mini player, newsletter error placement, Services General, cart pending rows, News and About widths, shell navigation continuity) and attach screenshots; note real-phone smoothness as unverified unless measured.

## Workflow follow-up

- Owner approves the CMS slug rename for the Caregivers article and publishes it through Content Publication.
- Software Release to UAT and PRD follows the normal release workflow after validation.
- Archive the change once released and accepted.

## Codex implementation notes

- Work is limited to group 5 in the authorized `worktree-ux-laws-review-fixes` worktree. The hook is the only edited part of `DeliverySummary.tsx`; the selector is the only edited part of `AppShellRoot.tsx`.
- 5.1 removes the first request's programmed 250 ms wait, retaining 250 ms settling for later edits and retries, cancellation and latest-result checks. `pnpm test apps/web/src/components/store/checkout/DeliveryQuote.test.ts` passed (9 affected projects).
- 5.2 adds Store card intent without new eager imports. Pointer-over, pointer-down and focus tests verify both cart modules load once; `pnpm test apps/web/src/components/app-shell/app-shell-code-splitting.test.ts` passed. After the one authorized web build generated artifacts, `pnpm performance:bundles --output=.codex-artifacts/ux-laws-group5/bundle-graphs.json` passed with no diagnostics: shell 41,149 Brotli bytes against 104,448 allowed; every checked route also passed.
- 5.3 overlaps availability and product-projection reads while preserving sold-out results if the speculative projection fails. The final quote check uses the existing combined stock/hold query, removing a redundant stock lookup. Per merged buyable line with a Product binding: before 9 D1 SELECTs and 1 default-price gateway call (source counts); after 8 SELECTs and 1 explicit mocked gateway call (local tests). Early availability and final post-provider stock/hold checks remain. `catalog-reconciler.ts` already reads mapping/snapshot in parallel and needs no edit. `pnpm test apps/backend/src/interfaces/http/routes/delivery-quote.worker.test.ts` passed; the final `pnpm test apps/backend/src/application/commerce/checkout/checkout-use-cases.test.ts` passed all 10 affected projects, including 13 new quote cases. Coverage includes counts, read overlap, duplicate lines, tariff boundaries, stock rejection, provider/projection failure and a hold inserted during the provider wait. Savings are one measured statement per successful line and expected latency from overlapping reads; no live timing was measured. Trade-off: unavailable items now also start the projection read.
- 5.4 uses a publication-aware condition because build route patterns admit dynamic News slugs: the target must be allowed by the gateway and return HTTP 200 HTML to a header-stripped public-renderer HEAD request. Only then does the legacy URL return 308 to `/news/caregivers/`, preserving its query string, with `no-store`. Missing, failed, redirected or non-HTML targets retain ordinary legacy-route behavior. Tests cover GET/HEAD, both slash forms, before/after publication and route allowlists. `pnpm test scripts/pages-public-gateway.test.mjs` passed (8 Nx tasks). Only legacy requests add one renderer HEAD call; before publication they can make two renderer calls including the old article. The CMS rename and canonical/internal-link acceptance remain the owner's separate Content Publication operation.
- Build handoff: `pnpm build:web` ran once. Astro generated 340 pages; cache and font checks passed, but image-markup validation stopped the remaining pipeline: News `anarchotribal`, `disintegration` and `lorem-ipsum` emit a 660px image size at 1440@1 while the checker expects a 1012px slot. This is outside Codex file ownership; no second build or `pnpm validate` was run. The separate bundle check above passed against those generated artifacts. Strict OpenSpec validation, formatting and `git diff --check` passed. Final repository/browser/hosted acceptance remains with the coordinator. Graphify has no worktree graph and CodeGraph resolves to the other checkout, so scoped worktree reads were used.
