---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Modulith Boundary Hardening
current_phase: 12
current_phase_name: modulith-boundary-hardening-planning
current_plan: 63
status: active
stopped_at: Completed repo-wide modulith entrypoint refactor
paused_at: ''
last_updated: '2026-05-16T00:00:00.000Z'
last_activity: 2026-05-16
progress:
  total_phases: 12
  completed_phases: 9
  total_plans: 62
  completed_plans: 59
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
Plan: 63 of 63
Current Phase: 12
Current Phase Name: modulith-boundary-hardening-planning
Total Phases: 12
Current Plan: 63
Total Plans in Phase: 63
Status: Complete - Phase 12 boundary hardening achieved
Progress: [##########] 100%
Last activity: 2026-05-16
Last Activity Description: Repo-wide modulith entrypoint refactor split root APIs from SPI surfaces
Paused At:

Phase summary: Phases 5, 5.1, 6, 6.1, 6.1.1, 7.1, 8, and 11 are complete. Phase 7 mock, contract, frontend
cart/checkout, return UI, all-items local mock readiness, and Browser Use local mock UAT work is complete enough to
proceed while sandbox UAT evidence is now available. Phase 8 now has the schema-only
`CheckoutOrder` lifecycle table, internal order repository/application seams, a dependency-free typed transition guard,
a fixture-tested Stripe webhook raw-body route contract, an optional official `stripe-mock` API local checkout
simulation harness, shared Stripe Checkout Session reconciliation, pending order creation from Worker-owned checkout
start, idempotent paid webhook handling that decrements stock only on the first paid transition, non-paid/needs-review
handling that never mutates stock, and Access-protected order readback for low-volume reconciliation. Phase 7.1
completed the Cloudflare Pages static artifact contract, GitHub Pages rollback posture, Direct Upload CI workflow,
browser-safe Pages build env contract, exact checkout return-origin allowlist guidance, Cloudflare-root Astro base-path
correction, Browser Use hosted validation, and canonical hosting docs. Phase 9 now chooses and closes the manual-address
BOX NOW path for new checkout starts; the earlier locker-first branch remains prototype evidence only. Stripe Checkout
collects Greek address/contact details, new `StartCheckout` calls do not accept `shippingLocker`, and full BOX NOW
portal/API integration is reopen-only future work after access exists. Phase 10 now has a no-account local UAT checklist, sandbox readiness evidence, a
completed `10-03` hosted Stripe sandbox e2e gate, `10-04` no-account release audit evidence, a completed `10-04.1`
Native Checkout Gate, and a `10-05` milestone review package that links evidence, blockers, and the Go-Live / Launch
Hardening handoff. Stripe sandbox UAT is available; production go-live remains unapproved.

GSD v1.41.2 operating note: this repo stays in flat planning mode and disables GSD worktree isolation for Codex
because Codex cannot provide Claude-style isolated subagent worktrees. Older SDK progress helpers may still surface
pre-access deferred sandbox history; active planning records `07-16` and `10-03` as complete for sandbox UAT. Use
explicit phase or plan arguments for GSD commands; the current human focus is now Phase 12 and sandbox UAT release.

## Performance Metrics

**Velocity:**

- Total plans completed: 81
- Total plans remaining: 7
- Completed plan ratio: 81/88
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
| 9     | 7/7   | Completed | 2026-05-17 |
| 10    | 5/6   | Deferred  | 2026-05-01 |
| 11    | 5/5   | Completed | 2026-05-12 |
| 12    | 47/50 | Active    | 2026-05-16 |

**Recent Trend:**

- Last 5 plans: 10-02, 10-04, 10-04.1, 10-05, milestone activation
- Trend: The Cloudflare Pages migration and sandbox groundwork are in place, but external Stripe validation remains
  deferred. BOX NOW is closed for the current manual v1 scope. The active milestone has now shifted to Phase 12 so boundary enforcement and modulith-style hardening can
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
- Phase 12 plan 12-24 completed the StoreCart apply-state boundary-hardening slice: applying and persisting StoreCart
  state is characterized and lives in the existing StoreCart bridge.
- Phase 12 plan 12-25 completed the shell prefetch intent boundary-hardening slice: player origin warmup and
  route/overlay prefetch intent classification are characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-26 completed the player iframe blur interaction boundary-hardening slice: blur-delayed iframe focus
  detection is characterized and lives in an internal `app-shell` helper.
- Phase 12 plan 12-27 completed the player frame-host boundary-hardening slice: active iframe host append/mark/update
  behavior is characterized and lives in an internal `app-shell` helper.
- Phase 12 plan 12-28 completed the shell rendered navigation state boundary-hardening slice: rendered pathname,
  React-active pathname, and desktop navigation synchronization are characterized and live in an internal `app-shell`
  helper.
- Phase 12 plan 12-29 completed the cached shell page restoration boundary-hardening slice: cache hit/miss,
  shell-section transition, snapshot application failure, scroll reset, enter transition, and loading cleanup behavior are
  characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-30 completed the shell popstate navigation boundary-hardening slice: overlay history restoration,
  shell-section history routing, cached page restoration, and fallback overlay close behavior are characterized and live
  in an internal `app-shell` helper.
- Phase 12 plan 12-31 completed the shell Escape dismissal boundary-hardening slice: player-modal priority, overlay
  dismissal, non-Escape no-op, and idle no-op behavior are characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-32 completed the shell document click intent boundary-hardening slice: mobile-nav, player-control,
  player-trigger, scroll-target, and anchor target classification are characterized and live in an internal `app-shell`
  helper.
- Phase 12 plan 12-33 completed the shell anchor click navigation boundary-hardening slice: internal-origin filtering,
  mobile-nav close, shell section routing, overlay routing, overlay-collapse document navigation, and `data-astro-reload`
  behavior are characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-34 completed the player modal open request boundary-hardening slice: no-provider, same-release reuse,
  different-release active-session stop, cached provider preference, and default-provider fallback behavior are
  characterized and live in an internal `app-shell` helper.
- Phase 12 plan 12-35 documented the AppShellRoot refactor strategy: `AppShellRoot.tsx` is currently 1,207 lines, the
  Phase 12 target is 800-900 lines, the app-shell internals should move toward `navigation`, `overlay`, `player-shell`,
  `store-cart`, and `dom` folders, and remaining code-motion slices should stay under `eslint-plugin-boundaries` plus the
  normal repo gates.
- Phase 12 plan 12-36 organized already-tested app-shell-owned helper/test pairs into `navigation`, `overlay`,
  `player-shell`, `store-cart`, and `dom` folders while keeping `AppShell.astro`, `AppShellRoot.tsx`, and the closed
  `player` module's `player-*` files at the app-shell root.
- Phase 12 plan 12-37 extracted shell-section navigation orchestration into `navigation/shell-section-navigation`,
  characterized section href rejection, current-section reset, uncached fetch/loading, cached snapshots, document fallback,
  and overlay-history collapse, and reduced `AppShellRoot.tsx` from 1,210 to 1,150 lines.
- Phase 12 plan 12-38 extracted overlay open coordination into `overlay/shell-overlay-navigation`, characterized
  non-overlay href rejection, cached/loading state seeding, history writes, fragment fetch, stale-route protection,
  document fallback, and abort handling, reduced `AppShellRoot.tsx` from 1,150 to 1,114 lines, and recorded the user
  decision to defer both internal-submodule formalization and Nx adoption for now.
- Phase 12 plan 12-39 completed the immediate test-performance analysis slice. Focused app-shell Vitest commands remain
  the fast seam loop, the web package now exposes the native `test` lifecycle like backend/api-client, and root
  `pnpm test:unit` now runs the three package test suites through native pnpm filtered parallel execution without custom
  scripts, Nx, or new dependencies.
- Phase 12 plan 12-40 extracted shell document/window event routing into `dom/shell-document-event-routing`,
  characterized mobile navigation, player controls, anchor/scroll routing, prefetch, Escape, popstate, and iframe-blur
  behavior, and reduced `AppShellRoot.tsx` from 1,114 to 997 lines.
- Phase 12 plan 12-41 extracted shell player session lifecycle coordination into
  `player-shell/shell-player-session-controller`, characterized provider activation, interaction marking,
  close/minimize/stop/reopen behavior, and reduced `AppShellRoot.tsx` from 997 to 820 lines.
- Phase 12 plan 12-42 extracted generic Decap YAML field and collection rendering into
  `apps/web/src/lib/admin/decap-yaml-builder.ts`, added direct builder characterization tests, and reduced
  `decap-config.ts` from 1,375 to 1,133 lines.
- Phase 12 plan 12-43 extracted Decap local-backend and site-root URL decisions into
  `apps/web/src/lib/admin/decap-runtime-config.ts`, moved the runtime characterization tests next to that seam, and
  reduced `decap-config.ts` from 1,133 to 1,088 lines.
- Phase 12 plan 12-44 extracted homepage-specific Decap field generation into
  `apps/web/src/lib/admin/decap-home-fields.ts`, added direct homepage field characterization tests, and reduced
  `decap-config.ts` from 1,088 to 889 lines.
- Phase 12 plan 12-45 completed the test-performance follow-up analysis: focused module Vitest loops and native pnpm
  parallel `test:unit` remain the approved fast path, `pnpm check:types` is the largest measured check path, and the
  ESLint import resolver now uses the existing single `tsconfig.boundaries.json` project instead of suppressing the
  multiple-project warning.
- Phase 12 plan 12-46 extracted About-page Decap field generation into
  `apps/web/src/lib/admin/decap-about-fields.ts`, added direct About field characterization tests, and reduced
  `decap-config.ts` from 889 to 746 lines.
- Phase 12 plan 12-47 extracted Services-page Decap field generation into
  `apps/web/src/lib/admin/decap-services-fields.ts`, added direct Services field characterization tests, and reduced
  `decap-config.ts` from 746 to 590 lines.
- Phase 12 plan 12-48 extracted Settings Decap field generation into
  `apps/web/src/lib/admin/decap-settings-fields.ts`, added direct Settings field characterization tests, and reduced
  `decap-config.ts` from 590 to 551 lines.
- Phase 12 plan 12-49 extracted Home/About/Services/Settings file-collection wiring into
  `apps/web/src/lib/admin/decap-page-collections.ts`, added direct page collection characterization tests, and reduced
  `decap-config.ts` from 551 to 490 lines.
- Phase 12 plan 12-50 extracted Navigation/Socials collection wiring into
  `apps/web/src/lib/admin/decap-site-chrome-collections.ts`, added direct site chrome collection characterization tests,
  and reduced `decap-config.ts` from 490 to 425 lines.
- Phase 12 plan 12-51 extracted Artist collection wiring into
  `apps/web/src/lib/admin/decap-artist-collection.ts`, added direct artist collection characterization tests, and reduced
  `decap-config.ts` from 425 to 296 lines.
- Phase 12 plan 12-52 extracted Release collection wiring into
  `apps/web/src/lib/admin/decap-release-collection.ts`, added direct release collection characterization tests, and reduced
  `decap-config.ts` from 296 to 191 lines.
- Phase 12 plan 12-53 extracted Distro collection wiring into
  `apps/web/src/lib/admin/decap-distro-collection.ts`, added direct distro collection characterization tests, and reduced
  `decap-config.ts` from 191 to 102 lines.
- Phase 12 plan 12-54 extracted News collection wiring into
  `apps/web/src/lib/admin/decap-news-collection.ts`, added direct news collection characterization tests, and reduced
  `decap-config.ts` from 102 to 53 lines.
- Phase 12 plan 12-55 closed the `cms-admin` temporary-open exception: the module boundary manifest now marks
  `cms-admin` as closed, declares `/admin/media/**` as an explicit entrypoint, and the manifest validator now approves
  only `app-shell` as a remaining temporary-open module.
- Phase 12 plan 12-56 closed the `app-shell` temporary-open exception: the module boundary manifest now marks
  `app-shell` as closed, `AppShellRoot.tsx` is inside the documented 800-900 line target band at 820 lines, and the
  manifest validator no longer approves any temporary-open modules.
- Phase 12 plan 12-57 completed the test/check feedback-loop analysis after the module migrations: focused app-shell and
  cms-admin Vitest loops remain the fastest refactor loops, root `test:unit` remains native pnpm parallel package
  execution, root `check:types` now uses native pnpm parallel package execution, and boundary enforcement remains intact.
- Phase 12 plan 12-58 extracted backend commerce IDs and repository port contracts from `platform-shared` into a closed
  `commerce-domain` module, updated checkout/order/stock dependencies to use that module, and hardened the manifest
  validator against moving backend commerce domain code back into `platform-shared`.
- Phase 12 plan 12-59 extracted shared frontend UI primitives and `cn` from `platform-shared` into a closed
  `ui-foundation` module, updated frontend consumer dependencies to use that module, and hardened the manifest validator
  against moving frontend UI foundation code back into `platform-shared`.
- Phase 12 plan 12-60 extracted Cloudflare Access operator identity parsing from `platform-shared` into a closed
  `operator-auth` module, updated internal order and operator stock dependencies to use that module, and hardened the
  manifest validator against moving operator auth code back into `platform-shared`.
- Phase 12 plan 12-61 extracted backend Prisma/D1 persistence adapters and Stripe SDK integration from
  `platform-shared` into closed `commerce-persistence` and `stripe-integration` modules, updated backend consumer
  dependencies to use those modules, and closed `platform-shared` with validator coverage against reopening it.
- Phase 12 plan 12-62 extracted app-shell render surfaces into `components/app-shell/view/`, reducing
  `AppShellRoot.tsx` to 591 lines while keeping routing, overlay, player, StoreCart, and portal state composition in the
  root.
- Phase 12 plan 12-63 completed the boundary-hardening audit: every manifest module is closed, the approved
  open-temporary set is empty, `eslint-plugin-boundaries` remains a hard gate, and further extraction would be cosmetic
  without a new decision.
- Follow-up repo-wide modulith entrypoint refactor split backend commerce identity aliases onto the `commerce-domain`
  root interface, moved repository and checkout provider contracts to explicit `spi.ts` named interfaces, and hardened the
  manifest validator so `*-spi` surfaces must target `spi.ts` and unapproved module-level `ports/` or `adapters/`
  directories fail the boundary audit.
- Phase 12 now has an explicit refactor end-goal document at
  `.planning/phases/12-modulith-boundary-hardening-planning/12-REFACTOR-ENDGOAL.md`; remaining slices should aim at thin
  app-shell composition, explicit `cms-admin` seams, closed commerce modules, strict `platform-shared`, and hard
  `eslint-plugin-boundaries` enforcement rather than generic file shrinking.
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
  a hosted Checkout Session.
- The static checkout shell now hydrates a small Worker-read status panel that displays backend-known offer, variant,
  and checkout eligibility state without starting payment.
- The static checkout shell now redirects to the Worker-returned hosted Checkout `checkoutUrl`; it does not load
  Stripe.js or receive Checkout client secrets.
- Phase 7 corrected the current `/store/barren-point/` route drift: the shopper-facing smoke item now uses
  `/store/disintegration-black-vinyl-lp/`, with legacy `barren-point` routes kept as compatibility redirects.
- Phase 7 now has a browser-local single-item cart state seam and header cart icon that store only browser-safe item
  option display data.
- Phase 7 now has a Shopify-inspired cart drawer that shows one item summary, subtotal, remove, continue-shopping, and
  canonical checkout navigation.
- Phase 7 now routes store item detail purchases through `Add To Cart`, stores or replaces the single browser cart
  item, and opens the cart drawer before checkout navigation.
- Phase 7 now renders checkout as a familiar order-summary plus payment handoff layout while preserving Worker-owned
  checkout eligibility and Stripe-hosted Checkout redirect.
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
- Phase 7 real Stripe sandbox validation is complete for test mode. Required production inputs remain live-mode Stripe
  keys, live prices/products, production webhook endpoint and secret, production Worker configuration, and final go-live
  approval.
- Phase 8 backend order groundwork remains independent from live-mode Stripe validation because D1 schema, repositories,
  transition guards, fixture-based webhook contracts, generated clients, and local tests do not require account-specific
  live Stripe values.
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
- Phase 9 plan 1 locked the original BOX NOW shipping contract: v1 is Greece-only, BOX NOW credentials remain Worker
  runtime secrets or out-of-band operator credentials, and fulfillment stays manual. Later plan `09-07` replaced the
  live locker-first checkout requirement with manual address-based fulfillment.
- Phase 9 plan 2 added the frontend-only BOX NOW locker gate to the checkout route. Local mock mode can select a
  deterministic Greek locker before payment, non-mock mode fails closed until the real BOX NOW picker exists, and
  `StartCheckout` still sends only `storeItemSlug` and `variantId`.
- Phase 9 plan 3 added Worker-owned checkout preflight for the historical Greece-only BOX NOW locker-selection branch.
  Plan `09-07` later removed `shippingLocker` from new public `StartCheckout` calls.
- Phase 9 plan 4 added nullable D1/Prisma `CheckoutOrder` fields for the approved thin BOX NOW locker snapshot,
  persists that snapshot when checkout starts, and exposes it through protected internal order readback for manual
  fulfillment/reconciliation.
- Phase 9 plan 5 extended public `ReadCheckoutState` with the nullable Worker-owned `shippingLocker` snapshot and
  renders selected-locker or needs-review recap copy on the checkout return UI.
- Phase 9 plan 6 documented the manual BOX NOW fulfillment handoff and local prototype evidence. On 2026-05-17 it was
  accepted as complete for the current manual v1 scope; partner-portal/API integration is reopen-only future work after access exists.
- On 2026-05-14, Phase 9 was revised: the locker-first sandbox slice is now treated as prototype evidence only, and
  final closure must explicitly choose between manual-address fulfillment and `boxnow-js`-backed automation.
- Phase 9 plan 7 chose manual-address BOX NOW fulfillment for new checkout starts: the checkout UI no longer requires a
  browser-selected locker, public `StartCheckout` no longer accepts `shippingLocker`, checkout-core writes new pending
  orders with `shippingLocker: null`, and Stripe Checkout collects Greek shipping address plus phone details for manual
  operator fulfillment.
- Phase 10 plan 1 added a repeatable local full-loop UAT checklist for the no-account path: local D1, official local
  `stripe-mock`, Mock Checkout Panel, BOX NOW Test Locker, signed paid webhook fixture, protected internal order
  readback, checkout return recap, and replay idempotency checks.
- Phase 10 plan 2 recorded sandbox readiness evidence: Worker sandbox deployment lookup succeeds, Cloudflare/GitHub CI
  credentials are present by name, sandbox D1 is inspectable through `COMMERCE_DB`, current migrations and base seed are
  applied, Worker Stripe secret names are configured, and real Stripe sandbox mappings exist. BOX NOW portal evidence is
  no longer an active blocker for the current manual v1 scope.
- Phase 10 plan 3 prep bound sandbox `COMMERCE_DB` to the existing sandbox D1 database, applied migration `0004`,
  applied the non-secret base commerce seed, redeployed the sandbox Worker with the D1 binding, and later closed the
  hosted Stripe sandbox evidence pass through automated smoke run `20260517102558`.
- Phase 10 plan 4 added a deterministic commerce boundary audit and recorded no-account release audit evidence:
  generated API parity, public/internal OpenAPI separation, Browser Use local checks for
  store/checkout/return/stock/shell navigation, and explicit limits around local stripe-mock and Access-protected
  stock API behavior.
- Phase 10 plan 4.1 added the Worker-owned Native Checkout Gate so native checkout can be disabled at runtime through
  Cloudflare Flagship without replacing Worker environment isolation; the browser sees only sanitized capability state
  from `/api/store/capabilities`.
- Phase 10 plan 5 produced the milestone review package and go-live handoff. The package links implemented
  architecture, sandbox evidence, remaining production gates, and Go-Live / Launch Hardening seeds without claiming
  production cutover.
- Phase 10 plan 6 fixed the GitHub Pages hosted Checkout return base-path bug, deployed sandbox Worker version
  `3c996856-1285-43f3-8391-7307f5b0888e`, and verified smoke run `20260517123136` returned paid Checkout to
  `/blackbox-records/store/.../checkout/return/?session_id=...`. The return page now uses buyer-facing order status
  copy while still reading payment state from the Worker.
- The no-account cart expansion workstream now promotes `BL-13` into concrete multi-item and CartQuantity planning. It
  can proceed without BOX NOW account access, but production multi-line checkout approval remains behind Go-Live /
  Launch Hardening.
- StoreCart remains convenience-only state. Native `localStorage` stays the approved storage primitive until carts
  become account-backed, cross-device, large/offline, or operationally authoritative.

## Decisions Made

| Phase | Decision                                                                                                                                                                             | Status  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| v1.0  | Production commerce cutover remains deferred until the future go-live milestone; Cloudflare Pages is the canonical static frontend host and GitHub Pages is rollback/legacy.         | Active  |
| v1.0  | The first native sellable slice is `/store/` collection -> store item detail -> single-item cart-like checkout, with familiar cart affordances but no multi-item cart semantics.     | Revised |
| v1.0  | v1 order state stays minimal: `pending_payment`, `paid`, `not_paid`, and `needs_review`, with Checkout webhooks as the authoritative paid/unpaid signals.                            | Active  |
| v1.0  | MVP shipping remains Greece only; the default end state is manual address-based BOX NOW fulfillment, and any future automation must use `boxnow-js`.                                 | Revised |
| v1.1  | The Astro site remains static, and Phase 7.1 moved canonical static hosting from GitHub Pages to Cloudflare Pages after checkout browser wiring was complete.                        | Active  |
| v1.1  | A separate Cloudflare Worker backend is the dynamic commerce surface for Stripe, webhooks, D1, and later BOX NOW backend work.                                                       | Active  |
| v1.1  | The Worker is a backend/BFF, not the primary frontend runtime.                                                                                                                       | Active  |
| v1.1  | The Worker does not expose default synthetic probe routes such as `healthz`, `status`, or `readyz`; runtime checks rely on Wrangler, deploy success, and real API tests.             | Active  |
| v1.1  | Backend application code is TypeScript-only and uses Hono only as the HTTP interface layer.                                                                                          | Active  |
| v1.1  | The backend owns HTTP contracts through code-first OpenAPI, emitted as separate public/internal documents, and the frontend consumes generated clients from `@blackbox/api-client`.  | Active  |
| v1.1  | Backend modules must stay DDD-layered, use ubiquitous-language names, and ship with mandatory tests.                                                                                 | Active  |
| v1.1  | Astro content owns editorial content only, Stripe owns sellable commerce data, and D1 owns operational state plus internal mappings.                                                 | Active  |
| v1.1  | The primary sellable unit is a `Variant` attached to a storefront-facing `StoreItem`.                                                                                                | Active  |
| v1.1  | Phase 5.1 is inserted as a hard architecture gate before further storefront or checkout work.                                                                                        | Active  |
| v1.1  | `/store/` is the canonical native storefront route; `/shop/` is compatibility-only.                                                                                                  | Active  |
| v1.1  | Phase 6 storefront UI composes stable `StoreItem` plus `ItemAvailability` contracts and keeps temporary offer state out of editorial content.                                        | Active  |
| v1.1  | Internal stock operations use Google-backed Cloudflare Access on a separate protected backend hostname; Decap auth is not reused for runtime stock writes.                           | Active  |
| v1.1  | D1 is the authoritative stock ledger using `Stock`, `StockChange`, and `StockCount`; spreadsheets are temporary capture/reporting only.                                              | Active  |
| v1.1  | Each `Variant` exposes a conservative `OnlineStock` quantity separate from total stock balance before public checkout depends on live stock.                                         | Active  |
| v1.1  | Public checkout starts only through Worker-owned `StartCheckout`; the browser receives a hosted Stripe Checkout `checkoutUrl` but never receives Stripe price IDs or server secrets. | Active  |
| v1.1  | Stripe Checkout return URLs are Worker-validated against `CHECKOUT_RETURN_ORIGINS`; arbitrary browser origins are not trusted.                                                       | Active  |
| v1.1  | Shopper-facing store URLs must describe the sellable item option, not legacy release shorthand or backend mapping names.                                                             | Active  |
| v1.1  | Phase 7 cart UX is a single-item Shopify-familiar shell built in Astro/React/shadcn; true multi-item cart remains out of scope for this milestone.                                   | Active  |
| v1.1  | Every current release and distro entry is a native store candidate; legacy external merch metadata no longer blocks native store projection.                                         | Active  |
| v1.1  | Local stripe-mock D1 state is generated from static storefront content and uses fake 99/99 stock plus `price_mock_*` mappings only for local development.                            | Active  |
| v1.1  | Local stripe-mock checkout readiness may use fake dev stock for every current distro and release item; real stock authority still requires staff-recorded D1 stock operations.       | Active  |
| v1.1  | Do not add frontend commerce state machines or state-machine dependencies; Phase 8 uses a tiny backend typed order transition guard for persisted order rows.                        | Active  |

## Pending Todos

- Keep future backend routes inside the OpenAPI contract/generation workflow; do not add handwritten frontend DTOs for
  backend APIs.
- Preserve the current `StoreItem` and `ItemAvailability` storefront contracts while later backend APIs grow on top of
  the completed Phase 6.1 foundation.
- Treat Phase 12 as complete; any further boundary hardening should start as a new approved slice or milestone and should
  still respect the boundary manifest and verifier rules.
- Use the completed Stripe sandbox validation gate as sandbox UAT evidence only; do not treat it as production release approval.
- Treat Phase 9, `09-06`, and `SHIP-01` through `SHIP-03` as complete for the current manual v1 BOX NOW scope.
- Do not reopen BOX NOW portal/API integration unless the user explicitly asks after access exists.
- Use `10-LOCAL-UAT.md` as the local no-account UAT checklist until external access exists.
- Use `10-SANDBOX-READINESS.md` as the latest sandbox readiness and evidence record.
- Use `10-MILESTONE-REVIEW.md` as the prepared human review package without claiming production cutover.
- Use `10-MULTI-ITEM-CART-WORKSTREAM.md` when planning multi-item cart, quantity controls, Worker-owned multi-line
  checkout validation, order-line persistence, and paid-webhook stock decrement per line.

## Blockers

- No production cutover work is approved in this milestone.
- Public shopper and sandbox browsing remain unauthenticated by design; internal stock writes stay confined to the
  protected operator hostname and Access boundary.
- The Astro frontend is no longer being treated as "moving to Workers" in this milestone; do not reintroduce that
  assumption in implementation.
- Phase 7 must still avoid production cutover and should remain sandbox-first.
- Stripe sandbox validation is complete for test mode. Do not commit any account-specific Stripe values, and do not use
  sandbox evidence as live-mode approval.
- BOX NOW portal/API integration is not active work. Reopen it only on explicit user instruction after BOX NOW access
  exists; still never commit BOX NOW credentials, voucher data, labels, or raw portal output.
- Cloudflare Pages production and `pages/no-stripe-validation` preview deploys now pass through GitHub Actions, serve
  root-based assets, and pass Browser Use hosted smoke. Hosted Stripe sandbox Checkout evidence exists for the sandbox
  Worker; live-mode Stripe Checkout remains future Go-Live work.
- Cloudflare Access + Google setup for the protected operator hostname remains deferred until the operator-hostname
  setup phase; do not treat it as a blocker for public Pages/Worker sandbox browsing.

## Session

**Last Date:** 2026-05-16T00:00:00.000Z
**Stopped At:** Completed Phase 12 boundary-hardening audit
**Resume File:** None
