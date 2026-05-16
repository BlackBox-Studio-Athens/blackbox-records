# Phase 9 Validation

## 09-01 Lock BOX NOW Shipping Data And Secret Contracts

- Result: passed.
- Evidence: Phase 9 now has explicit context and BOX NOW contract docs.
- Evidence: The approved v1 locker snapshot is locked to `locker_id`, `country_code`, and `locker_name_or_label`.
- Evidence: Greece-only scope is explicit and `country_code` is fixed to `GR` for v1.
- Evidence: Payment is documented as fail-closed until a valid Greek locker is selected.
- Evidence: BOX NOW credentials are documented as Worker runtime secrets or out-of-band operator credentials, never Astro `PUBLIC_*` env.
- Evidence: Manual BOX NOW partner-portal fulfillment remains the v1 operational model.
- No locker UI, API calls, D1 migration, generated client, checkout behavior, Stripe configuration, BOX NOW credentials, or fulfillment automation changed.
- Validation: `rg` contract check; `git diff --check`; `pnpm check`.

## Required Checks

- `rg -n "locker_id|country_code|locker_name_or_label|Greece only|Worker runtime secret|manual" README.md AGENTS.md .planning/phases/09-greece-only-box-now-shipping .planning/STATE.md .planning/ROADMAP.md`
- `git diff --check`
- `pnpm check`

## 09-02 Add Greece-Only Locker Selection UI Before Checkout

- Result: passed.
- Evidence: Checkout now renders a shipping-first BOX NOW gate before the payment action.
- Evidence: Local mock checkout mode selects the BOX NOW FAQ test locker with `locker_id = 4`, `country_code = GR`, and `locker_name_or_label = ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234` held only in browser component state.
- Evidence: Non-mock checkout mode fails closed with the approved “Locker selection unavailable” copy until the real BOX NOW picker integration exists.
- Evidence: `StartCheckout` request payload remains unchanged and still sends only `storeItemSlug` and `variantId`.
- Evidence: Tests cover missing locker, non-Greece locker rejection, valid Greek locker enablement, non-mock fail-closed behavior, and no BOX NOW credentials in browser-rendered markup.
- Evidence: Browser Use against `pnpm dev:stack:stripe-mock` on `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/` verified payment is blocked before locker selection, the local Greek locker unlocks payment, the mock checkout panel mounts, and `Change Locker` returns to the shipping gate and hides the mounted checkout.
- Note: the Browser Use dev log buffer retained two first-load Astro hydration errors from the initial Vite dependency optimization reload; the successful interaction pass produced no new checkout UI errors.
- No BOX NOW API calls, backend checkout preflight, D1 migration, OpenAPI/generated client change, order persistence, Stripe account values, or fulfillment automation changed.
- Validation: targeted web tests; `git diff --check`; `pnpm test:unit`; `pnpm check`; `pnpm build`.

Manual UI validation:

- Result: passed with the Vite first-load caveat above.
- Command: `pnpm dev:stack:stripe-mock`.
- Browser Use route: `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/`.
- Verified: payment blocked before locker selection; local Greek locker selection unlocks payment; mock checkout panel mounts; `Change Locker` returns to shipping and destroys/hides the mounted checkout.

## 09-03 Add Backend Checkout Preflight For Greece-Only Locker Selection

- Result: passed.
- Evidence: Public `StartCheckout` now requires `shippingLocker` with `locker_id`, `country_code = GR`, and `locker_name_or_label` before the Worker creates a Stripe Checkout Session.
- Evidence: Backend validation rejects missing locker data, blank locker fields, and non-Greece lockers before calling the Stripe gateway.
- Evidence: Frontend checkout start sends only `storeItemSlug`, `variantId`, and the minimal selected locker snapshot.
- Evidence: The checkout gateway request remains unchanged and does not receive BOX NOW data, credentials, raw payloads, stock counts, or order state.
- Evidence: OpenAPI and generated public API client artifacts include the required `shippingLocker` request object.
- Evidence: Browser Use against `pnpm dev:stack:stripe-mock` on `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/` verified payment is blocked before locker selection, the approved local Greek test locker unlocks payment, the mock checkout panel mounts, `Change Locker` returns to the shipping gate, and the console stays clean.
- No paid-order shipping persistence, D1 migration, BOX NOW partner API call, fulfillment automation, stock behavior, Stripe account value, or webhook behavior changed.
- Validation: `pnpm generate:api`; targeted backend/web tests; `git diff --check`; `pnpm test:unit`; `pnpm check`; `pnpm build`; Browser Use local mock smoke.

## 09-04 Persist The Thin Locker Snapshot On Checkout And Order State

- Result: passed.
- Evidence: `CheckoutOrder` now has nullable D1/Prisma fields for the approved thin BOX NOW locker snapshot: `shippingLockerId`, `shippingLockerCountryCode`, and `shippingLockerNameOrLabel`.
- Evidence: Worker-owned `StartCheckout` validates the shopper-provided `shippingLocker`, normalizes it to a `ShippingLockerSnapshot`, and persists it when creating the pending checkout order.
- Evidence: Protected internal order readback now returns `shippingLocker` as the approved nested snapshot or `null` for older rows.
- Evidence: The public `ReadCheckoutState` response remains unchanged; shopper-facing selected-locker display is deferred to `09-05`.
- Evidence: Generated Prisma and internal OpenAPI/API-client artifacts were regenerated.
- Evidence: Local D1 migration `0004_add_checkout_order_shipping_locker_snapshot.sql` applied successfully, and `PRAGMA table_info('CheckoutOrder')` confirmed all three nullable columns.
- No BOX NOW API calls, credentials, raw payload persistence, coordinates, postal codes, voucher IDs, labels, tracking data, fulfillment automation, stock behavior, webhook behavior, real Stripe account value, or production cutover changed.
- Validation: `pnpm --filter @blackbox/backend prisma:generate`; `pnpm generate:api`; `pnpm --filter @blackbox/backend d1:migrations:apply:local`; `PRAGMA table_info('CheckoutOrder')`; targeted backend tests; `pnpm --filter @blackbox/backend test`; `pnpm --filter @blackbox/backend check`.

## 09-05 Surface Selected Locker State In Checkout Return And Order Recap

- Result: passed.
- Evidence: Public `ReadCheckoutState` now returns `shippingLocker` as the Worker-owned thin BOX NOW snapshot or `null`.
- Evidence: `readCheckoutState` reads the persisted checkout order by checkout session id and does not infer locker data from browser state or query parameters.
- Evidence: Checkout return UI now shows the selected BOX NOW locker label and locker id when Worker state has the snapshot.
- Evidence: Checkout return UI shows support-oriented needs-review copy when payment state loads but the persisted locker snapshot is missing.
- Evidence: Generated public OpenAPI/API-client artifacts were regenerated for the nullable `shippingLocker` response field.
- Browser Use note: Browser Use was attempted first, but Windows security blocked the in-app browser client file `browser-client.mjs` as potentially unwanted software, so DevTools MCP was used as the documented fallback.
- Fallback smoke evidence: `pnpm dev:stack:stripe-mock` created a local mock checkout with `checkoutSessionId = cs_test_Qc8qnErOUWF1djL`; the return page displayed `ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234` and `Locker ID 4 · Greece-only BOX NOW`.
- Fallback smoke evidence: an older local checkout row with no locker snapshot displayed `Locker Needs Review` and support copy, and the browser console had no warnings or errors.
- No BOX NOW API calls, tracking, fulfillment status, fulfillment automation, checkout-start payload change, D1 migration, webhook behavior, stock behavior, real Stripe account value, or production cutover changed.
- Validation: `pnpm generate:api`; targeted backend/web tests; `git diff --check`; `pnpm test:unit`; `pnpm check`; `pnpm build`; DevTools MCP local mock smoke after Browser Use fallback.

## 09-06 Document Manual BOX NOW Fulfillment And Sandbox Validation

- Result: complete for the current manual v1 BOX NOW scope.
- Evidence: `09-MANUAL-FULFILLMENT.md` now defines the manual-address baseline and the mandatory `boxnow-js` boundary for any future automation.
- Evidence: The documented operator source of truth remains Worker-owned order state and the chosen shipping-mode data, not browser state, screenshots, query parameters, or raw BOX NOW payloads.
- Evidence: The current local validation path still covers the locker-first prototype branch using `pnpm dev:stack:stripe-mock`, the BOX NOW FAQ test locker, a signed local paid webhook fixture, internal order readback, and checkout return recap.
- Evidence: `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` passed with `29/29` store items ready.
- Browser Use fallback: Browser Use was attempted first, but the installed Browser Use plugin path was missing `scripts/browser-client.mjs`, so DevTools MCP was used as the documented fallback.
- Local UI evidence: DevTools MCP opened `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/`, confirmed payment was blocked before locker selection, selected the BOX NOW test locker, and reached the local mock checkout panel.
- Local request evidence: `StartCheckout` sent only `shippingLocker`, `storeItemSlug`, and `variantId`; the `shippingLocker` snapshot was `locker_id = 4`, `country_code = GR`, and `locker_name_or_label = ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234`.
- Local order evidence: D1 persisted `checkoutSessionId = cs_test_QcU0uf6k4GvBInZ` as `pending_payment` with the same locker snapshot.
- Local webhook evidence: `$env:STRIPE_WEBHOOK_CHECKOUT_SESSION_ID = "cs_test_QcU0uf6k4GvBInZ"; pnpm stripe:webhook:simulate:local checkout.session.completed` returned `HTTP 200` with `{ "received": true }`.
- Local paid-order evidence: protected internal order readback returned `status = paid`, `paidAt = 2026-05-01T00:21:46.982Z`, and the same persisted BOX NOW locker snapshot.
- Local idempotency evidence: replaying the signed paid fixture returned `HTTP 200`, `StockChange` remained at one `checkout_paid` row for `cs_test_QcU0uf6k4GvBInZ`, and stock for `variant_barren-point_standard` remained `98/98`.
- Return recap evidence: the return route displayed `ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234` and `Locker ID 4 · Greece-only BOX NOW`; payment state still displayed `open` because official `stripe-mock` is stateless and does not make session retrieval reflect the signed local webhook fixture.
- Console evidence: no warnings or errors were recorded beyond expected Vite/Astro debug logs and React DevTools info messages.
- Evidence: The locker-first prototype still keeps BOX NOW-specific persistence capped at `locker_id`, `country_code`, and `locker_name_or_label`.
- Closure decision: plan `09-07` chooses manual-address fulfillment as the current BOX NOW path. `09-06`, Phase 9, and
  `SHIP-01` through `SHIP-03` are now closed for the current manual v1 scope. Full BOX NOW portal/API integration is
  reopen-only future work after access exists.
- No BOX NOW API calls, partner credentials, label/voucher persistence, D1 schema changes, frontend behavior changes, generated API client changes, Stripe changes, or production cutover changed.
- Validation: targeted simulator/webhook tests; `pnpm --filter @blackbox/backend d1:check:stripe-mock:local`; local DevTools MCP fallback smoke; `git diff --check`; `pnpm test:unit`; `pnpm check`; `pnpm build`.

## Explicit Non-Goals

- No BOX NOW API integration.
- No non-Greece shipping.
- No automated delivery request, voucher, label, or tracking creation.
- No BOX NOW fulfillment, tracking page, or deployment change.
- No real Stripe validation or production cutover.

## 09-07 Choose Manual-Address BOX NOW Fulfillment And Refactor Checkout

- Result: complete for the current manual v1 BOX NOW scope.
- Evidence: `StartCheckout` no longer requires or accepts `shippingLocker` in the public request schema.
- Evidence: Checkout-core no longer runs the BOX NOW locker-selection validator before creating a Stripe Checkout Session.
- Evidence: New pending checkout orders are created with `shippingLocker: null`; legacy nullable locker readback remains available for old/prototype rows.
- Evidence: Stripe Checkout Session creation now enables `shipping_address_collection.allowed_countries = ['GR']` and `phone_number_collection.enabled = true`.
- Evidence: The checkout shipping step now renders manual BOX NOW fulfillment copy and no locker picker/test-locker control.
- Evidence: Generated public OpenAPI/API-client artifacts were regenerated after removing the start-checkout `shippingLocker` input.
- Closure decision: no BOX NOW partner/sandbox portal evidence is required to keep the current manual path closed. Reopen
  only if the user explicitly asks for full BOX NOW integration after access exists.
- No BOX NOW API calls, BOX NOW credentials, voucher/label/tracking persistence, custom Astro address form, D1 address schema, migration rewrite, or production cutover changed.
- Validation: `pnpm generate:api`; targeted code search for removed locker-gate contracts; `pnpm test:unit`; `pnpm check`; `pnpm build`.
