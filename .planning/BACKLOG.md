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
  - Include Stripe Access Gate evidence, BOX NOW Portal Gate evidence, and Native Checkout Gate setup
  - Name required approvers and the stop/go gate
  - Stay implementation-aware enough to use the sandbox milestone evidence directly
- Human review stop: approve final launch gate format

### BL-17: Account-backed external gate validation

- Linked milestone: Go-Live / Launch Hardening
- Acceptance criteria:
  - Capture real Stripe test-mode checkout, webhook, and return-state evidence
  - Capture BOX NOW partner or sandbox portal fulfillment evidence for a paid Greek locker order
  - Keep the evidence separate from local stripe-mock and signed-fixture validation
- Human review stop: approve whether the external gates are satisfied

## Ready For No-Account Commerce Expansion

### BL-13: Cart and multi-item checkout

- Linked milestone: Go-Live / Launch Hardening or a no-account cart expansion slice before external account gates clear
- Acceptance criteria:
  - Define `CartDraft`, `CartLine`, and `CartQuantity` semantics that fit the existing shell and Worker-owned checkout
  - Replace the current single-item cart drawer with multi-line StoreCart state, quantity controls, item removal, and a multi-line order summary
  - Keep StoreCart non-authoritative and limited to app-safe display/routing fields plus `storeItemSlug`, `variantId`, and `quantity`
  - Evolve `StartCheckout` so the Worker re-reads availability, OnlineStock, and Stripe Price Mapping for every line before creating a Checkout Session
  - Add additive order-line persistence, preferably `CheckoutOrderLine`, instead of overloading current single-item `CheckoutOrder` fields
  - Preserve paid-webhook idempotency by decrementing stock exactly once for each paid CheckoutOrderLine
  - Keep one BOX NOW Locker per CheckoutOrder unless a later shipping plan explicitly supports split shipments
  - Validate locally with stripe-mock and Browser Use; defer real multi-line Stripe evidence until the Stripe Access Gate is satisfied
- Planning artifact: `.planning/phases/10-sandbox-verification-and-release-gate/10-MULTI-ITEM-CART-WORKSTREAM.md`
- Human review stop: approve whether native commerce launches as current single-item scope or waits for multi-item quantity scope

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
- Acceptance criteria:
  - Compare manual partner-portal fulfillment with API-assisted automation
  - Define the minimum additional data required for automation
  - Keep Greece-only locker behavior compatible with the future automation path

### BL-16: Non-Greece shipping path

- Linked milestone: v2+
- Acceptance criteria:
  - Define how non-Greece shipping fits the current checkout architecture
  - Avoid redesigning the Greece-only MVP flow just to add a second path
  - Document whether the next shipping path is another locker model or a courier flow
