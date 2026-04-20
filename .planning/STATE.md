---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Stripe Sandbox Integration
status: active
stopped_at: Phase 6.1.1 planned for operator auth and internal stock tooling
last_updated: "2026-04-20T23:59:00.000Z"
last_activity: 2026-04-20 -- Added backend-owned code-first OpenAPI foundation and generated API client package
progress:
  total_phases: 9
  completed_phases: 0
  total_plans: 28
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** Ship a minimal native commerce flow that is operationally safe: the static site owns storefront presentation, the Worker backend owns dynamic commerce behavior, Stripe owns sellable catalog/pricing/payment, server routes own secrets and mutations, and inventory changes happen only after verified webhooks.
**Current focus:** Phase 5: Worker Backend Platform And Deployment Plumbing

## Current Position

Current Phase: 5
Current Phase Name: Worker Backend Platform And Deployment Plumbing
Total Phases: 9
Current Plan: 1
Total Plans in Phase: 6
Status: Ready to execute
Progress: 0%
Last Activity: 2026-04-20
Last Activity Description: Added backend-owned code-first OpenAPI foundation and generated API client package
Paused At: Phase 6.1.1 planned for operator auth and internal stock tooling

Phase summary: Phase 5 now owns the separate Worker backend foundation. Phase 5.1 is the hard architecture gate for entities, source-of-truth, IDs, mappings, and APIs. Phase 6 remains the static storefront slice, Phase 6.1 moves D1 + Prisma into the Worker backend, Phase 6.1.1 adds protected operator auth plus internal stock tooling, and Phase 7 becomes Worker-owned checkout plus frontend integration.

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: Stable

## Accumulated Context

### Roadmap Evolution

- Phase 6.1.1 inserted after Phase 6.1: Internal Stock Operations And Operator Access (URGENT)
- Phase 6.1.1 was fully planned to cover operator auth, stock tooling, auditability, and spreadsheet policy before checkout depends on live stock.

## Decisions Made

| Phase | Decision | Status |
|-------|----------|--------|
| v1.0 | Production remains GitHub Pages + Fourthwall until the future go-live milestone. | Active |
| v1.0 | The first native sellable slice is `/shop/` collection -> product detail -> dedicated checkout, with single-item `Buy Now` and no cart. | Active |
| v1.0 | v1 order state stays minimal: `pending_payment`, `paid`, `closed_unpaid`, and `needs_review`, with Checkout-session webhooks as the authoritative paid/unpaid signals. | Active |
| v1.0 | MVP shipping is Greece only, BOX NOW locker selection happens before payment, and fulfillment stays manual through the partner portal. | Active |
| v1.1 | The Astro site remains a static frontend on GitHub Pages during this milestone. | Active |
| v1.1 | A separate Cloudflare Worker backend is the dynamic commerce surface for Stripe, webhooks, D1, and later BOX NOW backend work. | Active |
| v1.1 | The Worker is a backend/BFF, not the primary frontend runtime. | Active |
| v1.1 | The Worker does not expose default synthetic probe routes such as `healthz`, `status`, or `readyz`; runtime checks rely on Wrangler, deploy success, and real API tests. | Active |
| v1.1 | Backend application code is TypeScript-only and uses Hono only as the HTTP interface layer. | Active |
| v1.1 | The backend owns HTTP contracts through code-first OpenAPI, emitted as separate public/internal documents, and the frontend consumes generated clients from `@blackbox/api-client`. | Active |
| v1.1 | Backend modules must stay DDD-layered, use ubiquitous-language names, and ship with mandatory tests. | Active |
| v1.1 | Astro content owns editorial content only, Stripe owns sellable commerce data, and D1 owns operational state plus internal mappings. | Active |
| v1.1 | The primary sellable unit is a `Variant` attached to a storefront-facing `CatalogItem`. | Active |
| v1.1 | Phase 5.1 is inserted as a hard architecture gate before further storefront or checkout work. | Active |
| v1.1 | Internal stock operations use Google-backed Cloudflare Access on a separate protected backend hostname; Decap auth is not reused for runtime stock writes. | Active |
| v1.1 | D1 is the authoritative stock ledger using `StockBalance`, `StockChange`, and `StockCount`; spreadsheets are temporary capture/reporting only. | Active |
| v1.1 | Each `Variant` exposes a conservative `online_available` quantity separate from total stock balance before public checkout depends on live stock. | Active |

### Pending Todos

- Execute the rewritten Phase 5 backend-platform plans.
- Keep future backend routes inside the OpenAPI contract/generation workflow; do not add handwritten frontend DTOs for backend APIs.
- Complete Phase 5.1 before implementing Phase 6, 6.1, or 7 against the new architecture.
- Execute the planned Phase 6.1.1 stock-ops/auth work after Phase 6.1 is complete and before Phase 7 starts.

## Blockers

- No production cutover work is approved in this milestone.
- Public shopper and sandbox browsing surfaces are not yet treated as strongly access-controlled; do not expose internal stock-write routes until the Phase 6.1.1 Access boundary exists.
- The Astro frontend is no longer being treated as “moving to Workers” in this milestone; do not reintroduce that assumption in implementation.
- Phase 5.1 must settle the entity and source-of-truth model before D1, Stripe, or storefront code drifts.

## Session

**Last Date:** 2026-04-20T23:35:00.000Z
**Stopped At:** Phase 6.1.1 planned for operator auth and internal stock tooling
**Resume File:** .planning/ROADMAP.md

