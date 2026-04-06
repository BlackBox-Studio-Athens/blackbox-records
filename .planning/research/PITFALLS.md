# Pitfalls Research: BlackBox Records Native Commerce Migration

**Project:** BlackBox Records Native Commerce Migration
**Domain:** Brownfield Astro storefront adding low-volume native commerce
**Researched:** 2026-04-06
**Confidence:** HIGH

## Pitfalls

### 1. Treating the current static host as if it can safely grow live commerce routes

- Warning signs: planning assumes GitHub Pages can keep hosting checkout-session creation or webhook endpoints; runtime/adapter decision is postponed
- Prevention strategy: make hosting/runtime the first phase and require explicit human approval before any implementation planning continues
- Phase: Phase 1

### 2. Trusting browser return pages instead of Stripe webhooks for paid state

- Warning signs: success page logic decides that payment succeeded; inventory/order state changes happen from client-side code
- Prevention strategy: require webhook-authoritative status transitions and make return pages read status only
- Phase: Phase 3

### 3. Leaking privileged writes to the browser

- Warning signs: browser can write order or inventory rows directly; Supabase service-role logic is reused on the client; “quick” inventory updates bypass the server
- Prevention strategy: keep all authoritative writes in server-owned routes and explicitly document the trust boundary in ADRs
- Phase: Phases 1 and 3

### 4. Building reservation logic too early

- Warning signs: planning introduces hold timers, stock reservations, or cart expiry workflows despite the v1 non-goal
- Prevention strategy: keep v1 semantics simple: no reservation, decrement only after webhook-confirmed payment, and document oversell risk review as a future decision
- Phase: Phase 3

### 5. Duplicating the catalog between Stripe and Astro content

- Warning signs: sellable prices or product metadata are copied into Astro content files “just for now”; Stripe is no longer the single pricing authority
- Prevention strategy: define a single catalog authority in the architecture ADR and treat Astro content as editorial only
- Phase: Phases 1 and 2

### 6. Overbuilding shipping operations for low order volume

- Warning signs: roadmap jumps straight to automated multi-step fulfillment flows, admin dashboards, or multi-carrier abstractions
- Prevention strategy: keep BOX NOW work focused on locker selection plus the minimum operator-ready order metadata for v1
- Phase: Phase 4

### 7. Ignoring API-version and terminology drift in Stripe embedded Checkout docs

- Warning signs: plan mixes `embedded`, `embedded_page`, and older guide examples without deciding what API version/request shape to target
- Prevention strategy: pin Stripe API/versioning expectations in Phase 1 ADR work and validate examples against the current API reference before implementation
- Phase: Phase 1

### 8. Launching without a reversible cutover

- Warning signs: `/shop/` replacement is treated as a single irreversible deploy; no fallback path remains to the current external store
- Prevention strategy: require phased cutover, reconciliation checks, and rollback criteria before replacing the live external handoff
- Phase: Phases 5 and 6

## Roadmap Implications

- Runtime and secret-boundary ADRs are mandatory before feature planning gets specific.
- The first implementation slice should stop before inventory mutation.
- Webhook idempotency and reconciliation need to be planned before shipping or launch phases.
- BOX NOW integration should be scoped to selection + persisted metadata first.
- Launch readiness must include rollback to the current external-store path.

## Sources

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create)
- [Stripe embedded Checkout guide](https://docs.stripe.com/payments/accept-a-payment?payment-ui=checkout&ui=embedded-form)
- [Stripe handling payment events](https://docs.stripe.com/payments/handling-payment-events)
- [BOX NOW API Manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf)

---
*Research completed: 2026-04-06*
