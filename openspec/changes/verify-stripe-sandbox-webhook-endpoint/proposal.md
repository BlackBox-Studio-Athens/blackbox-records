## Why

Sandbox catalog sync still depends on an operational Stripe Dashboard endpoint that is outside the repo: `stripe listen` proves a smoke run, but it does not prove the deployed sandbox Worker will keep receiving catalog events after the listener stops. The repo now needs a repeatable verification path that fails when the Stripe account, Worker secret, or webhook event subscriptions drift away from the intended sandbox endpoint.

## What Changes

- Add a Stripe webhook endpoint verifier command, tentatively `pnpm stripe:webhooks:verify --env sandbox`, that checks the Stripe account for a persistent endpoint targeting `https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev/api/stripe/webhooks`.
- Require the verifier to confirm the endpoint subscribes to `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`.
- Require a Worker secret check proving the deployed sandbox Worker has `STRIPE_WEBHOOK_SECRET` set for the persistent endpoint, without printing the secret value.
- Keep `stripe listen` limited to paid smoke runs and local/manual diagnostics; it must not be accepted as evidence that persistent sandbox catalog webhooks are configured.
- Wire the webhook endpoint verifier into sandbox preflight/operator proof, and make it suitable for CI or manually-run launch readiness checks without requiring browser automation.
- Keep the scheduled catalog verification backstop enabled for sandbox and documented as layered control, not a substitute for persistent webhooks.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tooling-validation`: Add a Stripe webhook endpoint verification gate that checks persistent endpoint URL, enabled catalog events, and deployed sandbox Worker secret presence.
- `commerce-checkout`: Clarify that Stripe catalog webhook reconciliation relies on a persistent Stripe Dashboard endpoint for near-real-time Store Offer sync, while Store Offer reads, checkout start, scheduled verification, and manual catalog verification remain layered controls.
- `static-site-and-deployment`: Require sandbox Worker deployment evidence to include the persistent Stripe webhook endpoint and `STRIPE_WEBHOOK_SECRET` binding state for the deployed Worker.

## Impact

- Root scripts and the new verifier implementation, likely under `scripts/`.
- Stripe SDK usage for webhook endpoint listing/retrieval and redacted diagnostics.
- Wrangler/Cloudflare checks for sandbox Worker secret presence.
- Existing sandbox smoke/preflight docs and operator proof commands.
- OpenSpec launch/readiness expectations for sandbox catalog webhooks, scheduled backstop, and `pnpm stripe:catalog:verify --env sandbox`.
