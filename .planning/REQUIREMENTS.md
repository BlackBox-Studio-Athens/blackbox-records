# Requirements: BlackBox Records Native Commerce Migration

**Defined:** 2026-04-19  
**Core Value:** Ship a minimal native commerce flow that is operationally safe: the static site owns storefront presentation, the Worker backend owns dynamic commerce behavior, Stripe owns sellable items/pricing/payment, server routes own secrets and mutations, and stock changes happen only after verified webhooks.

## v1 Requirements

### Runtime & Deployment

- [x] **DEPL-01**: Team can keep the Astro storefront deployed statically to GitHub Pages while adding a separate Cloudflare Worker backend for sandbox commerce.
- [x] **DEPL-02**: Static frontend and separate Worker backend can communicate locally and in sandbox through an explicit environment and URL contract.
- [x] **DEPL-03**: Sandbox deployment and testing can proceed without changing the current live GitHub Pages + Fourthwall production path.
- [x] **DEPL-04**: Team can bootstrap local D1 and a Prisma-compatible migration workflow inside the Worker backend before Stripe checkout implementation begins.

### Commerce Architecture

- [x] **ARCH-01**: Team locks the commerce entity model for `Artist`, `Release`, `DistroEntry`, `StoreItem`, and `Variant` before implementation of storefront or checkout phases.
- [x] **ARCH-02**: Team locks the source-of-truth split so Astro content owns editorial content, Stripe owns sellable commerce data, and D1 owns operational state plus internal mappings.
- [x] **ARCH-03**: Team defines internal backend interfaces and external Worker API contracts before storefront and checkout implementation begins, using backend-owned code-first OpenAPI with separate public/internal documents and generated clients.
- [x] **ARCH-04**: Canonical IDs, slugs, mappings, and release-to-shop linking rules are explicit before implementation.

### Storefront

- [x] **CATA-01**: Shopper can browse a native `/store/` collection inside the existing shell using a unified `StoreItem` projection derived from releases and distro.
- [x] **CATA-02**: Shopper can view store item detail that combines Astro editorial content with temporary variant state through a stable `ItemAvailability` contract before live Stripe-backed reads are required.
- [x] **CATA-03**: Release and distro entry points can resolve to canonical native store item pages instead of raw external shop URLs.
- [x] **CATA-04**: Temporary variant state remains outside editorial collections and can later swap from fixture-backed reads to Worker-backed D1/Stripe reads without changing the storefront contract.

### Checkout & Payment

- [ ] **CHKO-01**: Shopper can start single-item checkout from store item detail using a Worker-created Checkout Session with Stripe embedded Checkout (`ui_mode: embedded`), with Checkout Sessions as the only approved v1 payment-creation API.
- [ ] **CHKO-02**: Shopper can complete or retry checkout through dedicated in-site checkout and return states that retrieve status through Worker-owned APIs without treating the browser as payment authority.
- [ ] **CHKO-03**: Team can validate Worker-backed `StartCheckout`, embedded mount, and Worker-owned return-page/ReadCheckoutState flow in Stripe sandbox and local webhook testing.

### Orders & Stock

- [ ] **ORDR-01**: Worker-side code stores D1 order lifecycle state using `pending_payment`, `paid`, `not_paid`, and `needs_review`.
- [ ] **ORDR-02**: Verified raw-body Stripe webhooks received by the Worker backend are authoritative for paid-order transitions.
- [ ] **ORDR-03**: Stock decrements once, and only once, after webhook-confirmed payment success.
- [ ] **ORDR-04**: Failed, expired, canceled, or unpaid flows leave stock untouched and remain traceable in D1.

### Operator Access & Stock Operations

- [ ] **AUTH-01**: Team members can access internal stock operations through Google-backed Cloudflare Access on a separate protected backend hostname.
- [ ] **AUTH-02**: Internal stock writes record the authenticated operator identity and write time.
- [ ] **INV-01**: Team members can update stock through `StockChange` and `StockCount` without direct database access.
- [ ] **INV-02**: D1 remains the authoritative stock ledger and spreadsheets are temporary capture/reporting tools only, never the source of truth.
- [ ] **INV-03**: Each `Variant` exposes both total `Stock` and a conservative `OnlineStock` quantity so offline sales drift does not automatically oversell online.

### Shipping & Fulfillment

- [ ] **SHIP-01**: Greece-only shoppers must select a BOX NOW locker before entering payment.
- [ ] **SHIP-02**: Paid orders store only `locker_id`, `country_code`, and `locker_name_or_label` as BOX NOW metadata.
- [ ] **SHIP-03**: Operator can fulfill sandbox-paid Greek orders manually through the BOX NOW partner portal.

### Security & Operations

- [x] **SECU-01**: Stripe secrets, webhook secrets, and D1 access remain server-only in the Worker backend and local development.
- [ ] **SECU-02**: Browser code never writes authoritative stock or paid-order state.
- [ ] **OPER-01**: Team can validate the full sandbox path from static `/store/` browse through Worker checkout, webhook-confirmed paid order, and D1 state changes.
- [ ] **OPER-02**: Milestone ends with a human review package that captures sandbox evidence, open production gaps, and explicit handoff to the go-live milestone.

## v2 Requirements

### Launch & Production

- **V2GO-01**: Team can switch the live production storefront from the current external handoff to native commerce.
- **V2GO-02**: Team can run live-mode secrets, production monitoring, and a documented emergency disable path.

### Stock & Checkout

- **V2IN-01**: System reserves stock before payment confirmation to reduce oversell risk on higher-demand launches.
- **V2IN-02**: System supports a cart or other multi-item checkout flow when the single-item MVP is proven.

### Shipping & Fulfillment

- **V2SH-01**: Paid Greek orders can create BOX NOW delivery requests automatically instead of relying on manual portal steps.
- **V2SH-02**: Team can support non-Greece shipping flows without redesigning the whole commerce stack.

### Operator Tooling

- **V2OP-01**: Operator can manage order exceptions through a dedicated admin workflow instead of Stripe Dashboard plus D1 inspection.
- **V2OP-02**: Operator can see structured fulfillment, refund, and stock adjustment history in one place.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Production cutover in this milestone | Deferred to the Go-Live milestone so sandbox implementation and launch risk stay separate |
| Live-mode Stripe keys or real-money processing | This milestone stays in sandbox |
| Browser-side writes to orders or stock | Violates the trust boundary for payment and stock state |
| Stock reservation in v1 | Explicitly deferred to keep the first release simple and authoritative on payment webhook success |
| Multi-item cart | Single-item `Buy Now` is the approved MVP shape |
| Non-Greece shipping paths | Greece-only BOX NOW is the approved v1 shipping scope |
| Automated BOX NOW fulfillment | Manual partner-portal fulfillment is sufficient for projected low volume |
| Full operator dashboard / OMS beyond thin stock operations | Low order volume does not justify the maintenance cost yet |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPL-01 | Phase 5 | Completed |
| DEPL-02 | Phase 5 | Completed |
| DEPL-03 | Phase 5 | Completed |
| DEPL-04 | Phase 6.1 | Completed |
| ARCH-01 | Phase 5.1 | Completed |
| ARCH-02 | Phase 5.1 | Completed |
| ARCH-03 | Phase 5.1 | Completed |
| ARCH-04 | Phase 5.1 | Completed |
| CATA-01 | Phase 6 | Completed |
| CATA-02 | Phase 6 | Completed |
| CATA-03 | Phase 6 | Completed |
| CATA-04 | Phase 6.1 | Completed |
| AUTH-01 | Phase 6.1.1 | Pending |
| AUTH-02 | Phase 6.1.1 | Pending |
| INV-01 | Phase 6.1.1 | Pending |
| INV-02 | Phase 6.1.1 | Pending |
| INV-03 | Phase 6.1.1 | Pending |
| CHKO-01 | Phase 7 | Pending |
| CHKO-02 | Phase 7 | Pending |
| CHKO-03 | Phase 7 | Pending |
| ORDR-01 | Phase 8 | Pending |
| ORDR-02 | Phase 8 | Pending |
| ORDR-03 | Phase 8 | Pending |
| ORDR-04 | Phase 8 | Pending |
| SHIP-01 | Phase 9 | Pending |
| SHIP-02 | Phase 9 | Pending |
| SHIP-03 | Phase 9 | Pending |
| SECU-01 | Phase 5 | Completed |
| SECU-02 | Phase 8 | Pending |
| OPER-01 | Phase 10 | Pending |
| OPER-02 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-19*  
*Last updated: 2026-04-21 after the storefront implementation review and Phase 6 alignment*

