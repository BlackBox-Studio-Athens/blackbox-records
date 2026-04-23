# Feature Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration  
**Domain:** Sandbox implementation for the first native commerce slice  
**Researched:** 2026-04-19  
**Confidence:** HIGH

## Table Stakes

| Feature | Why it matters | Complexity | Dependencies |
|---------|----------------|------------|--------------|
| Cloudflare Worker sandbox runtime | Native checkout and webhooks need live server routes | Medium | Astro adapter, Worker config, secret bindings |
| Native `/store/` collection and product detail | Replaces the legacy external redirect for the first sellable slice | Medium | Existing distro content, Stripe catalog projection |
| Single-item embedded Checkout | Proves in-site payment without building a cart | Medium | Server-created Checkout Session, Stripe.js |
| Server-created Checkout Sessions | Prevents secret leakage and untrusted checkout mutations | Medium | Worker runtime, Stripe secret key |
| Webhook-authoritative payment success | Prevents false positives from relying on return pages | Medium | Stripe webhook endpoint, signature verification |
| Post-payment stock decrement | Matches the approved stock semantics | Medium | D1 order/stock model, idempotency |
| Greece-only BOX NOW locker step | Required v1 shipping path | Medium | Checkout route UX, locker capture |
| Sandbox verification path | The milestone ends only when the end-to-end flow is proven in sandbox | Medium | Stripe sandbox, Stripe CLI, Worker deployment |

## Differentiators

| Feature | Why it differentiates this milestone |
|---------|--------------------------------------|
| Preserve the current Astro content/app-shell architecture | Avoids rewriting parts of the site that already work |
| Keep most routes prerendered | Limits runtime cost and keeps Worker work narrow |
| Use Stripe as catalog/pricing authority | Avoids maintaining a second product admin surface |
| Keep D1 narrow | Stores only stock and order lifecycle state |
| Keep BOX NOW manual | Matches low order volume instead of overbuilding shipping ops |

## Anti-Features

| Feature to avoid | Why to avoid it now |
|------------------|---------------------|
| Production cutover | This milestone is sandbox-only and should not silently turn into launch work |
| Stock reservation logic | Explicit non-goal and unnecessary at projected volume |
| Client-trusted payment confirmation | Unsafe because return pages are not authoritative |
| Browser-side order or stock writes | Breaks the trust boundary |
| Cart / multi-item checkout | Expands scope before the single-item flow is proven |
| Non-Greece shipping paths | Conflicts with the approved Greece-only MVP |
| Automated BOX NOW shipment creation | Adds maintenance without current business need |
| Full admin dashboard | Too much surface area for the order volume |

## Thin Vertical Slice Guidance

1. Phase 5 should prove the Worker runtime, secrets, and D1 bindings without touching production traffic.
2. Phase 6 should replace the native store entry points and prove the curated catalog slice in-site.
3. Phase 7 should prove single-item embedded Checkout from a server-created session.
4. Phase 8 should prove verified webhooks, D1 order state, and post-payment stock changes.
5. Phase 9 should add the Greece-only BOX NOW gate before payment.
6. Phase 10 should prove the full sandbox path and capture the go-live handoff package.

## Sources

- [Stripe sandboxes](https://docs.stripe.com/sandboxes)
- [Stripe embedded Checkout build guide](https://docs.stripe.com/payments/checkout/build-subscriptions?payment-ui=embedded-form)
- [Stripe custom success / redirect behavior](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=embedded-form)
- [Stripe checkout fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=embedded-form)
- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/)
- [BOX NOW API manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)

---
*Research completed: 2026-04-19*
