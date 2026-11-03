## Why

A release or distro item cannot be published until it has a canonical catalog number (releases) and an explicit physical condition (New or Used). On UAT, Afterwise lacked both, so staff could not publish a change to it. UAT should always be in a state where staff flip a switch and publish, without first filling in fixed details by hand.

## What Changes

- The UAT release stages, as private drafts, the publish-required details that are missing: the legacy catalog number for known releases, and the physical condition New for physical releases and distro items that have none. It never replaces an existing value, never publishes and never runs on PRD.
- An unknown release slug or an invalid existing number is skipped and reported, so a new unfinished release never blocks a UAT deploy.
- The step is idempotent: a second run stages nothing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `catalog-promotion-automation`: a UAT release may stage missing publish-required details as private drafts.

## Impact

- `apps/backend/src/cms` (new `uat-publish-readiness.ts`, a small extension of the catalog-number backfill), `apps/backend/scripts/prepare-cms-catalog-schema.mjs` (new UAT-only flag), `.github/workflows/pages.yml` (one command in the UAT migration step).
- `apps/backend/cms-migrations/README.md` and `docs/catalog-promotion.md` (one sentence each).
- Out of scope: product safety, release dates, images, stock, prices, checkout state and the UAT smoke test.
