# Phase 10 Sandbox Readiness Evidence

Last checked: 2026-05-01T05:01:41+03:00

## Summary

`10-02` verified the current sandbox posture without changing runtime code, applying migrations, writing remote D1 data, setting secrets, or introducing account-specific Stripe or BOX NOW values.

The Cloudflare sandbox Worker deployment path exists and sandbox D1 is now bound, migrated through the current repo schema, and seeded with the non-secret base commerce rows. The remaining blockers for full end-to-end sandbox UAT are external or deliberately deferred: Worker sandbox Stripe secrets are absent, real Stripe mappings are absent, and Stripe test preflight is blocked by missing account credentials. BOX NOW is closed for the current manual v1 scope and should reopen only if the user explicitly requests full integration after access exists.

## Cloudflare Worker Sandbox

- Wrangler authentication succeeded with an OAuth token.
- `wrangler deployments list --env sandbox --json` returned four sandbox deployment records.
- The newest listed sandbox Worker deployment was created on `2026-04-29T10:48:09Z` and routes 100% of traffic to one version.
- No deployment IDs, account IDs, or author emails are required for repo evidence and are intentionally omitted here.

## Sandbox D1

Binding readiness:

- `apps/backend/wrangler.jsonc` now binds sandbox `COMMERCE_DB` to the existing `blackbox-records-commerce-sandbox` D1 database ID.
- `pnpm --filter @blackbox/backend d1:migrations:list:sandbox` now works through the `COMMERCE_DB` binding and reports no pending migrations after the prep pass.

Remote setup applied:

- `pnpm --filter @blackbox/backend d1:migrations:apply:sandbox` applied `0004_add_checkout_order_shipping_locker_snapshot.sql`.
- `pnpm --filter @blackbox/backend d1:seed:sandbox` applied the non-secret base commerce seed and wrote 33 rows.
- `pnpm deploy:backend:sandbox` redeployed `blackbox-records-backend-sandbox` with the bound D1 config.

Read-only binding checks:

- `wrangler d1 execute COMMERCE_DB --env sandbox --remote` queries now succeed.
- Existing tables: `CheckoutOrder`, `ItemAvailability`, `Stock`, `StockChange`, `StockCount`, `StoreItemOption`, `VariantStripeMapping`, `_cf_KV`, `d1_migrations`, and `sqlite_sequence`.
- Applied migration rows now include `0001_initial_commerce_state.sql`, `0002_add_internal_stock_ledger.sql`, `0003_add_checkout_order_lifecycle.sql`, and `0004_add_checkout_order_shipping_locker_snapshot.sql`.
- `CheckoutOrder` now has the `shippingLockerId`, `shippingLockerCountryCode`, and `shippingLockerNameOrLabel` columns in sandbox.

Read-only row counts:

| Table                  | Row count |
| ---------------------- | --------: |
| `StoreItemOption`      |         3 |
| `VariantStripeMapping` |         0 |
| `Stock`                |         3 |
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

## BOX NOW Reopen Gate

BOX NOW partner/sandbox portal access is not part of the active blocker set anymore. `09-06`, Phase 9, and `SHIP-03`
are complete for the current manual v1 scope. Reopen this gate only if the user explicitly asks to fully integrate BOX
NOW after access exists.

## Current Sandbox Readiness Decision

Ready:

- Cloudflare authentication and sandbox Worker deployment lookup.
- Cloudflare Pages workflow readiness and public backend URL variable.
- Binding-scoped remote D1 inspection through `COMMERCE_DB`.
- Sandbox D1 migration parity with the current repo schema.
- Non-secret base commerce rows in sandbox `StoreItemOption` and `Stock`.

Not ready:

- Worker sandbox Stripe secrets.
- Real Stripe test checkout preflight.
- Real Stripe price mappings.
- Optional BOX NOW portal/API fulfillment evidence only if the reopen gate is explicitly activated.

`10-02` remains complete because the readiness pass was executed and blockers were captured. `10-03` is a deferred external gate for full sandbox evidence until the Stripe Access Gate is satisfied. `10-04` no-account audit work may proceed around that gate, but it does not satisfy `OPER-01`.
