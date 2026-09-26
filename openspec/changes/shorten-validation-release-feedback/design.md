# Design

## Context

See `proposal.md` for motivation and the delta specs for required behavior. The release workflow currently prepares both environments in one job, packs one schema-2 bundle, and uses a workflow-wide non-cancelling lock. Local validation phases and the release manifest already provide evidence and integrity primitives to extend.

## Goals / Non-Goals

**Goals:** Preserve the existing promotion contract while allowing target builds and read-only UAT checks to progress independently. Keep preparation cancellable and hosted mutations serialized through final acceptance.

**Non-Goals:** Remote validation caches, generated build-output reuse, a new orchestration service, provider-smoke parallelism, or changes to credentials and launch/catalog authorization.

## Decisions

- Extend `scripts/validate.mjs` and the existing CI measurement collector. Resume only successful, known eligible phases against an unchanged complete source/toolchain fingerprint; a fresh full run remains the default.
- Produce compact, target-scoped intermediate bundles with the existing content-addressed transport. Each carries target, source/workflow SHA, run identity, configuration, and file digests. Target verification validates only its declared inventory. Final assembly checks both target identities and migration inventories, then writes the current schema-2 manifest from the already stamped bytes.
- Split candidate checks, UAT preparation, PRD preparation, and final assembly into jobs. UAT deploy/acceptance depends on UAT preparation and checks; the candidate run remains unsuccessful until PRD preparation, assembly, and complete UAT acceptance all pass.
- Keep the existing Pages and Worker credential boundaries and separate deployment jobs. Run read-only UAT readiness and static smoke immediately after Pages deployment, then run provider smoke sequentially and finish with release-identity verification.
- Replace the workflow-wide lock with separate preparation concurrency and one shared non-cancelling concurrency group on the UAT mutation/acceptance caller and each PRD mutation path. The lock spans each complete mutation sequence; immediate monotonic-order checks remain the final defense against late candidates.
- Use the existing standalone audit command in a scheduled/manual workflow and always publish its report, including when the audit fails.

## Risks / Trade-offs

- Target bundles can be individually valid yet incompatible → require identical candidate identity/configuration and migration inventory during assembly, verify every digest, and preserve final schema-2 validation.
- Splitting jobs adds checkout/setup overhead → retain setup-node dependency caching, avoid transferring `node_modules`, and measure queue, setup, transfer, and runner cost separately.
- Preparation and mutation concurrency can be mis-scoped → contract-test group names, caller/child placement, all mutation paths, and acceptance dependencies; keep monotonic release-order checks immediately before mutations.
- Local resume evidence can be stale or incomplete → default to fresh execution and treat any missing, malformed, incompatible, cancelled, or source-changing record as a cache miss.

## Migration Plan

Implement and commit each numbered milestone independently. Validate each workflow and bundle contract locally. After all milestones, run full local validation on the exact tree and applicable editor/publication checks. Hosted behavior is observed only on a subsequently authorized normal push. Roll back by reverting the affected milestone and producing a fresh candidate; never reuse incompatible evidence.
