# Phase 7 Research - Worker Checkout And Stripe Sandbox Flow

## Standard Stack

- Worker backend owns Checkout Session creation
- static frontend mounts embedded Checkout using Worker-provided session data
- static frontend return/retry states retrieve CheckoutState through Worker-owned APIs
- Stripe sandbox and webhook tooling validate the checkout loop

## Architecture Patterns

- browser -> Worker backend -> Stripe
- browser never calls secret Stripe APIs directly
- frontend return/retry pages remain informative only
- frontend contracts should not depend on raw Stripe query params or Stripe identifiers

## Don't Hand-Roll

- Do not let the browser construct Checkout Sessions.
- Do not introduce raw PaymentIntents or Payment Element flows while embedded Checkout satisfies the approved v1 UX.
- Do not use frontend-only pricing authority.
- Do not treat return pages as payment truth.

## Common Pitfalls

- leaking Stripe IDs directly into frontend routing contracts
- letting the browser invent its own checkout-status truth from raw Stripe query params
- coupling checkout initialization to a temporary fixture model
- mixing webhook authority into the Phase 7 browser flow

## Code Examples

- backend item/variant lookup endpoint
- backend ReadCheckoutState endpoint
- backend StartCheckout endpoint
- frontend checkout page fetching session state from backend

## Shopify-Familiar UX Research Addendum

See `07-SHOPIFY-CHECKOUT-RESEARCH.md` for the UI research pass.

Key conclusions:

- Use free Shopify theme patterns as familiarity references, especially Dawn's cart drawer, line item, subtotal, continue shopping, and checkout CTA structure.
- Do not copy Shopify theme code, Liquid, CSS, or visual assets.
- Keep the BlackBox implementation Astro/React/shadcn-native.
- Keep shopper-facing item option URLs canonical before cart work; `/store/disintegration-black-vinyl-lp/` is the canonical smoke item and `/store/barren-point/` is compatibility-only.
- Add a single-item cart icon and drawer for familiarity while keeping true multi-item cart behavior out of scope.
- Keep checkout simple, high-contrast, and low-distraction; Stripe embedded Checkout owns payment internals.

## All-Items Local Mock Readiness Addendum

The current site items are real sellable items across both distro and releases, but real quantities are not yet counted.

Key conclusions:

- Treat every current distro JSON entry and release Markdown entry as a sellable store candidate for local mock checkout readiness.
- Use fake development stock only in local stripe-mock mode so every current item can exercise the local buy path.
- Do not treat fake local stock as a label inventory count, sandbox stock count, or production stock count.
- Keep real Stripe test Price IDs out of git; local mock mode can use committed `price_mock_*` mappings for every current variant.
- Real Stripe test-mode all-items coverage is deferred. Final Phase 7 validation may use selected real sandbox Price mappings while mock mode proves all-items route and API readiness.

---
*Research completed: 2026-04-20; Shopify UX addendum added: 2026-04-24; all-items mock readiness addendum added: 2026-04-25*

