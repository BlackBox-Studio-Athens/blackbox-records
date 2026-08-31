## Why

The repository and deployed UAT/PRD Workers now use the canonical Local, UAT, and PRD model, but two unused GitHub settings still carry the old sandbox/production names. The change should remain active only for that external cleanup.

## What Changes

- Keep repo-owned runtime, Wrangler, Worker, D1, workflow, catalog, smoke, and documentation names on local, uat, and prd.
- Keep Stripe test/live only for actual provider mode.
- Keep existing cheap sandbox/production command aliases mapped to UAT/PRD; add no more aliases.
- Keep old Cloudflare Worker and D1 resources undeleted for rollback/history.
- Record UAT cutover and persistent webhook/payment verification as complete.
- Move PRD live secrets, webhook activation, provider mutation, and launch proof to production-go-live-readiness.
- Record the August 31, 2026 deletion of the stale repository variable PUBLIC_BACKEND_BASE_URL and unused GitHub environment catalog-promotion-production.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- environment-model: Application and Cloudflare-facing product targets are the closed Local/UAT/PRD set; provider modes remain separate.
- tooling-validation: Current surfaces reject old environment names except documented compatibility aliases and historical archives.

## Impact

- Repository implementation and hosted UAT cutover are complete.
- The two unused external GitHub settings were deleted on August 31, 2026 after current workflow references were reconfirmed absent.
- No PRD-open work and no deletion of old Cloudflare resources.
