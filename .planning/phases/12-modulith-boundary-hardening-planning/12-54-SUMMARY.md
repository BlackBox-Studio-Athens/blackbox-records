---
plan_id: 12-54
phase: 12
status: completed
completed: 2026-05-16
---

# 12-54 Summary - Decap News Collection Extraction

## Changes

- Added `apps/web/src/lib/admin/decap-news-collection.ts` for News collection wiring.
- Added `apps/web/src/lib/admin/decap-news-collection.test.ts` to characterize news frontmatter folder settings, date
  formatting, summary/image fields, section label, and body field output.
- Updated `buildDecapConfig` to call `buildNewsCollection()` instead of owning the News collection block inline.
- Reduced `apps/web/src/lib/admin/decap-config.ts` from 102 lines to 53 lines, leaving the root config focused on
  backend/auth/site-root assembly and collection composition.
- Updated the `cms-admin` module canvas so the new direct helper test is part of required refactor coverage.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin` - 13 files, 23 tests passed.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
