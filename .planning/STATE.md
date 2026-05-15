---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Modulith Boundary Hardening
current_phase: 12
current_phase_name: modulith-boundary-hardening-planning
current_plan: 23
status: active
stopped_at: Completed 12-23 player session machine state boundary hardening
paused_at: ''
last_updated: '2026-05-15T00:00:00.000Z'
last_activity: 2026-05-15
progress:
  total_phases: 12
  completed_phases: 8
  total_plans: 23
  completed_plans: 20
  percent: 87
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Ship a minimal native commerce flow that is operationally safe: the static site owns storefront
presentation, the Worker backend owns dynamic commerce behavior, Stripe owns sellable items/pricing/payment, server
routes own secrets and mutations, and stock changes happen only after verified webhooks.
**Current focus:** Phase 12 - modulith-boundary-hardening-planning

## Current Position

Phase: 12 (modulith-boundary-hardening-planning) - ACTIVE
Plan: 23 of 23
Current Phase: 12
Current Phase Name: modulith-boundary-hardening-planning
Total Phases: 12
Current Plan: 23
Total Plans in Phase: 23
Status: Active - 12-23 player session machine state boundary hardening complete
Progress: [#########-] 87%
Last activity: 2026-05-15
Last Activity Description: 12-23 completed player session-machine state characterization and extraction
Paused At:

Phase summary: Phases 5, 5.1, 6, 6.1, 6.1.1, 7.1, 8, and 11 are complete. Phase 7 mock, contract, frontend
cart/checkout, return UI, all-items local mock readiness, and Browser Use local mock UAT work is complete enough to
proceed while real Stripe-account validation remains explicitly deferred. Phase 8 now has the schema-only
`CheckoutOrder` lifecycle table, internal order repository/application seams, a dependency-free typed transition guard,
a fixture-tested Stripe webhook raw-body route contract, an optional official `stripe-mock` API local checkout
simulation harness, shared Stripe Checkout Session reconciliation, pending order creation from Worker-owned checkout
start, idempotent paid webhook handling that decrements stock only on the first paid transition, non-paid/needs-review
handling that never mutates stock, and Access-protected order readback for low-volume reconciliation. Phase 7.1
completed the Cloudflare Pages static artifact contract, GitHub Pages rollback posture, Direct Upload CI workflow,
browser-safe Pages build env contract, exact checkout return-origin allowlist guidance, Cloudflare-root Astro base-path
correction, Browser Use hosted validation, and canonical hosting docs. Phase 9 currently has a locker-first prototype
branch: the BOX NOW secret boundary, frontend locker gate, Worker preflight, thin locker snapshot persistence, return
recap, and local signed-fixture evidence. On 2026-05-14 the phase contract was revised so that this prototype is no
longer the only acceptable end state; final Phase 9 closure now requires choosing between manual-address fulfillment
and `boxnow-js`-backed automation. Phase 10 now has a no-account local UAT checklist, sandbox readiness evidence, a
deferred `10-03` full sandbox e2e gate, `10-04` no-account release audit evidence, a completed `10-04.1` Native
Checkout Gate, and a `10-05` milestone review package that links evidence, blockers, and the Go-Live / Launch
Hardening handoff. The Stripe Access Gate and BOX NOW Portal Gate remain deferred, so full sandbox release approval
still requires external account evidence and human approval.

GSD v1.41.2 operating note: this repo stays in flat planning mode and disables GSD worktree isolation for Codex
because Codex cannot provide Claude-style isolated subagent worktrees. While `07-16`, `09-06`, and `10-03` remain
deferred external gates, SDK progress helpers may still surface older incomplete sandbox phases. Use explicit phase or
plan arguments for GSD commands; the current human focus is now Phase 12.

## Performance Metrics

**Velocity:**

- Total plans completed: 63
- Total plans remaining: 7
- Completed plan ratio: 63/70
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
| 7.1   | 5/5   | Completed | 2026-04-29 |
| 8     | 8/8   | Completed | 2026-04-26 |
| 9     | 5/6   | Deferred  | 2026-04-30 |
| 10    | 5/6   | Deferred  | 2026-05-01 |
| 11    | 5/5   | Completed | 2026-05-12 |
| 12    | 20/23 | Active    | 2026-05-15 |

**Recent Trend:**

- Last 5 plans: 10-02, 10-04, 10-04.1, 10-05, milestone activation
- Trend: The Cloudflare Pages migration and sandbox groundwork are in place, but external Stripe/BOX NOW gates remain
  deferred. The active milestone has now shifted to Phase 12 so boundary enforcement and modulith-style hardening can
  land before more commerce refactors.

| Phase 11 P01 | ~35min | 3 tasks | 35 files |
| Phase 11 P02 | ~1h 20min | 3 tasks | 11 files |
| Phase 11 P03 | ~45min | 2 tasks | 5 files |
| Phase 11 P04 | ~50min | 3 tasks | 29 files |
| Phase 11 P05 | ~35min | 3 tasks | 2 files |

## Accumulated Context

### Roadmap Evolution

- Phase 6.1.1 inserted after Phase 6.1: Internal Stock Operations And Operator Access (URGENT)
- Phase 6.1.1 was fully planned to cover operator auth, stock tooling, auditability, and spreadsheet policy before
  checkout depends on live stock.
- Phase 6.1.1 is complete; D1 remains authoritative, spreadsheets are capture/reporting only, and `OnlineStock` is the
  conservative checkout-facing stock value.
- `/store/` replaced `/shop/` as the canonical native storefront route, with `/shop/` kept only as a compatibility
  redirect.
- The backend now exposes a typed Worker runtime binding contract with `COMMERCE_DB` as the first D1 binding.
- The backend now uses Prisma + `@prisma/adapter-d1` behind committed repository seams, while HTTP routes remain
  persistence-agnostic.
- The backend migration workflow is now Prisma-schema-driven but Wrangler-applied, with the current pre-production D1
  schema consolidated into one baseline SQL migration under `apps/backend/prisma/migrations/`.
- The backend now has repo-owned local seed SQL and a first application-layer StoreOffer reader on top of the D1
  repositories.
- The backend now has a typed Access-header extraction seam for `actor_email` on the future protected operator
  hostname.
- Phase 12 plan 12-04 completed the legacy-open governance slice: `cms-admin` now has explicit temporary-open closure
  criteria, the manifest validator rejects missing open-temporary metadata or unapproved open-temporary modules, and
  repo guidance locks one approved Phase 12 execution slice per branch without enabling Codex worktrees.
- Phase 12 plan 12-05 completed the app-shell boundary-hardening slice: shell section navigation and shell page loader
  behavior are characterized, and shell page fetch/cache/de-duplication now lives outside `AppShellRoot`.
- Phase 12 plan 12-06 completed the next app-shell boundary-hardening slice: overlay fragment loading behavior is
  characterized, and overlay fetch/cache/de-duplication now lives outside `AppShellRoot`.
- Phase 12 plan 12-07 completed the overlay history boundary-hardening slice: overlay history write, collapse, and
  back-vs-close behavior are characterized and live outside `AppShellRoot`.
- Phase 12 plan 12-08 completed the player iframe session boundary-hardening slice: iframe DOM construction, cache reuse,
  pruning, retirement, and active marking are characterized and live in the closed `player` module.
- Phase 12 plan 12-09 completed the shell portal target boundary-hardening slice: route-scoped portal target discovery
  is characterized and lives in an internal `app-shell` helper.
- Phase 12 plan 12-10 completed the shell page snapshot application boundary-hardening slice: snapshot cache/apply DOM
  details are characterized and live in `shell-page-snapshot`.
- Phase 12 plan 12-11 completed the route loading indicator timer boundary-hardening slice: timeout cleanup and delayed
  close mechanics are characterized and live in `route-loading-indicator`.
- Phase 12 plan 12-12 completed the player provider warmup boundary-hardening slice: preconnect and DNS-prefetch details
  are characterized and live in the closed `player` module.
- Phase 12 plan 12-13 completed the player trigger data boundary-hardening slice: listen-trigger dataset readers and
  default-provider selection are characterized and live in the closed `player` module.
- Phase 12 plan 12-14 completed the shell target scroll boundary-hardening slice: document and overlay target scrolling
  are characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-15 completed the shell body state class boundary-hardening slice: overlay and player modal body class
  synchronization is characterized and lives in an internal `app-shell` helper.
- Phase 12 plan 12-16 completed the shell hero scroll progress boundary-hardening slice: homepage hero scroll progress
  calculation, scheduling, inactive-route behavior, and cleanup are characterized and live in an internal `app-shell`
  helper.
- Phase 12 plan 12-17 completed the shell overlay focus boundary-hardening slice: trigger focus restore and loaded
  overlay content focus scheduling are characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-18 completed the shell scroll restoration boundary-hardening slice: manual scroll-restoration setup
  and cleanup are characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-19 completed the shell document listener boundary-hardening slice: document/window listener
  registration and cleanup are characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-20 completed the player shell view-state boundary-hardening slice: idle, loading, and minimized
  player UI state derivation is characterized and lives in an app-shell-owned helper.
- Phase 12 plan 12-21 completed the player modal focus boundary-hardening slice: player modal close-button focus
  scheduling is characterized and lives in an internal `app-shell` helper.
- Phase 12 plan 12-22 completed the player trigger focus boundary-hardening slice: connected/disconnected player trigger
  focus restoration is characterized and lives in an internal `app-shell` helper.
- Phase 12 plan 12-23 completed the player session-machine state boundary-hardening slice: idle, unloaded modal-open,
  and loaded/interacted/minimized session-machine inputs are characterized and live in an internal `app-shell` helper.
- The backend now persists `Stock`, `StockChange`, and `StockCount` in D1 and exposes internal stock lookup/write
  routes under `/api/internal/variants/*`.
- The static Astro app now serves the protected stock operations UI at `/stock/`, using `/stock/?variantId=<variantId>`
  for detail state and Worker-owned `/api/internal/variants/*` calls for data and writes.
- The stock reconciliation policy now defines when to use `StockChange`, when to use `StockCount`, and why
  spreadsheets must not become live stock truth.
- Commerce naming was simplified to DDD-style label language: `StoreItem`, `ItemAvailability`, `StoreItemOption`,
  `StoreOffer`, `Stock`, `OnlineStock`, `StartCheckout`, `ReadCheckoutState`, and `not_paid`.
- The Worker now exposes public checkout/store API routes under `/api/store/*` and `/api/checkout/*`, with
  `StartCheckout` validating store item mapping, availability, `OnlineStock`, and Stripe price mapping before creating
  an embedded Checkout Session.
- The static checkout shell now hydrates a small Worker-read status panel that displays backend-known offer, variant,
  and checkout eligibility state without starting payment.
- The static checkout shell now uses browser-safe `PUBLIC_STRIPE_PUBLISHABLE_KEY` and Stripe.js to mount embedded
  Checkout from the Worker-returned `clientSecret`.
- Phase 7 corrected the current `/store/barren-point/` route drift: the shopper-facing smoke item now uses
  `/store/disintegration-black-vinyl-lp/`, with legacy `barren-point` routes kept as compatibility redirects.
- Phase 7 now has a browser-local single-item cart state seam and header cart icon that store only browser-safe item
  option display data.
- Phase 7 now has a Shopify-inspired cart drawer that shows one item summary, subtotal, remove, continue-shopping, and
  canonical checkout navigation.
- Phase 7 now routes store item detail purchases through `Add To Cart`, stores or replaces the single browser cart
  item, and opens the cart drawer before checkout navigation.
- Phase 7 now renders checkout as a familiar order-summary plus payment-panel layout while preserving Worker-owned
  checkout eligibility and Stripe embedded Checkout mounting.
- Phase 7 now renders checkout return/retry feedback from Worker-owned `ReadCheckoutState` and does not treat raw Stripe
  return query parameters as payment truth.
- Phase 7 now treats every current distro entry and release entry as a native store candidate, while keeping fallback
  availability unavailable until mock or real commerce readiness exists.
- Phase 7 now generates local stripe-mock `StoreItemOption`, `ItemAvailability`, `Stock`, and `VariantStripeMapping`
  rows for every current store item from static storefront content.
- Phase 7 now has a local mock checkout readiness command that compares current storefront content against local D1 mock
  rows and reports missing availability, stock, or `price_mock_*` mappings by slug/source.
- Phase 7 now has Browser Use UAT evidence that representative release and distro items can enter the local mock
  checkout panel through PDP, cart, checkout, and Worker-owned `StartCheckout`.
- Phase 7 real Stripe validation is deferred until Stripe account access exists. Required later inputs are real
  `pk_test_*`, `sk_test_*`, `price_*`, `STRIPE_WEBHOOK_SECRET`, Stripe products/prices, webhook endpoint
  configuration, sandbox Worker URL, and Browser Use evidence against real Stripe test mode.
- Non-secret Phase 8 backend order groundwork may proceed before real Stripe validation because D1 schema,
  repositories, transition guards, fixture-based webhook contracts, generated clients, and local tests do not require
  account-specific Stripe values.
- Phase 8 now has a `CheckoutOrder` model with backend-owned checkout session, payment intent, item/variant identity,
  status, and lifecycle timestamp fields, plus internal order repositories, application lifecycle seams, a typed
  transition guard, a fixture-tested Stripe webhook raw-body route contract, shared Checkout Session reconciliation,
  paid-webhook stock decrement guarded by order transition idempotency, non-paid/needs-review lifecycle handling that
  leaves stock untouched, and Access-protected internal order readback for low-volume reconciliation.
- Phase 7 must add a familiar single-item cart UX with a cart icon, cart drawer/summary, checkout CTA, and
  Shopify-inspired order summary while keeping multi-item cart semantics out of scope.
- Phase 7 must treat every current distro entry and release entry as a real sellable store candidate for local mock
  checkout readiness, even if real quantities are unknown.
- Phase 7 may seed fake local mock stock and mock Stripe Price mappings for every current item so the no-network local
  checkout path can exercise representative item types; that fake stock must never be described as a real stock count.
- Checkout session return URLs are constrained by the Worker-side `CHECKOUT_RETURN_ORIGINS` allowlist and expected
  store checkout route shape.
- Local checkout validation now has two explicit stack launchers: `pnpm dev:stack:stripe-test` for real Stripe test
  keys and real local Price mappings, and `pnpm dev:stack:stripe-mock` for local official `stripe-mock` API
  request-shape simulation plus a frontend mock checkout panel.
- Phase 8 plan 3.1 added the official `stripe-mock` API stack for local Stripe SDK request-shape simulation.
  Mock-specific compatibility remains outside production checkout/order use cases because official `stripe-mock` is
  stateless, hardcoded, and not a real payment or webhook simulator.
- Phase 7.1 was inserted after Phase 7 to move the static Astro frontend from GitHub Pages to Cloudflare Pages while
  keeping the Worker backend separate and GitHub Pages available as rollback.
- Phase 7.1 now has the deployment contract locked, a Cloudflare Pages Direct Upload workflow, browser-safe Pages build
  env wiring, exact checkout return-origin guidance, hosted Browser Use validation, and canonical docs: Cloudflare
  Pages deploys only the prebuilt `apps/web/dist` static artifact after repo gates, the Worker remains separate for
  dynamic commerce and secrets, and GitHub Pages remains rollback/legacy only.
- Phase 7.1 plan 4 hosted validation passed on 2026-04-29 after switching acceptance evidence to GitHub Actions Direct
  Upload, correcting the Cloudflare-root Astro base path, validating production and `pages/no-stripe-validation`
  preview routes with Browser Use, and confirming Worker CORS/routing from both exact Pages origins. Hosted real Stripe
  checkout mount and payment evidence remain deferred to the Stripe access gate.
- Phase 7.1 plan 5 retired GitHub Pages as canonical hosting in docs after Cloudflare Pages acceptance. GitHub Pages
  remains a rollback/legacy workflow and Astro default path, not the canonical static frontend host.
- Phase 9 plan 1 locked the BOX NOW shipping contract: v1 is Greece-only, payment stays blocked until a valid Greek
  locker is selected, future paid-order shipping persistence is limited to `locker_id`, `country_code`, and
  `locker_name_or_label`, BOX NOW credentials remain Worker runtime secrets or out-of-band operator credentials, and
  fulfillment stays manual through the BOX NOW partner portal.
- Phase 9 plan 2 added the frontend-only BOX NOW locker gate to the checkout route. Local mock mode can select a
  deterministic Greek locker before payment, non-mock mode fails closed until the real BOX NOW picker exists, and
  `StartCheckout` still sends only `storeItemSlug` and `variantId`.
- Phase 9 plan 3 added Worker-owned checkout preflight for Greece-only BOX NOW locker selection. `StartCheckout` now
  requires a minimal `shippingLocker` snapshot before Stripe Checkout Session creation, but paid-order shipping
  persistence remains deferred.
- Phase 9 plan 4 added nullable D1/Prisma `CheckoutOrder` fields for the approved thin BOX NOW locker snapshot,
  persists that snapshot when checkout starts, and exposes it through protected internal order readback for manual
  fulfillment/reconciliation.
- Phase 9 plan 5 extended public `ReadCheckoutState` with the nullable Worker-owned `shippingLocker` snapshot and
  renders selected-locker or needs-review recap copy on the checkout return UI.
- Phase 9 plan 6 has local evidence for the manual BOX NOW fulfillment handoff using the local mock checkout, signed
  paid webhook fixture, internal paid order readback, idempotent stock decrement replay, and return locker recap. It is
  now a deferred `BOX NOW Portal Gate` until BOX NOW partner/sandbox portal validation can prove `SHIP-03`.
- On 2026-05-14, Phase 9 was revised: the locker-first sandbox slice is now treated as prototype evidence only, and
  final closure must explicitly choose between manual-address fulfillment and `boxnow-js`-backed automation.
- Phase 10 plan 1 added a repeatable local full-loop UAT checklist for the no-account path: local D1, official local
  `stripe-mock`, Mock Checkout Panel, BOX NOW Test Locker, signed paid webhook fixture, protected internal order
  readback, checkout return recap, and replay idempotency checks.
- Phase 10 plan 2 recorded sandbox readiness evidence: Worker sandbox deployment lookup succeeds, Cloudflare/GitHub CI
  credentials are present by name, sandbox D1 can be inspected by database name, but binding-scoped `COMMERCE_DB`
  remote commands are blocked by missing `database_id`, migration `0004` is not applied, key commerce tables are
  empty, Worker Stripe secrets are absent, real Stripe mappings are absent, and BOX NOW portal evidence remains
  unavailable.
- Phase 10 plan 3 prep bound sandbox `COMMERCE_DB` to the existing sandbox D1 database, applied migration `0004`,
  applied the non-secret base commerce seed, and redeployed the sandbox Worker with the D1 binding. `10-03` itself is
  now a deferred external gate and remains unchecked until the Stripe Access Gate and BOX NOW Portal Gate can both be
  satisfied.
- Phase 10 plan 4 added a deterministic commerce boundary audit and recorded no-account release audit evidence:
  generated API parity, public/internal OpenAPI separation, Browser Use local checks for
  store/checkout/return/stock/shell navigation, and explicit limits around local stripe-mock and Access-protected
  stock API behavior.
- Phase 10 plan 4.1 added the Worker-owned Native Checkout Gate so native checkout can be disabled at runtime through
  Cloudflare Flagship without replacing Worker environment isolation; the browser sees only sanitized capability state
  from `/api/store/capabilities`.
- Phase 10 plan 5 produced the milestone review package and go-live handoff. The package links implemented
  architecture, evidence, deferred gates, and Go-Live / Launch Hardening seeds without claiming the Stripe Access Gate,
  BOX NOW Portal Gate, `10-03`, `OPER-01`, or `SHIP-03` passed.
- The no-account cart expansion workstream now promotes `BL-13` into concrete multi-item and CartQuantity planning. It
  can proceed without Stripe or BOX NOW account access, but real multi-line Stripe evidence remains behind the Stripe
  Access Gate.
- StoreCart remains convenience-only state. Native `localStorage` stays the approved storage primitive until carts
  become account-backed, cross-device, large/offline, or operationally authoritative.

## Decisions Made

| Phase | Decision                                                                                                                                                                            | Status  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| v1.0  | Production commerce cutover remains deferred until the future go-live milestone; Cloudflare Pages is the canonical static frontend host and GitHub Pages is rollback/legacy.        | Active  |
| v1.0  | The first native sellable slice is `/store/` collection -> store item detail -> single-item cart-like checkout, with familiar cart affordances but no multi-item cart semantics.    | Revised |
| v1.0  | v1 order state stays minimal: `pending_payment`, `paid`, `not_paid`, and `needs_review`, with Checkout webhooks as the authoritative paid/unpaid signals.                           | Active  |
| v1.0  | MVP shipping remains Greece only; the default end state is manual address-based BOX NOW fulfillment, and any future automation must use `boxnow-js`.                                | Revised |
| v1.1  | The Astro site remains static, and Phase 7.1 moved canonical static hosting from GitHub Pages to Cloudflare Pages after checkout browser wiring was complete.                       | Active  |
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

## Pending Todos

- Keep future backend routes inside the OpenAPI contract/generation workflow; do not add handwritten frontend DTOs for
  backend APIs.
- Preserve the current `StoreItem` and `ItemAvailability` storefront contracts while later backend APIs grow on top of
  the completed Phase 6.1 foundation.
- Continue Phase 12 through the next approved app-shell or cms-admin slice; `12-04` through `12-23` are complete and
  deeper refactors should still respect the boundary manifest and verifier rules.
- Complete the deferred Stripe access validation gate before sandbox/release approval.
- Choose the Phase 9 shipping mode and complete the deferred BOX NOW Portal Gate before marking Phase 9, `09-06`, or
  `SHIP-01` through `SHIP-03` complete.
- Use `10-LOCAL-UAT.md` as the local no-account UAT checklist until external access exists.
- Use `10-SANDBOX-READINESS.md` as the latest sandbox readiness evidence and blocker record before attempting `10-03`.
- Use `10-MILESTONE-REVIEW.md` as the prepared human review package without claiming the deferred Stripe Access Gate,
  BOX NOW Portal Gate, or `10-03` sandbox e2e gate passed.
- Use `10-MULTI-ITEM-CART-WORKSTREAM.md` when planning multi-item cart, quantity controls, Worker-owned multi-line
  checkout validation, order-line persistence, and paid-webhook stock decrement per line.

## Blockers

- No production cutover work is approved in this milestone.
- Public shopper and sandbox browsing remain unauthenticated by design; internal stock writes stay confined to the
  protected operator hostname and Access boundary.
- The Astro frontend is no longer being treated as "moving to Workers" in this milestone; do not reintroduce that
  assumption in implementation.
- Phase 7 must still avoid production cutover and should remain sandbox-first.
- Real Stripe-account validation is blocked until Stripe account access, test keys, test Price IDs, webhook secret, and
  sandbox endpoint configuration exist. Do not commit any account-specific Stripe values.
- Real BOX NOW portal validation is blocked until BOX NOW partner/sandbox portal access exists and a sandbox-paid Greek
  order can be fulfilled through the chosen path. Do not commit BOX NOW credentials, voucher data, labels, or raw
  portal output.
- Cloudflare Pages production and `pages/no-stripe-validation` preview deploys now pass through GitHub Actions, serve
  root-based assets, and pass Browser Use hosted smoke. Real Stripe checkout mount evidence remains blocked on Stripe
  account access for a real test `PUBLIC_STRIPE_PUBLISHABLE_KEY`, backend Stripe secrets, Price mappings, and webhook
  secret.
- Cloudflare Access + Google setup for the protected operator hostname remains deferred until the operator-hostname
  setup phase; do not treat it as a blocker for public Pages/Worker sandbox browsing.

## Session

**Last Date:** 2026-05-15T00:00:00.000Z
**Stopped At:** Completed 12-23 player session machine state boundary hardening
**Resume File:** None
