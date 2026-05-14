---
phase: 12
slug: modulith-boundary-hardening-planning
status: planned
created: 2026-05-14
source: Spring Modulith design model adapted to blackbox-records through a TypeScript-native boundary stack
---

# Phase 12 - Modulith Boundary Hardening Planning Spec

## Objective

Create a planning-only future milestone package that adapts Spring Modulith's application-module model to this
Astro/React/Worker monorepo through a TypeScript-native enforcement stack:

- `eslint-plugin-boundaries`
- `dependency-cruiser`
- explicit root entrypoints and named interfaces
- one repo machine-readable boundary manifest

## Requirements

- `MOD-PLAN-01`: Add a backlog item and a planned milestone `v1.2 Modulith Boundary Hardening` without changing the
  active `v1.1` sandbox milestone or pretending the refactor is already in execution.
- `MOD-PLAN-02`: Define an explicit module map covering `app-shell`, `player`, `storefront-catalog`, `store-cart`,
  `checkout-web`, `cms-admin`, `public-commerce-http`, `checkout-core`, `orders`, `stock`, `operator-stock`, and
  `platform-shared`.
- `MOD-PLAN-03`: Create one module canvas per module with responsibility, owned paths, provided interface, internal
  implementation area, allowed dependencies, named interfaces or SPI surfaces, published/listened-to events,
  verification strategy, required tests, and migration status.
- `MOD-PLAN-04`: Lock the repo-specific module model: one responsibility per module, root-first provided interface,
  hidden internals, explicit required dependencies, and interaction types declared as direct API, named interface, or
  event.
- `MOD-PLAN-05`: Define one repo machine-readable boundary manifest with directory-first ownership, explicit exceptions,
  allowed dependencies, entrypoint policy, and module statuses.
- `MOD-PLAN-06`: Define a future TypeScript-native verifier stack that uses `eslint-plugin-boundaries` as the primary
  import and entrypoint rule layer, `dependency-cruiser` as the cycle and graph rule layer, and `pnpm check` as the
  fail-fast gate.
- `MOD-PLAN-07`: Split the future execution work into four implementation-ready plans: module model and verification,
  web shell decomposition, backend commerce boundary hardening, and legacy-open governance closure.
- `MOD-PLAN-08`: Update permanent planning docs so the new boundary policy is durable: `ADR-004`,
  `.planning/codebase/MODULES.md`, the manifest, module canvases, and `.planning/UBIQUITOUS_LANGUAGE.md`.
- `MOD-VERIFY-01`: The planning-only milestone passes `pnpm check` and `pnpm test:unit`.

## Boundaries

- This phase is planning and documentation only.
- Do not change runtime behavior, public checkout contracts, generated API output, or production code ownership in this
  phase.
- Do not change `.planning/config.json` `parallelization: false`.
- Do not change `workflow.use_worktrees = false`.
- Do not rewrite the active `v1.1` roadmap or state as if v1.2 execution has already begun.
- Do not treat Spring Modulith as a literal library adoption plan for this TypeScript monorepo.
- Do not make Nx a requirement of the future boundary stack. Nx may be revisited later for orchestration, but it is not
  the primary Phase 12 enforcement mechanism.

## Acceptance Criteria

- `BL-19` exists in `.planning/BACKLOG.md`.
- `v1.2 Modulith Boundary Hardening` exists in `.planning/MILESTONES.md`.
- `.planning/phases/12-modulith-boundary-hardening-planning/` contains `12-CONTEXT.md`, `12-RESEARCH.md`,
  `12-SPEC.md`, `12-01-PLAN.md`, `12-02-PLAN.md`, `12-03-PLAN.md`, `12-04-PLAN.md`, and `12-VALIDATION.md`.
- `.planning/adrs/ADR-004-modulith-style-module-boundaries.md` exists and is internally consistent with the phase docs.
- `.planning/codebase/MODULES.md`, `.planning/codebase/module-boundaries.manifest.json`, and one canvas per approved
  module exist.
- `app-shell` and `cms-admin` are the only initial `open-temporary` modules.
- the boundary docs lock root-first entrypoints, directory-first ownership, no temporary compatibility facades, and a
  fail-fast verifier strategy
- every future execution plan is small enough to fit one branch and one reviewable PR or commit cluster
- `pnpm check` and `pnpm test:unit` pass after the planning docs land
