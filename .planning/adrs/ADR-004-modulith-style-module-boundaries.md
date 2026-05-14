# ADR-004: Modulith-Style Module Boundaries

**Status:** Proposed  
**Date:** 2026-05-14  
**Decision owner:** Future milestone v1.2 Modulith Boundary Hardening

## Context

The current `blackbox-records` monorepo already has strong commerce authority boundaries, but several implementation
hotspots still make bad code too easy to write:

- `apps/web/src/components/app-shell/AppShellRoot.tsx` is 1621 lines and mixes shell routing, overlays, history,
  player state, and StoreCart orchestration.
- `apps/backend/src/interfaces/http/routes/register-public-commerce-routes.ts` is 392 lines and still combines route
  schema, route definitions, handlers, and composition concerns.
- `apps/web/src/lib/admin/decap-config.ts` is 1313 lines and remains an entangled admin/config hotspot.

The next large refactor should not start from ad hoc file cleanup. It needs an explicit module model first. Spring
Modulith provides the right design inspiration: explicit application modules, API-only access by default, named
interfaces for extra exposed surfaces, structural verification, module documentation canvases, and module-scoped
integration testing.

This repo is not adopting Spring Modulith as a library. It is adopting the design model in TypeScript, Astro, React,
Cloudflare Worker, and GSD planning artifacts.

Research also showed that Nx is not the lowest-friction primary boundary mechanism for this repo's desired module
granularity. The planned modules live mostly _inside_ `apps/web` and `apps/backend`, while Nx's strongest built-in
boundary rules are project-level. The closer TypeScript-native fit is:

- `eslint-plugin-boundaries`
- `dependency-cruiser`
- explicit root entrypoints and named interfaces
- one repo machine-readable boundary manifest

## Decision

- The future v1.2 milestone will use **explicitly declared Application Modules**, not automatic folder detection, as the
  planning and refactor source of truth.
- Every Application Module must declare:
  - one responsibility
  - a provided interface
  - hidden internal implementation
  - required dependencies
  - direct API vs named interface vs event interaction type
- Modules are **closed by default**.
- `app-shell` and `cms-admin` are the initial **open-temporary** exceptions.
- `platform-shared` is a **split-pending** residual module that must stay strict bootstrap-only and shrink over time.
- Extra exposed module surfaces must be represented as **Named Interfaces** and later implemented as explicit TS entry
  points such as `index.ts`, `api.ts`, or `spi.ts`.
- The future boundary stack will use:
  - a one repo machine-readable manifest at `.planning/codebase/module-boundaries.manifest.json`
  - `eslint-plugin-boundaries` as the primary import and entrypoint rule layer
  - `dependency-cruiser` as the primary cycle and dependency-graph rule layer
  - existing repo gates such as `pnpm check`, `pnpm test:unit`, and `pnpm audit:commerce-boundaries`
- Human review reads `.planning/codebase/MODULES.md` and `.planning/codebase/modules/*.md`; tooling reads
  `.planning/codebase/module-boundaries.manifest.json`. Ownership, entrypoint, status, dependency, or exception-policy
  changes must keep those surfaces in sync.
- The only approved initial `open-temporary` modules are `app-shell` and `cms-admin`; each must carry manifest metadata
  for why it is open, how it closes, and what is forbidden while open.
- Boundary checks should fail fast once execution slices put a covered area under the new rules.
- Temporary compatibility facades are out of policy. A boundary slice must move callers to the new root entrypoint
  inside the same change.
- The refactor starts only after a planning-only Phase 12 creates the module map, module canvases, manifest, ADRs, and
  future execution slices.

## Rationale

- Explicit modules make it harder to spread logic across random files and easier to review narrow changes.
- Closed-by-default modules create a stronger default than style advice alone.
- A manifest plus lint and graph checks gives TypeScript a practical equivalent of executable architecture.
- `eslint-plugin-boundaries` is a closer fit than Nx for enforcing in-app module ownership and entrypoint rules.
- `dependency-cruiser` is stronger than plain lint rules for cycle and graph-shape enforcement.
- Root-first entrypoints allow AI agents to see one obvious legal import target instead of many accidental ones.
- Planning-first milestone work preserves the active v1.1 sandbox roadmap while preparing a safer post-sandbox
  hardening sequence.

## Consequences

- `.planning/codebase/MODULES.md` and `.planning/codebase/modules/*.md` become the human review docs for the future
  refactor.
- `.planning/codebase/module-boundaries.manifest.json` becomes the tooling input for boundary enforcement.
- `.planning/UBIQUITOUS_LANGUAGE.md` must carry the module terminology used by future plans, tests, and ADRs.
- Future execution slices should be one branch at a time, manually managed, with no change to
  `.planning/config.json` `parallelization: false`.
- Any future large refactor that bypasses the module canvases, manifest, allowed dependencies, or temporary-open exit
  criteria should be treated as out of policy.
- A module must not be marked `open-temporary` unless the manifest validator accepts it and the matching canvas explains
  the closure path.
- Nx may still be introduced later for task orchestration or caching, but the Phase 12 boundary model does not depend
  on it.

## References

- [Spring Modulith Fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html)
- [Spring Modulith Verification](https://docs.spring.io/spring-modulith/reference/verification.html)
- [Spring Modulith Documentation](https://docs.spring.io/spring-modulith/reference/documentation.html)
- [Spring Modulith Testing](https://docs.spring.io/spring-modulith/reference/testing.html)
- [Spring Modulith Events](https://docs.spring.io/spring-modulith/reference/events.html)
- [JS Boundaries rules overview](https://www.jsboundaries.dev/docs/rules/)
- [JS Boundaries ESLint integration](https://www.jsboundaries.dev/docs/setup/eslint-integration/)
- [dependency-cruiser rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)
- [TypeScript modules reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
