# Commerce Migration Backlog

**Project:** BlackBox Records Native Commerce Migration  
**Date:** 2026-04-06  
**Scope:** Planning backlog only. No implementation items are approved yet.

## Ready For Phase 1

### BL-01: Runtime option matrix
- Linked phase: Phase 1
- Acceptance criteria:
  - Compare at least three hosting/runtime shapes
  - Document portability, baseline monthly cost, adapter fit, and rollback implications
  - Name a recommended default and at least one fallback
- Human review stop: approve runtime direction before any implementation planning

### BL-02: Stripe API/version decision pack
- Linked phase: Phase 1
- Acceptance criteria:
  - Document the embedded Checkout request shape to use
  - Resolve current terminology drift around embedded Checkout naming
  - Identify webhook events required for paid-order authority
- Human review stop: approve the pinned Stripe integration shape

### BL-03: Commerce trust-boundary spec
- Linked phase: Phase 1
- Acceptance criteria:
  - Define which system owns catalog, pricing, order state, and inventory
  - Define which writes are server-only
  - Document explicit browser restrictions for Supabase and order mutation
- Human review stop: approve system ownership boundaries

## Ready For Phase 2

### BL-04: Native catalog slice definition
- Linked phase: Phase 2
- Acceptance criteria:
  - Define the minimum SKU/product slice to prove native commerce
  - Specify how storefront views derive product and price data from Stripe
  - Confirm editorial content remains separate from sellable catalog data
- Human review stop: approve first vertical slice scope

### BL-05: Embedded checkout slice plan
- Linked phase: Phase 2
- Acceptance criteria:
  - Define the server route contract for creating Checkout Sessions
  - Define shopper entry, success, and cancel states
  - Confirm that no inventory mutation happens in this slice
- Human review stop: approve the first end-to-end checkout slice

## Ready For Phase 3

### BL-06: Webhook idempotency and order-state plan
- Linked phase: Phase 3
- Acceptance criteria:
  - Define authoritative webhook event handling
  - Define order states and paid transition rules
  - Define idempotency and duplicate-event handling expectations
- Human review stop: approve payment-authority model

### BL-07: Inventory decrement rules
- Linked phase: Phase 3
- Acceptance criteria:
  - Document exactly when inventory decrements
  - Document what never decrements inventory
  - Confirm no-reservation semantics and their tradeoffs
- Human review stop: approve stock semantics before implementation

## Ready For Phase 4

### BL-08: BOX NOW locker-selection plan
- Linked phase: Phase 4
- Acceptance criteria:
  - Define the locker-selection UX path
  - Define which locker fields are persisted
  - Define failure/fallback behavior if locker lookup fails
- Human review stop: approve v1 shipping UX and data contract

### BL-09: Fulfillment-depth decision
- Linked phase: Phase 4
- Acceptance criteria:
  - Compare manual partner-portal fulfillment with thin API-assisted fulfillment
  - Recommend the lowest-maintenance v1 option
  - Document what is deferred to v2
- Human review stop: approve fulfillment depth

## Ready For Phases 5-6

### BL-10: Brownfield cutover plan
- Linked phase: Phase 5
- Acceptance criteria:
  - Define rollout order and fallback path from Fourthwall
  - Define whether to use a limited-catalog or parallel-run phase
  - Define explicit rollback triggers
- Human review stop: approve cutover approach

### BL-11: Launch readiness checklist
- Linked phase: Phase 6
- Acceptance criteria:
  - Cover runtime, secrets, Stripe, Supabase, shipping, reconciliation, rollback, and communications
  - Name the required approvers and stop/go gate
  - Stay implementation-agnostic enough to survive planning revisions
- Human review stop: approve launch gate format

