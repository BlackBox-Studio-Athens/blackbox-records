# Roadmap: BlackBox Records Native Commerce Migration

## Overview

This roadmap covers milestone `v1.1`, the Stripe Sandbox Integration milestone. The goal is to implement the approved native commerce slice end-to-end on Cloudflare Workers + D1 and validate it in Stripe sandbox, while leaving the live GitHub Pages + Fourthwall production experience unchanged until the next milestone.

The UI contracts for the store flow and BOX NOW locker flow were already approved in the archived pre-sandbox milestone. Re-run `$gsd-ui-phase` only if implementation work materially changes those approved shopper flows.

## Milestone v1.1: Stripe Sandbox Integration

## Milestone Position

- **Current milestone:** Stripe Sandbox Integration
- **Starts at:** Phase 5
- **Ends after:** Phase 10 approval
- **Next milestone:** Go-Live / Launch Hardening

## Phases

**Phase Numbering:**
- Integer phases continue from the previous milestone
- Decimal phases (for example `6.1`) remain reserved for inserted urgent work

- [ ] **Phase 5: Cloudflare Runtime And Secret Plumbing** - Establish the Worker-first runtime, environment model, local dev path, and sandbox deploy plumbing
- [ ] **Phase 6: Native Storefront Slice** - Replace `/shop/` with a native store built from a unified content-driven shop projection and fixture-backed offer state
- [ ] **Phase 6.1: Local Commerce State Foundation** - Introduce local D1 + Prisma behind the shop repository boundary before any Stripe checkout work
- [ ] **Phase 7: Embedded Checkout Sandbox Flow** - Implement server-created Checkout Sessions and embedded Checkout on the dedicated route
- [ ] **Phase 8: Webhook Orders And Inventory** - Make D1 order and inventory state webhook-authoritative and idempotent
- [ ] **Phase 9: Greece-Only BOX NOW Shipping** - Add the approved locker-selection gate and thin fulfillment data contract
- [ ] **Phase 10: Sandbox Verification And Release Gate** - Prove the full sandbox flow and prepare the go-live handoff package

## Phase Details

### Phase 5: Cloudflare Runtime And Secret Plumbing
**Goal**: Establish the Worker-first runtime and environment contract for sandbox commerce work without disturbing the live GitHub Pages baseline.
**Depends on**: Archived milestone v1.0 decisions
**Requirements**: DEPL-01, DEPL-02, DEPL-03, SECU-01
**Success Criteria** (what must be TRUE):
1. Astro builds for Cloudflare Workers with brochure routes still prerendered by default and commerce routes able to opt into on-demand execution.
2. Local Worker development, runtime configuration, and sandbox deploy plumbing are explicit and isolated from the current Pages production workflow.
3. Runtime secrets remain server-only across local development, CI, and the deployed sandbox Worker.
**Plans**: 6 plans
**Review gate**: Human review required before sandbox runtime assumptions and secret handling are treated as stable.

Plans:
- [ ] 05-01: Astro Cloudflare adapter bootstrap
- [ ] 05-02: On-demand route boundary and prerender contract
- [ ] 05-03: Wrangler config and Workers-first environment model
- [ ] 05-04: Local Worker development path
- [ ] 05-05: Sandbox deployment workflow and stable sandbox hostname
- [ ] 05-06: Secrets contract for local dev, CI, and deployed Worker

### Phase 6: Native Storefront Slice
**Goal**: Turn `/shop/` into a native store built from shared editorial content and a unified shop-facing projection, while preserving the existing shell and site language.
**Depends on**: Phase 5
**Requirements**: CATA-01, CATA-02, CATA-03
**Success Criteria** (what must be TRUE):
1. Shopper can browse a native `/shop/` catalog backed by one unified shop projection derived from releases and distro entries.
2. Shopper can open a native product detail page that reuses editorial assets and summaries while reading offer state from a fixture-backed adapter instead of Stripe or D1.
3. Release and distro entry points route into canonical native shop product pages instead of the old redirect model.
**Plans**: 7 plans
**Review gate**: Human review required if implementation drifts from the approved store UI contract.

Plans:
- [ ] 06-01: Define the shared shop projection contract
- [ ] 06-02: Define cross-collection mapping rules
- [ ] 06-03: Build a fixture-backed catalog adapter
- [ ] 06-04: Replace `/shop/` redirect with native collection route
- [ ] 06-05: Build shop product detail route and `Buy Now` handoff shell
- [ ] 06-06: Add release-to-shop navigation
- [ ] 06-07: Reuse editorial assets and summaries without duplication

### Phase 6.1: Local Commerce State Foundation (INSERTED)
**Goal**: Introduce local D1 and Prisma behind the shop repository boundary without changing the UI-facing shop contract or starting Stripe checkout work.
**Depends on**: Phase 6
**Requirements**: DEPL-04, CATA-04, SECU-01
**Success Criteria** (what must be TRUE):
1. Local D1 bindings and a Worker-compatible Prisma runtime path exist and are executable in local development.
2. The migration workflow is defined before any checkout implementation depends on it.
3. The shop repository boundary can evolve from fixture-backed state toward D1-backed reads where needed without changing the UI projection shape.
4. No Stripe checkout-session creation or embedded Checkout integration is introduced in this phase.
**Plans**: 4 plans
**Review gate**: Human review required before D1 or Prisma assumptions become the baseline for later checkout and order phases.

Plans:
- [ ] 06.1-01: Local D1 bootstrap and bindings
- [ ] 06.1-02: Prisma runtime setup on D1
- [ ] 06.1-03: Migration workflow baseline
- [ ] 06.1-04: Repository boundary swap from fixture-backed adapter to D1-backed reads where needed

### Phase 7: Embedded Checkout Sandbox Flow
**Goal**: Implement the single-item embedded Checkout path on the dedicated in-site checkout route.
**Depends on**: Phase 6.1
**Requirements**: CHKO-01, CHKO-02, CHKO-03
**Success Criteria** (what must be TRUE):
1. Server code creates a single-item Checkout Session using the current embedded Checkout request shape and the stable shop projection contract.
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
1. D1 extends the earlier local foundation to store the approved minimal order states and authoritative inventory values.
2. Verified Stripe webhooks are the only path that marks orders paid.
3. Inventory decrements exactly once after confirmed payment success, and unpaid flows leave stock untouched.
**Plans**: 3 plans
**Review gate**: Human review required on webhook verification, idempotency, and inventory semantics.

Plans:
- [ ] 08-01: Extend the D1 schema and data-access layer for minimal order and inventory state
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
Phases execute in numeric order: `5 → 6 → 6.1 → 7 → 8 → 9 → 10`

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Cloudflare Runtime And Secret Plumbing | 0/6 | Planned |  |
| 6. Native Storefront Slice | 0/7 | Planned |  |
| 6.1. Local Commerce State Foundation | 0/4 | Planned |  |
| 7. Embedded Checkout Sandbox Flow | 0/3 | Planned |  |
| 8. Webhook Orders And Inventory | 0/3 | Planned |  |
| 9. Greece-Only BOX NOW Shipping | 0/3 | Planned |  |
| 10. Sandbox Verification And Release Gate | 0/2 | Planned |  |
