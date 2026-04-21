# Roadmap: BlackBox Records Native Commerce Migration

## Overview

This roadmap covers milestone `v1.1`, the Stripe Sandbox Integration milestone. The goal is to add native commerce to the existing Astro site using a dual-deploy monorepo model:

- the Astro site remains a static frontend deployed to GitHub Pages
- a separate Cloudflare Worker backend is added in-repo for dynamic commerce APIs, Stripe integration, webhooks, and D1 state

The live GitHub Pages + Fourthwall production experience remains the safety baseline until a later go-live milestone.

The UI contracts for the store flow and BOX NOW locker flow were approved in the archived pre-sandbox milestone. Re-run `$gsd-ui-phase` only if implementation work materially changes those approved shopper flows.

## Milestone v1.1: Stripe Sandbox Integration

## Milestone Position

- **Current milestone:** Stripe Sandbox Integration
- **Starts at:** Phase 5
- **Ends after:** Phase 10 approval
- **Next milestone:** Go-Live / Launch Hardening

## Phases

**Phase Numbering:**
- Integer phases continue from the previous milestone
- Decimal phases remain reserved for inserted urgent work

- [x] **Phase 5: Worker Backend Platform And Deployment Plumbing** - Add a separate Cloudflare Worker backend to the repo without disrupting the static Astro Pages frontend
- [x] **Phase 5.1: Commerce Domain Architecture And Source-Of-Truth Research** - Lock entity boundaries, source-of-truth rules, IDs, mappings, and API contracts before storefront or checkout implementation
- [x] **Phase 6: Static Storefront Slice** - Replace the legacy `/shop/` redirect with a canonical `/store/` static storefront built from shared editorial content and a stable store projection
- [ ] **Phase 6.1: Worker Commerce State Foundation** - Introduce D1 + Prisma in the separate Worker backend behind repository and API boundaries before checkout work
- [ ] **Phase 6.1.1: Internal Stock Operations And Operator Access** - Add protected staff-only stock tooling and operator auth before checkout depends on live stock
- [ ] **Phase 7: Worker Checkout And Stripe Sandbox Flow** - Implement Worker-owned checkout APIs and connect the frontend checkout route to Stripe sandbox
- [ ] **Phase 8: Webhook Orders And Inventory** - Make payment truth and stock mutation Worker-owned, webhook-authoritative, and idempotent
- [ ] **Phase 9: Greece-Only BOX NOW Shipping** - Add the approved locker-selection gate and thin fulfillment data contract
- [ ] **Phase 10: Sandbox Verification And Release Gate** - Prove the dual-deploy sandbox flow and prepare the go-live handoff package

## Phase Details

### Phase 5: Worker Backend Platform And Deployment Plumbing
**Goal**: Bootstrap a separate Cloudflare Worker backend in-repo while preserving the Astro static frontend and GitHub Pages deployment path.
**Depends on**: Archived milestone v1.0 decisions
**Requirements**: DEPL-01, DEPL-02, DEPL-03, SECU-01
**Success Criteria** (what must be TRUE):
1. The Astro site keeps its static Pages build path and remains the frontend deployment target during this milestone.
2. A separate Cloudflare Worker backend can be built, configured, and run locally without changing the frontend runtime model.
3. Frontend-to-Worker environment contracts, sandbox deployment plumbing, server-only secret boundaries, the no-probe-endpoint runtime posture, the TS-only Hono backend conventions, and the code-first OpenAPI contract foundation are explicit.
**Plans**: 6 plans
**Review gate**: Human review required before the separate backend runtime and auth/deploy assumptions are treated as stable.

Plans:
- [x] 05-01: Bootstrap the separate Cloudflare Worker backend in-repo
- [x] 05-02: Define the frontend-to-Worker environment and URL contract
- [x] 05-03: Add Wrangler config and the backend environment model
- [x] 05-04: Add the local Worker development path and docs
- [x] 05-05: Add the sandbox deployment workflow and stable backend hostname
- [x] 05-06: Lock the secrets and CI auth contract for the Worker backend

### Phase 5.1: Commerce Domain Architecture And Source-Of-Truth Research (INSERTED)
**Goal**: Freeze the commerce domain model and source-of-truth split before storefront, D1, or Stripe implementation drifts.
**Depends on**: Phase 5
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
1. The entity model for `Artist`, `Release`, `DistroEntry`, `CatalogItem`, and `Variant` is explicit and decision-complete.
2. Astro content, Stripe, and D1 ownership boundaries are locked with no ambiguous overlap.
3. Canonical IDs, mappings, internal interfaces, external Worker APIs, backend naming conventions, and the backend-owned OpenAPI/generation contract are drafted clearly enough that Phases 6, 6.1, and 7 can implement without re-deciding architecture.
**Plans**: 4 plans
**Review gate**: Human review required because this phase locks the architecture that every later commerce phase consumes.

Plans:
- [x] 05.1-01: Spec the domain entities and source-of-truth matrix
- [x] 05.1-02: Research implementation patterns and failure modes across Astro content, Worker backend, Stripe, and D1
- [x] 05.1-03: Draft internal backend interfaces and external Worker API contracts
- [x] 05.1-04: Freeze IDs, mappings, and static-to-dynamic linking rules for downstream phases

### Phase 6: Static Storefront Slice
**Goal**: Turn `/store/` into the canonical native storefront in the static Astro site using shared editorial content and the architecture frozen in Phase 5.1, while keeping `/shop/` as a compatibility redirect.
**Depends on**: Phase 5.1
**Requirements**: CATA-01, CATA-02, CATA-03
**Success Criteria** (what must be TRUE):
1. Shopper can browse a native `/store/` catalog built from a stable `CatalogItem` projection derived from releases and distro entries.
2. Shopper can open a native product detail page that reuses editorial assets and summaries while reading temporary variant state through the approved contract.
3. Release and distro entry points route into canonical native shop product pages instead of raw external shop URLs.
**Plans**: 7 plans
**Review gate**: Human review required if implementation drifts from the approved storefront UI contract or from the Phase 5.1 architecture.

Plans:
- [x] 06-01: Implement the shared `CatalogItem` projection contract in the static frontend
- [x] 06-02: Implement cross-collection mapping rules from releases and distro into catalog items
- [x] 06-03: Add the temporary variant-state adapter that matches the future backend API shape
- [x] 06-04: Replace the legacy `/shop/` redirect with the canonical native `/store/` collection route
- [x] 06-05: Build the product detail route and `Buy Now` handoff shell
- [x] 06-06: Add release-to-shop navigation using canonical shop links
- [x] 06-07: Reuse editorial assets and summaries without duplicating content into commerce storage

### Phase 6.1: Worker Commerce State Foundation
**Goal**: Introduce D1 + Prisma inside the separate Worker backend behind repository and API boundaries, without changing the frontend shop contract.
**Depends on**: Phase 6
**Requirements**: DEPL-04, CATA-04, SECU-01
**Success Criteria** (what must be TRUE):
1. Local D1 bindings and Worker-compatible Prisma runtime access exist inside the separate backend.
2. The migration workflow is defined before checkout implementation depends on backend state.
3. Backend repositories can evolve from temporary variant snapshots to D1-backed reads without changing the Phase 6 storefront contract, while staying inside the TS-only Hono + layered-boundary standard.
**Plans**: 4 plans
**Review gate**: Human review required before Stripe checkout work consumes the backend state model.

Plans:
- [x] 06.1-01: Bootstrap local D1 and Worker bindings
- [ ] 06.1-02: Add Prisma runtime access and repository seams in the Worker backend
- [ ] 06.1-03: Establish the migration workflow baseline
- [ ] 06.1-04: Move backend variant and mapping reads from temporary data toward D1-backed repositories where needed

### Phase 06.1.1: Internal Stock Operations And Operator Access (INSERTED)

**Goal**: Add a protected staff-only stock operations surface on the Worker backend before public checkout depends on live stock.
**Depends on**: Phase 6.1
**Requirements**: AUTH-01, AUTH-02, INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):
1. Team members can reach an internal stock tool through Google-backed Cloudflare Access on a separate protected backend hostname, while public storefront and shopper checkout remain unauthenticated.
2. The Worker backend exposes protected internal APIs for variant discovery, stock visibility, `StockChange`, and `StockCount`, and every write records operator identity and time using the same TS-only Hono + layered-boundary standard.
3. D1 is explicitly the authoritative stock ledger, spreadsheets are explicitly non-authoritative, and the online-vs-offline stock policy is locked before checkout consumes stock state.
4. The operator UI is concrete enough that label staff can update stock without direct database access or Decap reuse.
**Plans**: 4 plans
**Review gate**: Human review required because this phase locks staff authentication, stock-write semantics, and the operator workflow that later checkout relies on.

Plans:
- [ ] 06.1.1-01: Lock the protected hostname and Cloudflare Access + Google contract for internal operators
- [ ] 06.1.1-02: Define the internal stock API and D1 ledger contract around `Variant`, `StockBalance`, `StockChange`, and `StockCount`
- [ ] 06.1.1-03: Design the internal stock operations UI for search, balance, history, and write actions
- [ ] 06.1.1-04: Lock spreadsheet policy, audit attribution, and the online-vs-offline stock buffer rules

### Phase 7: Worker Checkout And Stripe Sandbox Flow
**Goal**: Implement the Worker-owned checkout API surface and connect the static frontend checkout route to Stripe sandbox.
**Depends on**: Phase 6.1.1
**Requirements**: CHKO-01, CHKO-02, CHKO-03
**Success Criteria** (what must be TRUE):
1. The Worker backend exposes the required catalog-item/variant, trusted session-status, and checkout-session endpoints using the approved domain contracts and the locked backend conventions.
2. The static frontend checkout route mounts embedded Checkout using data and session state obtained through the Worker backend, not directly from Stripe, and return/retry state reads Worker-owned checkout status instead of raw Stripe browser contracts.
3. The checkout path is testable locally and in sandbox using Stripe sandbox and webhook tooling.
**Plans**: 3 plans
**Review gate**: Human review required on the final backend API contract and shopper-facing retry/return behavior.

Plans:
- [ ] 07-01: Implement Worker APIs for item lookup, variant lookup, trusted session-status retrieval, and checkout-session creation
- [ ] 07-02: Connect the static frontend checkout route to the Worker APIs, embedded Checkout, and Worker-owned return-state retrieval
- [ ] 07-03: Validate the checkout loop locally and in sandbox with Stripe sandbox and webhook testing

### Phase 8: Webhook Orders And Inventory
**Goal**: Make payment truth and stock mutation server-owned, verified, and idempotent in the Worker backend.
**Depends on**: Phase 7
**Requirements**: ORDR-01, ORDR-02, ORDR-03, ORDR-04, SECU-02
**Success Criteria** (what must be TRUE):
1. D1 stores the approved minimal order states, inventory values, and backend mappings needed for authoritative payment handling.
2. Verified Stripe webhooks hitting the Worker backend verify the raw body/signature, acknowledge safely, and remain the only path that marks orders paid.
3. Inventory decrements exactly once after confirmed payment success, unpaid flows leave stock untouched, and trusted session-status retrieval reuses shared backend reconciliation logic without becoming payment authority.
**Plans**: 3 plans
**Review gate**: Human review required on webhook verification, idempotency, and inventory semantics.

Plans:
- [ ] 08-01: Extend the D1 schema and backend data-access layer for minimal order and inventory state
- [ ] 08-02: Implement the verified Worker webhook handler, shared Stripe reconciliation flow, and idempotent paid-order transitions
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
**Goal**: Prove the implemented dual-deploy sandbox flow and package the milestone outcome for the go-live milestone.
**Depends on**: Phase 9
**Requirements**: OPER-01, OPER-02
**Success Criteria** (what must be TRUE):
1. The full sandbox path works from static browse through Worker checkout APIs, webhook-confirmed paid order, and D1 state updates.
2. Required command checks, browser checks, and sandbox UAT evidence are captured across both deployment targets.
3. The milestone ends with a human review package and an explicit handoff to Go-Live / Launch Hardening.
**Plans**: 2 plans
**Review gate**: Human approval required before any production cutover milestone work starts.

Plans:
- [ ] 10-01: Run sandbox UAT, command validation, and browser verification across the implemented dual-deploy flow
- [ ] 10-02: Produce milestone evidence, open-issues list, and the go-live handoff package

## Future Milestone Seeds

### Go-Live / Launch Hardening
- Production cutover remains a separate milestone
- Consumes the sandbox evidence and support docs produced by this milestone
- Covers live-mode keys, production rollout, emergency disable strategy, comms, and final stop/go review

## Progress

**Execution Order:**  
Phases execute in numeric order: `5 → 5.1 → 6 → 6.1 → 6.1.1 → 7 → 8 → 9 → 10`

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Worker Backend Platform And Deployment Plumbing | 6/6 | Completed | 2026-04-20 |
| 5.1. Commerce Domain Architecture And Source-Of-Truth Research | 4/4 | Completed | 2026-04-20 |
| 6. Static Storefront Slice | 7/7 | Completed | 2026-04-21 |
| 6.1. Worker Commerce State Foundation | 1/4 | Active |  |
| 6.1.1. Internal Stock Operations And Operator Access | 0/4 | Planned |  |
| 7. Worker Checkout And Stripe Sandbox Flow | 0/3 | Planned |  |
| 8. Webhook Orders And Inventory | 0/3 | Planned |  |
| 9. Greece-Only BOX NOW Shipping | 0/3 | Planned |  |
| 10. Sandbox Verification And Release Gate | 0/2 | Planned |  |

