# Phase 19 - Research: Knip Dependency And Export Audits

## Package Evidence

- `pnpm view knip version` returned `6.14.2` on 2026-05-23.
- `pnpm view knip repository.url` points to `https://github.com/webpro-nl/knip.git`.
- Prior package research found `webpro-nl/knip` active, non-archived, with more than 11k GitHub stars.

## Repo Fit

The repo already has strong boundary checks:

- `eslint-plugin-boundaries` through `eslint.config.mjs`
- `dependency-cruiser` through `.dependency-cruiser.cjs`
- custom module and commerce boundary audits under `scripts/`

Knip fills a different gap: stale dependencies, unused exports, and files that no longer have an owning entrypoint. That is useful after the recent Phase 12 module hardening and dependency adoption slices, but only if the config understands Astro routes, content, generated clients, Prisma output, workflow references, scripts, and planning archives.

## Risks

- False positives around Astro route files, content collections, public assets, GitHub workflows, generated OpenAPI/Prisma code, D1 migrations, and package exports.
- Turning Knip into a hard gate too early could block unrelated work with noisy findings.
- Deleting files from audit output without route/config/generated evidence could break public behavior.

## Recommendation

Adopt Knip as a root report-first maintenance command. Add a documented baseline and only promote it into `pnpm check` after the first findings are triaged and intentional ignores are stable.
