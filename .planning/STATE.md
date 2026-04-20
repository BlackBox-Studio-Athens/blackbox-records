---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Stripe Sandbox Integration
status: active
stopped_at: Phase 5 and Phase 5.1 replanned
last_updated: "2026-04-20T22:10:00.000Z"
last_activity: 2026-04-20 -- Milestone realigned to the dual-deploy commerce architecture
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 24
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
Total Phases: 8
Current Plan: 1
Total Plans in Phase: 6
Status: Ready to execute
Progress: 0%
Last Activity: 2026-04-20
Last Activity Description: Milestone realigned to the dual-deploy commerce architecture
Paused At: Phase 5 and Phase 5.1 replanned

Phase summary: Phase 5 now owns the separate Worker backend foundation. Phase 5.1 is the hard architecture gate for entities, source-of-truth, IDs, mappings, and APIs. Phase 6 remains the static storefront slice, Phase 6.1 moves D1 + Prisma into the Worker backend, and Phase 7 becomes Worker-owned checkout plus frontend integration.

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
| v1.1 | Astro content owns editorial content only, Stripe owns sellable commerce data, and D1 owns operational state plus internal mappings. | Active |
| v1.1 | The primary sellable unit is an `Offer/SKU` attached to a storefront-facing `ShopItem`. | Active |
| v1.1 | Phase 5.1 is inserted as a hard architecture gate before further storefront or checkout work. | Active |

### Pending Todos

- Execute the rewritten Phase 5 backend-platform plans.
- Complete Phase 5.1 before implementing Phase 6, 6.1, or 7 against the new architecture.

## Blockers

- No production cutover work is approved in this milestone.
- Cloudflare Access is intentionally deferred, so the sandbox Worker must not be treated as strongly access-controlled.
- The Astro frontend is no longer being treated as “moving to Workers” in this milestone; do not reintroduce that assumption in implementation.
- Phase 5.1 must settle the entity and source-of-truth model before D1, Stripe, or storefront code drifts.

## Session

**Last Date:** 2026-04-20T22:10:00.000Z
**Stopped At:** Phase 5 and Phase 5.1 replanned
**Resume File:** .planning/ROADMAP.md
