# Phase 10 Validation

## 10-01 Create Local Full-Loop UAT Checklist And Scripts

- Result: complete for no-account preparation.
- Evidence: `10-LOCAL-UAT.md` now documents the repeatable local full-loop UAT path using local D1, official local `stripe-mock`, the Mock Checkout Panel, the BOX NOW Test Locker, signed webhook simulation, protected internal order readback, checkout return recap, and replay idempotency checks.
- Evidence: Existing commands already cover the local loop, so no new script was added for `10-01`.
- Boundary: The checklist does not claim real Stripe test-mode evidence, BOX NOW portal evidence, Cloudflare sandbox Worker evidence, or production cutover readiness.
- Deferred gates: the Stripe Access Gate and BOX NOW Portal Gate remain required before full sandbox/release evidence.
- Browser policy: rendered UI evidence must use Browser Use first; DevTools MCP remains fallback-only with the Browser Use failure reason recorded.
- Validation: `rg` command-reference check, `git diff --check`, and `pnpm check`.

## 10-02 Verify Sandbox Deployment, Secrets, D1, And Stripe Mapping Readiness

- Result: complete as readiness evidence and blocker capture, not as full sandbox UAT approval.
- Evidence: `10-SANDBOX-READINESS.md` records the read-only Cloudflare, Wrangler, GitHub, sandbox D1, Worker secret-name, and Stripe preflight checks.
- Worker sandbox: Wrangler authentication succeeded and sandbox Worker deployment lookup returned deployment records, with the newest listed sandbox deployment on `2026-04-29T10:48:09Z`.
- Sandbox D1: a remote database named `blackbox-records-commerce-sandbox` exists and read-only database-name queries succeeded.
- Sandbox D1 blocker: binding-scoped remote D1 commands through `COMMERCE_DB` fail because the sandbox binding is missing a remote `database_id`.
- Sandbox D1 blocker: sandbox has migrations `0001` through `0003` only; current repo migration `0004_add_checkout_order_shipping_locker_snapshot.sql` is not applied.
- Sandbox D1 blocker: `StoreItemOption`, `VariantStripeMapping`, `Stock`, and `CheckoutOrder` row counts are all `0`.
- Stripe blocker: real Stripe mapping count is `0`, Worker sandbox secret list is empty, and `pnpm checkout:preflight:stripe-test` fails because the real `pk_test_*`, local `.dev.vars`, and ignored real Price mapping seed are absent.
- GitHub readiness: Cloudflare Pages and Worker sandbox workflows are active; `CLOUDFLARE_ACCOUNT_ID`, `PUBLIC_BACKEND_BASE_URL`, and `CLOUDFLARE_API_TOKEN` are configured by name. `PUBLIC_STRIPE_PUBLISHABLE_KEY` is not configured while the Stripe Access Gate is deferred.
- BOX NOW blocker: the BOX NOW Portal Gate remains deferred, so `09-06`, Phase 9 completion, and `SHIP-03` remain pending.
- Boundary: no remote D1 migrations were applied, no remote data was written, no secrets were read, and no runtime behavior changed.

## 10-03 Prep - Make Sandbox D1 Ready Enough For Later UAT

- Result: partial prep for `10-03`, not full sandbox UAT completion.
- Evidence: sandbox `COMMERCE_DB` is now bound to the existing `blackbox-records-commerce-sandbox` D1 database in `apps/backend/wrangler.jsonc`.
- Evidence: `pnpm --filter @blackbox/backend d1:migrations:apply:sandbox` applied `0004_add_checkout_order_shipping_locker_snapshot.sql`, and `pnpm --filter @blackbox/backend d1:migrations:list:sandbox` now reports no pending migrations.
- Evidence: `pnpm --filter @blackbox/backend d1:seed:sandbox` applied the non-secret base commerce seed and wrote 33 rows.
- Evidence: sandbox row counts are now `StoreItemOption = 3`, `Stock = 3`, `VariantStripeMapping = 0`, and `CheckoutOrder = 0`.
- Evidence: `CheckoutOrder` now includes the thin locker snapshot columns in sandbox: `shippingLockerId`, `shippingLockerCountryCode`, and `shippingLockerNameOrLabel`.
- Evidence: `pnpm deploy:backend:sandbox` redeployed `blackbox-records-backend-sandbox` with the bound D1 config.
- Boundary: no real Stripe mappings, mock Stripe mappings, BOX NOW credentials, production D1 config, production data, Worker secrets, or runtime behavior changes were introduced.
- Remaining blockers: full `10-03` sandbox UAT still requires the Stripe Access Gate and BOX NOW Portal Gate.
