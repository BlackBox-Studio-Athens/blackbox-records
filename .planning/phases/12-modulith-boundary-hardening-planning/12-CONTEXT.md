---
phase: 12
slug: modulith-boundary-hardening-planning
status: planned
created: 2026-05-14
source: Spring Modulith reference docs, TypeScript boundary-tool research, and current blackbox-records hotspots
---

# Phase 12: Modulith Boundary Hardening Planning - Context

**Gathered:** 2026-05-14T14:40:04.2546224+03:00  
**Updated:** 2026-05-14  
**Status:** Ready for replanning

<domain>
## Phase Boundary

Phase 12 prepares a future hardening milestone that makes bad code harder to write in this repo by defining explicit
Application Modules, their allowed dependencies, their provided interfaces, and the TypeScript-native verification
stack that will later enforce those boundaries.

This phase does not perform the refactor. It only prepares the future milestone and execution slices.

</domain>

<spec_lock>

## Requirements Locked Via SPEC.md

**9 requirements are locked.** See `12-SPEC.md` for the full contract.

Downstream agents MUST read `.planning/phases/12-modulith-boundary-hardening-planning/12-SPEC.md` before planning or
executing any future module-boundary work. Requirements are not duplicated here.

**In scope from SPEC.md:** backlog and milestone setup, explicit module map, module canvases, one repo manifest, ADR,
glossary updates, future verification design, and four future execution plans.

**Out of scope from SPEC.md:** runtime refactors, checkout/public API changes, generated-client behavior changes,
activation of v1.2 execution ahead of the current v1.1 milestone, and adopting Nx as a required boundary framework.

</spec_lock>

<decisions>
## Planning Decisions

### Milestone Shape

- **D-01:** Keep `v1.1` as the active sandbox milestone. Add `v1.2 Modulith Boundary Hardening` as a planned milestone
  after `v1.1` and before Go-Live / Launch Hardening.
- **D-02:** Treat Phase 12 as planning-only. It prepares the refactor roadmap but does not start implementation.
- **D-03:** Keep `.planning/config.json` `parallelization: false` and `workflow.use_worktrees = false`.

### Modulith Translation

- **D-04:** Translate Spring Modulith's application-module model into repo-local GSD artifacts instead of adopting the
  Java library.
- **D-05:** Use explicitly declared modules, not automatic folder detection, because this repo spans Astro, React,
  Worker backend, generated API client, and planning docs.
- **D-06:** Keep entrypoints root-first. Use `index.ts` as the default future module facade, and allow `api.ts` or
  `spi.ts` only when the extra surface is explicitly documented.
- **D-07:** Disallow temporary compatibility facades during boundary refactors. A slice must move callers to the new
  root entrypoint instead of leaving old deep-import paths in place.

### TypeScript-Native Boundary Stack

- **D-08:** Use one repo machine-readable boundary manifest at
  `.planning/codebase/module-boundaries.manifest.json`.
- **D-09:** Use directory-first ownership with explicit exceptions, not file-level ownership from day one.
- **D-10:** Use `eslint-plugin-boundaries` as the primary import and entrypoint enforcement layer.
- **D-11:** Use `dependency-cruiser` as the primary cycle and graph-shape enforcement layer.
- **D-12:** Make the boundary stack fail fast inside `pnpm check`, not audit-only.
- **D-13:** Nx is optional later for caching or affected-task orchestration, but it is not the primary Phase 12
  boundary mechanism.

### Initial Module Statuses

- **D-14:** Default modules to `closed`.
- **D-15:** `app-shell` and `cms-admin` are the only initial `open-temporary` modules.
- **D-16:** Apply a hard closure bar: no new `open-temporary` modules without an explicit new planning decision and no
  boundary expansion around `app-shell` or `cms-admin` until their exit criteria are met.
- **D-17:** `platform-shared` is `split-pending` and must stay strict bootstrap-only. It is not a permanent dumping
  ground for business logic.

### Execution Planning Defaults

- **D-18:** Future execution slices should be small enough for one branch and one reviewable PR or local commit cluster.
- **D-19:** Events are exceptional decoupling tools, not the default interaction mode.
- **D-20:** Direct API calls remain the default interaction mode unless asynchronous decoupling is genuinely part of the
  domain.
- **D-21:** Move tests closer to modules during the hardening work. New module-surface tests should be local to the
  module, and touched legacy tests should be actively relocated where that reduces ownership ambiguity.
- **D-22:** Generated and shared artifacts still require explicit module ownership. Real packages may use package
  `exports`; in-app modules should rely on explicit root entrypoints plus boundary rules instead.

</decisions>

<canonical_refs>

## Canonical References

### Current Repo Source Of Truth

- `.planning/BACKLOG.md`
- `.planning/MILESTONES.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/UBIQUITOUS_LANGUAGE.md`
- `.planning/phases/12-modulith-boundary-hardening-planning/12-REFACTOR-ENDGOAL.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/MODULES.md`
- `.planning/codebase/module-boundaries.manifest.json`

### Hotspot Files

- `apps/web/src/components/app-shell/AppShellRoot.tsx`
- `apps/web/src/lib/store-cart.ts`
- `apps/web/src/lib/admin/decap-config.ts`
- `apps/backend/src/interfaces/http/routes/register-public-commerce-routes.ts`
- `apps/backend/test/http/public-commerce-routes.test.ts`

### Enforcement Stack References

- `eslint.config.mjs`
- `packages/api-client/package.json`
- [JS Boundaries rules overview](https://www.jsboundaries.dev/docs/rules/)
- [JS Boundaries ESLint integration](https://www.jsboundaries.dev/docs/setup/eslint-integration/)
- [JS Boundaries entry-point rule note](https://www.jsboundaries.dev/docs/rules/entry-point/)
- [dependency-cruiser rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)
- [dependency-cruiser rules tutorial](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-tutorial.md)
- [TypeScript modules reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [Node package exports](https://nodejs.org/api/packages.html)

### Spring Modulith Design References

- [Fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html)
- [Verification](https://docs.spring.io/spring-modulith/reference/verification.html)
- [Documentation](https://docs.spring.io/spring-modulith/reference/documentation.html)
- [Testing](https://docs.spring.io/spring-modulith/reference/testing.html)
- [Events](https://docs.spring.io/spring-modulith/reference/events.html)

</canonical_refs>
