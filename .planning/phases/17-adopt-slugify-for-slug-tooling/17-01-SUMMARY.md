---
phase: 17
plan: 17-01
subsystem: storefront-catalog
tags: [frontend, catalog, cms-admin, slug-tooling, dependency-adoption]
key-files:
  - apps/web/package.json
  - apps/web/src/lib/slugs.ts
  - apps/web/src/lib/slugs.test.ts
  - apps/web/src/lib/catalog-data.ts
  - apps/web/src/lib/admin/decap-artist-collection.ts
  - apps/backend/scripts/seed-local-mock-commerce-state.ts
  - .planning/phases/17-adopt-slugify-for-slug-tooling/17-VALIDATION.md
metrics:
  tests_added: 6
  dependency_added: '@sindresorhus/slugify'
status: completed
completed: 2026-05-22
---

# 17-01 Summary - Add Centralized Slug Tooling

## Completed

- Added `@sindresorhus/slugify@^3.0.0` to `@blackbox/web`.
- Added `apps/web/src/lib/slugs.ts` as the repo-owned slug wrapper for suggestion generation, validation, fallback resolution, and collision detection.
- Wired Decap artist slug helper output and slug-pattern validation through the wrapper.
- Added StoreItem slug collision detection without auto-suffixing existing public slugs.
- Updated local mock-commerce seed fallback slug generation for invalid draft/file IDs while preserving explicit release aliases and existing canonical store item slugs.
- Documented `slugs.ts` as a `storefront-catalog` boundary root so `cms-admin` can depend on it through the existing allowed module dependency.
- Recorded validation evidence in `17-VALIDATION.md`.

## Task Commits

| Commit        | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| Not committed | Phase 17 executed in an already dirty tree with unrelated phase/code changes |

## Deviations from Plan

- Updated Phase 12 module boundary docs because the new wrapper needed an explicit module owner.
- Formatted the pre-existing Phase 16 summary markdown because it blocked `pnpm check` before Phase 17 validation could complete.
- Did not create a commit because the worktree already contained broad unrelated uncommitted changes across Phase 13-18 planning and commerce code.

## Self-Check: PASSED

- Latest `@sindresorhus/slugify` version was checked at implementation time.
- Existing public route slugs, content filenames, D1 mappings, Stripe mappings, and StoreItem identities were not rewritten.
- Known legacy release ID vs canonical store item slug separation remains covered.
- Collision handling reports duplicate committed/public slugs rather than silently suffixing them.
- `pnpm test:unit`, `pnpm check`, and `pnpm build` passed after implementation.
