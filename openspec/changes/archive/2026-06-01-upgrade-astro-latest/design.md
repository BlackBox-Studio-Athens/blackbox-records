## Context

The repository currently resolves `astro@6.3.7` and `@astrojs/react@5.0.5`. The latest stable releases confirmed before implementation are `astro@6.4.2` and `@astrojs/react@5.0.6`.

Astro 6.4 requires Node `>=22.12.0`; the repo workflows use Node 24. Astro 6.4 depends on Vite `^7.3.2`; the repo already resolves one Vite 7.3.x line, and `@tailwindcss/vite@4.3.0` accepts Vite 7.

The web app is intentionally static: `apps/web/astro.config.mjs` uses `output: 'static'`, GitHub Pages hosts UAT, Cloudflare Pages hosts PRD, and dynamic commerce remains in the separate Worker backend.

## Goals / Non-Goals

**Goals:**

- Upgrade Astro to the latest stable 6.4.x version.
- Keep the official Astro React integration current with the same compatibility surface.
- Regenerate the pnpm lockfile with the existing pnpm 10.33.4 workflow.
- Prove the upgrade through OpenSpec validation, dependency sanity checks, repo gates, and Browser Use smoke coverage.

**Non-Goals:**

- No Astro SSR, server output, or adapter migration.
- No adoption of `@astrojs/cloudflare`, Astro advanced routing, Astro Actions, Astro Sessions, or Pages Functions.
- No broad dependency modernization outside the Astro compatibility set.
- No UAT or PRD deploy as part of local acceptance.

## Decisions

### Decision 1: Narrow Upgrade Set

Update only `astro` and `@astrojs/react` by default.

Rationale: `@astrojs/check`, `eslint-plugin-astro`, `prettier-plugin-astro`, and `@tailwindcss/vite` are already current or compatible with the target versions. Keeping them stable reduces lockfile churn and isolates upgrade risk.

### Decision 2: Keep Static Frontend Architecture

Leave `apps/web/astro.config.mjs` unchanged unless the upgrade fails and a minimal compatibility fix is required.

Rationale: Astro 6.4's Cloudflare helpers are for experimental advanced routing and custom Cloudflare worker entrypoints. This repo uses a static frontend plus a separate Worker backend, so adopting those helpers would be an architecture change, not an upgrade requirement.

### Decision 3: Validate Compatibility From Both Dependency Graph And Runtime Gates

Use npm metadata and `pnpm -r outdated` to verify intended versions, then use `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm audit:unused`, and Browser Use smoke routes to prove repository behavior.

Rationale: Type/package compatibility alone is insufficient because Astro affects content collections, static output, route generation, and the persistent app shell.

## Risks / Trade-offs

- Astro latest changes after planning -> reconfirm npm latest before package edits and stop if the latest target is no longer `6.4.2`.
- Lockfile pulls an unexpected second Vite or Astro line -> inspect lockfile/dependency output and resolve before validation is accepted.
- Astro 6.4 changes generated output or content checks -> use repo gates and Browser Use smoke as the acceptance boundary.
- Existing unrelated OpenSpec edits are dirty -> avoid staging, editing, or rewriting `integrate-resend-email` files.

## Migration Plan

1. Run the OpenSpec main-worktree guard.
2. Create and validate this OpenSpec change.
3. Update package manifests for `astro` and `@astrojs/react`.
4. Regenerate the lockfile with pnpm 10.33.4.
5. Run dependency sanity checks and required repository gates.
6. Run local static route smoke checks through Browser Use.
7. Leave unrelated dirty work untouched.

## Open Questions

None. If npm latest moves beyond `astro@6.4.2` before package edits, update this change instead of silently targeting a different version.
