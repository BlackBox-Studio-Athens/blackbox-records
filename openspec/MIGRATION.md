# GSD to OpenSpec Migration

Migration date: 2026-05-23

## Migrated Sources

- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/LAUNCH-READINESS.md`, `.planning/BACKLOG.md`, `.planning/UBIQUITOUS_LANGUAGE.md`, phase context, summaries, ADRs, and codebase maps were reviewed and collapsed into OpenSpec baseline specs under `openspec/specs/`.
- Implemented behavior from completed phases 5 through 19 is represented as baseline requirements.
- Unfinished or planned work is represented as active OpenSpec changes under `openspec/changes/`.
- Historical GSD execution logs, validation ledgers, and archived phase plan prompts are obsolete after this migration. Their durable decisions are either in baseline specs or active changes below.

## Baseline Spec Map

- `openspec/specs/project-language/spec.md`: canonical domain language and ambiguity boundaries.
- `openspec/specs/static-site-and-deployment/spec.md`: static Astro frontend, Cloudflare Pages, GitHub Pages rollback, CI/deploy boundaries.
- `openspec/specs/app-shell-and-player/spec.md`: shell routing, overlays, player lifecycle, and UI validation expectations.
- `openspec/specs/commerce-checkout/spec.md`: storefront, StoreCart, Worker checkout, Stripe Checkout, feature gates, and secret boundaries.
- `openspec/specs/orders-stock-operator/spec.md`: D1 order lifecycle, stock ledger, webhook authority, and operator stock access.
- `openspec/specs/shipping-fulfillment/spec.md`: Greece-only manual BOX NOW fulfillment and deferred shipping automation boundaries.
- `openspec/specs/module-boundaries/spec.md`: TypeScript-native modulith rules and manifest ownership.
- `openspec/specs/tooling-validation/spec.md`: repository validation, asset QA, slug tooling, Zod policy, Knip audit, and OpenSpec workflow.

## Active Change Map

- `openspec/changes/production-go-live-readiness/`: production/native commerce launch gates that remain after sandbox evidence.
- `openspec/changes/add-shiplemon-non-greece-shipping/`: post-MVP Shiplemon non-Greece shipping path, stale until explicitly reactivated.
- `openspec/changes/adopt-cloudflare-vitest-pool-workers/`: planned Worker-runtime test adoption.
- `openspec/changes/adopt-msw-http-mocking/`: planned frontend/API-client HTTP mocking adoption.
- `openspec/changes/adopt-t3-env-core-contracts/`: planned scoped env contract helper adoption.
- `openspec/changes/adopt-execa-process-orchestration/`: planned process orchestration refactor.

## Obsolete GSD Sources

The `.planning/` tree, GSD phase files, GSD config, GSD references in repo instructions, and `.planning`-specific tooling paths are obsolete after migration. Future requirements, proposals, context, tasks, validation notes, and source-of-truth decisions belong in `openspec/specs/` or `openspec/changes/`.

No product feature implementation was performed as part of this migration.
