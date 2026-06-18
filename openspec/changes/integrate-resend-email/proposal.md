## Why

BlackBox now has Worker-owned checkout and order state, but paid orders still depend on Stripe's generic receipts and operator polling for fulfillment awareness.

Integrating Resend gives the Worker a single email provider boundary for paid-order notifications while keeping provider secrets out of the static Astro frontend.

## What Changes

- Add a Worker-owned email communications capability backed by the official Resend SDK.
- Send rich, BlackBox-designed, repo-owned HTML/text shopper confirmation and ops fulfillment emails only after the first verified Stripe paid transition.
- Add Resend-backed newsletter registration for the existing site signup forms and shopper opt-in during purchase.
- Document manual Resend and Cloudflare provider readiness checkpoints without adding a repo-owned verifier script or committed evidence artifact.
- Extend environment, order, and module-boundary specs so Resend secrets, sender config, runtime behavior, and local validation remain explicit.
- Stay compatible with Resend Free tier constraints; defer welcome emails, newsletter broadcast composition/sending, DNS automation, secret upload automation, and provider account/domain/key automation to later reviewable changes.

## Capabilities

### New Capabilities

- `email-communications`: Worker-owned transactional email, newsletter contact registration, SDK-backed Resend delivery/contact operations, idempotency, provider verification, free-tier constraints, and provider-secret boundaries.

### Modified Capabilities

- `orders-stock-operator`: Paid Stripe webhook reconciliation also triggers paid-order email notifications exactly once.
- `environment-model`: Product environments include Resend provider readiness, Worker runtime email config, and manual provider checkpoints.
- `module-boundaries`: Email application and infrastructure modules become documented backend entrypoints with allowed dependencies.

## Impact

- Backend Worker env contract, Resend SDK infrastructure gateway, email application services, and Stripe webhook acknowledgement path.
- OpenSpec/docs guidance for manual Resend CLI diagnostics and manual DNS/secret checkpoints; no committed provider-readiness script or evidence artifact.
- Unit tests, runtime config verification, module-boundary checks, and required repo gates.
