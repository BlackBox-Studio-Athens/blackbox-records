## Why

EmDash is live at cutover commit `7134654b`, but dormant Sveltia, compiled catalog and staff Pages deployment paths remain. Removing them must preserve the runtime catalog and publication correction in `123b905a`.

## What Changes

- **BREAKING**: Remove public `/admin/*` and Sveltia tooling.
- Remove compiled catalog inputs and routine repository catalog mutation; retain explicit migration/recovery and fixture tooling.
- **BREAKING**: Require combined CMS release artifacts and retire standalone staff Pages deployment and its detached project.
- Reconcile current specifications and document verified external retirement.
- Apply the operator-approved September 15 stale-cache-only acceptance exception to the reviewed source, with pinned prior provider evidence and fresh email-free static verification. Natural cache expiry remains separately outstanding; do not report cached 200 responses as passing 404 checks.

## Capabilities

### New Capabilities

### Modified Capabilities

- `static-site-and-deployment`: Remove legacy admin and staff Pages delivery.
- `stripe-catalog-sync`: Restrict repository catalog inputs to explicit recovery/fixtures.
- `software-release-promotion`: Require combined CMS artifacts and runtime-safe deployment.
- `tooling-validation`: Verify removal and EmDash regression boundaries.

## Impact

Public admin routes, development scripts, diagnostics, release packaging, GitHub workflows, current documentation, and confirmed external Sveltia/staff Pages resources. EmDash source, staff hostname and Access, D1 catalog, stock, orders, provider bindings, snapshots and checkout gates are preserved.
