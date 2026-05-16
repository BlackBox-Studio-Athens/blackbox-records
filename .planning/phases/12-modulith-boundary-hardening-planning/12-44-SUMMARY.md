---
plan_id: 12-44
phase: 12
status: completed
completed: 2026-05-16
---

# 12-44 Summary - Decap Home Field Extraction

## Completed

- Added `apps/web/src/lib/admin/decap-home-fields.ts` for homepage CMS field generation.
- Added direct characterization tests for homepage schema, hero, and editor-removable section block fields.
- Updated `decap-config.ts` to consume the homepage field helper while leaving the remaining content collection groups in
  place for later slices.
- Reduced `decap-config.ts` from 1,088 lines to 889 lines.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin`
- `pnpm check`
- `pnpm test:unit`
- `pnpm build`

## Notes

- No shopper UI, checkout contracts, Worker runtime, D1, Stripe, BOX NOW, generated API output, `.planning/config.json`,
  or worktree/parallelization setting changed.
- Ownership stayed within the existing `cms-admin` module, so the module manifest did not need an ownership or dependency
  update.
