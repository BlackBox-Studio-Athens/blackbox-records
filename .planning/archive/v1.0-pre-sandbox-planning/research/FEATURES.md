# Feature Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration
**Domain:** Minimal native commerce for an existing Astro storefront
**Researched:** 2026-04-06
**Confidence:** HIGH

## Table Stakes

| Feature | Why it matters | Complexity | Dependencies |
|---------|----------------|------------|--------------|
| Native product browsing | Replaces the current external shop redirect with an in-site storefront experience | Medium | Runtime decision, Stripe catalog read path |
| Embedded checkout | Keeps payment inside the site without building custom PCI-sensitive forms | Medium | Stripe Checkout Sessions, server routes |
| Server-created checkout sessions | Prevents secret leakage and untrusted cart/payment mutations | Medium | Runtime, secret management |
| Webhook-authoritative payment success | Prevents false positives from relying on client return pages | Medium | Stripe webhook endpoint, idempotency design |
| Post-payment inventory decrement | Matches the requested stock semantics and avoids premature stock loss | Medium | Supabase order/inventory schema, webhook flow |
| BOX NOW locker selection for Greece | Required shipping behavior for Greek orders | Medium | Checkout/order UX, locker metadata capture |
| Operator reconciliation path | Low-volume commerce still needs a clear way to inspect paid orders and stock changes | Low | Stripe/Supabase data model |
| Cutover and rollback plan | Brownfield migrations fail when launch is treated as a one-way switch | Medium | Runtime, roadmap, readiness checklist |

## Differentiators

| Feature | Why it differentiates this plan |
|---------|---------------------------------|
| Preserve the current Astro content/app-shell architecture | Avoids rewriting parts of the site that are already working |
| Keep most routes prerendered | Limits runtime cost and maintenance footprint |
| Use Stripe as catalog/pricing authority | Avoids maintaining a second product admin surface |
| Keep Supabase narrow | Reduces future lock-in and keeps data ownership clear |
| Thin BOX NOW integration | Matches low order volume instead of overbuilding shipping ops |

## Anti-Features

| Feature to avoid | Why to avoid it now |
|------------------|---------------------|
| Inventory reservation logic | Explicit non-goal for v1 and a common source of extra state complexity |
| Client-trusted payment confirmation | Unsafe because return pages and client redirects are not authoritative |
| Browser-side inventory/order writes | Expands blast radius of client bugs or malicious requests |
| Recreating product/pricing management in Decap or Astro collections | Duplicates Stripe and increases maintenance |
| Full OMS/admin dashboard | Too much surface area for the current order volume |
| Multi-carrier abstraction | Premature before the BOX NOW flow is proven |

## Thin Vertical Slice Guidance

1. First vertical slice should prove runtime viability and secret boundaries before trying to sell anything.
2. Second slice should prove one native product path plus embedded checkout session creation.
3. Third slice should prove webhook-authoritative paid-order and inventory updates.
4. Fourth slice should add BOX NOW locker capture and low-volume fulfillment readiness.
5. Final slices should cover cutover, rollback, and launch criteria rather than jumping straight to feature breadth.

## Open Questions To Resolve In Planning

- Which hosting/runtime option gives the best portability-to-cost ratio for this repo?
- How much BOX NOW automation is necessary in v1 versus a manual partner-portal workflow?
- Whether the native catalog should start with a reduced SKU subset before broader cutover
- Which Stripe API version will be pinned for embedded Checkout terminology and request shape stability

## Sources

- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe embedded Checkout guide](https://docs.stripe.com/payments/accept-a-payment?payment-ui=checkout&ui=embedded-form)
- [Stripe handling payment events](https://docs.stripe.com/payments/handling-payment-events)
- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [BOX NOW API Manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)

---
*Research completed: 2026-04-06*
