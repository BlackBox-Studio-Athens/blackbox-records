---
plan_id: 12-53
phase: 12
status: completed
completed: 2026-05-16
---

# 12-53 Summary - Decap Distro Collection Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-distro-collection.ts` for Distro collection wiring.
- Added `apps/web/src/lib/admin/decap-distro-collection.test.ts` to characterize distro JSON folder settings, Astro
  schema linkage, shelf options, Fourthwall URL, release date, and ordering fields.
- Updated `buildDecapConfig` to call `buildDistroCollection()` instead of owning the Distro collection block inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 191 lines to 102 lines while preserving the generated config
  assembly path.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 12 files, 22 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
