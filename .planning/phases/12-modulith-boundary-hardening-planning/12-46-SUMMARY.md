---
plan_id: 12-46
phase: 12
status: completed
completed: 2026-05-16
---

# 12-46 Summary - Decap About Field Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-about-fields.ts` as the About-page Decap field generator.
- Added `apps/web/src/lib/admin/decap-about-fields.test.ts` to characterize the About schema field, hero object, editor
  section list, block types, contact item summary, and stats summary.
- Updated `buildDecapConfig` to call `buildAboutFields()` instead of owning the About field block inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 889 lines to 746 lines while preserving the generated config
  assembly path.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 5 files, 15 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
