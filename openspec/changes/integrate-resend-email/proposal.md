## Why

BlackBox now has Worker-owned checkout and order state, but paid orders still depend on Stripe's generic receipts and operator polling for fulfillment awareness. The newsletter form is also presentational only, so signups cannot reach a durable marketing list.

Integrating Resend gives the Worker a single email provider boundary for paid-order notifications and newsletter capture while keeping provider secrets out of the static Astro frontend.

## What Changes

- Add a Worker-owned email communications capability backed by Resend REST calls.
- Send repo-owned HTML/text shopper confirmation and ops fulfillment emails only after the first verified Stripe paid transition.
- Add a public Worker newsletter subscription endpoint for single opt-in signup, Resend Contact Segment/Topic enrollment, and a first welcome email.
- Add repo-owned Resend CLI setup automation for diagnostics and provider resource preparation without using the CLI at runtime.
- Extend environment, deployment, order, and module-boundary specs so Resend secrets, provider IDs, runtime behavior, and local validation remain explicit.

## Capabilities

### New Capabilities

- `email-communications`: Worker-owned transactional email, newsletter signup, Resend provider setup, idempotency, and provider-secret boundaries.

### Modified Capabilities

- `orders-stock-operator`: Paid Stripe webhook reconciliation also triggers paid-order email notifications exactly once.
- `static-site-and-deployment`: Static newsletter forms submit to the Worker API and do not use Astro SSR, Pages Functions, or public provider secrets.
- `environment-model`: Product environments include Resend provider resources, Worker runtime email config, and manual provider checkpoints.
- `module-boundaries`: Email application and infrastructure modules become documented backend entrypoints with allowed dependencies.

## Impact

- Backend Worker env contract, Resend infrastructure client, email application services, Stripe webhook acknowledgement path, and public OpenAPI contracts.
- Static Astro newsletter component and browser API client behavior.
- Repo setup scripts and docs for Resend CLI diagnostics/resource setup.
- Unit tests, API contract generation, runtime config verification, module-boundary checks, and browser validation for newsletter UI.
