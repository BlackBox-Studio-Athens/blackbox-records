# Phase 7 Validation

## Required Checks

- Worker-owned StoreItem/Variant lookup and StartCheckout APIs exist.
- Worker-owned checkout-status retrieval exists for return/retry states.
- Static frontend checkout route uses backend APIs, not Stripe secrets.
- Embedded Checkout mounts and returns cleanly in sandbox.
- Browser pages remain non-authoritative for paid state.
- Shopper-facing checkout URLs describe the sellable item option rather than legacy release shorthand.
- Cart icon, cart drawer, and checkout summary remain single-item and do not introduce browser-owned commerce authority.
- Local stripe-mock checkout readiness covers every current distro entry and release entry with fake local stock and mock Stripe mappings.
- Fake local stock is documented as development-only and is not treated as real inventory evidence.

## Review Questions

- Can the frontend remain stable if Stripe identifiers or internal mappings change?
- Does any browser path bypass the Worker backend for checkout initialization?
- Does any browser path infer durable checkout truth from raw Stripe query params instead of Worker-owned status retrieval?
- Is webhook authority still reserved for Phase 8?
- Does the cart/checkout UI feel familiar to Shopify users without copying Shopify theme assets or implying unsupported multi-item behavior?
- Does every current release and distro store item have local mock D1 state, fake local stock, and a mock Stripe mapping?
- Is real quantity uncertainty still handled by staff-recorded D1 stock operations rather than committed fake data outside mock mode?

## 07-08 Browser Use Evidence

- 2026-04-25: Codex Browser Use verified `/blackbox-records/store/disintegration-black-vinyl-lp/` through the local stripe-mock stack. The eligible PDP showed `Add To Cart`, did not expose a primary `Buy Now`, opened the cart drawer after Add To Cart, showed `Disintegration`, `Afterwise`, and `Black Vinyl LP`, and linked checkout to `/store/disintegration-black-vinyl-lp/checkout/`.
- 2026-04-25: Codex Browser Use verified `/blackbox-records/store/afterglow-tape/` remained viewable while unavailable, rendered disabled `Currently Unavailable`, and exposed no actionable Add To Cart or checkout link.

## 07-09 Validation Evidence

- 2026-04-25: Checkout page was rebuilt around a Shopify-like order summary and payment panel. Direct checkout loads render `Order Summary`, the canonical item option, subtotal, secure Stripe copy, and the existing Worker-read embedded Checkout island without relying on browser cart state.
- 2026-04-25: Codex Browser Use verified `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/` through the local stripe-mock stack. The page rendered `Order Summary`, `Disintegration`, `Afterwise`, `Black Vinyl LP`, `Subtotal`, secure Stripe copy, checkout status, and the embedded Checkout mount; clicking `Checkout` rendered the local `Mock Checkout Started` handoff panel with no browser console errors.

## 07-10 Validation Evidence

- 2026-04-25: Checkout return UI was added at `/store/[slug]/checkout/return/`. It reads `session_id` only as input to the Worker-owned checkout state endpoint, renders app-owned paid/open/processing/expired/unknown states, and keeps retry/cart/item/store actions non-authoritative.
- 2026-04-25: Codex Browser Use verified `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/return?session_id=cs_mock_variant_barren-point_standard` through the local stripe-mock stack. The page called `ReadCheckoutState`, rendered `Checkout Still Open`, showed retry/cart/item/store actions and the order summary, and had no browser console errors. Browser Use also verified the missing-`session_id` state renders `Checkout Link Incomplete`, and `Back To Cart` opens the existing cart drawer without treating browser state as payment truth.

## 07-11 Validation Evidence

- 2026-04-25: Checkout browser hardening removed visible mock client-secret output, rejects malformed checkout-start responses without mounting checkout, keeps unavailable Worker offer states non-startable, and sanitizes cart drawer input even if an unsafe cart state reaches the drawer view.
- 2026-04-25: Focused tests cover missing backend/API errors, missing Stripe publishable key, empty Worker client secret, missing variant id, malformed cart state, forbidden browser/cart fields, and return-page missing-session behavior. Browser Use verification confirmed ready, unavailable, missing-session, and return-state paths through the local stripe-mock stack with no browser console errors.

## 07-12 Validation Evidence

- 2026-04-25: Store discovery now treats every current release and distro entry as a native store candidate. The `Caregivers` release keeps its legacy external merch metadata in content, but the release page now links to `/store/caregivers-vinyl/` and no longer exposes the external merch link as the primary commerce path.
- 2026-04-25: Codex Browser Use verified `/blackbox-records/store/` shows `Disintegration`, `Caregivers`, and the real distro entry `Afterglow Cassette`; `/blackbox-records/store/caregivers-vinyl/` renders fallback unavailable/price-soon state; `/blackbox-records/releases/caregivers/` links to the native store route; and `/blackbox-records/store/disintegration-black-vinyl-lp/` still renders the canonical smoke item. Fresh console logs during the clean Browser Use pass had no errors.

## 07-13 Validation Evidence

- 2026-04-25: `pnpm --filter @blackbox/backend d1:seed:stripe-mock:local` now generates local mock D1 state from static storefront content instead of applying a one-row static SQL file. The generated seed upserts `StoreItemOption`, `ItemAvailability`, `Stock`, and `VariantStripeMapping` rows for every current release and distro store item.
- 2026-04-25: Mock seed data uses clearly fake local-only defaults: `available`, `canBuy=true`, `quantity=99`, `onlineQuantity=99`, and `price_mock_*` Stripe mappings. This is development scaffolding for `dev:stack:stripe-mock`, not counted stock or sandbox/production payment evidence.

## 07-14 Validation Evidence

- 2026-04-25: `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` now compares current storefront content against local D1 mock checkout rows and reports missing `StoreItemOption`, `ItemAvailability`, `Stock`, or mock `VariantStripeMapping` rows by slug/source.
- 2026-04-25: The readiness check is read-only, uses one local Wrangler D1 query, verifies positive local fake stock plus `price_mock_*` mappings, and prints local prep/seed commands when local D1 is unavailable or incomplete.

## 07-15 Validation Evidence

- 2026-04-25: Before Browser Use UAT, `pnpm --filter @blackbox/backend d1:prepare:local`, `pnpm --filter @blackbox/backend d1:seed:stripe-mock:local`, and `pnpm --filter @blackbox/backend d1:check:stripe-mock:local` passed; readiness reported `29/29` store items ready.
- 2026-04-25: Codex Browser Use verified the release item `/blackbox-records/store/disintegration-black-vinyl-lp/` through PDP, `Add To Cart`, cart drawer, checkout route, Worker `CHECKOUT READY` state, and the local `Mock Checkout Started` handoff panel with no console errors.
- 2026-04-25: Codex Browser Use verified the release item `/blackbox-records/store/caregivers-vinyl/` through PDP, `Add To Cart`, cart drawer, checkout route, Worker `CHECKOUT READY` state, and the local `Mock Checkout Started` handoff panel with no console errors. UAT exposed the missing PDP Worker-read cart entry for statically unavailable but mock-ready items, fixed in `fix(web): use worker readiness for store cart entry`.
- 2026-04-25: Codex Browser Use verified distro items `/blackbox-records/store/afterglow-tape/` and `/blackbox-records/store/mass-culture-lp/` through PDP, cart drawer, checkout route, Worker `CHECKOUT READY` state, and the local `Mock Checkout Started` handoff panel with no console errors.
- 2026-04-25: Follow-up note for Phase 7/7.1 polish: when local mock D1 overrides static fallback availability, the action and checkout status correctly become ready, but some static PDP/order-summary labels can still show fallback unavailable/sold-out copy. This does not block local mock checkout UAT, but should be cleaned up before treating all-item mock buyability as shopper-facing polish.

## 07-16 Validation Attempt

- 2026-04-25: Added `pnpm checkout:preflight:stripe-test` so real Stripe test checkout validation fails before starting servers when local-only setup is incomplete. The command checks the browser publishable key, backend `.dev.vars` secret, ignored local Stripe test seed, and gitignore protection without printing secret values.
- 2026-04-25: `pnpm checkout:preflight:stripe-test` is currently blocked on this machine: `PUBLIC_STRIPE_PUBLISHABLE_KEY` is unset, `apps/backend/.dev.vars` is missing, and ignored `apps/backend/prisma/seeds/local-stripe-test-state.sql` is missing. Because real Stripe test credentials and a real test Price mapping are unavailable, 07-16 is not complete and no Stripe sandbox Browser Use evidence has been recorded.
- Smallest next action: add local-only `pk_test_*`, `sk_test_*`, and `price_*` values following README setup, rerun `pnpm checkout:preflight:stripe-test`, then run the local stripe-test stack and Browser Use validation. Sandbox validation still also requires Cloudflare sandbox access plus a real sandbox `VariantStripeMapping` applied without committing Price IDs.

## Stripe Access Deferred Gate

- 2026-04-25: GSD was rescoped because Stripe account access is not currently available. Real Stripe Checkout validation, real products/prices, real webhook signing, remote sandbox payment evidence, and Phase 10 full sandbox evidence are deferred until access exists.
- Do now without Stripe account: D1/Prisma order schema, repository seams, typed transition guard, generated API/client contract checks, fixture-based webhook route shape, docs, and local Browser Use smoke checks through `pnpm dev:stack:stripe-mock`.
- Prepare now, validate later: Stripe setup checklist, preflight checks, ignored mapping seed examples, fixture tests, sandbox runbook, and expected non-committed secrets/mappings documentation.
- This rescope does not treat real Stripe validation as passed. It only unblocks non-secret Phase 8 backend order groundwork while preserving 07-16 as a required validation gate before sandbox/release approval.

---

_Validation completed: 2026-04-20; Shopify UX validation addendum added: 2026-04-24; all-items mock readiness addendum added: 2026-04-25; 07-08 Browser Use verification added: 2026-04-25; 07-09 checkout summary Browser Use evidence added: 2026-04-25; 07-10 checkout return Browser Use evidence added: 2026-04-25; 07-11 checkout browser hardening evidence added: 2026-04-25; 07-12 store candidacy Browser Use evidence added: 2026-04-25; 07-13 local mock commerce seed evidence added: 2026-04-25; 07-14 local mock readiness command evidence added: 2026-04-25; 07-15 local mock Browser Use UAT evidence added: 2026-04-25; 07-16 preflight blocker recorded: 2026-04-25; Stripe access deferred gate recorded: 2026-04-25_
