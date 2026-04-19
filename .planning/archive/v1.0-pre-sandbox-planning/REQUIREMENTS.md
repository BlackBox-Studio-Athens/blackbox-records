# Requirements: BlackBox Records Native Commerce Migration

**Defined:** 2026-04-06
**Core Value:** Ship a minimal native commerce flow that is operationally safe: Stripe handles catalog/pricing/payment, server-owned logic handles checkout and webhooks, and inventory changes happen only after webhook-confirmed payment success.

## v1 Requirements

### Runtime & Deployment

- [ ] **DEPL-01**: Team can deploy the Astro storefront on a runtime that supports on-demand server routes and webhook handling while keeping brochure/content routes prerendered where practical.
- [ ] **DEPL-02**: Commerce server routes can run without exposing Stripe secret keys, webhook secrets, or Supabase service-role credentials to the browser.
- [ ] **DEPL-03**: Team can cut over from the current Fourthwall redirect model using an explicit rollback path instead of a one-way deployment gamble.

### Catalog & Pricing

- [ ] **CATA-01**: Shopper can browse native in-site products whose sellable name, price, and currency come from Stripe Products and Prices.
- [ ] **CATA-02**: Operator can manage sellable catalog and pricing in Stripe without editing Astro content files for every product/price change.
- [ ] **CATA-03**: Editorial site content remains owned by Astro collections and Decap CMS rather than being absorbed into the commerce catalog system.

### Checkout & Payment

- [ ] **CHKO-01**: Shopper can begin checkout inside the site using Stripe Checkout Sessions with the embedded Checkout page mode (`ui_mode: embedded_page` in the current API reference).
- [ ] **CHKO-02**: Checkout Sessions are created only by server-side code using server-held Stripe secrets.
- [ ] **CHKO-03**: Shopper return/cancel pages do not act as the authoritative source of payment success; paid state comes from webhooks.

### Orders & Inventory

- [ ] **ORDR-01**: Server-side code can create and update order lifecycle state in Supabase without allowing browser writes to authoritative order or inventory data.
- [ ] **ORDR-02**: Stripe webhook events are authoritative for marking an order paid.
- [ ] **ORDR-03**: Inventory is decremented only after webhook-confirmed payment success.
- [ ] **ORDR-04**: Failed, expired, or abandoned checkouts never decrement inventory.
- [ ] **ORDR-05**: v1 order flow does not reserve stock before payment confirmation.

### Shipping & Fulfillment

- [ ] **SHIP-01**: Greek shopper can select a BOX NOW locker and the selected locker identifier is attached to the order record.
- [ ] **SHIP-02**: Operator can view the paid order together with the BOX NOW locker metadata needed for fulfillment.
- [ ] **SHIP-03**: v1 shipping flow supports a low-volume manual or thin-server fulfillment path rather than requiring a heavyweight warehouse workflow.

### Security & Operations

- [ ] **SECU-01**: Server secrets remain server-only across runtime, CI, and deployment workflows.
- [ ] **SECU-02**: Browser code never receives permission to mutate authoritative inventory or paid-order state.
- [ ] **OPER-01**: Operator can reconcile Stripe payment records against Supabase order and inventory state when something goes wrong.
- [ ] **OPER-02**: Team has explicit human review gates, launch checklist items, and rollback criteria before replacing the external shop redirect.

## v2 Requirements

### Inventory & Checkout

- **V2IN-01**: System reserves stock before payment confirmation to reduce oversell risk on higher-demand launches.
- **V2IN-02**: System can release expired reservations automatically without manual cleanup.

### Fulfillment Automation

- **V2SH-01**: Paid Greek orders can create BOX NOW delivery requests automatically instead of relying on manual portal steps.
- **V2SH-02**: Team can support additional carriers or non-locker shipping flows without redesigning the whole commerce stack.

### Operator Tooling

- **V2OP-01**: Operator can manage order exceptions through a dedicated admin workflow instead of Stripe/Supabase manual inspection.
- **V2OP-02**: Operator can see structured fulfillment, refund, and inventory adjustment history in one place.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Static-only GitHub Pages commerce runtime | Cannot safely host live checkout creation or webhook endpoints |
| Browser-side writes to orders or inventory | Violates the trust boundary for payment and stock state |
| Inventory reservation in v1 | Explicitly deferred to keep the first release simple and authoritative on payment webhook success |
| Multi-carrier abstraction | BOX NOW for Greek shipments is the immediate need; abstraction can wait |
| Full operator dashboard / OMS | Low order volume does not justify the maintenance cost yet |
| Code implementation during this milestone | This milestone is planning-only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPL-01 | Phase 1 | Pending |
| DEPL-02 | Phase 1 | Pending |
| DEPL-03 | Phase 5 | Pending |
| CATA-01 | Phase 2 | Pending |
| CATA-02 | Phase 2 | Pending |
| CATA-03 | Phase 1 | Pending |
| CHKO-01 | Phase 2 | Pending |
| CHKO-02 | Phase 2 | Pending |
| CHKO-03 | Phase 3 | Pending |
| ORDR-01 | Phase 3 | Pending |
| ORDR-02 | Phase 3 | Pending |
| ORDR-03 | Phase 3 | Pending |
| ORDR-04 | Phase 3 | Pending |
| ORDR-05 | Phase 3 | Pending |
| SHIP-01 | Phase 4 | Pending |
| SHIP-02 | Phase 4 | Pending |
| SHIP-03 | Phase 4 | Pending |
| SECU-01 | Phase 1 | Pending |
| SECU-02 | Phase 3 | Pending |
| OPER-01 | Phase 3 | Pending |
| OPER-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after initial definition*
