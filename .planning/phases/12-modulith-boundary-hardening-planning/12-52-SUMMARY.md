---
plan_id: 12-52
phase: 12
status: completed
completed: 2026-05-16
---

# 12-52 Summary - Decap Release Collection Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-release-collection.ts` for Release collection wiring.
- Added `apps/web/src/lib/admin/decap-release-collection.test.ts` to characterize release folder settings, dynamic artist
  options, release date formatting, player URL fields, formats, and credits.
- Updated `buildDecapConfig` to call `buildReleaseCollection(options.artistOptions)` instead of owning the Release
  collection block inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 296 lines to 191 lines while preserving the generated config
  assembly path.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 11 files, 21 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
