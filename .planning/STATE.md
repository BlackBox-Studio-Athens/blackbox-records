---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Stripe Sandbox Integration
status: active
stopped_at: Phase 6.1.1 active; next implementation focus is 06.1.1-03 protected operator stock UI
last_updated: "2026-04-24T00:40:00+03:00"
last_activity: 2026-04-24 -- Landed internal stock ledger schema, D1-backed stock routes, and internal OpenAPI contract under /api/internal/variants/*
progress:
  total_phases: 9
  completed_phases: 4
  total_plans: 36
  completed_plans: 23
  percent: 64
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Ship a minimal native commerce flow that is operationally safe: the static site owns storefront presentation, the Worker backend owns dynamic commerce behavior, Stripe owns sellable items/pricing/payment, server routes own secrets and mutations, and stock changes happen only after verified webhooks.
**Current focus:** Phase 6.1.1: Internal Stock Operations And Operator Access

## Current Position

Current Phase: 6.1.1
Current Phase Name: Internal Stock Operations And Operator Access
Total Phases: 9
Current Plan: 3
Total Plans in Phase: 4
Status: Active
Progress: 61%
Last Activity: 2026-04-24
Last Activity Description: Landed internal stock ledger schema, D1-backed stock routes, and internal OpenAPI contract under /api/internal/variants/*
Paused At: Phase 6.1.1 active; next implementation focus is 06.1.1-03 protected operator stock UI

Phase summary: Phases 5, 5.1, 6, and 6.1 are complete. The repo now has a real backend-local D1 binding contract named `COMMERCE_DB`, Worker-compatible Prisma runtime access, committed SQL migration history, local seed SQL for current storefront cases, a first backend application reader that resolves offer availability by `storeItemSlug`, a typed operator-identity extraction seam for the separate Access-protected stock hostname, and an internal stock ledger API backed by `Stock`, `StockChange`, and `StockCount`. Phase 6.1.1 remains the active gate before Phase 7 checkout work starts.

## Performance Metrics

**Velocity:**

- Total plans completed: 17
- Total plans completed: 23
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 5 | 6 | Completed | 2026-04-20 |
| 5.1 | 4 | Completed | 2026-04-20 |
| 6 | 7 | Completed | 2026-04-21 |
| 6.1 | 4 | Completed | 2026-04-22 |
| 6.1.1 | 2 | Active | 2026-04-24 |

**Recent Trend:**

- Last 5 plans: 06.1-02, 06.1-03, 06.1-04, 06.1.1-01, 06.1.1-02
- Trend: Backend commerce-state foundation is complete, the protected operator auth boundary is locked, and the Worker now exposes a D1-backed internal stock ledger API before the operator UI phase.

## Accumulated Context

### Roadmap Evolution

- Phase 6.1.1 inserted after Phase 6.1: Internal Stock Operations And Operator Access (URGENT)
- Phase 6.1.1 was fully planned to cover operator auth, stock tooling, auditability, and spreadsheet policy before checkout depends on live stock.
- `/store/` replaced `/shop/` as the canonical native storefront route, with `/shop/` kept only as a compatibility redirect.
- The backend now exposes a typed Worker runtime binding contract with `COMMERCE_DB` as the first D1 binding.
- The backend now uses Prisma + `@prisma/adapter-d1` behind committed repository seams, while HTTP routes remain persistence-agnostic.
- The backend migration workflow is now Prisma-schema-driven but Wrangler-applied, with the current pre-production D1 schema consolidated into one baseline SQL migration under `apps/backend/prisma/migrations/`.
- The backend now has repo-owned local seed SQL and a first application-layer StoreOffer reader on top of the D1 repositories.
- The backend now has a typed Access-header extraction seam for `actor_email` on the future protected operator hostname.
- The backend now persists `Stock`, `StockChange`, and `StockCount` in D1 and exposes internal stock lookup/write routes under `/api/internal/variants/*`.
- Commerce naming was simplified to DDD-style label language: `StoreItem`, `ItemAvailability`, `StoreItemOption`, `StoreOffer`, `Stock`, `OnlineStock`, `StartCheckout`, `ReadCheckoutState`, and `not_paid`.

## Decisions Made

| Phase | Decision | Status |
|-------|----------|--------|
| v1.0 | Production remains GitHub Pages + Fourthwall until the future go-live milestone. | Active |
| v1.0 | The first native sellable slice is `/store/` collection -> store item detail -> dedicated checkout, with single-item `Buy Now` and no cart. | Active |
| v1.0 | v1 order state stays minimal: `pending_payment`, `paid`, `not_paid`, and `needs_review`, with Checkout webhooks as the authoritative paid/unpaid signals. | Active |
| v1.0 | MVP shipping is Greece only, BOX NOW locker selection happens before payment, and fulfillment stays manual through the partner portal. | Active |
| v1.1 | The Astro site remains a static frontend on GitHub Pages during this milestone. | Active |
| v1.1 | A separate Cloudflare Worker backend is the dynamic commerce surface for Stripe, webhooks, D1, and later BOX NOW backend work. | Active |
| v1.1 | The Worker is a backend/BFF, not the primary frontend runtime. | Active |
| v1.1 | The Worker does not expose default synthetic probe routes such as `healthz`, `status`, or `readyz`; runtime checks rely on Wrangler, deploy success, and real API tests. | Active |
| v1.1 | Backend application code is TypeScript-only and uses Hono only as the HTTP interface layer. | Active |
| v1.1 | The backend owns HTTP contracts through code-first OpenAPI, emitted as separate public/internal documents, and the frontend consumes generated clients from `@blackbox/api-client`. | Active |
| v1.1 | Backend modules must stay DDD-layered, use ubiquitous-language names, and ship with mandatory tests. | Active |
| v1.1 | Astro content owns editorial content only, Stripe owns sellable commerce data, and D1 owns operational state plus internal mappings. | Active |
| v1.1 | The primary sellable unit is a `Variant` attached to a storefront-facing `StoreItem`. | Active |
| v1.1 | Phase 5.1 is inserted as a hard architecture gate before further storefront or checkout work. | Active |
| v1.1 | `/store/` is the canonical native storefront route; `/shop/` is compatibility-only. | Active |
| v1.1 | Phase 6 storefront UI composes stable `StoreItem` plus `ItemAvailability` contracts and keeps temporary offer state out of editorial content. | Active |
| v1.1 | Internal stock operations use Google-backed Cloudflare Access on a separate protected backend hostname; Decap auth is not reused for runtime stock writes. | Active |
| v1.1 | D1 is the authoritative stock ledger using `Stock`, `StockChange`, and `StockCount`; spreadsheets are temporary capture/reporting only. | Active |
| v1.1 | Each `Variant` exposes a conservative `OnlineStock` quantity separate from total stock balance before public checkout depends on live stock. | Active |

### Pending Todos

- Keep future backend routes inside the OpenAPI contract/generation workflow; do not add handwritten frontend DTOs for backend APIs.
- Preserve the current `StoreItem` and `ItemAvailability` storefront contracts while later backend APIs grow on top of the completed Phase 6.1 foundation.
- Build the planned Phase 06.1.1-03 protected operator stock UI on top of the landed internal stock API and ledger contract.
- Continue the planned Phase 6.1.1 stock-ops/auth work before Phase 7 starts.

## Blockers

- No production cutover work is approved in this milestone.
- Public shopper and sandbox browsing surfaces are not yet treated as strongly access-controlled; do not expose internal stock-write routes until the Phase 6.1.1 Access boundary exists.
- The Astro frontend is no longer being treated as “moving to Workers” in this milestone; do not reintroduce that assumption in implementation.
- Phase 7 checkout work remains blocked on the remaining Phase 6.1.1 operator UI and operator workflow steps.

## Session

**Last Date:** 2026-04-22T01:52:14.9376385+03:00
**Stopped At:** Phase 6.1.1 active; next implementation focus is 06.1.1-03 protected operator stock UI
**Resume File:** .planning/ROADMAP.md

