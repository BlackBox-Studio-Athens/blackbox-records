## Why

UAT needs repeatable proof that Stripe test-mode events reach the persistent deployed Worker after any temporary stripe listen process stops. The read-only verifier and UAT delivery evidence are implemented; the old change ID remains only for history.

## What Changes

- Keep the historical verify-stripe-sandbox-webhook-endpoint ID but use canonical UAT wording.
- Verify exactly one enabled Stripe test-mode account endpoint targets the UAT Worker webhook URL.
- Require Product and Price created/updated/deleted events; reject missing, disabled, duplicate, wrong-mode, Connect-only, or misrouted endpoints.
- Verify UAT Worker STRIPE_WEBHOOK_SECRET name presence without reading or printing its value.
- Distinguish configuration presence from signing-secret equality; prove equality through successful signed delivery and paid reconciliation.
- Keep stripe listen temporary and unable to overwrite the persistent Worker secret.
- Rely on the existing catalog-sync recovery contract; do not redefine it in checkout.
- Remove every six-hour Cron assumption; scheduled catalog verification was intentionally retired.
- Leave PRD endpoint creation, secret installation, and live proof to production-go-live-readiness.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- tooling-validation: A read-only UAT endpoint verifier checks exact persistent configuration and redacted evidence.
- static-site-and-deployment: UAT deployment readiness includes persistent webhook and successful delivery proof.

## Impact

- The verifier, listener guard, UAT preflight, tests, docs, and hosted proof are complete.
- GitHub Actions run 30166382129 passed UAT webhook/payment verification on July 25, 2026.
- No external endpoint mutation or PRD provider state change in this completed change.
