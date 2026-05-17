# Phase 10 Sandbox Readiness Evidence

Last checked: 2026-05-17T13:27:01+03:00

## Summary

`10-02` originally verified the sandbox posture without changing runtime code. The later Stripe access pass completed the sandbox/test-mode setup needed for UAT.

The Cloudflare sandbox Worker deployment path exists, sandbox D1 is bound and migrated through the current repo schema, real Stripe sandbox mappings exist, Worker sandbox Stripe secret names are configured, and the automated hosted Checkout smoke passed. BOX NOW remains manual for the current v1 scope and should reopen only if the user explicitly requests full integration after access exists.

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

- Real Stripe sandbox mappings exist in sandbox D1.
- No `price_*` values are recorded in this repo evidence.

## GitHub Actions And Pages Variables

- `gh workflow list` shows the Cloudflare Pages deploy workflow and Worker sandbox deploy workflow are active.
- Recent Cloudflare Pages workflow runs succeeded for `main` and `pages/no-stripe-validation`.
- `gh variable list` shows `CLOUDFLARE_ACCOUNT_ID` and `PUBLIC_BACKEND_BASE_URL` are configured.
- Hosted Checkout no longer requires `PUBLIC_STRIPE_PUBLISHABLE_KEY`; Stripe readiness now depends on Worker secrets, webhook secret, and real Price mappings.
- `gh secret list` shows `CLOUDFLARE_API_TOKEN` is configured.
- Secret values were not read or recorded.

## Worker Sandbox Secrets

- `STRIPE_SECRET_KEY` is configured for sandbox.
- `STRIPE_WEBHOOK_SECRET` is configured for sandbox.
- Secret values were not read or recorded.

## Stripe Access Gate

Stripe Access Gate is satisfied for sandbox/test mode:

- real Stripe test-mode keys are configured outside git
- real Stripe test-mode Price mappings exist in sandbox D1
- the sandbox Worker webhook secret matches the active Stripe CLI listener used for evidence
- hosted Checkout, 3DS, declines, webhook reconciliation, and D1 paid-order evidence were validated by the automated smoke
- raw evidence remains ignored under `.codex-artifacts/stripe-sandbox-smoke/20260517102558/`

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
- Real Stripe sandbox mappings and Worker secret names.
- Hosted Stripe sandbox UAT smoke with paid, 3DS, and decline scenarios.

Not ready:

- Production live-mode checkout.
- Production D1 cutover.
- Optional BOX NOW portal/API fulfillment evidence only if the reopen gate is explicitly activated.

`10-02` remains complete as the readiness pass. `10-03` is complete for sandbox/test mode. Production release approval remains deferred to Go-Live / Launch Hardening.
