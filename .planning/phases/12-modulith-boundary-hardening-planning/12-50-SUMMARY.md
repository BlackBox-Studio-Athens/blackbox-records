---
plan_id: 12-50
phase: 12
status: completed
completed: 2026-05-16
---

# 12-50 Summary - Decap Site Chrome Collection Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-site-chrome-collections.ts` for Navigation and Socials collection wiring.
- Added `apps/web/src/lib/admin/decap-site-chrome-collections.test.ts` to characterize navigation/social folders,
  schemas, summary behavior, header/footer flags, and social link fields.
- Updated `buildDecapConfig` to spread `buildSiteChromeCollections()` into the collections list instead of owning those
  collection blocks inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 490 lines to 425 lines while preserving the generated config
  assembly path.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 9 files, 19 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
