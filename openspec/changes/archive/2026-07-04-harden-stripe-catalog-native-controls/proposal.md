## Why

The UAT catalog reset showed that deleted Stripe test catalog objects can be recreated by an actor that is not obvious from Dashboard counts alone. We need Stripe-native forensics, stable catalog identity, and disciplined idempotent catalog mutations so future catalog drift can be traced and repaired without guessing.

## What Changes

- Add an operator forensics workflow for unexpected Stripe Product/Price creation, reactivation, archive, or lookup-key movement using Stripe Workbench request logs plus Stripe Events.
- Make catalog verification/apply reports include safe correlation handles for Stripe forensics: environment, variant identity, lookup key, action kind, idempotency key or stable hash, run timestamp, and redacted Stripe object IDs.
- Tighten the Stripe catalog identity contract around environment-scoped Price `lookup_key` plus Product/Price metadata, and document when custom Product IDs are allowed or intentionally skipped.
- Add drift checks that flag active Stripe Products/Prices owned by BlackBox but outside the current expected Store Item catalog.
- Standardize catalog mutation idempotency keys so retrying the same logical mutation is safe, while changed price/projection inputs intentionally produce a different key.
- Update UAT operator docs with exact Stripe Workbench/Event search steps and the fields maintainers must capture before manual cleanup.
- Keep this separate from the active Stripe Dashboard price-webhook propagation change: webhooks keep D1 fresh; this change makes unexpected provider mutation traceable and repeatable.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `stripe-catalog-sync`: Require catalog forensics, stricter environment-scoped identity checks, orphan owned-object detection, and deterministic idempotency behavior for Stripe Product/Price mutations.
- `stripe-catalog-field-ownership`: Clarify the native Stripe identity fields that identify BlackBox-owned Products/Prices and prevent Dashboard/repo sync loops.
- `worker-observability`: Add safe correlation fields for Stripe catalog mutation and scheduled verification logs.
- `tooling-validation`: Require tests, docs, and validation commands for Stripe-native forensics and catalog mutation idempotency.

## Impact

- `apps/backend/src/application/commerce/catalog-sync/**`
- `apps/backend/src/infrastructure/stripe/stripe-catalog-gateway.ts`
- `scripts/stripe-catalog-verify.ts` and related Stripe catalog reset/diagnostic scripts
- UAT Worker scheduled catalog verification logs
- D1 catalog mapping/snapshot verification paths
- `docs/stripe-sandbox-uat.md` and catalog promotion/operator docs
- Tests for identity matching, orphan detection, idempotency keys, redaction, and report formatting
