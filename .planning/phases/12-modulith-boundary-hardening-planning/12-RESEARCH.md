# Phase 12 - Modulith Boundary Hardening Planning Research

## Objective

Translate the useful parts of Spring Modulith's design model into a TypeScript-native boundary stack for this repo.

The target is not "Spring, but in TypeScript". The target is a repo where AI agents have fewer legal moves:

- ownership is explicit
- imports are mechanically constrained
- deep imports are rejected
- cycles are rejected
- public entrypoints are obvious
- tests sit close enough to modules that refactors stay reviewable

## Spring Modulith Findings To Carry Forward

### 1. Modules are explicit functional units

Spring Modulith defines an application module as a unit with:

- an API exposed to other modules
- internal implementation that should not be accessed externally
- required interfaces toward other modules

This repo should adopt that same model, but through explicit planning docs and enforcement files rather than Java
package discovery.

Source:

- [Spring Modulith Fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html)

### 2. Auto-detected package boundaries are the wrong fit here

Spring Modulith defaults to direct sub-packages as modules, but also supports explicitly annotated module detection.
That explicit mode is the closer match for this repo because the real boundaries cross multiple packages and runtimes.

Translation for this repo:

- module boundaries are declared in `.planning/codebase/MODULES.md`, module canvases, and one repo manifest
- the repo should not treat a random folder boundary as a valid architecture boundary without docs and tooling support

Source:

- [Spring Modulith Fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html)

### 3. API-only access plus named interfaces

Spring Modulith treats the module root as the default API and allows additional explicitly declared named interfaces.
That maps well to future TypeScript facades such as `index.ts`, `api.ts`, or `spi.ts`.

Translation for this repo:

- root facade or documented entrypoint is the only default cross-module import target
- extra exposed surfaces must be named and documented
- arbitrary deep imports count as internal access violations

Source:

- [Spring Modulith Fundamentals](https://docs.spring.io/spring-modulith/reference/fundamentals.html)

### 4. Verification must reject cycles and internal access

Spring Modulith verification checks:

- no module cycles
- access only via API packages
- explicit allowed dependencies where configured

Translation for this repo:

- future verification should check no cycles between declared modules
- future verification should reject cross-module deep imports into internals
- future verification should compare imports against the documented allowed dependency list

Source:

- [Spring Modulith Verification](https://docs.spring.io/spring-modulith/reference/verification.html)

### 5. Module canvases are first-class design artifacts

Spring Modulith can generate application-module canvases that summarize beans, events, and exposed surfaces per module.

Translation for this repo:

- maintain human-authored module canvases under `.planning/codebase/modules/`
- use them as the planning equivalent of generated application-module documentation

Source:

- [Spring Modulith Documentation](https://docs.spring.io/spring-modulith/reference/documentation.html)

### 6. Module tests should stay local and narrow

Spring Modulith's module testing guidance favors bootstrapping one module or one dependency slice at a time. It also
explicitly calls out that too many cross-module dependencies are usually a coupling smell and often a sign to consider
events.

Translation for this repo:

- future refactors should begin with module-scope characterization tests
- UI modules should get helper-level tests plus Browser Use checks for their public behavior
- backend modules should get route or application tests at the documented module boundary
- use events where coupling is truly a domain boundary, not as a blanket replacement for direct APIs

Sources:

- [Spring Modulith Testing](https://docs.spring.io/spring-modulith/reference/testing.html)
- [Spring Modulith Events](https://docs.spring.io/spring-modulith/reference/events.html)

## TypeScript Ecosystem Findings

### 1. Nx is adoptable here, but not the closest low-hassle fit for internal module enforcement

Nx can be added incrementally with `nx init`, infer tasks from an existing workspace, and enforce project boundaries
through tagged projects. That is useful for caching, affected-task execution, and workspace visualization.

The mismatch is granularity. This repo's planned modules live mostly _inside_ `apps/web` and `apps/backend`, while Nx's
strongest built-in boundary rules are project-level. Using Nx as the main Phase 12 boundary mechanism would push this
repo toward many extra Nx projects before the actual refactor even starts.

Conclusion for Phase 12:

- Nx stays a valid later choice for orchestration or caching
- Nx is **not** the primary boundary mechanism for the current modulith plan

Sources:

- [Nx installation](https://nx.dev/docs/getting-started/installation)
- [Add Nx to an existing project](https://nx.dev/docs/guides/adopting-nx/adding-to-existing-project)
- [Nx enforce module boundaries](https://nx.dev/docs/features/enforce-module-boundaries)

### 2. `eslint-plugin-boundaries` is the best primary import-boundary layer

`eslint-plugin-boundaries` is designed specifically to:

- classify files into known architectural elements
- define allowed dependencies between them
- reject unknown files or imports when used in strict mode

Its primary rule is `boundaries/dependencies`. The docs explicitly position this as the main boundary rule, and the
strict config enables full compliance while the recommended config exists for progressive adoption.

Important nuance:

- the older `entry-point` rule is now treated as legacy
- the docs recommend expressing entrypoint restrictions through `boundaries/dependencies` using `internalPath`

That fits this repo well because the desired rule is "root-first entrypoints, with documented named interfaces only",
not "sprinkle many separate lint mechanisms".

Conclusion for Phase 12:

- use `eslint-plugin-boundaries` as the **primary** cross-module import and entrypoint enforcement layer
- target strict, fail-fast enforcement on the covered module roots rather than audit-only drift detection

Sources:

- [JS Boundaries rules overview](https://www.jsboundaries.dev/docs/rules/)
- [JS Boundaries ESLint integration](https://www.jsboundaries.dev/docs/setup/eslint-integration/)
- [JS Boundaries entry-point rule note](https://www.jsboundaries.dev/docs/rules/entry-point/)

### 3. `dependency-cruiser` is the best cycle and graph rule layer

`dependency-cruiser` is the strongest complement to ESLint for this plan because it handles dependency graph rules well:

- forbidden rules can have `error` severity and fail builds
- `circular: true` rules catch cycles
- `scope: "folder"` works for folder-level rules
- path regex and group matching fit directory-first module ownership
- `via` lets the plan carve out temporary known knots when needed

That makes it a good fit for:

- cycle detection
- folder-level module dependency rules
- broader graph checks that do not belong in per-file ESLint import logic

Conclusion for Phase 12:

- use `dependency-cruiser` for no-cycle and graph-shape enforcement
- keep severities at `error` for the covered boundary set so the checks fail fast

Sources:

- [dependency-cruiser overview](https://github.com/sverweij/dependency-cruiser)
- [dependency-cruiser rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)
- [dependency-cruiser rules tutorial](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-tutorial.md)

### 4. Explicit entrypoints matter more than package extraction

TypeScript and Node already support package `exports`, package `imports`, and self-name imports. That is useful when a
module is a real package. This repo already has one concrete example:

- `packages/api-client/package.json` exports only `"."`

That is a good hardening pattern for real workspace packages. But most planned Phase 12 modules are not independent
packages today. They are internal modules inside `apps/web` or `apps/backend`.

Conclusion for Phase 12:

- default to root `index.ts` facades and documented `api.ts` or `spi.ts` named interfaces for in-app modules
- use package `exports` only where there is already a real package boundary, such as `@blackbox/api-client`, or where a
  future slice intentionally extracts one

Sources:

- [TypeScript modules reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Node package exports](https://nodejs.org/api/packages.html)

## Current Repo Evidence

### Milestone posture

- `v1.1 Stripe Sandbox Integration` remains the active milestone.
- `Go-Live / Launch Hardening` is still a later milestone.
- Adding v1.2 as a planned milestone does not require changing the current roadmap or state to pretend execution has
  begun.

Repo evidence:

- `.planning/MILESTONES.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/BACKLOG.md`

### Hotspot sizes

- `apps/web/src/components/app-shell/AppShellRoot.tsx`: **1621 lines**
- `apps/backend/src/interfaces/http/routes/register-public-commerce-routes.ts`: **392 lines**
- `apps/web/src/lib/store-cart.ts`: **261 lines**
- `apps/web/src/lib/admin/decap-config.ts`: **1313 lines**
- `apps/web/src/components/stock/StockOperationsApp.tsx`: **433 lines**
- `apps/backend/test/http/public-commerce-routes.test.ts`: **336 lines**

### Existing test reality

- The backend does have substantial tests, but they live under `apps/backend/test/**`, not colocated under
  `apps/backend/src/**`.
- The app-shell player helpers have direct unit tests, but the shell router itself still lacks direct automated
  coverage around routing, history, overlay fetch, and DOM snapshot application.

Repo evidence:

- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`
- `apps/backend/test/**`
- `apps/web/src/components/app-shell/player-session-machine.test.ts`
- `apps/web/src/components/app-shell/player-session-ui.test.ts`

### Existing package and entrypoint reality

- The repo is a small pnpm workspace, not yet a fine-grained Nx workspace.
- `packages/api-client/package.json` already uses a root `exports` surface, which is the right pattern for real package
  boundaries.
- The web and backend code still rely mainly on file-level imports rather than explicit module root facades.

Repo evidence:

- `package.json`
- `pnpm-workspace.yaml`
- `packages/api-client/package.json`

### Existing verifier leverage

This repo already has a good base for the chosen TypeScript-native stack:

- root `eslint.config.mjs`
- `pnpm audit:commerce-boundaries`
- backend architecture and boundary tests under `apps/backend/test/**`

That makes a layered verifier stack realistic:

- `eslint-plugin-boundaries` in the existing ESLint config
- `dependency-cruiser` as an additional graph check
- repo-local manifest data instead of inferred project tags

## Resulting Translation Decisions

1. Use **explicit module canvases plus one repo machine-readable manifest** instead of folder heuristics alone.
2. Keep modules **closed by default**, with `app-shell` and `cms-admin` as the only initial `open-temporary`
   exceptions.
3. Treat `platform-shared` as **strict bootstrap-only** and reject business behavior there.
4. Use **directory-first ownership with explicit exceptions**, not file-by-file ownership from day one.
5. Use **`eslint-plugin-boundaries`** as the primary import and entrypoint rule layer.
6. Use **`dependency-cruiser`** as the primary cycle and folder-level graph rule layer.
7. Make the boundary checks **fail fast inside `pnpm check`**, not audit-only.
8. Keep entrypoints **root-first**. Extra named interfaces are allowed only when documented.
9. Disallow **temporary compatibility facades** during execution slices. A slice must move callers to the new
   entrypoint inside the same boundary change.
10. Move tests **closer to modules** as boundary work progresses, and actively relocate the relevant legacy tests during
    those slices.
11. Treat events as **exceptional decoupling tools**, not the default interaction mode.
12. Generated or shared artifacts still need an explicit owner module, but they do **not** need to pretend to be
    ordinary business modules if a package or platform boundary is the better fit.
