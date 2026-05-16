---
plan_id: 12-51
phase: 12
status: completed
completed: 2026-05-16
---

# 12-51 Summary - Decap Artist Collection Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-artist-collection.ts` for Artist collection wiring.
- Added `apps/web/src/lib/admin/decap-artist-collection.test.ts` to characterize artist folder settings, slug behavior,
  profile links, videos, image fields, shop handle, and body field output.
- Updated `buildDecapConfig` to call `buildArtistCollection()` instead of owning the Artist collection block inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 425 lines to 296 lines while preserving the generated config
  assembly path.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 10 files, 20 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
