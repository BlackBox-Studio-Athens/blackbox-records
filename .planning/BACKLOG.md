# Commerce Migration Backlog

**Project:** BlackBox Records Native Commerce Migration  
**Date:** 2026-04-19  
**Scope:** Future work outside the active sandbox implementation roadmap.

## Ready For Future Go-Live Milestone

Start from `.planning/phases/10-sandbox-verification-and-release-gate/10-MILESTONE-REVIEW.md`.

### BL-11: One-way production cutover plan

- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Consume the `10-MILESTONE-REVIEW.md` deferred-gate list before any cutover decision
  - Define the production rollout order from the current external handoff to native commerce
  - Define emergency disable or rollback triggers for native checkout
  - Keep the cutover plan separate from sandbox implementation work
- Human review stop: approve production cutover approach

### BL-12: Live-mode launch checklist

- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Cover runtime, secrets, Stripe, D1, shipping, reconciliation, monitoring, and communications
  - Include Stripe Access Gate evidence, BOX NOW Portal Gate evidence, and Native Checkout Gate setup
  - Name required approvers and the stop/go gate
  - Stay implementation-aware enough to use the sandbox milestone evidence directly
- Human review stop: approve final launch gate format

### BL-17: Account-backed external gate validation

- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Capture real Stripe test-mode checkout, webhook, and return-state evidence
  - Capture BOX NOW partner or sandbox portal fulfillment evidence for a paid Greek locker order
  - Keep the evidence separate from local stripe-mock and signed-fixture validation
- Human review stop: approve whether the external gates are satisfied

## Ready For Future v2 Milestones

### BL-13: Cart and multi-item checkout

- Linked milestone: v2+
- Acceptance criteria:
  - Define cart semantics that fit the existing shell and Stripe flow
  - Confirm stock implications for multi-item checkout
  - Keep single-item `Buy Now` behavior stable while designing the expansion

### BL-14: Stock reservation design

- Linked milestone: v2+
- Acceptance criteria:
  - Define reservation lifecycle and expiry behavior
  - Define oversell reduction strategy
  - Compare added complexity against actual order volume

### BL-15: Automated BOX NOW fulfillment

- Linked milestone: v2+
- Acceptance criteria:
  - Compare manual partner-portal fulfillment with API-assisted automation
  - Define the minimum additional data required for automation
  - Keep Greece-only locker behavior compatible with the future automation path

### BL-16: Non-Greece shipping path

- Linked milestone: v2+
- Acceptance criteria:
  - Define how non-Greece shipping fits the current checkout architecture
  - Avoid redesigning the Greece-only MVP flow just to add a second path
  - Document whether the next shipping path is another locker model or a courier flow
