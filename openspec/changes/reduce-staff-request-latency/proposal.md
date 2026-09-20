# Proposal

## Why

The authenticated staff workspace repeatedly waits seconds for page code: a measured JavaScript request spent 3,130 ms in the entry Worker but only 9 ms in `CmsRuntime`, while the Stock list downloaded 30.9 MB for 25 small covers. Staff need fast, reliable navigation from predominantly Greek connections without weakening Access, losing unsaved work, or leaving Cloudflare Free.

## What Changes

- Serve authenticated staff HTML and build assets from the existing entry Worker's `ASSETS` binding, avoiding the CMS Durable Object for static GET/HEAD requests. Keep the current private cache categories, hostname checks, and conditional-request authorization.
- Store bounded display thumbnails in the existing private R2 bucket when images are uploaded; serve them through an authenticated read-only route. Replace original-image requests in compact stock/catalog rows, and provide a dry-run-first, resumable preparation command for existing media.
- Reduce staff startup work: separate lightweight content labels from editor imports, load optional editor/history code on demand, and settle Overview panels independently.
- Preserve the existing navigation and save/recovery guards. Address the measured request path and payload costs before considering a separate client-router change.
- Add focused local checks and a bounded hosted acceptance worksheet covering latency, image bytes, Free-tier usage, authorization, and real Greek-network measurements. Preserve the distinction between a local implementation pass and hosted performance acceptance.
- Investigate actual Worker-to-object and database placement only through measurements. Existing object/database relocation, paid capacity, Smart Placement changes, and claims that a location hint guarantees Athens are outside implementation scope.

## Capabilities

### New Capabilities

None. Extend the existing staff and CMS contracts.

### Modified Capabilities

- `emdash-editorial-operations`: permit authenticated static delivery outside `CmsRuntime`, define private thumbnail ownership and failure behavior, and retain supported CMS integration and Free-tier acceptance.
- `staff-workspace`: require bounded compact artwork, lighter initial dependencies, independently available panels, and reproducible performance acceptance with draft/recovery protection.

## Impact

- Backend: `apps/backend/src/cms/index.ts`, `auth.ts`, `staff-assets.ts`, `media-upload.ts`, the existing media binding, CMS route admission, and hosting/auth/media tests.
- Frontend: `StaffShell`, `StaffOverview`, content/stock compact artwork, content metadata imports, the existing upload helper, and browser smoke coverage.
- Tooling/docs: a bounded thumbnail preparation script using the already installed `sharp`, local performance checks, `docs/content-workspace.md`, and rollout evidence.
- No new provider, database, bucket, KV namespace, service worker, framework, or runtime image transformation dependency. No public-site routing, checkout, stock authority, publication identity, or payment-launch change.
- Planning only in this change creation. Implementation tasks distinguish local work, authorized UAT acceptance, and separately authorized PRD promotion/backfill.
