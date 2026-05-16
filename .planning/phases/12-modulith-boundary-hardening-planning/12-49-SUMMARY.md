---
plan_id: 12-49
phase: 12
status: completed
completed: 2026-05-16
---

# 12-49 Summary - Decap Page Collection Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-page-collections.ts` for Home, About, Services, and Settings singleton collection
  wiring.
- Added `apps/web/src/lib/admin/decap-page-collections.test.ts` to characterize collection names, source file paths, and
  caller-provided field insertion.
- Updated `buildDecapConfig` to spread `buildPageFileCollections()` into the collections list instead of owning those
  collection blocks inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 551 lines to 490 lines while preserving the generated config
  assembly path.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 8 files, 18 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
