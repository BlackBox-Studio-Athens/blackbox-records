## Why

BlackBox now has Worker-owned checkout and order state, but paid orders still depend on Stripe's generic receipts and operator polling for fulfillment awareness.

Integrating Resend gives the Worker a single email provider boundary for paid-order notifications while keeping provider secrets out of the static Astro frontend.

## What Changes

- Add a Worker-owned email communications capability backed by the official Resend SDK.
- Send repo-owned HTML/text shopper confirmation and ops fulfillment emails only after the first verified Stripe paid transition.
- Add a repo-owned Resend provider verifier for CLI/account/domain readiness without using the CLI at runtime.
- Extend environment, order, and module-boundary specs so Resend secrets, sender config, runtime behavior, and local validation remain explicit.
- Defer newsletter signup, Contact Segment/Topic enrollment, welcome emails, and provider resource automation to later reviewable changes.

## Capabilities

### New Capabilities

- `email-communications`: Worker-owned transactional email, SDK-backed Resend delivery, idempotency, provider verification, and provider-secret boundaries.

### Modified Capabilities

- `orders-stock-operator`: Paid Stripe webhook reconciliation also triggers paid-order email notifications exactly once.
- `environment-model`: Product environments include Resend provider readiness, Worker runtime email config, and manual provider checkpoints.
- `module-boundaries`: Email application and infrastructure modules become documented backend entrypoints with allowed dependencies.

## Impact

- Backend Worker env contract, Resend SDK infrastructure gateway, email application services, and Stripe webhook acknowledgement path.
- Repo provider verification script and docs for Resend CLI diagnostics and manual DNS/secret checkpoints.
- Unit tests, runtime config verification, module-boundary checks, and required repo gates.
