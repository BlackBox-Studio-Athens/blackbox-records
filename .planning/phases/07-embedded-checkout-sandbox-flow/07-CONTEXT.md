# Phase 7: Worker Checkout And Stripe Sandbox Flow - Context

**Gathered:** 2026-04-20
**Status:** Planning complete

<domain>
## Phase Boundary

Phase 7 implements Worker-owned checkout APIs and connects the static frontend checkout route to a Shopify-familiar cart and Stripe sandbox checkout flow. It does not move payment authority into the browser.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Checkout HTTP endpoints remain TypeScript-only and use Hono only at the HTTP interface layer.
- **D-02:** Checkout handlers delegate to business-named application/use-case modules rather than embedding Stripe flow logic directly in route files.
- **D-03:** Checkout endpoint changes require backend-local tests plus HTTP smoke coverage.

</decisions>

<decisions>
## Implementation Decisions

- **D-01:** The Worker backend creates Checkout Sessions.
- **D-02:** The frontend checkout route consumes Worker APIs, not direct Stripe secret APIs.
- **D-03:** Embedded Checkout remains the approved shopper-facing form factor.
- **D-04:** Return and retry pages remain non-authoritative for payment truth.
- **D-05:** Webhook authority remains deferred to Phase 8, but Phase 7 must already be shaped for that backend contract.
- **D-06:** Checkout Sessions are the only approved v1 shopper payment-creation API; raw PaymentIntents or Payment Element flows stay out of scope unless a later phase explicitly re-approves them.
- **D-07:** Return and retry pages retrieve CheckoutState through a Worker-owned checkout-state endpoint; raw Stripe query params and raw Stripe IDs are not the durable frontend contract.
- **D-08:** Phase 7 APIs must already be shaped so Phase 8 can reuse one backend-owned reconciliation use case across ReadCheckoutState and verified webhook handling.
- **D-09:** On Stripe API `2026-04-22.dahlia`, embedded Checkout is represented by `ui_mode: embedded_page`; older docs may refer to this as embedded Checkout.
- **D-10:** Checkout return URLs and split-port browser API calls must be constrained by the Worker-side `CHECKOUT_RETURN_ORIGINS` allowlist and expected `/store/<slug>/checkout/` route shape; arbitrary browser `Referer` origins are not trusted.
- **D-11:** Local checkout validation has two explicit modes: `dev:stack:stripe-test` for real Stripe test keys and real test Price mappings, and `dev:stack:stripe-mock` for an in-process mock Stripe gateway plus a frontend mock checkout panel.
- **D-12:** Local mock Stripe mode is not a real embedded Checkout browser substitute. It must never be documented as a successful end-to-end payment flow.
- **D-13:** Shopper-facing store URLs must describe the item option being purchased, not legacy release shorthand. The current `barren-point` route for Afterwise's `Disintegration` Black Vinyl LP is treated as a legacy alias to fix.
- **D-14:** Phase 7 now includes a single-item cart-like experience with a cart icon, cart drawer, checkout CTA, and familiar checkout summary. This is not a true multi-item cart and does not add quantity management.
- **D-15:** The cart and checkout UI may draw inspiration from free Shopify themes such as Dawn, but implementation must use BlackBox visual language and repo-owned Astro/React/shadcn components instead of copying Shopify theme code.
- **D-16:** The cart surface is a shadcn `Sheet`: right-side desktop panel and full-height mobile panel. Bottom drawer behavior is not the default.
- **D-17:** Every current distro entry and release entry is treated as a real sellable store candidate for local mock checkout readiness.
- **D-18:** Local stripe-mock mode may seed fake development `Stock`, `OnlineStock`, `ItemAvailability`, and `price_mock_*` mappings for every current item so the local no-network buying path can be exercised.
- **D-19:** Fake local stock is not a label inventory count. Sandbox and production buyability still require staff-recorded D1 stock counts and real Stripe mappings.
- **D-20:** Real Stripe test-mode coverage for every current item is deferred; Phase 7 only requires all-items coverage in mock mode plus selected real Stripe sandbox mappings for final validation.

</decisions>

<specifics>
## Specific Ideas

- Separate item lookup, variant lookup, ReadCheckoutState, and StartCheckout concerns in the backend API.
- Keep the frontend coupled to store item slugs and `ItemAvailability`, not to Stripe IDs.
- Treat sandbox validation as an API-plus-frontend integration problem, not a frontend-only task.
- Keep real Stripe test Price IDs in ignored local seed SQL; committed mock Price IDs are allowed only for the stripe-mock path.
- Rename or alias the current local smoke item so the shopper-facing URL reads like a sellable option, for example `/store/disintegration-black-vinyl-lp/`, while preserving `/store/barren-point/` as a compatibility redirect during migration.
- Add a cart icon/count, single-line cart drawer, item summary, subtotal/checkout action, and checkout page order summary before return/retry UI work.
- Add an all-current-items local mock readiness path so every current release and distro item has local D1 mapping, fake local stock, and mock Stripe mapping coverage.
- Keep real quantities unknown until staff record `StockCount` or `StockChange` entries through the protected stock workflow.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/phases/05.1-commerce-domain-architecture-and-source-of-truth-research/05.1-RESEARCH.md`
- `.planning/phases/06-native-storefront-slice/06-CONTEXT.md`
- `.planning/phases/06.1-local-commerce-state-foundation/06.1-CONTEXT.md`
- `.planning/phases/07-embedded-checkout-sandbox-flow/07-SHOPIFY-CHECKOUT-RESEARCH.md`
- `.planning/phases/07-embedded-checkout-sandbox-flow/07-CART-CHECKOUT-DESIGN-SPIKE.md`
- `.planning/phases/07-embedded-checkout-sandbox-flow/07-UI-SPEC.md`

</canonical_refs>

---

*Phase: 07-embedded-checkout-sandbox-flow*
*Context gathered: 2026-04-20*

