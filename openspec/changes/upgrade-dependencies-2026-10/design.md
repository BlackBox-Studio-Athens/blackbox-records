# Design

## Context

The approved plan is `C:/Users/SVall/.claude/plans/https-github-com-emdash-cms-emdash-relea-async-lemon.md`. The task supplies exact target versions and overrides ownership for manifest bumps only. See proposal.md for compatibility holds and authorization limits.

## Goals / Non-Goals

Preserve product behavior, package pin/caret style, existing EmDash patches, module boundaries and generated API contracts. Do not change UI components, relax assertions, bypass feedback-guard or perform hosted operations.

## Decisions

- Apply patch/minor updates, Nx, Vitest/plugin, MSW, Motion and Stripe in separate install/check batches so failures remain attributable. Use native Nx migrations rather than hand-writing their output; remove the migration file after execution.
- Replace the deprecated Worker test package and audit its override, type references and policy references together. Preserve real local D1 migrations and Worker tests.
- Inspect MSW handlers/setup for ESM, cookie and timer changes. Rename the unhandled-request option without weakening strict request handling.
- Inspect Stripe signature tolerance and connection-error handling before changing the pinned API version. Retain the old-version rejection test. Hosted endpoint settings remain a release gate.
- Keep the approved holds rather than upgrading to incompatible majors or prereleases. Keep exact/caret syntax unchanged; report all peer warnings verbatim.

## Risks / Trade-offs

- Vitest defaults can expose test isolation or async assertion failures; fix causal non-UI issues and hand UI failures to Claude.
- Runtime dependency changes need browser and CMS acceptance beyond unit tests. Record each unrun gate separately.
- Workspace-wide checks may require a maintainer grant. Record a refusal without changing guard configuration or issuing a grant.

## Migration Plan

Run focused tests after each batch, then contracts, API generation/diff, local EmDash acceptance, supported builds/bundle checks and final validation. Keep source-bound evidence under `.codex-artifacts/dependency-upgrade-20261023/` and a validation note in this change. Do not commit, push or release. Future release requires hosted webhook-version verification for UAT/PRD and UAT acceptance.
