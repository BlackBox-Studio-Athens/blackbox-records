# Phase 15 - Research: Sharp Asset QA

## Current State

- `sharp` is already installed in `apps/web/package.json` at `^0.34.5`.
- `pnpm view sharp version` returned `0.34.5` on 2026-05-22, so the repo is already on the current published version.
- `apps/web/src/config/site-favicon.test.ts` already uses Sharp to inspect favicon alpha metadata.
- `.planning/codebase/STACK.md` records Sharp as required for collection-owned image assets referenced through Astro `image()` fields.

## Recommended Approach

Add a read-only web-package asset check:

- resolve content-owned image references through the existing Astro/content file structure where practical;
- inspect image metadata with Sharp;
- validate favicon files, artist portrait aspect/dimension standards, and obvious broken image metadata;
- emit stable diagnostics that include the file path and rule id;
- add Vitest coverage for the rule engine and path resolver.

## Avoid

- Do not introduce a runtime image API.
- Do not add Cloudflare Images or a new asset hosting layer.
- Do not rewrite source images in the first slice.
- Do not make the check depend on a running Astro dev server.

## Verification

- `pnpm --filter @blackbox/web assets:check` or chosen package-local command.
- Targeted Vitest for the asset QA helpers.
- Required repo gate after behavior/tooling changes: `pnpm test:unit`, `pnpm check`, `pnpm build`.
