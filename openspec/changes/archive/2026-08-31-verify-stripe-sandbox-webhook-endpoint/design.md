## Context

The Worker already handles signed catalog and checkout events. A temporary Stripe CLI listener was useful for diagnostics but could not prove persistent account configuration and once risked replacing the deployed endpoint secret. The repository now has a read-only verifier and a persistent UAT endpoint.

## Goals / Non-Goals

**Goals:**

- Detect drift in UAT endpoint URL, mode, status, event set, duplication, routing, and Worker secret-name presence.
- Prove the configured secret works through real signed delivery.
- Keep output safe for CI evidence.

**Non-Goals:**

- Creating, editing, deleting, or rotating Stripe endpoints.
- Reading or comparing secret values through repository code.
- Scheduled catalog scanning or PRD live endpoint setup.

## Decisions

### Keep the verifier read-only

pnpm stripe:webhooks:verify --env uat lists account endpoints and requires exactly one enabled non-Connect test-mode match for:

    https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev/api/stripe/webhooks

Required events are:

- product.created
- product.updated
- product.deleted
- price.created
- price.updated
- price.deleted

Extra checkout events are allowed. Endpoint IDs are redacted. Missing, duplicate, disabled, wrong-mode, Connect-only, wrong-URL, or missing-event state fails with a safe repair summary.

### Verify secret presence separately from equality

Cloudflare inspection proves only that STRIPE_WEBHOOK_SECRET is configured. Stripe list/retrieve APIs do not return the existing signing secret, so the verifier never claims equality from presence.

Successful signed event delivery followed by expected catalog or paid-order reconciliation proves the installed Worker secret matches the persistent endpoint. UAT proof records the outcome, not the secret or raw payload.

### Keep stripe listen isolated

Temporary listener secrets are for Local diagnostics or explicit investigation. Tooling cannot write them into the deployed UAT Worker's primary STRIPE_WEBHOOK_SECRET. Listener delivery is never persistent endpoint evidence.

### Use the current layered recovery model

Near-real-time webhook reconciliation is backed by:

1. authoritative Store Offer reads;
2. checkout-time Stripe/D1 revalidation;
3. the one-item targeted catalog verifier.

There is no scheduled full-catalog verification. stabilize-store-listing-prices owns that removal.

### Keep PRD with go-live ownership

This historical UAT change does not create or verify a live PRD endpoint. production-go-live-readiness owns endpoint setup, secret installation, subscribed events, and live delivery evidence after the PRD-open gate.

## Risks / Trade-offs

- [Endpoint state drifts after proof] → Run the read-only verifier in UAT preflight and promotion evidence.
- [Secret presence is mistaken for equality] → Report them as separate facts and require signed delivery reconciliation.
- [Extra checkout events are removed accidentally] → Allow extras and keep paid-path smoke in UAT evidence.

## Migration Plan

Implementation and UAT proof are complete. Sync the durable requirements, run strict validation, and archive. No provider mutation or secret rotation is required for archive.
