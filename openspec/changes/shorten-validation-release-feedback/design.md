# Design

## Context

See `proposal.md` and the delta specs. The September 28 follow-up makes targeted local completion the default at the user's explicit request, moves full validation to CI, overlaps checks and builds, removes duplicate staff builds, and allows preparation during earlier deployments.

## Goals / Non-Goals

**Goals:** Preserve the existing promotion contract while allowing target builds and read-only UAT checks to progress independently. Keep preparation cancellable and hosted mutations serialized through final acceptance.

**Non-Goals:** Remote validation caches, generated build-output reuse, a new orchestration service, provider-smoke parallelism, or changes to credentials and launch/catalog authorization.

## Decisions

- Use the existing validation runner for targeted local evidence with `mode: local`. Select committed/dirty/untracked/deleted changes against a pinned origin/main comparison (HEAD fallback or explicit ref), run native Vitest related tests, affected-package types, changed-file lint, and cached formatting in two lanes. Broaden package configuration/content/assets/migrations to package tests and shared/tooling changes to repository contracts. Full tests/checks/builds remain CI gates; optional `validate:full` stays fresh by default with conservative opt-in phase reuse.
- Reuse the existing package test launcher with Vitest's native `--changed` mode. Require one explicit package and keep results partial, including empty selections. Offer `--since` for committed changes; dynamic file reads and shared/configuration changes require complete scoped checks. Reuse Astro's existing background dev server for public frontend iteration.
- Start target preparation concurrently with candidate checks. Repeat the immutable-main-source guard before each target checkout/restore; require checks before UAT inspection and final bundle assembly. Run public build checks once per target and staff build checks inside the combined CMS build. Restore only Astro image transforms in both jobs.
- Produce compact, target-scoped intermediate bundles with the existing content-addressed transport. Each carries target, source/workflow SHA, run identity, configuration, and file digests. Target verification validates only its declared inventory. Final assembly checks both target identities and migration inventories, then writes the current schema-2 manifest from the already stamped bytes.
- Split candidate checks, UAT preparation, PRD preparation, and final assembly into jobs. UAT deploy/acceptance depends on UAT preparation and checks; the candidate run remains unsuccessful until PRD preparation, assembly, and complete UAT acceptance all pass.
- Keep the existing Pages and Worker credential boundaries and separate deployment jobs. Run read-only UAT readiness and static smoke immediately after Pages deployment, then run provider smoke sequentially and finish with release-identity verification.
- Move UAT mutation and acceptance jobs into one reusable-workflow call holding `blackbox-release`. The caller uses `secrets: inherit`; Worker/provider jobs still bind the UAT environment and check credentials before setup or mutation, while Pages uses repository credentials. The earlier named-token-only forwarding failed; contract-test inherited secrets and environment placement. UAT preparation has a run-specific outer group and cancellable branch/role jobs, so it never waits for an active deployment. PRD dispatches retain the workflow-wide shared lock and direct jobs. Publication and holding-page workflows share that lock; immediate monotonic-order checks reject late candidates.
- Use the existing standalone audit command in a scheduled/manual workflow and always publish its report, including when the audit fails.
- Use native TypeScript incremental state for backend/API-client no-emit checks and the existing formatter cache for write mode. Reuse the existing complete-source phase cache for standalone lint; retain fresh full/CI lint and changed-file local lint. Avoid a separate per-file typed-lint cache, which could miss errors caused by an imported dependency changing.

## Risks / Trade-offs

- Target bundles can be individually valid yet incompatible → require identical candidate identity/configuration and migration inventory during assembly, verify every digest, and preserve final schema-2 validation.
- Splitting jobs adds checkout/setup overhead → retain setup-node dependency caching, avoid transferring `node_modules`, and measure queue, setup, transfer, and runner cost separately.
- Preparation and mutation concurrency can be mis-scoped → contract-test group names, caller/child placement, all mutation paths, and acceptance dependencies; keep monotonic release-order checks immediately before mutations.
- Local resume evidence can be stale or incomplete → default to fresh execution and treat any missing, malformed, incompatible, cancelled, or source-changing record as a cache miss.
- Concurrent preparation may finish for a failed candidate → accept that runner cost to shorten successful release latency; failed checks cannot unlock deployment or candidate assembly.

## Migration Plan

Validate each workflow and bundle contract locally, then run targeted local validation on the exact final tree and applicable browser/publication checks. CI owns the full suite. Hosted behavior is observed only on a subsequently authorized push. Roll back by reverting the affected milestone and producing a fresh candidate; never reuse incompatible evidence.
