# Launch Readiness Checklist

**Project:** BlackBox Records Native Commerce Migration  
**Status:** Planning draft  
**Purpose:** Future go-live milestone input. This checklist is not part of the active sandbox implementation roadmap; it exists so the later Go-Live / Launch Hardening milestone starts with explicit stop/go criteria.

## Runtime And Deployment

- [ ] Target runtime/adapter is approved
- [ ] Production host/vendor is approved
- [ ] Deployment topology is documented
- [ ] Emergency disable or rollback strategy for native commerce is documented

## Secrets And Security

- [ ] Stripe secret keys are server-only
- [ ] Stripe webhook secret handling is documented
- [ ] D1 access remains server-only
- [ ] Browser cannot write authoritative order or inventory state

## Stripe

- [ ] Stripe API/version choice is pinned
- [ ] Embedded Checkout request shape is documented
- [ ] Required webhook events and idempotency rules are documented
- [ ] Success/cancel/return-page behavior is documented as non-authoritative

## D1

- [ ] Inventory semantics are approved
- [ ] Order lifecycle states are approved
- [ ] Paid-order reconciliation path is documented
- [ ] Failure cases do not decrement stock

## BOX NOW

- [ ] Greek locker-selection UX is approved
- [ ] Required locker metadata is defined
- [ ] v1 fulfillment depth is approved
- [ ] Manual partner-portal fulfillment path exists if automation remains deferred

## Cutover

- [ ] Cutover sequence from the current external storefront handoff to native commerce is documented
- [ ] Emergency disable conditions are documented
- [ ] Operator comms/support plan is documented
- [ ] Human approval checkpoints are named

## Go/No-Go Gate

- [ ] Sandbox implementation milestone approved
- [ ] Stripe sandbox evidence reviewed
- [ ] Final stop/go reviewers identified
