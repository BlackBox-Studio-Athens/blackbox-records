# BlackBox Records Native Commerce Migration

## What This Is

This project plans a production-safe migration of the existing BlackBox Records Astro storefront from an external Fourthwall handoff to native commerce inside the site. It is a brownfield effort on top of the current Astro 5 app-shell/content architecture, and this milestone is planning-only: define the runtime decision, architecture boundaries, phased roadmap, and launch controls before any implementation starts.

## Core Value

Ship a minimal native commerce flow that is operationally safe: Stripe handles catalog/pricing/payment, server-owned logic handles checkout and webhooks, and inventory changes happen only after webhook-confirmed payment success.

## Requirements

### Validated

- ✓ Public storefront pages render from Astro content collections on a static GitHub Pages deployment — existing
- ✓ Top-level section navigation is managed by the persistent app shell instead of full document swaps — existing
- ✓ `/shop/` and distro/shop links currently hand off commerce to external Fourthwall — existing
- ✓ Editorial content is maintained in Astro collections with Decap CMS on top — existing

### Active

- [ ] Replace the current external shop redirect model with native in-site commerce backed by Stripe Checkout embedded form flows
- [ ] Use Stripe Products and Prices as the canonical catalog and pricing source
- [ ] Use Supabase only for inventory and order lifecycle state, with server-owned writes
- [ ] Support BOX NOW locker selection for Greek shipments in the checkout/order flow
- [ ] Decide the target runtime/hosting model before any commerce implementation work starts
- [ ] Produce planning artifacts only in this milestone: roadmap, ADRs, backlog, review gates, and launch/readiness checklist

### Out of Scope

- Inventory reservation before payment confirmation — explicitly deferred because v1 should decrement stock only after webhook-confirmed payment
- Browser-side writes to inventory or authoritative order state — violates the intended trust boundary
- A full operator dashboard, ERP, or warehouse management layer — too heavy for the expected order volume
- Multi-carrier shipping abstraction — unnecessary before the BOX NOW path is proven
- Implementation work in this milestone — this effort is planning-only

## Context

The current repository is an Astro 5 storefront with `output: 'static'`, deployed to GitHub Pages, with app-shell-managed top-level navigation and Astro content collections surfaced through Decap CMS. Commerce is currently externalized through Fourthwall via `/shop/`, distro cards, and merch links. That existing architecture is stable and should be preserved where it continues to make sense.

The migration target is intentionally narrow. Stripe should own products, prices, and payment state. Supabase should own only inventory and order lifecycle state. The browser should never receive permission to mutate authoritative inventory or orders. Stripe webhooks, not the browser return page, should be authoritative for successful payment. v1 should not implement reservation logic before payment.

Current official docs also shape the plan. Astro supports adding a server adapter while keeping most routes prerendered and opting specific pages/endpoints out with `prerender = false`. Stripe’s current Checkout Session API reference exposes `ui_mode: embedded_page`, while some older guide prose still says `embedded`, so the roadmap needs an explicit API-version/terminology decision before implementation. BOX NOW’s current API material exposes a locker `locationId` and widget/custom integration path, which fits the Greek-shipping requirement without forcing a heavyweight fulfillment build on day one.

## Constraints

- **Existing architecture**: Keep the current Astro content/app-shell structure intact unless a migration phase explicitly changes it — avoids unnecessary brownfield churn
- **Deployment**: The current GitHub Pages-only static deployment cannot host live checkout creation or webhook routes — Phase 1 must decide the adapter/runtime path
- **Security**: Stripe secret keys, webhook secrets, and any Supabase service-role credentials must remain server-only — prevents privileged browser writes
- **Payment authority**: Webhooks are authoritative for paid state — browser redirect/return flows are informative only
- **Inventory semantics**: Inventory is decremented only after webhook-confirmed payment success, with no v1 reservation logic — matches the requested risk model
- **Operations**: Expected order volume is low, so recurring cost and maintenance burden must stay minimal — avoid over-engineering
- **Portability**: Prefer runtime and integration choices that are portable and not deeply locked to a single hosting platform — protects future moves
- **Scope**: This milestone must stop at planning artifacts — no code, migrations, endpoints, components, or deployment/config changes yet

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| First roadmap phase decides hosting/runtime | The current static GitHub Pages deployment cannot safely host embedded checkout session creation or webhooks | — Pending |
| Stripe is the source of truth for catalog/pricing/payment state | Minimizes duplicated admin surfaces and keeps pricing out of Astro content files | — Pending |
| Supabase is limited to inventory and order lifecycle state | Keeps the data model narrow and avoids duplicating catalog ownership | — Pending |
| Browser writes stay away from inventory/orders | Protects stock and order status from untrusted clients | — Pending |
| v1 inventory decrements only after webhook-confirmed payment, with no reservation logic | Matches the requested safety semantics and keeps the first release simple | — Pending |
| BOX NOW locker selection is required for Greek shipments, but automation depth should be kept minimal in v1 | Meets shipping requirements while respecting low order volume and maintenance constraints | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-06 after initialization*
