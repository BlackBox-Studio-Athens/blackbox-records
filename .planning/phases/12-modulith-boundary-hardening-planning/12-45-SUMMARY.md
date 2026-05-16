---
plan_id: 12-45
phase: 12
status: completed
completed: 2026-05-16
---

# 12-45 Summary - Test Performance Follow-Up Analysis

## Evidence

Timing evidence was collected with the existing package scripts and native PowerShell wall-clock timing. No benchmark
scripts, custom timing helpers, Nx task runner, or new dependencies were added.

| Command                                                                | Result                                                                  | Observed Duration                                           |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm --filter @blackbox/web exec vitest run src/lib/admin`            | 4 files, 14 tests passed                                                | Vitest 295ms; wall-clock 1.308s                             |
| `pnpm --filter @blackbox/web exec vitest run src/components/app-shell` | 36 files, 158 tests passed                                              | Vitest 5.77s; wall-clock 7.181s                             |
| `pnpm test:web`                                                        | 66 files, 320 tests passed                                              | Vitest 8.22s; wall-clock 10.042s                            |
| `pnpm test:backend`                                                    | 30 files, 153 tests passed                                              | Vitest 5.83s; wall-clock 7.684s                             |
| `pnpm test:api-client`                                                 | 1 file, 2 tests passed                                                  | Vitest 519ms; wall-clock 2.271s                             |
| `pnpm test:unit`                                                       | web, backend, and api-client suites passed through native pnpm parallel | slowest package 6.78s; wall-clock 8.437s                    |
| `pnpm format:check`                                                    | Prettier check passed                                                   | wall-clock 8.706s                                           |
| `pnpm lint` before resolver cleanup                                    | ESLint passed                                                           | wall-clock 13.759s                                          |
| `pnpm check:types`                                                     | Astro check, backend tsc, and api-client tsc passed                     | wall-clock 19.594s                                          |
| `pnpm check:boundaries`                                                | module audit, depcruise, and commerce audit passed                      | depcruise 235 modules / 466 dependencies; wall-clock 3.812s |
| `pnpm lint` after resolver cleanup                                     | ESLint passed                                                           | wall-clock 12.195s                                          |
| `pnpm check:boundaries` after resolver cleanup                         | module audit, depcruise, and commerce audit passed                      | depcruise 235 modules / 466 dependencies; wall-clock 4.062s |

## Decision

- Keep native pnpm parallel package execution for `pnpm test:unit`; it remains the simplest fast root unit gate.
- Keep focused module Vitest commands as the Phase 12 refactor loop:
  - `pnpm --filter @blackbox/web exec vitest run src/components/app-shell`
  - `pnpm --filter @blackbox/web exec vitest run src/lib/admin`
  - narrower file/name commands when a slice touches only one seam.
- Keep the current Vitest topology. The measurements do not justify Vitest projects, sharding, or pool tuning yet.
- Do not add Nx, custom benchmark scripts, external task caches, or new test-speed dependencies in this slice.
- Do not introduce TypeScript project references yet. The current bottleneck is not clearly solved by references, and the
  repo still benefits from package-local `astro check` / `tsc -p` scripts.
- Replace the ESLint import resolver's multi-project list with the existing single `tsconfig.boundaries.json` resolver
  project. This removes the need for `noWarnOnMultipleProjects` while preserving boundary linting.

## Rationale

The highest-value change is to remove warning suppression instead of formalizing a larger TypeScript project-reference
topology. `tsconfig.boundaries.json` already includes the source files and path aliases needed by the boundary-focused
ESLint resolver, so the additional backend and api-client resolver projects were redundant for the current checks.

`pnpm check:types` is the slowest measured check path because it runs Astro diagnostics and package TypeScript checks.
Parallelizing those type checks or converting the repo to a solution-style TypeScript setup may be worth a later tooling
slice, but it is not obviously safer or simpler than the current package-owned checks.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/lib/admin`
- `pnpm --filter @blackbox/web exec vitest run src/components/app-shell`
- `pnpm test:web`
- `pnpm test:backend`
- `pnpm test:api-client`
- `pnpm test:unit`
- `pnpm format:check`
- `pnpm lint`
- `pnpm check:types`
- `pnpm check:boundaries`
- `pnpm check`
- `pnpm build`
