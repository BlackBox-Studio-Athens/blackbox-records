# BlackBox Records Native Commerce Migration

## What This Is

This project migrates BlackBox Records from a static GitHub Pages + Fourthwall storefront handoff to native commerce inside the existing Astro site. The active milestone now uses a Cloudflare-fronted dual-runtime architecture:

- the Astro site remains a static frontend and will move from GitHub Pages to Cloudflare Pages during Phase 7.1
- a separate Cloudflare Worker backend is added in-repo for dynamic commerce APIs, Stripe integration, webhooks, and D1 state

The live production checkout remains unchanged until a later go-live milestone.

## Core Value

Ship a minimal native commerce flow that is operationally safe: the static site owns storefront presentation, the Worker backend owns dynamic commerce behavior, Stripe owns sellable items/pricing/payment, server routes own secrets and mutations, and stock changes happen only after verified webhooks.

## Current Milestone: v1.1 Stripe Sandbox Integration

**Goal:** Implement and validate the first end-to-end native commerce sandbox flow using a static Astro frontend plus a separate Cloudflare Worker backend, without cutting over production traffic.

**Target features:**

- separate Cloudflare Worker backend added to the existing Astro repo
- explicit frontend-to-Worker environment and deployment contract
- dedicated architecture gate for entity boundaries, IDs, mappings, and API contracts
- backend-owned code-first OpenAPI documents with a generated `@blackbox/api-client` package for frontend consumption
- native `/store/` collection, store item detail, and checkout shell built from a unified `StoreItem` projection across releases and distro
- Worker-backed D1 + Prisma foundation before Stripe checkout integration
- protected internal stock operations surface on a separate backend hostname for label staff
- D1-led stock ledger around `Variant`, `Stock`, `StockChange`, and `StockCount`, with a conservative `OnlineStock` quantity for the public storefront
- Greece-only BOX NOW locker selection before payment
- Shopify-familiar single-item cart affordances and Stripe embedded Checkout in sandbox with Worker-created Checkout Sessions
- all-current-items local mock checkout readiness for current distro and release items without treating fake local stock as real label inventory
- Cloudflare Pages static frontend migration before webhook/order/shipping verification depends on final hosted origins
- D1-backed order and stock state driven by verified Stripe webhooks hitting the Worker backend
- sandbox validation package and human review handoff for the future go-live milestone

## Requirements

### Validated

- ✓ Public storefront pages render from Astro content collections on a static GitHub Pages deployment — existing brownfield baseline
- ✓ Top-level section navigation is managed by the persistent app shell instead of full document swaps — existing brownfield baseline
- ✓ `/shop/` and distro/shop links previously handed off commerce to external Fourthwall — legacy baseline before native `/store/`
- ✓ Editorial content is maintained in Astro collections with Decap CMS on top — existing brownfield baseline
- ✓ Pre-sandbox commerce runtime, trust boundary, UI, and shipping decisions were captured and archived — v1.0
- ✓ Separate Cloudflare Worker backend foundation, sandbox deployment path, and server-only secret model are in place — Phase 5
- ✓ Commerce entity model, source-of-truth split, IDs, mappings, and backend-owned OpenAPI contract are frozen — Phase 5.1
- ✓ Native `/store/` browse, store item detail, checkout shell, and canonical release/distro-to-store linking are implemented in the static frontend — Phase 6

### Active

- [ ] Introduce Worker-side D1 + Prisma before Stripe checkout integration
- [ ] Protect internal stock operations with Cloudflare Access + Google on a separate backend hostname
- [ ] Give label staff a thin internal stock tool for `StockChange`, `StockCount`, and recent stock history
- [ ] Use Stripe Products and Prices as the canonical sellable item and pricing source once checkout integration begins
- [x] Correct shopper-facing store URLs so they describe the purchased item option instead of legacy release shorthand
- [ ] Add a single-item cart icon, cart drawer, and familiar checkout layout before sandbox validation
- [ ] Make stripe-mock local checkout readiness cover every current distro and release item with clearly fake local stock
- [ ] Use D1 only for stock, order lifecycle, and internal mappings, with server-owned writes
- [ ] Treat spreadsheets as temporary capture/reporting only, never as an authoritative stock system
- [ ] Enforce Greece-only BOX NOW locker selection before payment in v1
- [ ] Move the static frontend from GitHub Pages to Cloudflare Pages after checkout wiring and before webhook/order/shipping verification
- [ ] Finish the milestone with sandbox validation evidence and a clear handoff to the go-live milestone

### Out of Scope

- Production cutover in this milestone
- Live-mode Stripe keys or real-money processing
- Stock reservation before payment confirmation
- Browser-side writes to stock or authoritative order state
- A full operator dashboard, ERP, or warehouse management layer
- True multi-item cart or multi-carrier shipping

## Context

The current repository is an Astro storefront with a React-managed app shell, Astro content collections, and Decap CMS-backed editorial content. The previous production baseline redirected `/shop/` externally to Fourthwall. The active native storefront contract now uses `/store/` as the canonical collection route, while `/shop/` remains a compatibility redirect during migration.

The corrected milestone architecture is now dual runtime. The Astro site remains the static frontend and content owner. A separate Cloudflare Worker backend becomes the dynamic commerce surface for:

- sellable item lookups when needed
- checkout session creation
- Stripe webhook handling
- D1-backed stock and order lifecycle state
- internal stock operations and operator-facing write APIs
- later BOX NOW backend work

This means the Astro site is no longer being treated as “moving to Workers” in this milestone. Instead, the frontend and backend are split intentionally. Phase 7.1 changes the static frontend host from GitHub Pages to Cloudflare Pages, but it does not merge the Worker backend into Pages Functions:

- Astro content collections own editorial content and shop presentation inputs
- Stripe owns sellable commerce data needed for checkout
- D1 owns operational state plus internal mappings
- the Worker is the backend/BFF between the browser and Stripe/D1

The stock model is now also explicit enough for offline retail reality. A storefront-facing `StoreItem` points to one or more sellable `Variant` records. D1 tracks `Stock` plus a conservative `OnlineStock` quantity for each `Variant`, and staff update stock through `StockChange` and `StockCount` workflows behind the Worker. Spreadsheets can remain temporary event-capture or reporting tools, but never become the authoritative ledger again.

The new inserted Phase 5.1 is the architecture gate for this split. It must lock the domain model before implementation drifts into ad hoc duplication across content, Stripe, and D1.

Current repo facts shape that decision. `releases` already reference `artists`, while `distro` carries editorial card content and Fourthwall URLs but no sellable identity or stock model. That makes a projection layer necessary. The projection should not stuff temporary commerce fields directly into the editorial collections. Instead, it should produce a stable `StoreItem` view and link that to sellable `Variant` identities through Worker-side mappings.

That frontend projection layer is now live. `/store/` is the canonical native storefront route, `/shop/` is a compatibility redirect, release pages route into canonical store PDPs when mapped, distro cards route into the same PDP system, and the static checkout shell is in place for the later Worker-backed embedded Checkout flow. Phase 7 corrected the first route-identity problem: a shopper buying the Black Vinyl LP option for Afterwise's `Disintegration` now sees `/store/disintegration-black-vinyl-lp/`, while legacy `/store/barren-point/` remains a compatibility redirect.

Current inventory knowledge also shapes Phase 7. The current site items are real sellable items across both distro and releases, but real quantities are not yet counted. Local stripe-mock checkout readiness may therefore use fake development stock and mock Stripe mappings for every current item so the buying path is testable, while sandbox and production buyability still require staff-recorded D1 stock counts and real Stripe mappings.

## Constraints

- **Existing architecture**: Keep the Astro content/app-shell structure intact unless a milestone phase explicitly changes it
- **Frontend deployment**: GitHub Pages remains the active frontend deployment target until Phase 7.1 validates Cloudflare Pages and marks it canonical
- **Backend runtime**: Dynamic commerce behavior must target a separate Cloudflare Worker backend
- **Production safety**: Live GitHub Pages + Fourthwall behavior stays untouched during sandbox implementation
- **Security**: Stripe secrets, webhook secrets, and D1 access must remain server-only in the Worker backend and local development
- **Payment authority**: Webhooks are authoritative for paid state
- **Stock semantics**: Stock decrements only after webhook-confirmed payment success, with no v1 reservation logic
- **Shipping scope**: v1 shipping is Greece-only through BOX NOW lockers
- **Operations**: Expected order volume is low, so recurring cost and maintenance burden must stay minimal

## Key Decisions

| Decision                                                                                                     | Rationale                                                                                                                                  | Outcome |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| Keep the Astro site static while moving canonical hosting from GitHub Pages to Cloudflare Pages in Phase 7.1 | Preserves the content/app-shell model while aligning frontend hosting with the Cloudflare Worker backend before final sandbox verification | ✓ Good  |
| Add a separate Cloudflare Worker backend in the same repo                                                    | Creates the minimal dynamic surface for Stripe, webhooks, and D1 without forcing a frontend hosting migration                              | ✓ Good  |
| Treat the Worker as a backend/BFF, not the primary frontend runtime                                          | Matches the intended architecture and keeps the browser away from secrets and operational writes                                           | ✓ Good  |
| Do not expose synthetic probe endpoints such as `healthz`, `status`, or `readyz` by default                  | This backend is a thin Worker, not a containerized service with a separate actuator-style ops surface                                      | ✓ Good  |
| Keep backend application code TypeScript-only                                                                | Prevents split language conventions and keeps backend contracts and domain models type-safe                                                | ✓ Good  |
| Use Hono only as the Worker HTTP interface layer                                                             | Standardizes routing and JSON/error handling without pushing framework concerns into domain logic                                          | ✓ Good  |
| Use backend-owned code-first OpenAPI with separate public/internal documents and a generated client package  | Keeps the HTTP boundary explicit, avoids frontend imports of backend runtime code, and makes contract drift reviewable                     | ✓ Good  |
| Keep backend code DDD-layered with business names and mandatory tests                                        | Stops backend growth from turning into route-level business logic and locks clean coding expectations early                                | ✓ Good  |
| Use a `Variant` layer beneath storefront-facing store items                                                  | Separates editorial entities from sellable units, stock, and Stripe mappings                                                               | ✓ Good  |
| Astro content owns editorial content only                                                                    | Prevents operational and payment concerns from polluting content collections                                                               | ✓ Good  |
| Stripe owns sellable commerce data needed for checkout                                                       | Avoids duplicate product/price administration in the app layer                                                                             | ✓ Good  |
| D1 owns operational state plus internal mappings                                                             | Keeps stock, order lifecycle, and Stripe mappings in one backend-owned store                                                               | ✓ Good  |
| Protect internal stock operations with Cloudflare Access + Google on a separate backend hostname             | Gives label staff shared access without turning shopper flows into a login product                                                         | ✓ Good  |
| Use `Stock`, `StockChange`, and `StockCount` as the stock ledger language                                    | Keeps the operator model understandable and matches offline reconciliation needs                                                           | ✓ Good  |
| Keep spreadsheets as temporary capture/reporting only                                                        | Avoids dual sources of truth between D1 and ad hoc spreadsheets                                                                            | ✓ Good  |
| Track a conservative `OnlineStock` quantity alongside total stock balance                                    | Reduces oversell risk when offline sales are reconciled later                                                                              | ✓ Good  |
| Use Shopify-familiar cart affordances without implementing a true multi-item cart                            | Gives shoppers a familiar buying path while preserving the low-risk single-item MVP and backend authority boundaries                       | ✓ Good  |
| Make shopper-facing store URLs describe the sellable item option                                             | Avoids exposing legacy release shorthand or backend mapping names as the primary buying URL                                                | ✓ Good  |
| Let stripe-mock mode use fake local stock for every current item                                             | Makes the local buying path testable across real distro and release entries without pretending unknown quantities are real label stock     | ✓ Good  |
| Add Phase 5.1 as a hard architecture gate before storefront or checkout work continues                       | Prevents rework and model drift across content, backend state, and Stripe                                                                  | ✓ Good  |
| Use Prisma for runtime database access while staying on D1                                                   | Improves readability and maintainability without forcing an immediate database change                                                      | ✓ Good  |
| Use Prisma schema plus `prisma migrate diff`, with Wrangler D1 migrations applying SQL                       | Matches Prisma's current D1 guidance without pretending Prisma-only migrations are first-class on D1                                       | ✓ Good  |
| Production cutover is deferred to a future go-live milestone                                                 | Keeps sandbox implementation and production launch risks separate                                                                          | ✓ Good  |

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

_Last updated: 2026-04-25 after completing the canonical store item URL correction_
