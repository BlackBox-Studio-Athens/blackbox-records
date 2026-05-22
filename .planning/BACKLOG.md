# Commerce Migration Backlog

**Project:** BlackBox Records Native Commerce Migration  
**Date:** 2026-04-19  
**Scope:** Future work outside the active sandbox implementation roadmap.

## Ready For Pre-Go-Live Architecture Hardening

### BL-19: Modulith boundary hardening planning

- Linked milestone: v1.2 Modulith Boundary Hardening
- Acceptance criteria:
  - Add a planning-only milestone that sits after the active v1.1 sandbox milestone and before Go-Live / Launch Hardening.
  - Create `.planning/phases/12-modulith-boundary-hardening-planning/` with context, research, spec, four plan docs, and validation.
  - Define an explicit module map for `app-shell`, `player`, `storefront-catalog`, `store-cart`, `checkout-web`, `cms-admin`, `public-commerce-http`, `checkout-core`, `orders`, `stock`, `operator-stock`, and `platform-shared`.
  - Create one module canvas per module plus an ADR that translates Spring Modulith ideas into repo-local rules for module boundaries, named interfaces, temporary-open modules, and verification.
  - Keep `.planning/config.json` `parallelization: false`, keep `workflow.use_worktrees = false`, and leave the active v1.1 roadmap/status untouched.
  - Run `pnpm check` and `pnpm test:unit` after the planning docs land.
- Human review stop: approve the module map, temporary-open exceptions, and future execution slices before any refactor starts.

## Ready For Future Go-Live Milestone

Start from `.planning/phases/10-sandbox-verification-and-release-gate/10-MILESTONE-REVIEW.md`.

### BL-11: One-way production cutover plan

- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Consume the `10-MILESTONE-REVIEW.md` deferred-gate list before any cutover decision
  - Define the production rollout order from the current external handoff to native commerce
  - Define emergency disable or rollback triggers for native checkout
  - Keep the cutover plan separate from sandbox implementation work
- Human review stop: approve production cutover approach

### BL-12: Live-mode launch checklist

- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Cover runtime, secrets, Stripe, D1, shipping, reconciliation, monitoring, and communications
  - Include Stripe Access Gate evidence, Native Checkout Gate setup, and optional BOX NOW reopen-only integration evidence if explicitly reopened
  - Name required approvers and the stop/go gate
  - Stay implementation-aware enough to use the sandbox milestone evidence directly
- Human review stop: approve final launch gate format

### BL-17: Account-backed external gate validation

- Linked milestone: Go-Live / Launch Hardening
- Status: Partially done for sandbox/test mode; production/live remains blocked on live Stripe access, final domain, production webhook wiring, and final cutover configuration.
- Acceptance criteria:
  - Keep the completed real Stripe test-mode checkout, webhook, and return-state evidence as sandbox UAT evidence
  - Capture production/live Stripe evidence only after live Stripe credentials, live Products/Prices, final domain, production webhook endpoint, and production Worker/D1 configuration are connected
  - Capture BOX NOW partner/API evidence only if the user explicitly reopens full BOX NOW integration after access exists
  - Keep the evidence separate from local stripe-mock and signed-fixture validation
- Human review stop: approve whether the external gates are satisfied

### BL-20: Stripe Tax product category decision

- Status: Done
- Linked milestone: Go-Live / Launch Hardening
- Decision: current launch StoreItems use the `physical_goods` tax category and always map to `General - Tangible Goods (txcd_99999999)`.
- Acceptance criteria:
  - Keep the physical-goods tax category mapped to `General - Tangible Goods (txcd_99999999)` for vinyl records, cassettes, CDs, shirts, and other merch
  - Explicitly reject `General - Electronically Supplied Services (txcd_10000000)` for shipped physical goods unless a qualified tax/accounting review says otherwise
  - Fix existing sandbox Stripe Products directly in Stripe so their Product tax code is `txcd_99999999`, without committing account-specific Stripe values
  - Require a new explicit tax-category policy before future digital goods can be mapped or sold
- Initial evidence: Stripe docs describe `txcd_10000000` as digital/electronically supplied services, while physical-goods docs say `General - Tangible Goods (txcd_99999999)` can be used for most shipped physical goods.
- Human review stop: approve any future non-physical tax-category policy before real products/prices are created or migrated for that category

### BL-21: Declined and expired Checkout Session lifecycle

- Status: Current implementation accepted for v1 unless production evidence shows a support/reconciliation gap.
- Decision: expired Checkout Sessions transition the app-owned CheckoutOrder to `not_paid`; card-decline attempts remain `pending_payment` while the Stripe Checkout Session is still open and only become non-paid after a verified Stripe non-paid signal such as session expiry.
- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Preserve the current policy unless live/sandbox evidence proves operators need a more granular declined/abandoned state
  - Treat `checkout.session.expired` as the verified signal that closes an unpaid CheckoutOrder as `not_paid`
  - Keep open declined attempts in `pending_payment` until Stripe emits a terminal or non-paid signal
  - Define what operator/support evidence is needed before adding more granular declined, failed, or abandoned-session lifecycle states
  - Preserve paid-order webhook authority and idempotent stock decrement semantics.
- Human review stop: approve any future change away from pending-until-expired before implementation.

### BL-22: Stripe dynamic payment methods policy

- Status: Approved for planning; implementation deferred.
- Decision: Production Checkout should use Stripe dynamic payment methods through a named Payment Method Configuration. Buyer-visible methods are limited to card rails, Apple Pay, Google Pay, and Link. Never show PayPal, Klarna, BNPL methods, or bank-debit style methods.
- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Create or update a named Stripe Payment Method Configuration such as `BlackBox merch checkout` through Stripe CLI/API where supported.
  - Enable only the approved positive set when configurable: `card`, `apple_pay`, `google_pay`, and `link`.
  - Disable PayPal, Klarna, all BNPL-style methods, and bank-debit/mandate-style methods when present in the Stripe configuration response.
  - Verify through Stripe CLI/API that banned methods are either unavailable or have effective display preference `off`.
  - Remove `payment_method_types: ['card']` from Checkout Session creation only in the implementation slice, and pass a Worker-owned `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` when configured.
  - Preserve deterministic sandbox smoke coverage for card success, 3D Secure, decline, and expired-card scenarios even if production uses dynamic payment methods.
- Planning artifacts: `.planning/phases/13-stripe-dynamic-payment-methods-policy/13-CONTEXT.md`,
  `.planning/phases/13-stripe-dynamic-payment-methods-policy/13-01-PLAN.md`
- Human review stop: approve Stripe CLI/API evidence and any Dashboard-only account activation gaps before implementation changes Checkout Session creation.

## Ready For No-Account Commerce Expansion

### BL-13: Cart and multi-item checkout

- Status: Done for the no-account v1 launch scope.
- Decision: Native commerce is now multi-item and will stay multi-item. Do not return to the earlier single-item launch scope.
- Linked milestone: Go-Live / Launch Hardening or a no-account cart expansion slice before external account gates clear
- Acceptance criteria:
  - Define `CartDraft`, `CartLine`, and `CartQuantity` semantics that fit the existing shell and Worker-owned checkout
  - Replace the current single-item cart drawer with multi-line StoreCart state, quantity controls, item removal, and a multi-line order summary
  - Keep StoreCart non-authoritative and limited to app-safe display/routing fields plus `storeItemSlug`, `variantId`, and `quantity`
  - Evolve `StartCheckout` so the Worker re-reads availability, OnlineStock, and Stripe Price Mapping for every line before creating a Checkout Session
  - Add additive order-line persistence, preferably `CheckoutOrderLine`, instead of overloading current single-item `CheckoutOrder` fields
  - Preserve paid-webhook idempotency by decrementing stock exactly once for each paid CheckoutOrderLine
  - Keep one manual BOX NOW shipping surface per CheckoutOrder unless a later shipping plan explicitly supports split shipments
  - Validate locally with stripe-mock and Browser Use; keep production/live multi-line checkout evidence behind the production Stripe go-live gate
- Planning artifact: `.planning/phases/10-sandbox-verification-and-release-gate/10-MULTI-ITEM-CART-WORKSTREAM.md`
- Human review stop: complete; multi-item quantity scope is the approved path.

### BL-14: Stock reservation design

- Linked milestone: v2+
- Acceptance criteria:
  - Define reservation lifecycle and expiry behavior
  - Define oversell reduction strategy
  - Compare added complexity against actual order volume

## Ready For Website Editorial Improvements

### BL-18: Website editorial and catalog UX improvements

- Linked milestone: Website Editorial And Catalog UX Improvements
- Planning artifact: `.planning/phases/11-website-editorial-and-catalog-ux-improvements/`
- Source input: partner handwritten website notes captured on 2026-05-12
- Acceptance criteria:
  - Rework artist detail planning around richer biographies, profile links, videos, latest release context, previous releases, and existing player behavior
  - Replace the homepage Latest Releases module with News while keeping other homepage sections by default
  - Add a latest-release feature/banner to the Releases page
  - Add display-only release date and format grouping support for Distro, including 12-inch vinyl, 7-inch vinyl, and CDs
  - Clean Distro descriptions without changing StoreItem identity, checkout authority, stock authority, Stripe mappings, or order/shipping behavior
  - Require `pnpm test:unit`, `pnpm check`, `pnpm build`, and Browser Use rendered validation when implemented
- Human review stop: approve supplied wireframe/mockup direction before implementation if a GPT Image 2 mockup is created

## Ready For Future v2 Milestones

### BL-15: Automated BOX NOW fulfillment

- Linked milestone: v2+
- Status: reopen-only; do not start unless the user explicitly asks after BOX NOW access exists.
- Acceptance criteria:
  - Compare manual partner-portal fulfillment with API-assisted automation
  - Define the minimum additional data required for automation
  - Keep Greece-only locker behavior compatible with the future automation path

### BL-16: Non-Greece shipping path

- Linked milestone: Post-MVP / Phase 14
- Status: Promoted to a post-MVP Phase 14 plan. It must not block checkout launch readiness unless explicitly
  reactivated.
- Decision: The next non-Greece shipping path is a Shiplemon courier-flow integration, not a BOX NOW reopen or locker
  model.
- Acceptance criteria:
  - Define how Shiplemon quote, package-profile, shipment, label, tracking, and customs data fit the current checkout
    architecture
  - Avoid redesigning or reopening the Greece-only manual BOX NOW path
  - Keep Shiplemon credentials, raw rate IDs, shipment IDs, labels, invoices, and raw provider payloads Worker-owned
  - Make non-Greece checkout fail closed when package profiles, Shiplemon credentials, supported rates, or valid quotes
    are missing
- Planning artifacts: `.planning/phases/14-shiplemon-non-greece-shipping-integration/14-CONTEXT.md`,
  `.planning/phases/14-shiplemon-non-greece-shipping-integration/14-01-PLAN.md`
