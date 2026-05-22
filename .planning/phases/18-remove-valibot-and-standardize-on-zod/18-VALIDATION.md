# Phase 18 Validation: Remove Valibot And Standardize On Zod

## Audit Evidence

- `rg -n "valibot" package.json apps packages scripts --glob '!node_modules'` found no direct package manifest, source, test, script, or generated-contract usage of Valibot.
- The remaining `valibot` hits are lockfile entries and Phase 18 planning text.
- `pnpm why valibot --recursive` shows `valibot@1.2.0` only through Prisma tooling: `@prisma/dev@0.24.3` -> `prisma@7.8.0` -> `@prisma/client@7.8.0` -> `@blackbox/backend`.

## Implementation Evidence

- Updated Astro content schemas from deprecated `z.string().url()` / `z.string().email()` calls to Zod 4 `z.url()` / `z.email()`.
- Updated the public checkout response contract from `z.string().url()` to `z.url()`.
- Documented the validator policy in `.planning/codebase/STACK.md`: repo-authored runtime validation uses Zod; Valibot is allowed only as an upstream Prisma transitive dependency.

## Verification Commands

- `pnpm test:unit` passed for `@blackbox/web` (81 files, 359 tests), `@blackbox/backend` (33 files, 192 tests), and `@blackbox/api-client` (1 file, 2 tests).
- `pnpm check` passed, including Prettier, ESLint, Astro/TypeScript checks, module boundary audit, dependency-cruiser boundary audit, and commerce boundary audit. Astro reported 0 errors, 0 warnings, and 0 hints after the Zod API cleanup.
- `pnpm build` passed and built 116 static pages.
