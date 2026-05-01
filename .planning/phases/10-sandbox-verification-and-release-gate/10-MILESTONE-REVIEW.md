# Phase 10 Milestone Review Package

## Summary

The `v1.1` Stripe Sandbox Integration milestone has produced a native commerce implementation that is ready for no-account local review and future account-backed validation. The static Astro frontend is hosted canonically on Cloudflare Pages, while the separate Worker backend owns checkout, D1 state, Stripe integration, webhooks, order lifecycle, stock mutation, internal operator APIs, and runtime secrets.

This package is a handoff document, not production approval. Full release approval remains blocked by the Stripe Access Gate and the BOX NOW Portal Gate.

## Implemented Architecture

- Static frontend: Cloudflare Pages serves the prebuilt Astro artifact from `apps/web/dist`; GitHub Pages remains rollback/legacy.
- Worker backend: Hono + TypeScript owns public shopper APIs, protected internal APIs, D1/Prisma access, Stripe Checkout creation, webhook verification, order lifecycle, stock mutation, and feature gates.
- Contracts: public and internal OpenAPI documents remain separated, with generated frontend API clients and a commerce boundary audit guarding browser/server separation.
- Checkout: `StartCheckout` is Worker-owned, validates the selected StoreItemOption, OnlineStock, Stripe mapping, Native Checkout Gate, and Shipping Locker Snapshot before creating a Checkout Session.
- Orders and stock: verified Stripe webhook fixtures drive CheckoutOrder transitions; the paid transition decrements stock once, and non-paid states leave stock untouched.
- Shipping: Greece-only BOX NOW selection is required before checkout; persisted shipping data is limited to the thin Shipping Locker Snapshot.
- Runtime controls: the Native Checkout Gate is Worker-owned, locally enabled by default, and fail-closed for hosted environments without the Cloudflare Flagship `FLAGS` binding.

## Evidence Index

- Local no-account UAT checklist: `10-LOCAL-UAT.md`.
- Sandbox readiness and blocker record: `10-SANDBOX-READINESS.md`.
- Phase 10 validation evidence: `10-VALIDATION.md`.
- Feature gate contract: `10-FEATURE-GATES.md`.
- Manual BOX NOW handoff: `../09-greece-only-box-now-shipping/09-MANUAL-FULFILLMENT.md`.

Validated locally without external accounts:

- Local D1 prepare, seed, and readiness checks.
- Official local `stripe-mock` API stack and Mock Checkout Panel.
- BOX NOW Test Locker selection before payment.
- Signed local Stripe webhook fixture delivery.
- Protected internal order readback for a paid order.
- Checkout return recap from Worker-owned order state.
- Replay idempotency for paid webhook stock decrement.
- OpenAPI public/internal separation.
- Browser-facing no-secret commerce boundary audit.
- Worker-owned native checkout capability read.

Prepared in Cloudflare sandbox:

- Sandbox Worker deployment lookup works.
- Sandbox `COMMERCE_DB` binding is configured.
- Sandbox D1 is migrated through `0004`.
- Sandbox D1 has the non-secret base commerce seed.
- Real Stripe mapping count remains `0`, which is expected until Stripe access exists.

## Deferred Gates

These items remain open and must not be claimed as passed by this milestone package:

- `07-16`: real local and sandbox checkout loop with real Stripe test mappings.
- `09-06`: manual BOX NOW sandbox fulfillment through the partner portal.
- `10-03`: hosted sandbox end-to-end checkout, webhook, stock, and shipping evidence.
- `OPER-01`: full sandbox path validation.
- `SHIP-03`: operator fulfillment of sandbox-paid Greek orders through BOX NOW.

Stripe Access Gate requirements:

- real `pk_test_*`
- real `sk_test_*`
- real `price_*`
- `STRIPE_WEBHOOK_SECRET`
- Stripe products/prices
- webhook endpoint setup
- sandbox Worker URL
- Browser Use evidence against real Stripe test mode

BOX NOW Portal Gate requirements:

- BOX NOW partner or sandbox portal access
- sandbox-paid Greek order
- accepted manual locker shipment
- recorded portal result or rejection evidence

## Go-Live / Launch Hardening Handoff

The next milestone should start from this package and stay separate from the sandbox milestone. Recommended phase seeds:

1. Satisfy the Stripe Access Gate with real test-mode keys, Price mappings, webhook secret, and Browser Use evidence.
2. Satisfy the BOX NOW Portal Gate with partner-portal fulfillment evidence for a sandbox-paid Greek locker order.
3. Configure Cloudflare Flagship for the Worker `FLAGS` binding and `native_checkout_enabled` flag.
4. Lock production Worker secrets, exact checkout return origins, D1 target, and Cloudflare Access posture.
5. Define production rollout order for enabling native checkout behind the Native Checkout Gate.
6. Define rollback and emergency disable using Worker environment isolation plus the Native Checkout Gate.
7. Finalize operator support notes for paid order review, stock reconciliation, BOX NOW manual fulfillment, and shopper support.

## Review Decision

Ready for human review:

- Architecture and no-account local evidence.
- Sandbox D1 readiness.
- Security and no-secret audit evidence.
- Runtime feature-gate pattern.
- Go-live handoff inputs.

Not ready for release approval:

- Full Stripe test-mode evidence.
- Full BOX NOW portal fulfillment evidence.
- Full hosted sandbox e2e evidence.
- Production cutover.
