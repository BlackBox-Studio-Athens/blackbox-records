# Phase 18 - Research: Valibot Removal And Zod Standardization

## Current State

- Direct repo source uses Zod in web content schemas, StoreCart parsing, money parsing, backend domain IDs/quantities, and Hono OpenAPI contracts.
- `pnpm view zod version` returned `4.4.3` on 2026-05-22.
- `pnpm view valibot version` returned `1.4.0` on 2026-05-22, but the repo does not need direct Valibot adoption.
- `pnpm why valibot --recursive` showed `valibot@1.2.0` only through Prisma tooling:
  - `@prisma/dev@0.24.3`
  - `prisma@7.8.0`
  - `@prisma/client@7.8.0`

## Recommended Approach

Treat this as an audit and policy-hardening phase:

- search all source, tests, scripts, package manifests, and planning docs for direct Valibot use;
- remove direct manifest entries if any exist;
- replace any direct code usage with Zod;
- preserve `@hono/zod-openapi` and `astro/zod`;
- document Prisma's transitive Valibot dependency as allowed until upstream changes;
- optionally add a lightweight audit command that fails only for direct app usage, not the transitive Prisma lockfile entry.

## Avoid

- Do not replace Prisma just to remove a transitive Valibot package.
- Do not migrate OpenAPI contracts away from Zod.
- Do not introduce ArkType or Valibot as a second repo validator.
- Do not claim the lockfile has no Valibot if Prisma still pulls it transitively.

## Verification

- `rg -n "from 'valibot'|from \"valibot\"|valibot" package.json apps packages scripts .planning`
- `pnpm why valibot --recursive`
- Targeted tests for any changed schemas.
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
