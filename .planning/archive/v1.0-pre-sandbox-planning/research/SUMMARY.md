# Project Research Summary

**Project:** BlackBox Records Native Commerce Migration
**Domain:** Brownfield Astro storefront adding low-volume native commerce
**Researched:** 2026-04-06
**Confidence:** HIGH

## Executive Summary

BlackBox Records already has the hard part of the public storefront in place: Astro pages, app-shell navigation, and content/Decap workflows. The migration work should therefore avoid rewriting the site and instead add a narrow server-owned commerce layer that can replace the current Fourthwall redirect safely.

The recommended approach is to keep Astro as the storefront shell, add an adapter-backed runtime for the commerce routes, use Stripe as the authoritative source for products, prices, checkout sessions, and payment events, and keep Supabase limited to inventory and order lifecycle state. BOX NOW should stay thin in v1: capture locker selection and persist the locker `locationId`, but avoid overbuilding fulfillment automation before order volume justifies it.

The biggest risks are architectural, not UI: leaving the deployment model unresolved, trusting browser return pages for payment state, duplicating catalog ownership across systems, and expanding inventory/shipping logic too early. The roadmap should therefore front-load runtime/ADR work, then move through small slices: native catalog + checkout, webhook-authoritative order state, BOX NOW locker selection, cutover, and launch readiness.

## Key Findings

### Recommended Stack

Use the existing Astro 5 storefront and add a server adapter only for routes that must execute on demand. Stripe Checkout embedded page mode remains the lowest-maintenance payment UX, and Stripe Products/Prices should become the only sellable catalog authority. Supabase should stay narrowly scoped to inventory and order lifecycle state with server-only writes.

**Core technologies:**
- Astro 5 + current app shell: storefront shell and content architecture — preserves working brownfield behavior
- Adapter-backed Astro runtime with a Node-oriented target: checkout/webhook host — best portability fit
- Stripe Products / Prices / Checkout / Webhooks: catalog, pricing, payment, authoritative paid state — smallest trusted commerce surface
- Supabase: inventory and order state only — keeps the database role narrow
- BOX NOW widget/custom locker flow: Greek locker selection — enough for low-volume fulfillment readiness

### Expected Features

**Must have (table stakes):**
- Native in-site product browsing from Stripe-backed catalog data
- Embedded checkout with server-created Checkout Sessions
- Webhook-authoritative payment success and post-payment inventory decrement
- BOX NOW locker selection for Greek shipments
- Cutover and rollback controls before replacing the current external store handoff

**Should have (competitive):**
- Preserve the current Astro content/app-shell experience instead of rebuilding it
- Keep most routes static/prerendered for lower runtime cost
- Low-maintenance operator reconciliation path for orders and stock

**Defer (v2+):**
- Reservation logic before payment
- Automated BOX NOW shipment creation
- Full operator dashboard / OMS
- Multi-carrier abstraction

### Architecture Approach

The recommended architecture is a single-storefront Astro app with a small server-owned commerce boundary. Most editorial pages remain prerendered. A limited set of server routes handles checkout-session creation, webhook receipt, trusted catalog reads, and order/inventory side effects. Stripe owns payment and pricing truth; Supabase owns inventory and order lifecycle truth; BOX NOW contributes shipping locker metadata.

**Major components:**
1. Astro storefront shell — public browsing, content, product discovery, success/cancel states
2. Server-owned commerce routes — Checkout Session creation, webhook handling, trusted reads/writes
3. Stripe + Supabase + BOX NOW boundaries — each with tightly scoped ownership

### Critical Pitfalls

1. **Leaving the runtime decision for later** — decide host/adapter first so every later plan rests on something deployable
2. **Trusting the client for payment success** — use Stripe webhooks as the only authority for paid state
3. **Letting the browser mutate inventory/orders** — keep authoritative writes server-only
4. **Overbuilding reservations or shipping automation** — stay thin and low-maintenance in v1
5. **Launching without rollback** — keep a reversible cutover path from the current Fourthwall model

## Implications for Roadmap

### Phase 1: Runtime And Guardrails
**Rationale:** Every later choice depends on the deployable server model and trust boundaries.
**Delivers:** Hosting/runtime ADRs, secret boundaries, Stripe API/version policy, cutover guardrails.
**Addresses:** DEPL-01, DEPL-02, CATA-03, SECU-01.
**Avoids:** Static-host assumptions and terminology drift.

### Phase 2: Native Catalog + Embedded Checkout Slice
**Rationale:** Proves that native product browsing and embedded checkout can work before inventory mutation.
**Delivers:** First thin slice from browse to server-created Checkout Session.
**Uses:** Stripe Products/Prices and embedded Checkout page mode.
**Implements:** Catalog and checkout boundaries.

### Phase 3: Paid Order + Inventory Authority
**Rationale:** Business risk concentrates around payment truth and stock changes.
**Delivers:** Webhook-authoritative order payment state and post-payment inventory decrement rules.
**Avoids:** Client-trusted success logic and premature reservation complexity.

### Phase 4: Greek Shipping Slice
**Rationale:** BOX NOW locker selection is a required business flow but should stay thin.
**Delivers:** Locker selection capture, persisted order metadata, and low-volume fulfillment path.
**Implements:** Shipping boundary without heavy ops tooling.

### Phase 5: Cutover Planning
**Rationale:** Brownfield migrations need reversible rollout, not a flag day.
**Delivers:** Catalog rollout scope, parallel-run plan, fallback to current shop path.
**Uses:** Earlier phases’ proven slices.

### Phase 6: Launch Readiness
**Rationale:** Final approval needs checklists, rollback criteria, and human review points.
**Delivers:** Go-live checklist, reconciliation criteria, and stop/go decision package.

### Phase Ordering Rationale

- Runtime and security decisions are prerequisites for every implementable slice.
- Payment/inventory authority must be proven before shipping or launch phases.
- Shipping can remain narrow because low volume makes manual support acceptable.
- Cutover and launch planning come last so they are based on concrete earlier slices, not speculation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Host/runtime choice, Stripe API/version pinning, secret and rollback policy
- **Phase 4:** Exact BOX NOW widget/custom integration details and how much automation is worth doing in v1

Phases with standard patterns:
- **Phase 2:** Embedded checkout session creation
- **Phase 3:** Webhook-authoritative order/inventory flow

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on official Astro and Stripe docs plus the existing repo shape |
| Features | HIGH | Strongly grounded in the user’s requested scope and current brownfield constraints |
| Architecture | HIGH | Clear ownership boundaries follow naturally from the chosen systems |
| Pitfalls | HIGH | The main failure modes are common and directly relevant to this repo |

**Overall confidence:** HIGH

### Gaps to Address

- Final host/vendor choice still needs human approval against current pricing and operational preference
- BOX NOW v1 automation depth should be chosen deliberately rather than assumed
- Stripe API/version policy should be pinned before implementation to avoid embedded Checkout naming drift

## Sources

### Primary (HIGH confidence)
- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) — adapter requirement and per-route `prerender = false`
- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create) — current Checkout Session parameters and `ui_mode` enum values
- [Stripe embedded Checkout guide](https://docs.stripe.com/payments/accept-a-payment?payment-ui=checkout&ui=embedded-form) — embedded Checkout flow semantics
- [Stripe handling payment events](https://docs.stripe.com/payments/handling-payment-events) — webhook-authoritative payment event handling
- [BOX NOW API Manual v7.2](https://boxnow.gr/media/hidden/BoxNow%20API%20Manual%20%28v.7.2%29.pdf) — locker `locationId` and widget/custom integration path

### Secondary (MEDIUM confidence)
- Existing codebase maps in `.planning/codebase/STACK.md` and `.planning/codebase/ARCHITECTURE.md` — brownfield constraints and current deployment model

---
*Research completed: 2026-04-06*
*Ready for roadmap: yes*
