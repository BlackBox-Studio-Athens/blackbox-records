# Design

## Context

See `proposal.md` and the delta specs. The September 29 follow-up moves selection, scheduling and local task caching to pinned Nx 23.2.1 while retaining targeted local completion, complete CI gates, and the existing release workflow changes.

## Goals / Non-Goals

**Goals:** Preserve the existing promotion contract while allowing target builds and read-only UAT checks to progress independently. Keep preparation cancellable and hosted mutations serialized through final acceptance.

**Non-Goals:** Remote validation caches, generated build-output reuse, a new orchestration service, provider-smoke parallelism, or changes to credentials and launch/catalog authorization.

## Decisions

- Nx 23.2.1 owns affected selection, scheduling and deterministic local caching, with parallelism capped at three (measured: two was 20-30% slower, four gave no reliable gain and lengthened critical paths) and no Nx Cloud. `pnpm validate` delegates affected tests, package-level lint/type checks and required architecture checks to the native project graph while retaining source fingerprinting, change invalidation and evidence reporting. The wrapper does not keep a second selector, task graph or phase cache. `--plan` prints the graph without execution; `--no-cache` disables cache reuse without changing the selected mode. Native caching is the default; `--resume` remains for compatibility.
- Nx `project.json` files define module and framework roots, targets and task inputs. Framework modules include separate `web-pages`, `web-layouts` and `web-test-support` roots. The boundary manifest references each project rather than duplicating root globs and continues to define allowed dependencies and public entrypoints. Actual Nx dependencies, including declared Astro runtime edges, remain distinct from architectural permission policy.
- Native Vitest projects discover tests within Nx source and integration-test roots. Backend module test targets depend on their test projects; Nx deduplicates shared suites and sees test imports as integration dependencies. Lint and typecheck targets remain package-level. `*.worker.test.ts` uses Cloudflare, `*.request.test.ts` uses API mocks, and other tests use Node. No Worker test uses SELF, so the unused application entrypoint is removed from the pool; tests import their exercised runtime directly. The web commerce integration suite is under `apps/web/test/commerce/`. `scripts/check-module-projects.mjs` checks that all 264 application TypeScript tests have exactly one owner, verifies real module cycles with Nx's pinned checker, and rejects source without an owner.
- `pnpm test <module>` runs a module test target without validation prerequisites for tight iteration. `pnpm test:watch <module>` uses the native test-watch target; `pnpm test:changed` uses Nx affected selection. `pnpm validate:full` uses Nx `run-many` for tests, lint, types and builds. Full CI/release acceptance remains unchanged.
- Start target preparation concurrently with candidate checks. Repeat the immutable-main-source guard before each target checkout/restore; require checks before UAT inspection and final bundle assembly. Run public build checks once per target and staff build checks inside the combined CMS build. Restore only Astro image transforms in both jobs.
- Produce compact, target-scoped intermediate bundles with the existing content-addressed transport. Each carries target, source/workflow SHA, run identity, configuration, and file digests. Target verification validates only its declared inventory. Final assembly checks both target identities and migration inventories, then writes the current schema-2 manifest from the already stamped bytes.
- Split candidate checks, UAT preparation, PRD preparation, and final assembly into jobs. UAT deploy/acceptance depends on UAT preparation and checks; the candidate run remains unsuccessful until PRD preparation, assembly, and complete UAT acceptance all pass.
- Keep the existing Pages and Worker credential boundaries and separate deployment jobs. Run read-only UAT readiness and static smoke immediately after Pages deployment, then run provider smoke sequentially and finish with release-identity verification.
- Move UAT mutation and acceptance jobs into one reusable-workflow call holding `blackbox-release`. The caller uses `secrets: inherit`; Worker/provider jobs still bind the UAT environment and check credentials before setup or mutation, while Pages uses repository credentials. The earlier named-token-only forwarding failed; contract-test inherited secrets and environment placement. UAT preparation has a run-specific outer group and cancellable branch/role jobs, so it never waits for an active deployment. PRD dispatches retain the workflow-wide shared lock and direct jobs. Publication and holding-page workflows share that lock; immediate monotonic-order checks reject late candidates.
- Use the existing standalone audit command in a scheduled/manual workflow and always publish its report, including when the audit fails.
- **Test ownership rule.** A test is co-located in module M when its imports stay within M, M's production dependency closure and test support. Composition roots (public-commerce-http, backend-runtime including the CMS Worker entry `apps/backend/src/cms-worker.ts`, cms-runtime) own tests of the composed app. Any other test is a real cross-module integration test in a feature-scoped project under `apps/backend/test/integration/<feature>/` (catalog-sync, stock, checkout, cms). Nx derives project edges from all imports, including tests, so co-locating a cross-module test would add a false production edge and widen `affected`; this follows Nx's feature-based testing guidance. Root tests split into `workspace:test-tooling` (narrow `workspaceTooling` inputs, so app edits hit the cache) and `workspace:test-content` (conservative inputs); `scripts/check-module-projects.mjs` requires each to be owned exactly once.

## Risks / Trade-offs

- Target bundles can be individually valid yet incompatible → require identical candidate identity/configuration and migration inventory during assembly, verify every digest, and preserve final schema-2 validation.
- Splitting jobs adds checkout/setup overhead → retain setup-node dependency caching, avoid transferring `node_modules`, and measure queue, setup, transfer, and runner cost separately.
- Preparation and mutation concurrency can be mis-scoped → contract-test group names, caller/child placement, all mutation paths, and acceptance dependencies; keep monotonic release-order checks immediately before mutations.
- Incorrect project roots or task inputs can omit affected work → keep test inputs explicit, check inventory ownership and module cycles, and retain complete CI gates.
- Concurrent preparation may finish for a failed candidate → accept that runner cost to shorten successful release latency; failed checks cannot unlock deployment or candidate assembly.

## Migration Plan

Validate each workflow and bundle contract locally, then run targeted local validation on the exact final tree and applicable browser/publication checks. CI owns the full suite. Hosted behavior is observed only on a subsequently authorized push. Roll back by reverting the affected milestone and producing a fresh candidate; never reuse incompatible evidence.
