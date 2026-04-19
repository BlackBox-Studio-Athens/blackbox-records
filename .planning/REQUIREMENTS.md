# Requirements: BlackBox Records Native Commerce Migration

**Defined:** 2026-04-19  
**Core Value:** Ship a minimal native commerce flow that is operationally safe: the site owns the storefront, Stripe owns catalog/pricing/payment, server routes own secrets and mutations, and inventory changes happen only after verified webhooks.

## v1 Requirements

### Runtime & Deployment

- [ ] **DEPL-01**: Team can deploy the Astro storefront to Cloudflare Workers in sandbox while keeping brochure/content routes prerendered where practical.
- [ ] **DEPL-02**: Commerce routes and webhooks can execute on demand with Worker bindings for D1 and server-only secrets.
- [ ] **DEPL-03**: Sandbox deployment and testing can proceed without changing the current live GitHub Pages + Fourthwall production path.

### Catalog & Storefront

- [ ] **CATA-01**: Shopper can browse a hand-picked distro subset at native `/shop/` inside the existing site shell.
- [ ] **CATA-02**: Shopper can view product detail that combines Astro editorial content with Stripe product and price data.
- [ ] **CATA-03**: Operator can manage sellable product and price data in Stripe sandbox without editing Astro content for price changes.

### Checkout & Payment

- [ ] **CHKO-01**: Shopper can start single-item checkout from product detail using a server-created Checkout Session with Stripe embedded Checkout (`ui_mode: embedded`).
- [ ] **CHKO-02**: Shopper can complete or retry checkout through dedicated in-site checkout and return states without treating the browser as payment authority.
- [ ] **CHKO-03**: Team can validate Checkout Session creation, embedded mount, and return-page retrieval flow in Stripe sandbox and local webhook testing.

### Orders & Inventory

- [ ] **ORDR-01**: Server-side code stores D1 order lifecycle state using `pending_payment`, `paid`, `closed_unpaid`, and `needs_review`.
- [ ] **ORDR-02**: Verified Stripe webhooks are authoritative for paid-order transitions.
- [ ] **ORDR-03**: Inventory decrements once, and only once, after webhook-confirmed payment success.
- [ ] **ORDR-04**: Failed, expired, canceled, or unpaid flows leave inventory untouched and remain traceable in D1.

### Shipping & Fulfillment

- [ ] **SHIP-01**: Greece-only shoppers must select a BOX NOW locker before entering payment.
- [ ] **SHIP-02**: Paid orders store only `locker_id`, `country_code`, and `locker_name_or_label` as BOX NOW metadata.
- [ ] **SHIP-03**: Operator can fulfill sandbox-paid Greek orders manually through the BOX NOW partner portal.

### Security & Operations

- [ ] **SECU-01**: Stripe secrets, webhook secrets, and D1 access remain server-only in Cloudflare Workers and local development.
- [ ] **SECU-02**: Browser code never writes authoritative inventory or paid-order state.
- [ ] **OPER-01**: Team can validate the full sandbox path from `/shop/` browse through webhook-confirmed paid order and D1 state changes.
- [ ] **OPER-02**: Milestone ends with a human review package that captures sandbox evidence, open production gaps, and explicit handoff to the go-live milestone.

## v2 Requirements

### Launch & Production

- **V2GO-01**: Team can switch the live production storefront from the current external handoff to native commerce.
- **V2GO-02**: Team can run live-mode secrets, production monitoring, and a documented emergency disable path.

### Inventory & Checkout

- **V2IN-01**: System reserves stock before payment confirmation to reduce oversell risk on higher-demand launches.
- **V2IN-02**: System supports a cart or other multi-item checkout flow when the single-item MVP is proven.

### Shipping & Fulfillment

- **V2SH-01**: Paid Greek orders can create BOX NOW delivery requests automatically instead of relying on manual portal steps.
- **V2SH-02**: Team can support non-Greece shipping flows without redesigning the whole commerce stack.

### Operator Tooling

- **V2OP-01**: Operator can manage order exceptions through a dedicated admin workflow instead of Stripe Dashboard plus D1 inspection.
- **V2OP-02**: Operator can see structured fulfillment, refund, and inventory adjustment history in one place.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live-mode production cutover | Deferred to the Go-Live milestone so sandbox implementation and launch risk stay separate |
| Browser-side writes to orders or inventory | Violates the trust boundary for payment and stock state |
| Inventory reservation in v1 | Explicitly deferred to keep the first release simple and authoritative on payment webhook success |
| Multi-item cart | Single-item `Buy Now` is the approved MVP shape |
| Non-Greece shipping paths | Greece-only BOX NOW is the approved v1 shipping scope |
| Automated BOX NOW fulfillment | Manual partner-portal fulfillment is sufficient for projected low volume |
| Full operator dashboard / OMS | Low order volume does not justify the maintenance cost yet |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPL-01 | Phase 5 | Pending |
| DEPL-02 | Phase 5 | Pending |
| DEPL-03 | Phase 5 | Pending |
| CATA-01 | Phase 6 | Pending |
| CATA-02 | Phase 6 | Pending |
| CATA-03 | Phase 6 | Pending |
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
| SECU-01 | Phase 5 | Pending |
| SECU-02 | Phase 8 | Pending |
| OPER-01 | Phase 10 | Pending |
| OPER-02 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-19*  
*Last updated: 2026-04-19 after starting milestone v1.1*
