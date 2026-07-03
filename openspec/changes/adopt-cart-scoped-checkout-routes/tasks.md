## 1. Route Inventory And Decisions

- [x] 1.1 Grep for all `/store/{storeItemSlug}/checkout/`, `/store/disintegration-black-vinyl-lp/checkout/`, `/store/aftermaths/checkout/`, and `checkoutPath` references in app, tests, docs, scripts, and OpenSpec.
- [x] 1.2 Confirm old item-scoped checkout compatibility uses a noindex shell when direct links load with an empty `StoreCart`, while old return compatibility may redirect or render as long as it preserves query parameters.
- [x] 1.3 Confirm `/store/checkout/` renders an empty-cart state and never starts checkout when `StoreCart` has no lines.
- [x] 1.4 Preserve existing paid-only `StoreCart` clearing on checkout return.
- [x] 1.5 Reserve `checkout` as a store route segment and choose the existing slug-collision helper location to enforce it.

## 2. Frontend Checkout Routes

- [x] 2.1 Add `apps/web/src/pages/store/checkout/index.astro` as the primary cart-scoped checkout page.
- [x] 2.2 Add `apps/web/src/pages/store/checkout/return/index.astro` as the primary cart-scoped return page.
- [x] 2.3 Move reusable checkout page data from `apps/web/src/pages/store/[slug]/checkout/index.astro` so cart-scoped checkout does not require `StorePageEntry`.
- [x] 2.4 Move reusable return page data from `apps/web/src/pages/store/[slug]/checkout/return/index.astro` so cart-scoped return does not require `StorePageEntry`.
- [x] 2.5 Update checkout metadata and visible copy so it describes cart checkout, not one item checkout.
- [x] 2.6 Ensure `/store/checkout/` direct load with empty cart renders the chosen empty-cart behavior without starting checkout.
- [x] 2.7 Ensure `/store/checkout/return/` renders order status from `session_id` without any route `storeItemSlug`.
- [x] 2.8 Ensure old return compatibility preserves `session_id` when redirecting or rendering a compatibility shell.

## 3. Cart Entry Points And Helpers

- [x] 3.1 Replace item-derived checkout href creation in `apps/web/src/lib/store-cart.ts` with a cart-scoped checkout path helper.
- [x] 3.2 Update `apps/web/src/components/store/StoreCartDrawer.tsx` so Checkout always points to `/store/checkout/` when the cart has lines.
- [x] 3.3 Remove `primaryLineItem` as a routing dependency where it is only used to build checkout URLs.
- [x] 3.4 Keep `primaryLineItem` only where display/backward compatibility still needs it, or delete it if no longer needed.
- [x] 3.5 Update `CheckoutOfferStatus` and `checkout-offer-status-state` so checkout start uses cart lines as the primary contract and does not treat page slug as checkout document identity.
- [x] 3.6 Keep single-line fallback behavior only where needed for compatibility routes or tests.
- [x] 3.7 Update `CheckoutOrderSummary` usage so cart-scoped checkout summarizes all `StoreCart` lines and no longer depends on the page item as the primary order summary.
- [x] 3.8 Remove `StoreItem.checkoutPath` from the public Store Item projection and replace remaining consumers with a cart checkout path helper or route-local compatibility path.
- [x] 3.9 Update catalog projection tests and catalog field-ownership references so `checkoutPath` is no longer a Store Item projection field.
- [x] 3.10 Add reserved-slug validation so no Store Item can project to `/store/checkout/`.

## 4. Item-Scoped Compatibility Routes

- [x] 4.1 Convert `apps/web/src/pages/store/[slug]/checkout/index.astro` into a noindex compatibility page that can recover item intent when `StoreCart` is empty.
- [x] 4.2 Convert `apps/web/src/pages/store/[slug]/checkout/return/index.astro` into a compatibility redirect or noindex compatibility page that preserves query parameters.
- [x] 4.3 Ensure compatibility routes do not trust `storeItemSlug` for checkout authority.
- [x] 4.4 Ensure compatibility routes point new shopper flow to `/store/checkout/` and `/store/checkout/return/`.
- [x] 4.5 Add or update robots/canonical metadata for compatibility pages if redirects are not used.
- [x] 4.6 Preserve `session_id` from item-scoped return compatibility routes through to checkout return status.
- [x] 4.7 Ensure old item-scoped checkout direct loads with empty `StoreCart` offer a validated item recovery path and do not start hosted checkout.

## 5. Worker Return And Cancel URLs

- [x] 5.1 Update `apps/backend/src/interfaces/http/routes/public-checkout-return-url.ts` to build success URLs at `{returnTarget.baseUrl}/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}`.
- [x] 5.2 Update `apps/backend/src/interfaces/http/routes/public-checkout-return-url.ts` to build cancel URLs at `{returnTarget.baseUrl}/store/checkout/`.
- [x] 5.3 Replace `isCheckoutPathForStoreItem()` with cart-scoped checkout path validation.
- [x] 5.4 Allow item-scoped checkout referers only as explicit rollout compatibility input.
- [x] 5.5 Keep configured return-target allowlisting unchanged, including configured path prefixes such as `/blackbox-records`.
- [x] 5.6 Update checkout trace/log fields only if they currently imply route identity; keep line-level item identity where useful.

## 6. Tests

- [x] 6.1 Update `apps/web/src/lib/store-cart.test.ts` for the cart-scoped checkout path helper.
- [x] 6.2 Update `apps/web/src/components/store/StoreCartDrawer.test.tsx` so cart checkout href is `/store/checkout/` for single-line and multi-line carts.
- [x] 6.3 Add or update checkout page tests for empty cart, single-line cart, multi-line cart, and quantity greater than one.
- [x] 6.4 Update `CheckoutOfferStatus` tests so multi-line checkout sends `lines[]` from cart state from `/store/checkout/`.
- [x] 6.5 Update `CheckoutOrderSummary` tests so checkout summary does not depend on one page item.
- [x] 6.6 Update `apps/backend/test/http/public-checkout-return-url.test.ts` for cart-scoped success and cancel URLs, including configured base paths such as `/blackbox-records`.
- [x] 6.7 Update `apps/backend/test/http/public-commerce-routes.test.ts` for cart-scoped referer and return URL expectations.
- [x] 6.8 Keep or add backend tests proving `lines[]` validation still rejects missing, mismatched, unavailable, or over-quantity lines.
- [x] 6.9 Add compatibility route tests or static build assertions for old item-scoped checkout paths, including empty-cart direct loads.
- [x] 6.10 Add tests that old item-scoped return compatibility preserves `session_id`.
- [x] 6.11 Add tests that `checkout` is rejected as a Store Item slug.
- [x] 6.12 Add tests proving Store Item projection no longer exposes `checkoutPath`.

## 7. Smoke Scripts, Docs, And OpenSpec

- [x] 7.1 Update deterministic local mock checkout route references from item-scoped checkout to `/store/checkout/`.
- [x] 7.2 Update Stripe UAT smoke fixtures and expected return URLs to `/store/checkout/` and `/store/checkout/return/`.
- [x] 7.3 Update README and AGENTS route notes that name deterministic checkout paths.
- [x] 7.4 Update docs that call `/store/{slug}/checkout/` the primary shopper checkout route.
- [x] 7.5 Keep item-scoped examples only when documenting compatibility or item detail pages.
- [x] 7.6 Confirm no OpenSpec baseline or active change still describes item-scoped checkout as primary after implementation.
- [x] 7.7 Update `openspec/specs/module-boundaries/module-boundaries.manifest.json` so `checkout-web` owns the new cart-scoped checkout route files.
- [x] 7.8 Update `openspec/specs/module-boundaries/spec.md` with cart-scoped checkout route ownership behavior.

## 8. Format And Variant URL Follow-Up Guardrails

- [x] 8.1 Document current one-`StoreItem`-per-format behavior near the catalog/store item projection code or relevant docs.
- [x] 8.2 Add tests or fixtures proving separate vinyl/CD sellable options remain separate `storeItemSlug`s in the current model when such content exists.
- [x] 8.3 Leave product-style variant selector implementation out of this change.
- [x] 8.4 Create a follow-up note only if implementation uncovers a concrete need for product identity separate from `storeItemSlug`.

## 9. Validation

- [x] 9.1 Run `pnpm openspec -- validate adopt-cart-scoped-checkout-routes --strict`.
- [x] 9.2 Run `pnpm test:unit`.
- [ ] 9.3 Run `pnpm check`.
- [x] 9.4 Run `pnpm build`.
- [x] 9.5 Run `pnpm audit:commerce-boundaries`.
- [x] 9.6 Run `pnpm audit:module-boundaries`.
- [x] 9.7 Run `pnpm depcruise:boundaries`.
- [x] 9.8 Run Browser Use validation for `/store/checkout/` with empty cart.
- [x] 9.9 Run Browser Use validation for add-to-cart then `/store/checkout/` with one item.
- [x] 9.10 Run Browser Use validation for multi-line cart checkout URL and summary.
- [x] 9.11 Run Browser Use validation for old item-scoped checkout compatibility route.
- [x] 9.12 If checkout return behavior changed, validate `/store/checkout/return/?session_id=<test-id>` renders the expected non-final or mocked status safely.
- [x] 9.13 Validate old item-scoped return compatibility with `session_id` using Browser Use or a static route assertion.
- [ ] 9.14 Run relevant checkout smoke script if route constants or UAT smoke files changed.

## 10. Rollout Cleanup

- [x] 10.1 Record the chosen compatibility behavior in implementation notes.
- [x] 10.2 Confirm no generated API contract changes are required beyond existing `lines[]`.
- [x] 10.3 Confirm old item-scoped route removal is deferred to a separate change after compatibility evidence exists.
- [ ] 10.4 Archive this OpenSpec change only after implementation, validation evidence, and baseline spec updates are complete.
