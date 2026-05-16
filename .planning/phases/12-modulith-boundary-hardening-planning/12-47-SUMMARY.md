---
plan_id: 12-47
phase: 12
status: completed
completed: 2026-05-16
---

# 12-47 Summary - Decap Services Field Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-services-fields.ts` as the Services-page Decap field generator.
- Added `apps/web/src/lib/admin/decap-services-fields.test.ts` to characterize the Services schema field, hero object,
  services list, inquiry-preselection service IDs, bullet field mapping, process block, and inquiry block.
- Updated `buildDecapConfig` to call `buildServicesFields()` instead of owning the Services field block inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 746 lines to 590 lines while preserving the generated config
  assembly path.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 6 files, 16 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
