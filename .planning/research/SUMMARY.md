# Project Research Summary

**Project:** BlackBox Records Native Commerce Migration  
**Domain:** Sandbox-native commerce implementation for an existing Astro storefront  
**Researched:** 2026-04-19  
**Confidence:** HIGH

## Executive Summary

BlackBox Records already has the public storefront, shell routing, and content pipeline in place. The current milestone should therefore avoid architectural drift and focus on implementing the pre-approved commerce slice on Cloudflare Workers + D1 in Stripe sandbox, without touching live production checkout.

The implementation stack is now settled. Astro keeps the storefront. Cloudflare Workers hosts the live server routes. D1 stores only inventory and order lifecycle state. Stripe owns product, price, checkout, and payment authority. BOX NOW remains a Greece-only, pre-payment locker selection step with manual partner-portal fulfillment.

The main risks are still boundary mistakes, not design mistakes: using stale Stripe embedded Checkout terminology, letting browser code mutate authoritative state, overloading the Worker runtime with unnecessary dynamic rendering, or letting sandbox work bleed into production launch work. The roadmap should therefore move from runtime and secret plumbing into the storefront slice, checkout flow, webhook-backed state, shipping gate, and finally sandbox verification evidence.

## Key Findings

### Recommended Stack

- Astro 5 + current React app shell remain the storefront shell.
- The native commerce runtime should use the official Cloudflare adapter and on-demand routes with `prerender = false`.
- Cloudflare Workers Free + D1 Free are currently sufficient for the projected low-volume sandbox load.
- Stripe embedded Checkout should use `ui_mode: embedded`, `return_url`, and optional `redirect_on_completion: if_required`.
- Stripe sandboxes plus the Stripe CLI are the official validation path for the checkout/webhook loop.

### Feature Table Stakes

- Native `/store/` collection and product detail pages for a curated distro subset
- Single-item `Buy Now` flow only
- Dedicated checkout route with embedded Checkout
- Webhook-authoritative D1 orders and post-payment stock decrement
- Greece-only BOX NOW locker selection before payment
- End-to-end sandbox validation before the go-live milestone begins

### Architecture Approach

Use the current Astro routes as the canonical UI surface and introduce a narrow server boundary:
1. Worker-backed server routes create Checkout Sessions and verify webhooks.
2. D1 stores only minimal order and inventory state.
3. Stripe remains the authority for product, price, and payment state.
4. BOX NOW contributes only the pre-payment locker choice and thin paid-order metadata.

### Watch Out For

1. **Stale Stripe terminology**: current docs use `ui_mode: embedded`, not `embedded_page`.
2. **Client overreach**: the browser must not write authoritative D1 state.
3. **Worker runtime limits**: keep request handlers thin and avoid unnecessary full-page SSR.
4. **Over-scoping shipping**: non-Greece shipping and automation remain out of scope.
5. **Sandbox-to-production drift**: keep production cutover in the next milestone, not this one.

## Implications for Roadmap

### Phase 5: Cloudflare Runtime And Secret Plumbing
**Why first:** all later work depends on a deployable sandbox runtime and server-only bindings.

### Phase 6: Native Storefront Slice
**Why second:** prove the curated in-site store flow before wiring payment.

### Phase 7: Embedded Checkout Sandbox Flow
**Why third:** prove server-created Checkout Sessions and embedded Checkout on the dedicated route.

### Phase 8: Webhook Orders And Inventory
**Why fourth:** payment truth and stock mutation remain the highest-risk operational boundary.

### Phase 9: Greece-Only BOX NOW Shipping
**Why fifth:** shipping stays thin and should layer onto the proven checkout/order path.

### Phase 10: Sandbox Verification And Release Gate
**Why last:** the milestone is complete only when the full sandbox flow is proven and handed off cleanly to go-live planning.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on current official Astro, Cloudflare, and Stripe docs plus the repo baseline |
| Features | HIGH | Directly grounded in the approved pre-sandbox milestone outputs |
| Architecture | HIGH | Clear ownership boundaries are already decided and fit the runtime |
| Pitfalls | HIGH | The main failure modes are common and directly relevant to this repo |

**Overall confidence:** HIGH

## Sources

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)
- [Stripe sandboxes](https://docs.stripe.com/sandboxes)
- [Stripe CLI](https://docs.stripe.com/stripe-cli/use-cli)
- [Stripe embedded Checkout build guide](https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=embedded-form)
- [Stripe custom success / redirect behavior](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form)
- [Stripe checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=embedded-form)

---
*Research completed: 2026-04-19*  
*Ready for roadmap: yes*
