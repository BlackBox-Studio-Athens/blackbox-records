## Why

The September 5, 2026 UAT smoke deployed Worker code whose repo-owned Stripe Product projection had not been promoted, so Product image drift blocked checkout before Stripe Checkout opened. UAT deployment and smoke responsibilities must stop mutating the same environment through multiple paths.

## What Changes

- Make catalog promotion the only supported UAT Worker deployment path.
- Make post-deploy provider smoke observation-only by removing its D1 migration and Worker deployment steps.
- Delete the unused standalone UAT Worker deployment workflow.
- Make public Store Offer reads and checkout starts verify Stripe state without mutating provider or D1 catalog state.
- Report Store Item and catalog status when provider smoke finds a non-ready Store Offer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `catalog-promotion-automation`: UAT Worker deployment remains inside the ordered catalog promotion sequence.
- `commerce-checkout`: Public Store Offer and checkout requests become catalog-mutation-free while preserving fail-closed validation.
- `tooling-validation`: Post-deploy provider smoke becomes observation-only and validation rejects duplicate UAT Worker deployment paths.

## Impact

UAT GitHub Actions workflows, public commerce service wiring, checkout use-case tests, environment-model validation, smoke diagnostics, OpenSpec contracts, and UAT operator documentation. No public API, database schema, environment variable, dependency, or PRD deployment change.
