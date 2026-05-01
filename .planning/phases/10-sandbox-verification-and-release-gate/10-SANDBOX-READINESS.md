# Phase 10 Sandbox Readiness Evidence

Last checked: 2026-05-01T04:35:01+03:00

## Summary

`10-02` verified the current sandbox posture without changing runtime code, applying migrations, writing remote D1 data, setting secrets, or introducing account-specific Stripe or BOX NOW values.

The Cloudflare sandbox Worker deployment path exists, but the sandbox commerce environment is not ready for full end-to-end UAT. The blocking gaps are now explicit: sandbox D1 is behind the current repo schema and unseeded, Worker sandbox secrets are absent, real Stripe mappings are absent, Stripe test preflight is blocked by missing account credentials, and BOX NOW partner/sandbox portal validation remains unavailable.

## Cloudflare Worker Sandbox

- Wrangler authentication succeeded with an OAuth token.
- `wrangler deployments list --env sandbox --json` returned four sandbox deployment records.
- The newest listed sandbox Worker deployment was created on `2026-04-29T10:48:09Z` and routes 100% of traffic to one version.
- No deployment IDs, account IDs, or author emails are required for repo evidence and are intentionally omitted here.

## Sandbox D1

Binding readiness:

- `pnpm --filter @blackbox/backend d1:migrations:list:sandbox` failed because the sandbox `COMMERCE_DB` binding is missing a `database_id` for remote D1 operations.
- This means the documented binding-scoped remote D1 commands are not ready until the existing sandbox database is linked in Worker config or an approved environment setup step handles the binding.

Read-only database-name checks:

- `wrangler d1 list --json` shows a remote database named `blackbox-records-commerce-sandbox`.
- Read-only `wrangler d1 execute blackbox-records-commerce-sandbox --remote` queries succeeded.
- Existing tables: `CheckoutOrder`, `ItemAvailability`, `Stock`, `StockChange`, `StockCount`, `StoreItemOption`, `VariantStripeMapping`, `_cf_KV`, `d1_migrations`, and `sqlite_sequence`.
- Applied migration rows: `0001_initial_commerce_state.sql`, `0002_add_internal_stock_ledger.sql`, and `0003_add_checkout_order_lifecycle.sql`.
- Current repo migration `0004_add_checkout_order_shipping_locker_snapshot.sql` is not applied in sandbox.
- `CheckoutOrder` does not yet have the `shippingLockerId`, `shippingLockerCountryCode`, or `shippingLockerNameOrLabel` columns in sandbox.

Read-only row counts:

| Table                  | Row count |
| ---------------------- | --------: |
| `StoreItemOption`      |         0 |
| `VariantStripeMapping` |         0 |
| `Stock`                |         0 |
| `CheckoutOrder`        |         0 |

Stripe mapping readiness:

- Real Stripe mapping count in sandbox D1 is `0`.
- No `price_*` values are recorded in this repo evidence.

## GitHub Actions And Pages Variables

- `gh workflow list` shows the Cloudflare Pages deploy workflow and Worker sandbox deploy workflow are active.
- Recent Cloudflare Pages workflow runs succeeded for `main` and `pages/no-stripe-validation`.
- `gh variable list` shows `CLOUDFLARE_ACCOUNT_ID` and `PUBLIC_BACKEND_BASE_URL` are configured.
- `PUBLIC_STRIPE_PUBLISHABLE_KEY` is not configured, which is expected while the Stripe Access Gate is deferred.
- `gh secret list` shows `CLOUDFLARE_API_TOKEN` is configured.
- Secret values were not read or recorded.

## Worker Sandbox Secrets

- `pnpm --filter @blackbox/backend exec wrangler secret list --env sandbox` returned an empty list.
- `STRIPE_SECRET_KEY` is not configured for sandbox.
- `STRIPE_WEBHOOK_SECRET` is not configured for sandbox.
- This is expected while the Stripe Access Gate is deferred.

## Stripe Access Gate

`pnpm checkout:preflight:stripe-test` failed for the expected no-account reasons:

- `PUBLIC_STRIPE_PUBLISHABLE_KEY` is not set to a real `pk_test_*` value.
- `apps/backend/.dev.vars` is absent for the real Stripe local stack.
- `apps/backend/prisma/seeds/local-stripe-test-state.sql` is absent and still requires real test `price_*` values.

Required later evidence remains unchanged: real `pk_test_*`, `sk_test_*`, real `price_*`, `STRIPE_WEBHOOK_SECRET`, Stripe products/prices, webhook endpoint setup, sandbox Worker URL, real Checkout mount, and webhook/payment evidence.

## BOX NOW Portal Gate

BOX NOW partner/sandbox portal access is still unavailable. `09-06`, Phase 9 completion, and `SHIP-03` remain pending until an operator can fulfill a sandbox-paid Greek order through the BOX NOW partner portal and record the result.

## Current Sandbox Readiness Decision

Ready:

- Cloudflare authentication and sandbox Worker deployment lookup.
- Cloudflare Pages workflow readiness and public backend URL variable.
- Read-only remote D1 inspection by database name.

Not ready:

- Binding-scoped remote D1 commands through `COMMERCE_DB`.
- Sandbox D1 migration parity with the current repo schema.
- Sandbox D1 seed/mapping data.
- Worker sandbox Stripe secrets.
- Real Stripe test checkout preflight.
- BOX NOW portal fulfillment evidence.

`10-02` may be marked complete because the readiness pass was executed and blockers were captured. `10-03` remains blocked for full sandbox evidence until the Stripe Access Gate and BOX NOW Portal Gate are satisfied and sandbox D1 is brought to the current schema/seed posture through a separately approved setup step.
