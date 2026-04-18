# Roadmap: BlackBox Records Native Commerce Migration

## Overview

This roadmap plans the migration from the current GitHub Pages + Fourthwall handoff model to a minimal native commerce stack inside the existing Astro storefront. The active milestone is pre-sandbox only: it ends when the team has a final runtime/vendor choice, approved trust boundaries, a first native storefront slice designed on paper, webhook-authoritative payment semantics defined, and BOX NOW locker-selection UX defined.

This roadmap is itself a planning deliverable. No implementation work is approved until Phase 1 review is complete, and no Stripe sandbox work starts until this milestone finishes at Phase 4.

## Milestone Position

- **Current milestone:** Pre-Sandbox Planning
- **Ends after:** Phase 4 approval
- **Next milestone:** Stripe Sandbox Integration
- **Following milestone:** Go-Live / Launch Hardening

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Runtime And Guardrails** - Decide the deployable runtime, trust boundaries, and brownfield migration rules
- [ ] **Phase 2: Native Catalog And Embedded Checkout Slice** - Plan the first sellable native storefront slice without inventory mutation
- [ ] **Phase 3: Webhook-Authoritative Orders And Inventory** - Define paid-order authority, stock semantics, and reconciliation rules
- [ ] **Phase 4: BOX NOW Locker Shipping Slice** - Add the Greek locker-selection and low-volume fulfillment path

## Phase Details

### Phase 1: Runtime And Guardrails
**Goal**: Choose the hosting/runtime model and approve the core commerce trust boundaries before implementation planning begins.
**Depends on**: Nothing (first phase)
**Requirements**: DEPL-01, DEPL-02, CATA-03, SECU-01
**Success Criteria** (what must be TRUE):
1. Team selects a final Astro adapter/runtime family and production host/vendor that can host on-demand server routes and Stripe webhooks.
2. Secret-handling, system ownership boundaries, and Stripe API/version policy are approved in ADRs.
3. A brownfield rollback shape exists before implementation planning continues.
**Plans**: 3 plans
**Review gate**: Human approval required before later implementation phases can be planned in detail.

Plans:
- [ ] 01-01: Compare host/runtime options and recommend the portable default
- [ ] 01-02: Finalize Stripe/Supabase/browser trust boundaries and embedded Checkout API policy
- [ ] 01-03: Define brownfield cutover guardrails and rollback assumptions

### Phase 2: Native Catalog And Embedded Checkout Slice
**Goal**: Plan the smallest native commerce slice that proves in-site browse + checkout without touching inventory state.
**Depends on**: Phase 1
**Requirements**: CATA-01, CATA-02, CHKO-01, CHKO-02
**Success Criteria** (what must be TRUE):
1. Shopper can browse a first native product slice sourced from Stripe-backed catalog data.
2. Shopper can enter Stripe embedded Checkout via a server-created Checkout Session.
3. The slice introduces no browser-side privileged writes and no inventory mutation.
**Plans**: 3 plans
**Review gate**: Human approval required on the first sellable vertical slice scope.
**UI workflow**: Run `$gsd-ui-phase 2` before `$gsd-plan-phase 2` to produce the storefront UI design contract.

Plans:
- [ ] 02-01: Define the Stripe-backed catalog projection and first-SKU rollout scope
- [ ] 02-02: Define the server route contract for embedded Checkout Session creation
- [ ] 02-03: Define shopper-facing entry, cancel, and return states for the first slice

### Phase 3: Webhook-Authoritative Orders And Inventory
**Goal**: Plan the authoritative post-payment state model so order status and stock are never trusted to the browser.
**Depends on**: Phase 2
**Requirements**: CHKO-03, ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05, SECU-02, OPER-01
**Success Criteria** (what must be TRUE):
1. Paid-order state changes only from verified Stripe webhook events.
2. Inventory decrements once, and only once, after confirmed payment success.
3. Failed, expired, or abandoned checkouts leave stock untouched.
4. Operators can reconcile Stripe payment records against Supabase order and inventory state.
**Plans**: 3 plans
**Review gate**: Human approval required on webhook authority, idempotency, and stock semantics.

Plans:
- [ ] 03-01: Define order lifecycle states and state transitions
- [ ] 03-02: Define webhook authority, signature verification, and idempotency expectations
- [ ] 03-03: Define inventory decrement and reconciliation rules for low-volume ops

### Phase 4: BOX NOW Locker Shipping Slice
**Goal**: Plan the required Greek locker-selection path without overbuilding fulfillment for a low-volume store.
**Depends on**: Phase 3
**Requirements**: SHIP-01, SHIP-02, SHIP-03
**Success Criteria** (what must be TRUE):
1. Greek shopper can select a BOX NOW locker in the planned checkout flow.
2. Paid orders retain the locker metadata operators need for fulfillment.
3. v1 fulfillment remains low-maintenance and does not require a heavyweight shipping platform.
**Plans**: 2 plans
**Review gate**: Human approval required on shipping UX and fulfillment depth.
**UI workflow**: Run `$gsd-ui-phase 4` before `$gsd-plan-phase 4` to lock the locker-selection and confirmation UX.

Plans:
- [ ] 04-01: Define locker-selection UX, data contract, and fallback behavior
- [ ] 04-02: Decide between manual and thin-server BOX NOW fulfillment for v1

## Future Milestone Seeds

### Stripe Sandbox Integration Milestone
- First milestone allowed to touch Stripe sandbox
- Starts after Phase 4 approval
- Uses the pre-sandbox planning outputs from Phases 1-4 as implementation inputs
- Re-runs `$gsd-ui-phase` only if a sandbox implementation phase introduces net-new shopper-facing UI beyond the approved Phase 2 and Phase 4 designs

### Go-Live / Launch Hardening Milestone
- Covers brownfield cutover, rollback rehearsal, and final launch approval
- Consumes the future cutover backlog and launch-readiness checklist maintained in the current milestone
- No production go-live work is in scope for the active milestone

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Runtime And Guardrails | 0/3 | Planned    |  |
| 2. Native Catalog And Embedded Checkout Slice | 0/3 | Not started | - |
| 3. Webhook-Authoritative Orders And Inventory | 0/3 | Not started | - |
| 4. BOX NOW Locker Shipping Slice | 0/2 | Not started | - |
