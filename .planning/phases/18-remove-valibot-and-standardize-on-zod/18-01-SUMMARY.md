---
phase: 18
plan: 18-01
subsystem: validation-tooling
tags: [tooling, validation, zod, valibot, dependencies]
key-files:
  - apps/web/src/content.config.ts
  - apps/backend/src/interfaces/http/contracts/public-contracts.ts
  - .planning/codebase/STACK.md
  - .planning/phases/18-remove-valibot-and-standardize-on-zod/18-VALIDATION.md
metrics:
  direct_valibot_usages: 0
  zod_deprecation_hints_removed: 6
status: completed
completed: 2026-05-23
---

# 18-01 Summary - Audit Valibot Usage And Lock Zod As The Validator Standard

## Completed

- Audited package manifests, app source, packages, scripts, planning docs, and lockfile evidence for Valibot.
- Confirmed no direct repo-authored Valibot package entry, import, source usage, test usage, script usage, or generated-contract usage exists.
- Confirmed the remaining lockfile Valibot entry is a Prisma tooling transitive dependency via `pnpm why valibot --recursive`.
- Updated scoped Zod 4 API calls in Astro content schemas and the public checkout response contract.
- Documented the validator policy in `.planning/codebase/STACK.md`.
- Recorded audit and gate evidence in `18-VALIDATION.md`.

## Task Commits

| Commit             | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| Local working tree | Audit Valibot usage, apply scoped Zod cleanup, and record phase status |

## Deviations from Plan

- No direct Valibot usage was found, so no direct dependency or schema replacement was needed.
- Browser Use validation was not run because this phase changed validation schemas, dependency policy docs, and planning artifacts, not rendered UI.

## Verification Commands

- `rg -n "valibot" package.json apps packages scripts --glob '!node_modules'` returned no matches.
- `rg -n "string\(\)\.url\(\)|string\(\)\.email\(\)" apps/web/src/content.config.ts apps/backend/src/interfaces/http/contracts/public-contracts.ts apps packages --glob '!node_modules'` returned no matches.
- `pnpm why valibot --recursive` showed Valibot only through Prisma tooling.
- `pnpm test:unit` passed for `@blackbox/web` (81 files, 359 tests), `@blackbox/backend` (33 files, 192 tests), and `@blackbox/api-client` (1 file, 2 tests).
- `pnpm check` passed, including format, lint, TypeScript/Astro checks, module boundary audit, dependency-cruiser boundary audit, and commerce boundary audit.
- `pnpm build` passed and built 116 static pages.

## Self-Check: PASSED

- Repo-authored runtime validation is standardized on Zod.
- No direct Valibot import or package manifest entry exists.
- Prisma transitive Valibot is documented as an upstream dependency, not repo-authored usage.
- Backend OpenAPI contracts and Astro content schemas remain on Zod.
- Full repository gates passed after implementation.
