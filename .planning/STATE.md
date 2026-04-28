---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Stripe Sandbox Integration
status: active
stopped_at: Phase 7.1 plan 4; validate Cloudflare Pages previews, production branch deploys, and Worker API routing
last_updated: '2026-04-28T12:27:48+03:00'
last_activity: 2026-04-28 -- Wired Cloudflare Pages browser env and checkout return-origin contracts
progress:
  total_phases: 10
  completed_phases: 6
  total_plans: 65
  completed_plans: 51
  percent: 78
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Ship a minimal native commerce flow that is operationally safe: the static site owns storefront presentation, the Worker backend owns dynamic commerce behavior, Stripe owns sellable items/pricing/payment, server routes own secrets and mutations, and stock changes happen only after verified webhooks.
**Current focus:** Phase 7.1: Cloudflare Pages Static Frontend Migration

## Current Position

Current Phase: 7.1
Current Phase Name: Cloudflare Pages Static Frontend Migration
Total Phases: 10
Current Plan: 4
Total Plans in Phase: 5
Status: Active
Progress: 78%
Last Activity: 2026-04-28
Last Activity Description: Wired Cloudflare Pages browser env and checkout return-origin contracts
Paused At: Phase 7.1 plan 4; validate Cloudflare Pages previews, production branch deploys, and Worker API routing

Phase summary: Phases 5, 5.1, 6, 6.1, 6.1.1, and 8 are complete. Phase 7 mock, contract, frontend cart/checkout, return UI, all-items local mock readiness, and Browser Use local mock UAT work is complete enough to proceed while real Stripe-account validation remains explicitly deferred. Phase 8 now has the schema-only `CheckoutOrder` lifecycle table, internal order repository/application seams, a dependency-free typed transition guard, a fixture-tested Stripe webhook raw-body route contract, an optional official `stripe-mock` API local checkout simulation harness, shared Stripe Checkout Session reconciliation, pending order creation from Worker-owned checkout start, idempotent paid webhook handling that decrements stock only on the first paid transition, non-paid/needs-review handling that never mutates stock, and Access-protected order readback for low-volume reconciliation. Phase 7.1 now has the Cloudflare Pages static artifact contract, GitHub Pages rollback posture, Direct Upload CI workflow, browser-safe Pages build env contract, and exact checkout return-origin allowlist guidance. Current focus is Phase 7.1 plan 4: validate Cloudflare Pages previews, production branch deploys, and Worker API routing.

## Performance Metrics

**Velocity:**

- Total plans completed: 51
- Total plans remaining: 14
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total     | Avg/Plan   |
| ----- | ----- | --------- | ---------- |
| 5     | 6     | Completed | 2026-04-20 |
| 5.1   | 4     | Completed | 2026-04-20 |
| 6     | 7     | Completed | 2026-04-21 |
| 6.1   | 4     | Completed | 2026-04-22 |
| 6.1.1 | 4     | Completed | 2026-04-24 |
| 7     | 15/16 | Deferred  | 2026-04-25 |
| 7.1   | 3/5   | Active    | -          |
| 8     | 8/8   | Completed | 2026-04-26 |

**Recent Trend:**

- Last 5 plans: 08-06, 08-07, 07.1-01, 07.1-02, 07.1-03
- Trend: Non-paid lifecycle handling, protected order readback, the Cloudflare Pages deployment contract, Direct Upload CI workflow, and browser env/origin contract are complete. Real Stripe validation remains deferred until account access exists.

## Accumulated Context

### Roadmap Evolution

- Phase 6.1.1 inserted after Phase 6.1: Internal Stock Operations And Operator Access (URGENT)
- Phase 6.1.1 was fully planned to cover operator auth, stock tooling, auditability, and spreadsheet policy before checkout depends on live stock.
- Phase 6.1.1 is complete; D1 remains authoritative, spreadsheets are capture/reporting only, and `OnlineStock` is the conservative checkout-facing stock value.
- `/store/` replaced `/shop/` as the canonical native storefront route, with `/shop/` kept only as a compatibility redirect.
- The backend now exposes a typed Worker runtime binding contract with `COMMERCE_DB` as the first D1 binding.
- The backend now uses Prisma + `@prisma/adapter-d1` behind committed repository seams, while HTTP routes remain persistence-agnostic.
- The backend migration workflow is now Prisma-schema-driven but Wrangler-applied, with the current pre-production D1 schema consolidated into one baseline SQL migration under `apps/backend/prisma/migrations/`.
- The backend now has repo-owned local seed SQL and a first application-layer StoreOffer reader on top of the D1 repositories.
- The backend now has a typed Access-header extraction seam for `actor_email` on the future protected operator hostname.
- The backend now persists `Stock`, `StockChange`, and `StockCount` in D1 and exposes internal stock lookup/write routes under `/api/internal/variants/*`.
- The static Astro app now serves the protected stock operations UI at `/stock/`, using `/stock/?variantId=<variantId>` for detail state and Worker-owned `/api/internal/variants/*` calls for data and writes.
- The stock reconciliation policy now defines when to use `StockChange`, when to use `StockCount`, and why spreadsheets must not become live stock truth.
- Commerce naming was simplified to DDD-style label language: `StoreItem`, `ItemAvailability`, `StoreItemOption`, `StoreOffer`, `Stock`, `OnlineStock`, `StartCheckout`, `ReadCheckoutState`, and `not_paid`.
- The Worker now exposes public checkout/store API routes under `/api/store/*` and `/api/checkout/*`, with `StartCheckout` validating store item mapping, availability, `OnlineStock`, and Stripe price mapping before creating an embedded Checkout Session.
- The static checkout shell now hydrates a small Worker-read status panel that displays backend-known offer, variant, and checkout eligibility state without starting payment.
- The static checkout shell now uses browser-safe `PUBLIC_STRIPE_PUBLISHABLE_KEY` and Stripe.js to mount embedded Checkout from the Worker-returned `clientSecret`.
- Phase 7 corrected the current `/store/barren-point/` route drift: the shopper-facing smoke item now uses `/store/disintegration-black-vinyl-lp/`, with legacy `barren-point` routes kept as compatibility redirects.
- Phase 7 now has a browser-local single-item cart state seam and header cart icon that store only browser-safe item option display data.
- Phase 7 now has a Shopify-inspired cart drawer that shows one item summary, subtotal, remove, continue-shopping, and canonical checkout navigation.
- Phase 7 now routes store item detail purchases through `Add To Cart`, stores or replaces the single browser cart item, and opens the cart drawer before checkout navigation.
- Phase 7 now renders checkout as a familiar order-summary plus payment-panel layout while preserving Worker-owned checkout eligibility and Stripe embedded Checkout mounting.
- Phase 7 now renders checkout return/retry feedback from Worker-owned `ReadCheckoutState` and does not treat raw Stripe return query parameters as payment truth.
- Phase 7 now treats every current distro entry and release entry as a native store candidate, while keeping fallback availability unavailable until mock or real commerce readiness exists.
- Phase 7 now generates local stripe-mock `StoreItemOption`, `ItemAvailability`, `Stock`, and `VariantStripeMapping` rows for every current store item from static storefront content.
- Phase 7 now has a local mock checkout readiness command that compares current storefront content against local D1 mock rows and reports missing availability, stock, or `price_mock_*` mappings by slug/source.
- Phase 7 now has Browser Use UAT evidence that representative release and distro items can enter the local mock checkout panel through PDP, cart, checkout, and Worker-owned `StartCheckout`.
- Phase 7 real Stripe validation is deferred until Stripe account access exists. Required later inputs are real `pk_test_*`, `sk_test_*`, `price_*`, `STRIPE_WEBHOOK_SECRET`, Stripe products/prices, webhook endpoint configuration, sandbox Worker URL, and Browser Use evidence against real Stripe test mode.
- Non-secret Phase 8 backend order groundwork may proceed before real Stripe validation because D1 schema, repositories, transition guards, fixture-based webhook contracts, generated clients, and local tests do not require account-specific Stripe values.
- Phase 8 now has a `CheckoutOrder` model with backend-owned checkout session, payment intent, item/variant identity, status, and lifecycle timestamp fields, plus internal order repositories, application lifecycle seams, a typed transition guard, a fixture-tested Stripe webhook raw-body route contract, shared Checkout Session reconciliation, paid-webhook stock decrement guarded by order transition idempotency, non-paid/needs-review lifecycle handling that leaves stock untouched, and Access-protected internal order readback for low-volume reconciliation.
- Phase 7 must add a familiar single-item cart UX with a cart icon, cart drawer/summary, checkout CTA, and Shopify-inspired order summary while keeping multi-item cart semantics out of scope.
- Phase 7 must treat every current distro entry and release entry as a real sellable store candidate for local mock checkout readiness, even if real quantities are unknown.
- Phase 7 may seed fake local mock stock and mock Stripe Price mappings for every current item so the no-network local checkout path can exercise representative item types; that fake stock must never be described as a real stock count.
- Checkout session return URLs are constrained by the Worker-side `CHECKOUT_RETURN_ORIGINS` allowlist and expected store checkout route shape.
- Local checkout validation now has two explicit stack launchers: `pnpm dev:stack:stripe-test` for real Stripe test keys and real local Price mappings, and `pnpm dev:stack:stripe-mock` for local official `stripe-mock` API request-shape simulation plus a frontend mock checkout panel.
- Phase 8 plan 3.1 added the official `stripe-mock` API stack for local Stripe SDK request-shape simulation. Mock-specific compatibility remains outside production checkout/order use cases because official `stripe-mock` is stateless, hardcoded, and not a real payment or webhook simulator.
- Phase 7.1 is inserted after Phase 7 to move the static Astro frontend from GitHub Pages to Cloudflare Pages while keeping the Worker backend separate and GitHub Pages available as rollback until acceptance.
- Phase 7.1 now has the deployment contract locked, a Cloudflare Pages Direct Upload workflow, browser-safe Pages build env wiring, and exact checkout return-origin guidance: Cloudflare Pages deploys only the prebuilt `apps/web/dist` static artifact after repo gates, the Worker remains separate for dynamic commerce and secrets, and GitHub Pages remains rollback until Phase 7.1 acceptance.

## Decisions Made

| Phase | Decision                                                                                                                                                                            | Status  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| v1.0  | Production remains GitHub Pages + Fourthwall until the future go-live milestone.                                                                                                    | Active  |
| v1.0  | The first native sellable slice is `/store/` collection -> store item detail -> single-item cart-like checkout, with familiar cart affordances but no multi-item cart semantics.    | Revised |
| v1.0  | v1 order state stays minimal: `pending_payment`, `paid`, `not_paid`, and `needs_review`, with Checkout webhooks as the authoritative paid/unpaid signals.                           | Active  |
| v1.0  | MVP shipping is Greece only, BOX NOW locker selection happens before payment, and fulfillment stays manual through the partner portal.                                              | Active  |
| v1.1  | The Astro site remains static, and Phase 7.1 now moves canonical static hosting from GitHub Pages to Cloudflare Pages after checkout browser wiring is complete.                    | Active  |
| v1.1  | A separate Cloudflare Worker backend is the dynamic commerce surface for Stripe, webhooks, D1, and later BOX NOW backend work.                                                      | Active  |
| v1.1  | The Worker is a backend/BFF, not the primary frontend runtime.                                                                                                                      | Active  |
| v1.1  | The Worker does not expose default synthetic probe routes such as `healthz`, `status`, or `readyz`; runtime checks rely on Wrangler, deploy success, and real API tests.            | Active  |
| v1.1  | Backend application code is TypeScript-only and uses Hono only as the HTTP interface layer.                                                                                         | Active  |
| v1.1  | The backend owns HTTP contracts through code-first OpenAPI, emitted as separate public/internal documents, and the frontend consumes generated clients from `@blackbox/api-client`. | Active  |
| v1.1  | Backend modules must stay DDD-layered, use ubiquitous-language names, and ship with mandatory tests.                                                                                | Active  |
| v1.1  | Astro content owns editorial content only, Stripe owns sellable commerce data, and D1 owns operational state plus internal mappings.                                                | Active  |
| v1.1  | The primary sellable unit is a `Variant` attached to a storefront-facing `StoreItem`.                                                                                               | Active  |
| v1.1  | Phase 5.1 is inserted as a hard architecture gate before further storefront or checkout work.                                                                                       | Active  |
| v1.1  | `/store/` is the canonical native storefront route; `/shop/` is compatibility-only.                                                                                                 | Active  |
| v1.1  | Phase 6 storefront UI composes stable `StoreItem` plus `ItemAvailability` contracts and keeps temporary offer state out of editorial content.                                       | Active  |
| v1.1  | Internal stock operations use Google-backed Cloudflare Access on a separate protected backend hostname; Decap auth is not reused for runtime stock writes.                          | Active  |
| v1.1  | D1 is the authoritative stock ledger using `Stock`, `StockChange`, and `StockCount`; spreadsheets are temporary capture/reporting only.                                             | Active  |
| v1.1  | Each `Variant` exposes a conservative `OnlineStock` quantity separate from total stock balance before public checkout depends on live stock.                                        | Active  |
| v1.1  | Public checkout starts only through Worker-owned `StartCheckout`; the browser receives a Stripe Checkout `clientSecret` but never receives Stripe price IDs or server secrets.      | Active  |
| v1.1  | Stripe Checkout return URLs are Worker-validated against `CHECKOUT_RETURN_ORIGINS`; arbitrary browser origins are not trusted.                                                      | Active  |
| v1.1  | Shopper-facing store URLs must describe the sellable item option, not legacy release shorthand or backend mapping names.                                                            | Active  |
| v1.1  | Phase 7 cart UX is a single-item Shopify-familiar shell built in Astro/React/shadcn; true multi-item cart remains out of scope for this milestone.                                  | Active  |
| v1.1  | Every current release and distro entry is a native store candidate; legacy external merch metadata no longer blocks native store projection.                                        | Active  |
| v1.1  | Local stripe-mock D1 state is generated from static storefront content and uses fake 99/99 stock plus `price_mock_*` mappings only for local development.                           | Active  |
| v1.1  | Local stripe-mock checkout readiness may use fake dev stock for every current distro and release item; real stock authority still requires staff-recorded D1 stock operations.      | Active  |
| v1.1  | Do not add frontend commerce state machines or state-machine dependencies; Phase 8 uses a tiny backend typed order transition guard for persisted order rows.                       | Active  |

### Pending Todos

- Keep future backend routes inside the OpenAPI contract/generation workflow; do not add handwritten frontend DTOs for backend APIs.
- Preserve the current `StoreItem` and `ItemAvailability` storefront contracts while later backend APIs grow on top of the completed Phase 6.1 foundation.
- Complete the deferred Stripe access validation gate before sandbox/release approval.
- In Phase 7.1 plan 4, validate Cloudflare Pages previews, production branch deploys, and Worker API routing.

## Blockers

- No production cutover work is approved in this milestone.
- Public shopper and sandbox browsing remain unauthenticated by design; internal stock writes stay confined to the protected operator hostname and Access boundary.
- The Astro frontend is no longer being treated as “moving to Workers” in this milestone; do not reintroduce that assumption in implementation.
- Phase 7 must still avoid production cutover and should remain sandbox-first.
- Real Stripe-account validation is blocked until Stripe account access, test keys, test Price IDs, webhook secret, and sandbox endpoint configuration exist. Do not commit any account-specific Stripe values.

## Session

**Last Date:** 2026-04-28T12:27:48+03:00
**Stopped At:** Phase 7.1 plan 4; validate Cloudflare Pages previews, production branch deploys, and Worker API routing
**Resume File:** .planning/ROADMAP.md
