# Phase 17 Validation

## Scope

Phase 17 added centralized slug tooling around `@sindresorhus/slugify` for repo-authored slug generation, validation, and collision checks.

Existing committed content filenames, public route params, explicit release-to-store slug mappings, D1 mappings, Stripe mappings, and StoreItem identities were not rewritten.

## Dependency Evidence

- `pnpm view @sindresorhus/slugify version` returned `3.0.0` on 2026-05-22.
- `apps/web/package.json` now adds `@sindresorhus/slugify@^3.0.0` to `@blackbox/web`.

## Behavior Evidence

- `apps/web/src/lib/slugs.ts` is the repo-owned slug wrapper.
- Slug generation, validation, fallback suggestion, and collision detection are separate exported operations.
- Decap artist slug helper output and YAML validation pattern route through the wrapper.
- Store item slug collisions are detected without auto-suffixing committed public slugs.
- Local mock-commerce seed fallback slug generation uses the wrapper for invalid draft/file IDs while preserving explicit release aliases.
- The Phase 12 module boundary manifest now assigns `apps/web/src/lib/slugs.ts` to `storefront-catalog`, which `cms-admin` is already allowed to depend on.

## Verification Commands

- `pnpm --filter @blackbox/web exec vitest run src/lib/slugs.test.ts src/lib/catalog-data.test.ts src/lib/admin/decap-artist-collection.test.ts` passed on 2026-05-22 with 3 files and 16 tests.
- `pnpm --filter @blackbox/backend exec vitest run test/scripts/local-mock-commerce-seed.test.ts` passed on 2026-05-22 with 1 file and 5 tests.
- `pnpm --filter @blackbox/backend check` passed on 2026-05-22.
- `pnpm --filter @blackbox/web check` passed on 2026-05-22 with 0 errors, 0 warnings, and 5 existing Zod deprecation hints.
- `pnpm test:unit` passed on 2026-05-22 for `@blackbox/web`, `@blackbox/backend`, and `@blackbox/api-client`.
- `pnpm check` passed on 2026-05-22, including format, lint, TypeScript/Astro checks, module boundary audit, dependency-cruiser boundary audit, and commerce boundary audit.
- `pnpm build` passed on 2026-05-22 and built 116 static pages.

## Browser Acceptance

Browser Use was not required for Phase 17 because rendered UI behavior did not change. The Decap YAML route was covered by `pnpm build`, including `/admin/config.yml`.
