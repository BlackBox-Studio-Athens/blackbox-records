---
phase: 19
status: complete
validated_at: 2026-05-23
---

# Phase 19 Validation - Knip Dependency And Export Audits

## Implemented Scope

- Added `knip@^6.14.2` as a root dev dependency.
- Added `pnpm audit:unused` as a report-first command using `knip --config knip.jsonc --no-exit-code --no-config-hints`.
- Added `knip.jsonc` with workspace-aware entrypoints for root scripts/config, `apps/web`, `apps/backend`, and `packages/api-client`.
- Classified generated, route-visible, content, migration, public asset, and planning archive surfaces as protected from unused-file deletion.
- Documented the tool in `.planning/codebase/STACK.md`.

## First Baseline

Command:

```powershell
pnpm audit:unused
```

Result: passed with report output because the command is intentionally report-first.

Reported findings:

- Unused root dev dependencies: `@astrojs/check`, `astro`.
- Unused exports: 33.
- Unused exported types: 54.

Triage:

- No files were deleted.
- No package exports were removed.
- No generated Prisma/OpenAPI/API-client files were removed.
- No Astro route, content collection, public asset, D1 migration, workflow, or planning archive was removed.
- CSS/dev-tool false positives for `tailwindcss`, `tw-animate-css`, `decap-server`, and `shadcn` are ignored with an explicit config comment because their usage is outside Knip's TypeScript import graph.

## Follow-Up Policy

- Treat current findings as cleanup candidates only after owner review.
- Keep Knip outside `pnpm check` until the unused export/type baseline is intentionally reduced or approved.
- Do not use Knip output as sole evidence for deleting public routes, content, generated contracts, migrations, package exports, workflows, or planning artifacts.
