# Architecture Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration
**Domain:** Brownfield Astro storefront with native commerce added
**Researched:** 2026-04-06
**Confidence:** HIGH

## Recommended Architecture

Keep the current Astro storefront as the presentation shell and introduce a small server-owned commerce boundary inside the same codebase. Most public editorial routes should stay prerendered. Only the commerce-specific pages and API endpoints should opt out of prerendering and run on demand behind an Astro adapter-backed runtime.

Stripe should own product, price, checkout-session, and payment-event truth. Supabase should own only inventory and order lifecycle state that the storefront needs to query or reconcile. BOX NOW should initially contribute locker selection metadata and low-volume fulfillment affordances, not a full shipping orchestration subsystem.

## Major Components

1. **Astro storefront shell**
   - Responsibilities: marketing/content pages, app-shell navigation, product discovery UI, success/cancel pages, account-free order status messaging
   - Existing assets: `src/pages/**`, `src/layouts/SiteLayout.astro`, `src/components/app-shell/**`, `src/content/**`

2. **Server-owned commerce routes**
   - Responsibilities: create Checkout Sessions, validate webhooks, read Stripe catalog data for sellable views, expose only safe projections to the browser
   - Future runtime: Astro adapter-backed server routes with `prerender = false`

3. **Stripe boundary**
   - Responsibilities: authoritative products/prices, checkout configuration, payment lifecycle events
   - Key rule: browser never uses secret-key operations

4. **Supabase order/inventory boundary**
   - Responsibilities: order lifecycle state, inventory levels, idempotent webhook side effects, reconciliation support
   - Key rule: browser never receives write capability for authoritative stock/order mutations

5. **BOX NOW shipping boundary**
   - Responsibilities: locker selection capture for Greek shipments, persisted locker `locationId`, and fulfillment-ready order metadata
   - Key rule: keep v1 thin and low-maintenance

## Target Data Flow

### Product browse flow

1. Storefront page requests sellable catalog projection.
2. Server-owned commerce read path resolves Stripe Products/Prices into a storefront-safe view model.
3. Astro page renders product data without creating a second pricing authority in content files.

### Checkout flow

1. Shopper chooses a product and shipping path.
2. Browser posts a minimal request to a server-owned route.
3. Server validates allowed inputs, resolves current Stripe price IDs, and creates a Checkout Session.
4. Storefront renders embedded Checkout using the returned session/client context.

### Payment and order flow

1. Shopper completes payment in Stripe Checkout.
2. Stripe emits webhook events to a server-owned webhook endpoint.
3. Server verifies the webhook signature, resolves the order context, marks the order paid, and decrements inventory.
4. Browser-facing return page reads already-authoritative status; it does not decide payment success.

### Shipping flow

1. Shopper selects a BOX NOW locker for eligible Greek orders.
2. Locker `locationId` and display metadata become part of the trusted order context.
3. After payment confirmation, operator can fulfill through a thin BOX NOW path with the selected locker info available.

## Build Order Implications

### Phase 1 comes first because:

- Runtime and secret boundaries determine every later integration choice.
- Checkout creation and webhooks cannot be built safely until the host/runtime path exists.
- The team needs a migration and rollback strategy before replacing `/shop/`.

### Phase 2 follows because:

- Catalog display and embedded checkout session creation can prove the new runtime without yet mutating stock.
- It creates the smallest meaningful end-to-end storefront slice.

### Phase 3 must precede shipping cutover because:

- Paid-order authority and inventory semantics are the highest-risk business rules.
- Shipping and launch should sit on top of a proven post-payment state model.

### Phase 4 stays thin because:

- Low order volume favors a simple fulfillment path over early automation.
- BOX NOW selection is required, but full shipping automation is not.

## Recommended Boundary Rules

- Keep Stripe API versioning explicit in Phase 1 ADR work because current docs show naming drift between guide prose and API reference for embedded Checkout.
- Do not let Astro content collections become the sellable catalog source once native commerce is live.
- Keep client code read-only for authoritative order/inventory state.
- Add idempotency rules to webhook-driven mutations before launch planning.

## Sources

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe handling payment events](https://docs.stripe.com/payments/handling-payment-events)
- [BOX NOW API Manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)

---
*Research completed: 2026-04-06*
