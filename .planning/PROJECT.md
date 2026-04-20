# BlackBox Records Native Commerce Migration

## What This Is

This project migrates BlackBox Records from a static GitHub Pages + Fourthwall storefront handoff to native commerce inside the existing Astro site. The active milestone now uses a dual-deploy architecture:

- the Astro site remains a static frontend deployed to GitHub Pages
- a separate Cloudflare Worker backend is added in-repo for dynamic commerce APIs, Stripe integration, webhooks, and D1 state

The live production checkout remains unchanged until a later go-live milestone.

## Core Value

Ship a minimal native commerce flow that is operationally safe: the static site owns storefront presentation, the Worker backend owns dynamic commerce behavior, Stripe owns sellable catalog/pricing/payment, server routes own secrets and mutations, and inventory changes happen only after verified webhooks.

## Current Milestone: v1.1 Stripe Sandbox Integration

**Goal:** Implement and validate the first end-to-end native commerce sandbox flow using a static Astro frontend plus a separate Cloudflare Worker backend, without cutting over production traffic.

**Target features:**
- separate Cloudflare Worker backend added to the existing Astro repo
- explicit frontend-to-Worker environment and deployment contract
- dedicated architecture gate for entity boundaries, IDs, mappings, and API contracts
- native `/shop/` collection and product detail built from a unified shop projection across releases and distro
- Worker-backed D1 + Prisma foundation before Stripe checkout integration
- Greece-only BOX NOW locker selection before payment
- Stripe embedded Checkout in sandbox with Worker-created Checkout Sessions
- D1-backed order and inventory state driven by verified Stripe webhooks hitting the Worker backend
- sandbox validation package and human review handoff for the future go-live milestone

## Requirements

### Validated

- ✓ Public storefront pages render from Astro content collections on a static GitHub Pages deployment — existing brownfield baseline
- ✓ Top-level section navigation is managed by the persistent app shell instead of full document swaps — existing brownfield baseline
- ✓ `/shop/` and distro/shop links currently hand off commerce to external Fourthwall — current production behavior
- ✓ Editorial content is maintained in Astro collections with Decap CMS on top — existing brownfield baseline
- ✓ Pre-sandbox commerce runtime, trust boundary, UI, and shipping decisions were captured and archived — v1.0

### Active

- [ ] Keep the Astro site static and deployed to GitHub Pages while adding a separate Worker backend for commerce
- [ ] Define and document the Worker backend runtime, auth, secrets, and deployment contract
- [ ] Freeze the commerce entity model, source-of-truth split, IDs, mappings, and APIs before storefront or checkout implementation
- [ ] Replace the current external shop redirect with a native in-site store flow built from a shared `ShopItem` projection over releases and distro
- [ ] Introduce Worker-side D1 + Prisma before Stripe checkout integration
- [ ] Use Stripe Products and Prices as the canonical sellable catalog and pricing source once checkout integration begins
- [ ] Use D1 only for inventory, order lifecycle, and internal mappings, with server-owned writes
- [ ] Enforce Greece-only BOX NOW locker selection before payment in v1
- [ ] Finish the milestone with sandbox validation evidence and a clear handoff to the go-live milestone

### Out of Scope

- Production cutover in this milestone
- Live-mode Stripe keys or real-money processing
- Inventory reservation before payment confirmation
- Browser-side writes to inventory or authoritative order state
- A full operator dashboard, ERP, or warehouse management layer
- Multi-item cart or multi-carrier shipping

## Context

The current repository is an Astro 5 storefront with a React-managed app shell, Astro content collections, and Decap CMS-backed editorial content. Production remains a static GitHub Pages deployment where `/shop/` redirects externally to Fourthwall. That current experience is the live baseline, not the long-term target.

The corrected milestone architecture is now dual deploy. The Astro site remains the static frontend and content owner. A separate Cloudflare Worker backend becomes the dynamic commerce surface for:

- sellable catalog lookups when needed
- checkout session creation
- Stripe webhook handling
- D1-backed inventory and order lifecycle state
- later BOX NOW backend work

This means the Astro site is no longer being treated as “moving to Workers” in this milestone. Instead, the frontend and backend are split intentionally:

- Astro content collections own editorial content and shop presentation inputs
- Stripe owns sellable commerce data needed for checkout
- D1 owns operational state plus internal mappings
- the Worker is the backend/BFF between the browser and Stripe/D1

The new inserted Phase 5.1 is the architecture gate for this split. It must lock the domain model before implementation drifts into ad hoc duplication across content, Stripe, and D1.

Current repo facts shape that decision. `releases` already reference `artists`, while `distro` carries editorial card content and Fourthwall URLs but no sellable identity or inventory model. That makes a projection layer necessary. The projection should not stuff temporary commerce fields directly into the editorial collections. Instead, it should produce a stable `ShopItem` view and link that to sellable `Offer/SKU` identities through Worker-side mappings.

## Constraints

- **Existing architecture**: Keep the Astro content/app-shell structure intact unless a milestone phase explicitly changes it
- **Frontend deployment**: GitHub Pages remains the active frontend deployment target during this milestone
- **Backend runtime**: Dynamic commerce behavior must target a separate Cloudflare Worker backend
- **Production safety**: Live GitHub Pages + Fourthwall behavior stays untouched during sandbox implementation
- **Security**: Stripe secrets, webhook secrets, and D1 access must remain server-only in the Worker backend and local development
- **Payment authority**: Webhooks are authoritative for paid state
- **Inventory semantics**: Inventory decrements only after webhook-confirmed payment success, with no v1 reservation logic
- **Shipping scope**: v1 shipping is Greece-only through BOX NOW lockers
- **Operations**: Expected order volume is low, so recurring cost and maintenance burden must stay minimal

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep the Astro site as a static GitHub Pages frontend during this milestone | Lowest-risk brownfield path that preserves the current content and app-shell model | ✓ Good |
| Add a separate Cloudflare Worker backend in the same repo | Creates the minimal dynamic surface for Stripe, webhooks, and D1 without forcing a frontend hosting migration | ✓ Good |
| Treat the Worker as a backend/BFF, not the primary frontend runtime | Matches the intended architecture and keeps the browser away from secrets and operational writes | ✓ Good |
| Use an `Offer/SKU` layer beneath storefront-facing shop items | Separates editorial entities from sellable units, stock, and Stripe mappings | ✓ Good |
| Astro content owns editorial content only | Prevents operational and payment concerns from polluting content collections | ✓ Good |
| Stripe owns sellable commerce data needed for checkout | Avoids duplicate product/price administration in the app layer | ✓ Good |
| D1 owns operational state plus internal mappings | Keeps inventory, order lifecycle, and Stripe mappings in one backend-owned store | ✓ Good |
| Add Phase 5.1 as a hard architecture gate before storefront or checkout work continues | Prevents rework and model drift across content, backend state, and Stripe | ✓ Good |
| Use Prisma for runtime database access while staying on D1 | Improves readability and maintainability without forcing an immediate database change | ✓ Good |
| Use Prisma schema plus `prisma migrate diff`, with Wrangler D1 migrations applying SQL | Matches Prisma's current D1 guidance without pretending Prisma-only migrations are first-class on D1 | ✓ Good |
| Production cutover is deferred to a future go-live milestone | Keeps sandbox implementation and production launch risks separate | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-20 after realigning to the dual-deploy commerce architecture*
