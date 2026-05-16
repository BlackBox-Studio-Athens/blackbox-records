---
plan_id: 12-43
phase: 12
status: completed
completed: 2026-05-16
---

# 12-43 Summary - Decap Runtime Config Extraction

## Completed

- Added `apps/web/src/lib/admin/decap-runtime-config.ts` for local-backend selection and site-root URL resolution.
- Moved the existing runtime/base-path characterization tests into `decap-runtime-config.test.ts`.
- Updated `/admin/config.yml` to depend on the runtime helper and keep `decap-config.ts` focused on generated YAML
  assembly.
- Reduced `decap-config.ts` from 1,133 lines to 1,088 lines.

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
