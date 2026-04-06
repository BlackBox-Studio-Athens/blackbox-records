# Launch Readiness Checklist

**Project:** BlackBox Records Native Commerce Migration  
**Status:** Planning draft  
**Purpose:** Stop/go checklist for replacing the current external shop redirect with native commerce.

## Runtime And Deployment

- [ ] Target runtime/adapter is approved
- [ ] Production host/vendor is approved
- [ ] Deployment topology is documented
- [ ] Rollback path to the current external-store experience is documented

## Secrets And Security

- [ ] Stripe secret keys are server-only
- [ ] Stripe webhook secret handling is documented
- [ ] Supabase privileged credentials are server-only
- [ ] Browser cannot write authoritative order or inventory state

## Stripe

- [ ] Stripe API/version choice is pinned
- [ ] Embedded Checkout request shape is documented
- [ ] Required webhook events and idempotency rules are documented
- [ ] Success/cancel/return-page behavior is documented as non-authoritative

## Supabase

- [ ] Inventory semantics are approved
- [ ] Order lifecycle states are approved
- [ ] Paid-order reconciliation path is documented
- [ ] Failure cases do not decrement stock

## BOX NOW

- [ ] Greek locker-selection UX is approved
- [ ] Required locker metadata is defined
- [ ] v1 fulfillment depth is approved
- [ ] Manual fallback exists if BOX NOW automation is deferred

## Cutover

- [ ] Cutover sequence from Fourthwall to native commerce is documented
- [ ] Fallback conditions are documented
- [ ] Operator comms/support plan is documented
- [ ] Human approval checkpoints are named

## Go/No-Go Gate

- [ ] Phase 1 review approved
- [ ] Phase 3 review approved
- [ ] Phase 4 review approved
- [ ] Phase 5 review approved
- [ ] Final stop/go reviewers identified

