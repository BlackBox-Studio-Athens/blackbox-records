# BlackBox Records Native Commerce Migration

## What This Is

This project migrates BlackBox Records from a static GitHub Pages + Fourthwall storefront handoff to native commerce inside the existing Astro site. The current milestone implements the agreed sandbox architecture on Cloudflare Workers + D1 and validates the flow in Stripe sandbox, while the live production checkout remains unchanged until a later go-live milestone.

## Core Value

Ship a minimal native commerce flow that is operationally safe: the site owns the storefront, Stripe owns catalog/pricing/payment, server routes own secrets and mutations, and inventory changes happen only after verified webhooks.

## Current Milestone: v1.1 Stripe Sandbox Integration

**Goal:** Implement and validate the first end-to-end native commerce flow in sandbox on Cloudflare Workers + D1 without cutting over production traffic.

**Target features:**
- Cloudflare Workers + D1 sandbox runtime added to the existing Astro storefront
- Native `/shop/` collection, product detail, and single-item `Buy Now` flow
- Greece-only BOX NOW locker selection before payment
- Stripe embedded Checkout in sandbox with server-created Checkout Sessions
- D1-backed order and inventory state driven by verified Stripe webhooks
- Sandbox validation package and human review handoff for the future go-live milestone

## Requirements

### Validated

- ✓ Public storefront pages render from Astro content collections on a static GitHub Pages deployment — existing brownfield baseline
- ✓ Top-level section navigation is managed by the persistent app shell instead of full document swaps — existing brownfield baseline
- ✓ `/shop/` and distro/shop links currently hand off commerce to external Fourthwall — current production behavior
- ✓ Editorial content is maintained in Astro collections with Decap CMS on top — existing brownfield baseline
- ✓ Pre-sandbox commerce runtime, trust boundary, UI, and shipping decisions were captured and archived — v1.0

### Active

- [ ] Replace the current external shop redirect with a native in-site store flow in Stripe sandbox
- [ ] Deploy the Astro site to Cloudflare Workers for sandbox-only server routes while preserving the current content/app-shell architecture
- [ ] Use Stripe Products and Prices as the canonical sellable catalog and pricing source
- [ ] Use D1 only for inventory and order lifecycle state, with server-owned writes
- [ ] Enforce Greece-only BOX NOW locker selection before payment in v1
- [ ] Finish the milestone with sandbox validation evidence and a clear handoff to the go-live milestone

### Out of Scope

- Production cutover in this milestone — sandbox integration must finish and be reviewed before live traffic changes
- Live-mode Stripe keys or real-money processing — this milestone stays in sandbox
- Inventory reservation before payment confirmation — explicitly deferred because stock decrements only after verified payment
- Browser-side writes to inventory or authoritative order state — violates the trust boundary
- A full operator dashboard, ERP, or warehouse management layer — too heavy for the expected order volume
- Multi-item cart or multi-carrier shipping — unnecessary before the first single-item Greek flow is proven

## Context

The current repository is an Astro 5 storefront with a React-managed app shell, Astro content collections, and Decap CMS-backed editorial content. Production remains a static GitHub Pages deployment where `/shop/` redirects externally to Fourthwall. That current experience is the live baseline, not the long-term target.

The pre-sandbox planning milestone locked the implementation shape. Astro will move to Cloudflare Workers for the native commerce runtime, with D1 as the narrow operational store for inventory and order lifecycle state. Stripe remains the authority for products, prices, Checkout Sessions, and payment state. BOX NOW applies only to Greece in v1, with locker selection before payment and manual partner-portal fulfillment after paid orders land.

Current official docs matter here. Astro’s on-demand rendering guidance allows adding the Cloudflare adapter while keeping most routes prerendered and opting specific commerce pages and endpoints out with `prerender = false`. Cloudflare Workers Free and D1 Free are currently large enough for the projected low volume. Stripe’s current embedded Checkout docs use `ui_mode: embedded`, not the older `embedded_page` phrasing, and require `return_url` unless redirects are explicitly disabled. Stripe sandbox and Stripe CLI flows are the expected validation path for this milestone.

## Constraints

- **Existing architecture**: Keep the current Astro content/app-shell structure intact unless a milestone phase explicitly changes it — avoids unnecessary brownfield churn
- **Runtime**: Sandbox implementation must target Cloudflare Workers + D1 — approved in the archived pre-sandbox milestone
- **Production safety**: Live GitHub Pages + Fourthwall behavior stays untouched during sandbox implementation — prevents accidental early cutover
- **Security**: Stripe secrets, webhook secrets, and D1 access must remain server-only in Workers and local development — prevents privileged browser writes
- **Payment authority**: Webhooks are authoritative for paid state — browser redirect/return flows are informative only
- **Inventory semantics**: Inventory decrements only after webhook-confirmed payment success, with no v1 reservation logic — matches the approved risk model
- **Shipping scope**: v1 shipping is Greece-only through BOX NOW lockers — avoids inventing a second shipping path early
- **Operations**: Expected order volume is low, so recurring cost and maintenance burden must stay minimal — avoid over-engineering

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Astro on Cloudflare Workers for the native commerce runtime | Lowest recurring cost and lowest-ops path that still supports server routes and webhooks | ✓ Good |
| Use D1 for inventory and order lifecycle state | Keeps the operational state narrow and colocated with the Worker runtime | ✓ Good |
| Keep separate D1 databases for beta and production, with local D1 for development | Simpler and safer than schema or table-prefix isolation, and still fits the current free-tier limits | ✓ Good |
| Use Prisma for runtime database access while staying on D1 | Improves readability and maintainability without forcing an immediate database change | ✓ Good |
| Use Prisma schema plus `prisma migrate diff`, with Wrangler D1 migrations applying SQL | Matches Prisma's current D1 guidance without pretending Prisma-only migrations are first-class on D1 | ✓ Good |
| Keep Stripe as the authority for catalog, pricing, Checkout Sessions, and payment state | Avoids duplicate admin surfaces and keeps pricing in the payment system | ✓ Good |
| Keep browser code away from authoritative order and inventory writes | Protects stock and paid-order state from untrusted clients | ✓ Good |
| Use current embedded Checkout terminology and request shape | Stripe’s current docs use `ui_mode: embedded`, `return_url`, and optional `redirect_on_completion` tuning | ✓ Good |
| v1 shipping is Greece-only BOX NOW with pre-payment locker selection and manual fulfillment | Matches the low-volume shipping requirement without overbuilding automation | ✓ Good |
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
*Last updated: 2026-04-20 during Phase 5 discussion*
