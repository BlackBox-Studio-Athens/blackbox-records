# Roadmap: BlackBox Records Native Commerce Migration

## Overview

This roadmap covers milestone `v1.1`, the Stripe Sandbox Integration milestone. The goal is to implement the previously approved native commerce slice end-to-end on Cloudflare Workers + D1 and validate it in Stripe sandbox, while leaving the live GitHub Pages + Fourthwall production experience unchanged until the next milestone.

The UI contracts for the store flow and BOX NOW locker flow were already approved in the archived pre-sandbox milestone. Re-run `$gsd-ui-phase` only if implementation work materially changes those approved shopper flows.

## Milestone Position

- **Current milestone:** Stripe Sandbox Integration
- **Starts at:** Phase 5
- **Ends after:** Phase 10 approval
- **Next milestone:** Go-Live / Launch Hardening

## Phases

**Phase Numbering:**
- Integer phases continue from the previous milestone
- Decimal phases (for example `6.1`) remain reserved for inserted urgent work

- [ ] **Phase 5: Cloudflare Runtime And Secret Plumbing** - Add the Worker runtime, D1 bindings, and sandbox-safe deployment path
- [ ] **Phase 6: Native Storefront Slice** - Replace the `/shop/` redirect with the curated native store entry and product detail flow
- [ ] **Phase 7: Embedded Checkout Sandbox Flow** - Implement server-created Checkout Sessions and embedded Checkout on the dedicated route
- [ ] **Phase 8: Webhook Orders And Inventory** - Make D1 order and inventory state webhook-authoritative and idempotent
- [ ] **Phase 9: Greece-Only BOX NOW Shipping** - Add the approved locker-selection gate and thin fulfillment data contract
- [ ] **Phase 10: Sandbox Verification And Release Gate** - Prove the full sandbox flow and prepare the go-live handoff package

## Phase Details

### Phase 5: Cloudflare Runtime And Secret Plumbing
**Goal**: Add the Cloudflare Worker runtime for sandbox commerce work without disturbing the live production path.
**Depends on**: Archived milestone v1.0 decisions
**Requirements**: DEPL-01, DEPL-02, DEPL-03, SECU-01
**Success Criteria** (what must be TRUE):
1. Astro builds for Cloudflare Workers with only required commerce routes rendered on demand.
2. D1 and server-only secrets are available through Worker bindings, not browser code.
3. The sandbox deployment path does not alter the current GitHub Pages + Fourthwall production behavior.
**Plans**: 3 plans
**Review gate**: Human review required before sandbox secrets and D1 bindings are treated as stable.

Plans:
- [ ] 05-01: Add the Cloudflare adapter/runtime configuration and keep brochure routes prerendered where practical
- [ ] 05-02: Define Worker bindings for D1 and server-only secrets across local and deployed sandbox environments
- [ ] 05-03: Update the deployment path so sandbox Worker deploys do not disturb the live GitHub Pages production site

### Phase 6: Native Storefront Slice
**Goal**: Turn `/shop/` into the approved curated native store entry while preserving the existing shell and editorial model.
**Depends on**: Phase 5
**Requirements**: CATA-01, CATA-02, CATA-03
**Success Criteria** (what must be TRUE):
1. Shopper can browse the approved hand-picked distro subset at native `/shop/`.
2. Shopper can open a native product detail page that combines Astro editorial content with Stripe-backed sellable data.
3. Navigation and distro entry points route into the native store flow instead of the old redirect for the sandbox path.
**Plans**: 3 plans
**Review gate**: Human review required if implementation drifts from the approved store UI contract.

Plans:
- [ ] 06-01: Replace the `/shop/` redirect surface with the curated collection route for sandbox
- [ ] 06-02: Build the product detail projection that joins Astro distro content to Stripe product and price data
- [ ] 06-03: Update navigation and store-entry links to route shoppers into the native store slice

### Phase 7: Embedded Checkout Sandbox Flow
**Goal**: Implement the single-item embedded Checkout path on the dedicated in-site checkout route.
**Depends on**: Phase 6
**Requirements**: CHKO-01, CHKO-02, CHKO-03
**Success Criteria** (what must be TRUE):
1. Server code creates a single-item Checkout Session using the current embedded Checkout request shape.
2. Shopper can mount embedded Checkout on the dedicated in-site checkout route and reach return or retry states cleanly.
3. The checkout path is testable locally and against the sandbox deployment using Stripe sandbox and webhook tooling.
**Plans**: 3 plans
**Review gate**: Human review required on the final checkout-session contract and shopper-facing retry/return behavior.

Plans:
- [ ] 07-01: Implement the server endpoint that creates single-item Checkout Sessions with `ui_mode: embedded`
- [ ] 07-02: Mount embedded Checkout on the dedicated route and implement non-authoritative return and retry states
- [ ] 07-03: Validate the checkout loop locally and in sandbox with Stripe sandbox and webhook testing

### Phase 8: Webhook Orders And Inventory
**Goal**: Make payment truth and stock mutation server-owned, verified, and idempotent.
**Depends on**: Phase 7
**Requirements**: ORDR-01, ORDR-02, ORDR-03, ORDR-04, SECU-02
**Success Criteria** (what must be TRUE):
1. D1 stores the approved minimal order states and inventory values.
2. Verified Stripe webhooks are the only path that marks orders paid.
3. Inventory decrements exactly once after confirmed payment success, and unpaid flows leave stock untouched.
**Plans**: 3 plans
**Review gate**: Human review required on webhook verification, idempotency, and inventory semantics.

Plans:
- [ ] 08-01: Create the D1 schema and data-access layer for minimal order and inventory state
- [ ] 08-02: Implement the verified webhook handler and idempotent paid-order transitions
- [ ] 08-03: Apply post-payment inventory decrement and manual reconciliation behavior for low-volume operations

### Phase 9: Greece-Only BOX NOW Shipping
**Goal**: Add the approved Greece-only locker gate before payment and keep fulfillment low-maintenance.
**Depends on**: Phase 8
**Requirements**: SHIP-01, SHIP-02, SHIP-03
**Success Criteria** (what must be TRUE):
1. Greece-only shoppers must select a BOX NOW locker before entering payment.
2. Paid orders persist only the approved thin locker snapshot.
3. Fulfillment remains manual through the BOX NOW partner portal.
**Plans**: 3 plans
**Review gate**: Human review required if implementation drifts from the approved locker UX or expands shipping scope.

Plans:
- [ ] 09-01: Gate checkout to Greece-only BOX NOW shipping and capture locker selection before session creation
- [ ] 09-02: Persist the thin locker snapshot on the order and surface the selected locker back to the shopper
- [ ] 09-03: Keep fulfillment manual through the BOX NOW partner portal and document the operator handoff

### Phase 10: Sandbox Verification And Release Gate
**Goal**: Prove the implemented sandbox flow and package the milestone outcome for the go-live milestone.
**Depends on**: Phase 9
**Requirements**: OPER-01, OPER-02
**Success Criteria** (what must be TRUE):
1. The full sandbox path works from native browse through webhook-confirmed paid order and D1 state updates.
2. Required command checks, browser checks, and sandbox UAT evidence are captured.
3. The milestone ends with a human review package and an explicit handoff to Go-Live / Launch Hardening.
**Plans**: 2 plans
**Review gate**: Human approval required before any production cutover milestone work starts.

Plans:
- [ ] 10-01: Run sandbox UAT, command validation, and browser verification across the implemented flow
- [ ] 10-02: Produce milestone evidence, open-issues list, and the go-live handoff package

## Future Milestone Seeds

### Go-Live / Launch Hardening
- Production cutover remains a separate milestone
- Consumes the sandbox evidence and support docs produced by this milestone
- Covers live-mode keys, production rollout, emergency disable strategy, comms, and final stop/go review

## Progress

**Execution Order:**  
Phases execute in numeric order: `5 → 6 → 7 → 8 → 9 → 10`

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Cloudflare Runtime And Secret Plumbing | 0/3 | Planned |  |
| 6. Native Storefront Slice | 0/3 | Planned |  |
| 7. Embedded Checkout Sandbox Flow | 0/3 | Planned |  |
| 8. Webhook Orders And Inventory | 0/3 | Planned |  |
| 9. Greece-Only BOX NOW Shipping | 0/3 | Planned |  |
| 10. Sandbox Verification And Release Gate | 0/2 | Planned |  |
