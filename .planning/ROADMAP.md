# Roadmap: BlackBox Records Native Commerce Migration

## Overview

This roadmap now treats milestone `v1.2`, Modulith Boundary Hardening, as the active milestone. The earlier `v1.1`
Stripe Sandbox Integration work remains partially open behind deferred external gates, while the current focus shifts to
the architecture hardening needed to make later refactors smaller, cheaper, and easier to review.

The historical v1.1 goal was to add native commerce to the existing Astro site using a Cloudflare-fronted dual-runtime
monorepo model:

- the Astro site remains a static frontend, now hosted canonically on Cloudflare Pages with GitHub Pages kept as rollback/legacy
- a separate Cloudflare Worker backend is added in-repo for dynamic commerce APIs, Stripe integration, webhooks, and D1 state

Cloudflare Pages is now the canonical static frontend host after Phase 7.1 validation. GitHub Pages remains rollback/legacy, and real native-commerce production cutover remains a later milestone.

The UI contracts for the store flow and BOX NOW locker flow were approved in the archived pre-sandbox milestone. Re-run `$gsd-ui-phase` only if implementation work materially changes those approved shopper flows.

## Milestone v1.2: Modulith Boundary Hardening

## Milestone Position

- **Current milestone:** Modulith Boundary Hardening
- **Starts at:** Phase 12
- **Ends after:** the approved Phase 12 hardening slices are executed or explicitly deferred
- **Previous milestone:** v1.1 Stripe Sandbox Integration (deferred external gates remain open)

## Phases

**Phase Numbering:**

- Integer phases continue from the previous milestone
- Decimal phases remain reserved for inserted urgent work

- [x] **Phase 5: Worker Backend Platform And Deployment Plumbing** - Add a separate Cloudflare Worker backend to the repo without disrupting the static Astro Pages frontend
- [x] **Phase 5.1: Commerce Domain Architecture And Source-Of-Truth Research** - Lock entity boundaries, source-of-truth rules, IDs, mappings, and API contracts before storefront or checkout implementation
- [x] **Phase 6: Static Storefront Slice** - Replace the legacy `/shop/` redirect with a canonical `/store/` static storefront built from shared editorial content and a stable store projection
- [x] **Phase 6.1: Worker Commerce State Foundation** - Introduce D1 + Prisma in the separate Worker backend behind repository and API boundaries before checkout work
- [x] **Phase 6.1.1: Internal Stock Operations And Operator Access** - Add protected staff-only stock tooling and operator auth before checkout depends on live stock
- [ ] **Phase 7: Worker Checkout And Stripe Sandbox Flow** - Implement Worker-owned checkout APIs and connect the frontend checkout route to Stripe sandbox (mock/contract implementation complete; real Stripe account validation deferred)
- [x] **Phase 7.1: Cloudflare Pages Static Frontend Migration** - Move the static Astro frontend from GitHub Pages to Cloudflare Pages before webhook/order/shipping verification depends on stable Cloudflare-hosted origins
- [x] **Phase 8: Webhook Orders And Stock** - Make payment truth and stock mutation Worker-owned, webhook-authoritative, and idempotent (non-secret backend groundwork may proceed before real Stripe account access)
- [ ] **Phase 9: Greece-Only BOX NOW Shipping** - Lock the Greece-only BOX NOW shipping contract and choose between manual address fulfillment or `boxnow-js`-backed automation (current locker-first implementation is prototype-only; final shipping mode still pending)
- [ ] **Phase 10: Sandbox Verification And Release Gate** - Prove the dual-deploy sandbox flow where account access allows and prepare the go-live handoff package (review package complete; external gates remain pending)
- [x] **Phase 11: Website Editorial And Catalog UX Improvements** - Convert partner website notes into static-site editorial, artist, release, homepage, and distro/catalog improvements without changing commerce authority (completed 2026-05-12)
- [ ] **Phase 12: Modulith Boundary Hardening Planning** - Activate the TypeScript-native boundary stack and execution slices that make later refactors safer before revisiting the deferred commerce gates

## Phase Details

### Phase 5: Worker Backend Platform And Deployment Plumbing

**Goal**: Bootstrap a separate Cloudflare Worker backend in-repo while preserving the Astro static frontend and GitHub Pages deployment path.
**Depends on**: Archived milestone v1.0 decisions
**Requirements**: DEPL-01, DEPL-02, DEPL-03, SECU-01
**Success Criteria** (what must be TRUE):

1. The Astro site keeps its static Pages build path and remains the frontend deployment target during this milestone.
2. A separate Cloudflare Worker backend can be built, configured, and run locally without changing the frontend runtime model.
3. Frontend-to-Worker environment contracts, sandbox deployment plumbing, server-only secret boundaries, the no-probe-endpoint runtime posture, the TS-only Hono backend conventions, and the code-first OpenAPI contract foundation are explicit.
   **Plans**: 6 plans
   **Review gate**: Human review required before the separate backend runtime and auth/deploy assumptions are treated as stable.

Plans:

- [x] 05-01: Bootstrap the separate Cloudflare Worker backend in-repo
- [x] 05-02: Define the frontend-to-Worker environment and URL contract
- [x] 05-03: Add Wrangler config and the backend environment model
- [x] 05-04: Add the local Worker development path and docs
- [x] 05-05: Add the sandbox deployment workflow and stable backend hostname
- [x] 05-06: Lock the secrets and CI auth contract for the Worker backend

### Phase 5.1: Commerce Domain Architecture And Source-Of-Truth Research (INSERTED)

**Goal**: Freeze the commerce domain model and source-of-truth split before storefront, D1, or Stripe implementation drifts.
**Depends on**: Phase 5
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):

1. The entity model for `Artist`, `Release`, `DistroEntry`, `StoreItem`, and `Variant` is explicit and decision-complete.
2. Astro content, Stripe, and D1 ownership boundaries are locked with no ambiguous overlap.
3. Canonical IDs, mappings, internal interfaces, external Worker APIs, backend naming conventions, and the backend-owned OpenAPI/generation contract are drafted clearly enough that Phases 6, 6.1, and 7 can implement without re-deciding architecture.
   **Plans**: 4 plans
   **Review gate**: Human review required because this phase locks the architecture that every later commerce phase consumes.

Plans:

- [x] 05.1-01: Spec the domain entities and source-of-truth matrix
- [x] 05.1-02: Research implementation patterns and failure modes across Astro content, Worker backend, Stripe, and D1
- [x] 05.1-03: Draft internal backend interfaces and external Worker API contracts
- [x] 05.1-04: Freeze IDs, mappings, and static-to-dynamic linking rules for downstream phases

### Phase 6: Static Storefront Slice

**Goal**: Turn `/store/` into the canonical native storefront in the static Astro site using shared editorial content and the architecture frozen in Phase 5.1, while keeping `/shop/` as a compatibility redirect.
**Depends on**: Phase 5.1
**Requirements**: CATA-01, CATA-02, CATA-03
**Success Criteria** (what must be TRUE):

1. Shopper can browse a native `/store/` collection built from a stable `StoreItem` projection derived from releases and distro entries.
2. Shopper can open a native store item detail page that reuses editorial assets and summaries while reading temporary variant state through the approved contract.
3. Release and distro entry points route into canonical native store item pages instead of raw external shop URLs.
   **Plans**: 7 plans
   **Review gate**: Human review required if implementation drifts from the approved storefront UI contract or from the Phase 5.1 architecture.

Plans:

- [x] 06-01: Implement the shared `StoreItem` projection contract in the static frontend
- [x] 06-02: Implement cross-collection mapping rules from releases and distro into store items
- [x] 06-03: Add the temporary ItemAvailability adapter that matches the future backend API shape
- [x] 06-04: Replace the legacy `/shop/` redirect with the canonical native `/store/` collection route
- [x] 06-05: Build the store item detail route and `Buy Now` handoff shell
- [x] 06-06: Add release-to-shop navigation using canonical shop links
- [x] 06-07: Reuse editorial assets and summaries without duplicating content into commerce storage

### Phase 6.1: Worker Commerce State Foundation

**Goal**: Introduce D1 + Prisma inside the separate Worker backend behind repository and API boundaries, without changing the frontend shop contract.
**Depends on**: Phase 6
**Requirements**: DEPL-04, CATA-04, SECU-01
**Success Criteria** (what must be TRUE):

1. Local D1 bindings and Worker-compatible Prisma runtime access exist inside the separate backend.
2. The migration workflow is defined before checkout implementation depends on backend state.
3. Backend repositories can evolve from temporary ItemAvailability data to D1-backed reads without changing the Phase 6 storefront contract, while staying inside the TS-only Hono + layered-boundary standard.
   **Plans**: 4 plans
   **Review gate**: Human review required before Stripe checkout work consumes the backend state model.

Plans:

- [x] 06.1-01: Bootstrap local D1 and Worker bindings
- [x] 06.1-02: Add Prisma runtime access and repository seams in the Worker backend
- [x] 06.1-03: Establish the migration workflow baseline
- [x] 06.1-04: Move backend variant and mapping reads from temporary data toward D1-backed repositories where needed

### Phase 06.1.1: Internal Stock Operations And Operator Access (INSERTED)

**Goal**: Add a protected staff-only stock operations surface before public checkout depends on live stock, with Astro owning the UI and the Worker owning internal APIs.
**Depends on**: Phase 6.1
**Requirements**: AUTH-01, AUTH-02, INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):

1. Team members can reach an internal stock tool through Google-backed Cloudflare Access on a separate protected operator hostname, while public storefront and shopper checkout remain unauthenticated.
2. The Worker backend exposes protected internal APIs for variant discovery, stock visibility, `StockChange`, and `StockCount`, and every write records operator identity and time using the same TS-only Hono + layered-boundary standard.
3. D1 is explicitly the authoritative stock ledger, spreadsheets are explicitly non-authoritative, and the online-vs-offline stock policy is locked before checkout consumes stock state.
4. The operator UI is concrete enough that label staff can update stock without direct database access or Decap reuse.
   **Plans**: 4 plans
   **Review gate**: Human review required because this phase locks staff authentication, stock-write semantics, and the operator workflow that later checkout relies on.

Plans:

- [x] 06.1.1-01: Lock the protected hostname and Cloudflare Access + Google contract for internal operators
- [x] 06.1.1-02: Define the internal stock API and D1 ledger contract around `Variant`, `Stock`, `StockChange`, and `StockCount`
- [x] 06.1.1-03: Design the static Astro internal stock operations UI for search, balance, history, and write actions
- [x] 06.1.1-04: Lock spreadsheet policy, audit attribution, and the online-vs-offline stock buffer rules

### Phase 7: Worker Checkout And Stripe Sandbox Flow

**Goal**: Implement the Worker-owned checkout API surface and connect the static frontend checkout route to a Shopify-familiar cart and Stripe sandbox checkout flow.
**Depends on**: Phase 6.1.1
**Requirements**: CHKO-01, CHKO-02, CHKO-03, CHKO-04, CHKO-05
**Success Criteria** (what must be TRUE):

1. The Worker backend exposes the required StoreItem/Variant lookup, ReadCheckoutState, and StartCheckout endpoints using the approved domain contracts and the locked backend conventions.
2. Shopper-facing store URLs describe the sellable item/option being purchased, not legacy release shorthand or backend mapping names.
3. The static frontend provides a familiar single-item cart affordance, cart icon, cart drawer/summary, and checkout page layout before mounting embedded Stripe Checkout.
4. The static frontend checkout route mounts embedded Checkout using data and session state obtained through the Worker backend, not directly from Stripe, and return/retry state reads Worker-owned CheckoutState instead of raw Stripe browser contracts.
5. The checkout path is testable locally with stripe-mock for all-current-items no-network checkout readiness; real Stripe test mapping validation is preserved as a deferred access gate.
6. Every current distro entry and release entry is treated as a real sellable store candidate for local mock checkout readiness, while unknown real quantities remain uncounted until staff records stock through D1-backed stock operations.
   **Plans**: 16 plans
   **Review gate**: Human review required on the shopper-facing URL/cart/checkout UX, final backend API contract, and retry/return behavior.

Plans:

- [x] 07-01: Implement Worker APIs for item lookup, variant lookup, ReadCheckoutState, and StartCheckout
- [x] 07-02: Add the frontend public checkout API client seam
- [x] 07-03: Wire the checkout shell to Worker offer and variant reads
- [x] 07-04: Mount embedded Stripe Checkout from Worker-created sessions
- [x] 07-05: Correct shopper-facing item option URLs and legacy slug redirects
- [x] 07-06: Add the storefront cart icon and single-item cart state seam
- [x] 07-07: Build the Shopify-inspired cart drawer and item summary
- [x] 07-08: Refactor PDP and checkout entry actions around Add To Cart and Checkout
- [x] 07-09: Rebuild the checkout page into a familiar Shopify-like order summary plus embedded Checkout layout
- [x] 07-10: Add checkout return and retry state UI through ReadCheckoutState
- [x] 07-11: Harden checkout browser states, unavailable handling, cart edge cases, and no-secret guarantees
- [x] 07-12: Treat all current distro and release entries as sellable store candidates
- [x] 07-13: Generate local mock commerce state for every current store item
- [x] 07-14: Add all-items local mock checkout readiness checks
- [x] 07-15: Run local mock checkout UAT across representative item types
- [ ] 07-16: Validate the local and sandbox checkout loop with real Stripe sandbox mappings (deferred until Stripe account access exists)

Stripe access deferred gate:

- Do now without Stripe account: local mock checkout, checkout contracts, generated clients, cart/checkout integration tests, D1/Prisma order schema, repository seams, typed transition guards, fixture-based webhook route shape, docs, and Browser Use checks against `pnpm dev:stack:stripe-mock`.
- Prepare now, validate later: Stripe setup checklist, webhook fixture tests, preflight checks, sandbox runbook, and expected non-committed mapping/secrets docs.
- Blocked until Stripe access: real Checkout mount against Stripe, real products/prices, real webhook signing, remote sandbox payment evidence, and Phase 10 full sandbox release evidence.

### Phase 7.1: Cloudflare Pages Static Frontend Migration (INSERTED)

**Goal**: Move the static Astro frontend deployment target from GitHub Pages to Cloudflare Pages while preserving the static frontend model and separate Worker backend boundary.
**Depends on**: Phase 7
**Requirements**: DEPL-01, DEPL-02, DEPL-03, OPER-01
**Success Criteria** (what must be TRUE):

1. The Astro frontend deploys to Cloudflare Pages from the monorepo using the existing static build output without introducing SSR, Pages Functions, or frontend-owned secrets.
2. The public storefront, protected ops UI, and checkout browser flows use explicit Cloudflare Pages environment/origin contracts for the Worker backend, Stripe publishable key, and checkout return allowlist.
3. GitHub Pages remains a rollback/safety reference until Cloudflare Pages preview and production-like sandbox checks pass, then docs clearly identify Cloudflare Pages as the canonical static frontend target for the remainder of the milestone.
   **Plans**: 5 plans
   **Review gate**: Human review required before GitHub Pages is treated as non-canonical because this changes hosting, CI/CD, URL/origin assumptions, and checkout return-origin configuration.

Plans:

- [x] 07.1-01: Lock the Cloudflare Pages deployment contract and rollback posture
- [x] 07.1-02: Add Cloudflare Pages project config and direct-upload CI workflow
- [x] 07.1-03: Move frontend browser env and checkout return-origin contracts to Cloudflare Pages
- [x] 07.1-04: Validate Cloudflare Pages previews, production branch deploys, and Worker API routing
- [x] 07.1-05: Retire GitHub Pages as canonical hosting in docs after Cloudflare Pages acceptance

### Phase 8: Webhook Orders And Stock

**Goal**: Make payment truth and stock mutation server-owned, verified, and idempotent in the Worker backend.
**Depends on**: Phase 7 mock/contract completion for local schema work; Phase 7.1 and the deferred Stripe access gate remain required before hosted sandbox/release evidence.
**Requirements**: ORDR-01, ORDR-02, ORDR-03, ORDR-04, SECU-02
**Success Criteria** (what must be TRUE):

1. D1 stores the approved minimal order states, stock values, and backend mappings needed for authoritative payment handling.
2. Verified Stripe webhooks hitting the Worker backend verify the raw body/signature, acknowledge safely, and remain the only path that marks orders paid.
3. Stock decrements exactly once after confirmed payment success, unpaid flows leave stock untouched, and ReadCheckoutState reuses shared backend reconciliation logic without becoming payment authority.
   **Plans**: 8 plans
   **Review gate**: Human review required on webhook verification, idempotency, and stock semantics.

Plans:

- [x] 08-01: Add minimal D1 order lifecycle schema and migration
- [x] 08-02: Add order repositories, lifecycle seams, and typed order transition guard
- [x] 08-03: Add verified Stripe webhook raw-body route contract
- [x] 08-03.1: Add stripe-mock API local checkout simulation harness
- [x] 08-04: Add shared Stripe checkout reconciliation use case
- [x] 08-05: Apply idempotent paid-order transition and stock decrement
- [x] 08-06: Handle unpaid, expired, canceled, and needs-review outcomes
- [x] 08-07: Add backend order-state readback and operator reconciliation notes

### Phase 9: Greece-Only BOX NOW Shipping

**Goal**: Lock the Greece-only BOX NOW shipping contract, choose the shipping mode, and keep fulfillment low-maintenance.
**Depends on**: Phase 8
**Requirements**: SHIP-01, SHIP-02, SHIP-03
**Success Criteria** (what must be TRUE):

1. Phase 9 chooses one explicit Greece-only BOX NOW path: manual address-based fulfillment or approved automation via `boxnow-js`.
2. The chosen path exposes only the minimum Worker-owned shipping data needed to fulfill Greek orders.
3. BOX NOW fulfillment stays low-maintenance without exposing BOX NOW secrets or shifting shipping authority to browser code.
   **Plans**: 6 plans
   **Review gate**: Human review required if implementation drifts from the chosen shipping mode, expands shipping scope, or proposes BOX NOW automation outside `boxnow-js`.

Current implementation note:

- Plans `09-02` through `09-05` currently reflect a locker-first prototype branch.
- If manual-address fulfillment is chosen, reopen or replace that prototype work before marking Phase 9 complete.

Plans:

- [x] 09-01: Lock BOX NOW shipping data and secret contracts
- [x] 09-02: Add Greece-only locker selection UI before checkout
- [x] 09-03: Add backend checkout preflight for Greece-only locker selection
- [x] 09-04: Persist the thin locker snapshot on checkout/order state
- [x] 09-05: Surface selected locker state in checkout return/order recap
- [ ] 09-06: Document manual BOX NOW fulfillment and sandbox validation (deferred until the shipping mode is chosen and BOX NOW partner/sandbox portal access exists)

Remaining Phase 9 gates:

- Decide the Phase 9 shipping mode:
  - manual-address fulfillment (default)
  - `boxnow-js`-backed BOX NOW automation
- Do now without BOX NOW account: document both branches, keep manual fulfillment low-maintenance, and treat existing locker-first work as prototype evidence only.
- If manual-address fulfillment is chosen: capture and validate the Worker-owned address/contact handoff needed for manual portal shipment.
- If automated fulfillment is chosen: open a follow-up integration slice that consumes `boxnow-js` rather than adding ad hoc BOX NOW logic here.
- Blocked until BOX NOW portal access: operator login and a sandbox-paid Greek order fulfilled through the chosen path, with recorded evidence and `SHIP-03` completion.

### Phase 10: Sandbox Verification And Release Gate

**Goal**: Prove the implemented dual-deploy sandbox flow where account access allows and package the milestone outcome for the go-live milestone.
**Depends on**: Phase 9 local implementation plus the deferred Stripe Access Gate and BOX NOW Portal Gate for full sandbox/release evidence
**Requirements**: OPER-01, OPER-02
**Success Criteria** (what must be TRUE):

1. The full sandbox path works from static browse through Worker checkout APIs, webhook-confirmed paid order, and D1 state updates.
2. Required command checks, browser checks, and sandbox UAT evidence are captured across both deployment targets.
3. The milestone ends with a human review package and an explicit handoff to Go-Live / Launch Hardening.
   **Plans**: 6 plans
   **Review gate**: Human approval required before any production cutover milestone work starts.

Plans:

- [x] 10-01: Create local full-loop UAT checklist and scripts
- [x] 10-02: Verify sandbox deployment, secrets, D1, and Stripe mapping readiness
- [ ] 10-03: Run sandbox end-to-end checkout, webhook, stock, and shipping evidence pass (deferred until the Stripe Access Gate and BOX NOW Portal Gate can both be satisfied)
- [x] 10-04: Run security, OpenAPI, browser, and no-secret release audit
- [x] 10-04.1: Add Worker-owned native checkout feature gate
- [x] 10-05: Produce milestone review package and go-live handoff

### Phase 11: Website Editorial And Catalog UX Improvements

**Goal**: Improve the static Astro site's editorial and catalog experience using partner notes as source input, while preserving the existing app shell, player model, and commerce authority boundaries.
**Depends on**: Phase 6 static content/storefront foundations; independent of deferred Stripe Access Gate and BOX NOW Portal Gate
**Requirements**: SITE-ARTIST-01, SITE-RELEASE-01, SITE-HOME-01, SITE-DISTRO-01, SITE-DISTRO-02, SITE-DISTRO-03, SITE-VERIFY-01
**Success Criteria** (what must be TRUE):

1. Artist pages support richer profile content, links, videos, previous releases, and latest-release listen/player context without moving player ownership out of the app shell.
2. Homepage freshness comes from News replacing the Latest Releases module, and `/releases/` promotes the latest release through a top feature/banner.
3. Distro/catalog entries can show release dates, group vinyl by 12-inch and 7-inch formats, include CDs, and use cleaned editorial descriptions without changing StoreItem, checkout, stock, or order authority.
   **Plans**: 5 plans
   **Review gate**: Human review required before implementation if a GPT Image 2 wireframe/mockup is supplied or if homepage simplification beyond the News replacement is proposed.

Plans:

**Wave 1**

- [x] 11-01: Extend editorial content models

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 11-02: Rework artist detail pages
- [x] 11-03: Add homepage News and latest release feature

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 11-04: Improve Distro catalog grouping and copy

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 11-05: Verify editorial and catalog UX improvements

## Active And Future Milestones

### v1.2 Modulith Boundary Hardening

- Active milestone that sits between the deferred sandbox milestone and Go-Live / Launch Hardening
- Consumes `BL-19`, `ADR-004`, `.planning/codebase/MODULES.md`, and the Phase 12 planning artifacts
- Produces explicit module-boundary execution slices for `app-shell`, `cms-admin`, public commerce HTTP, backend
  commerce modules, and the residual `platform-shared` bucket
- Keeps `.planning/config.json` `parallelization: false`
- Plan `12-04` completed the legacy-open governance slice: only `app-shell` and `cms-admin` may be initial
  `open-temporary` modules, temporary-open modules require hard-closure metadata, and future Phase 12 execution remains
  one approved slice per branch or local commit cluster
- Plan `12-05` is the approved app-shell boundary-hardening slice: it adds shell helper characterization coverage and
  extracts the shell page loader seam without changing shopper-facing shell behavior
- Plan `12-06` continues app-shell boundary hardening by extracting the overlay fragment loader seam while leaving
  overlay state, history, focus, and fallback navigation in the shell composition root
- Plan `12-07` extracts overlay history mechanics while leaving overlay state, focus policy, and popstate branching in
  the shell composition root
- Plan `12-08` moves player iframe DOM/cache mechanics into the closed `player` module while preserving shell-owned
  player behavior
- Plan `12-09` moves route-scoped portal target synchronization behind an internal app-shell helper
- Plan `12-10` moves shell page snapshot caching/application details into the existing snapshot seam
- Plan `12-11` moves route loading indicator timer mechanics into an internal app-shell helper
- Plan `12-12` moves player provider origin warmup into the closed player module
- Plan `12-13` moves player trigger dataset parsing and default-provider selection into the closed player module
- Plan `12-14` moves shell target scrolling into an internal app-shell helper
- Plan `12-15` moves shell body state class synchronization into an internal app-shell helper
- Plan `12-16` moves homepage hero scroll-progress coordination into an internal app-shell helper
- Plan `12-17` moves overlay focus scheduling into an internal app-shell helper
- Plan `12-18` moves shell scroll-restoration setup and cleanup into an internal app-shell helper
- Plan `12-19` moves shell document/window listener attachment and cleanup into an internal app-shell helper
- Plan `12-20` moves player shell view-state derivation into a focused player helper
- Plan `12-21` moves player modal close-button focus scheduling into an internal app-shell helper
- Plan `12-22` moves player trigger focus restoration into the existing player focus helper
- Plan `12-23` moves player session-machine input derivation into an internal app-shell helper
- Plan `12-24` moves StoreCart state application and persistence into the existing StoreCart bridge
- Plan `12-25` moves shell prefetch intent classification into an internal app-shell helper
- Plan `12-26` moves player iframe blur interaction detection into an internal app-shell helper
- Plan `12-27` moves player frame-host synchronization into an internal app-shell helper
- Plan `12-28` moves shell rendered navigation state synchronization into an internal app-shell helper
- Plan `12-29` moves cached shell page restoration orchestration into an internal app-shell helper
- Plan `12-30` moves shell `popstate` routing decisions into an internal app-shell helper
- Plan `12-31` moves shell Escape-key dismissal priority into an internal app-shell helper
- Plan `12-32` moves shell document click target classification into an internal app-shell helper
- Plan `12-33` moves shell anchor-click navigation routing into an internal app-shell helper
- Plan `12-34` moves player modal open request decision-making into an internal app-shell helper
- Plan `12-35` documents the AppShellRoot line-count target, app-shell internal folder strategy, and remaining extraction
  order
- Plan `12-36` organizes app-shell-owned helper/test pairs into behavior folders without changing public entrypoints
- Plan `12-37` moves shell-section navigation orchestration into `navigation/shell-section-navigation`
- Plan `12-38` moves overlay open coordination into `overlay/shell-overlay-navigation` and defers Nx/submodule
  formalization per user decision
- Plan `12-39` measured the Phase 12 test feedback loop and switched the root unit gate to native pnpm parallel package
  tests without custom scripts, Nx, or new dependencies
- Plan `12-40` moves shell document/window event routing into `dom/shell-document-event-routing`
- Plan `12-41` moves shell player session lifecycle coordination into `player-shell/shell-player-session-controller`
  and brings `AppShellRoot.tsx` into the Phase 12 target size band
- Plan `12-42` starts `cms-admin` hotspot closure by moving generic Decap YAML field and collection rendering into a
  tested helper
- Plan `12-43` separates Decap runtime/base-path decisions from generated YAML assembly for the `/admin/config.yml`
  route
- Plan `12-44` moves homepage-specific Decap field generation into a focused `cms-admin` helper with direct tests
- Plan `12-45` re-analyzed test and check performance after the newer module splits and replaced the ESLint import
  resolver's multi-project warning suppression with the existing single `tsconfig.boundaries.json` resolver project
- Plan `12-46` moves About-page Decap field generation into a focused `cms-admin` helper with direct tests
- Plan `12-47` moves Services-page Decap field generation into a focused `cms-admin` helper with direct tests
- Plan `12-48` moves Settings Decap field generation into a focused `cms-admin` helper with direct tests
- Plan `12-49` moves Home/About/Services/Settings file-collection wiring into a focused `cms-admin` helper with direct tests
- Plan `12-50` moves Navigation/Socials collection wiring into a focused `cms-admin` helper with direct tests
- Plan `12-51` moves Artist collection wiring into a focused `cms-admin` helper with direct tests
- Plan `12-52` moves Release collection wiring into a focused `cms-admin` helper with direct tests
- Plan `12-53` moves Distro collection wiring into a focused `cms-admin` helper with direct tests
- Plan `12-54` moves News collection wiring into a focused `cms-admin` helper with direct tests
- Plan `12-55` closes the `cms-admin` temporary-open exception in the manifest, validator, tests, and module canvases
- Plan `12-56` closes the `app-shell` temporary-open exception and leaves no approved temporary-open modules
- Phase 12 refactor end goal is now documented in `12-REFACTOR-ENDGOAL.md`: thin app-shell composition, explicit
  `cms-admin` seams, closed commerce modules, strict `platform-shared`, and hard `eslint-plugin-boundaries` enforcement
- Exists to make later large refactors safer and more reviewable before production cutover work begins

### Go-Live / Launch Hardening

- Production cutover remains a separate milestone
- Starts only after the planned v1.2 hardening milestone or an explicit decision to skip it
- Consumes `10-MILESTONE-REVIEW.md`, sandbox readiness evidence, local UAT evidence, and the deferred external-gate checklist produced by this milestone
- Covers Stripe Access Gate completion, BOX NOW Portal Gate completion, Cloudflare Flagship `FLAGS` setup, live-mode keys, production rollout, emergency disable strategy, comms, and final stop/go review
- Must explicitly decide whether native commerce launches with the current single-item cart scope or first completes the no-account multi-item CartDraft and CartQuantity workstream
- Must not start until human review accepts the prepared package and explicitly carries forward the open gates

### No-Account Cart Expansion Workstream

- May proceed while Stripe account access and BOX NOW portal access remain unavailable
- Consumes `BL-13` and `.planning/phases/10-sandbox-verification-and-release-gate/10-MULTI-ITEM-CART-WORKSTREAM.md`
- Covers multi-line StoreCart state, quantity controls, Worker-owned multi-line checkout validation, additive order-line persistence, and paid-webhook stock decrement per CartLine
- Keeps stock reservation separate in `BL-14`; the first multi-item implementation still decrements only after verified paid webhook transition unless a later reservation plan changes that
- Does not satisfy the Stripe Access Gate, BOX NOW Portal Gate, `10-03`, `OPER-01`, or `SHIP-03`

### Website Editorial And Catalog UX Improvements

- May proceed as a static-site UI/content phase without waiting for Stripe account access or BOX NOW portal access
- Consumes `BL-18` and `.planning/phases/11-website-editorial-and-catalog-ux-improvements/`
- Covers richer artist profile content, artist links/videos, previous releases, app-shell player continuity, homepage News replacing Latest Releases, latest-release feature banner on `/releases/`, and Distro release-date/format grouping
- Keeps checkout, order, stock, Stripe, D1, webhook, BOX NOW, and feature-gate authority unchanged
- Treats "hide all sections from main page?" as an unresolved note, not accepted implementation scope

## Progress

**Execution Order:**  
Nominal phase order remains `5 → 5.1 → 6 → 6.1 → 6.1.1 → 7 → 7.1 → 8 → 9 → 10`.
Because Stripe account access and BOX NOW portal access are unavailable, non-secret backend, shipping, local UAT, and audit work may proceed after local mock/contract completion. Phase 7.1 is complete, while the deferred Stripe Access Gate and BOX NOW Portal Gate remain required before full hosted sandbox/release evidence. Phase 11 is a separate static-site editorial/catalog phase and is not required to close the Phase 10 commerce release gate.

| Phase                                                          | Plans Complete | Status    | Completed  |
| -------------------------------------------------------------- | -------------- | --------- | ---------- |
| 5. Worker Backend Platform And Deployment Plumbing             | 6/6            | Completed | 2026-04-20 |
| 5.1. Commerce Domain Architecture And Source-Of-Truth Research | 4/4            | Completed | 2026-04-20 |
| 6. Static Storefront Slice                                     | 7/7            | Completed | 2026-04-21 |
| 6.1. Worker Commerce State Foundation                          | 4/4            | Completed | 2026-04-22 |
| 6.1.1. Internal Stock Operations And Operator Access           | 4/4            | Completed | 2026-04-24 |
| 7. Worker Checkout And Stripe Sandbox Flow                     | 15/16          | Deferred  | 2026-04-25 |
| 7.1. Cloudflare Pages Static Frontend Migration                | 5/5            | Completed | 2026-04-29 |
| 8. Webhook Orders And Stock                                    | 8/8            | Completed | 2026-04-26 |
| 9. Greece-Only BOX NOW Shipping                                | 5/6            | Deferred  |            |
| 10. Sandbox Verification And Release Gate                      | 5/6            | Active    |            |
| 11. Website Editorial And Catalog UX Improvements              | 5/5            | Complete  | 2026-05-12 |
| 12. Modulith Boundary Hardening Planning                       | 25/28          | Active    |            |
