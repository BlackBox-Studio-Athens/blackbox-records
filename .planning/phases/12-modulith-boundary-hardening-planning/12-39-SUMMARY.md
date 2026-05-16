---
plan_id: 12-39
phase: 12
status: completed
completed: 2026-05-16
---

# 12-39 Summary - Test Performance Analysis

## Evidence

| Command                                                                | Result                                                                | Observed Duration                               |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| `pnpm --filter @blackbox/web exec vitest run shell-overlay-navigation` | 1 file, 6 tests passed                                                | 312ms                                           |
| `pnpm --filter @blackbox/web exec vitest run src/components/app-shell` | 34 files, 144 tests passed                                            | 2.84s                                           |
| `pnpm test:web`                                                        | 61 files, 301 tests passed                                            | 4.45s                                           |
| `pnpm test:backend`                                                    | 30 files, 153 tests passed                                            | 3.58s                                           |
| `pnpm test:api-client`                                                 | 1 file, 2 tests passed                                                | 310ms                                           |
| old sequential `pnpm test:unit`                                        | web, backend, api-client passed in sequence                           | package durations 4.38s + 3.23s + 304ms         |
| new native-parallel `pnpm test:unit`                                   | web, backend, api-client passed in parallel with pnpm-prefixed output | slowest package duration 8.12s under contention |

## Decision

- Keep the focused direct Vitest commands for Phase 12 refactor loops:
  - `pnpm --filter @blackbox/web exec vitest run <test-name>`
  - `pnpm --filter @blackbox/web exec vitest run src/components/app-shell`
- Normalize the web package with a native `test` lifecycle script so all testable workspaces expose `test`.
- Change the root `pnpm test:unit` gate to pnpm's native filtered parallel execution:
  `pnpm --parallel --filter @blackbox/web --filter @blackbox/backend --filter @blackbox/api-client test`.
- Do not add Nx, custom benchmark scripts, Vitest workspace projects, sharding, TypeScript project references, or external
  task/cache libraries in this slice.

## Rationale

The app-shell direct loop is already fast enough for seam work, and the root unit gate can improve wall-clock feedback by
running independent package suites concurrently. The parallel run does increase each package's reported Vitest duration
because the suites contend for local resources, but the root command remains native, simple, and still emits package
prefixes that keep failures inspectable.

Vitest projects, sharding, pool tuning, and TypeScript references may become worthwhile if Phase 12 later shows repeated
slowdowns in a specific package. They are not justified by this measurement pass because they would add topology and
configuration surface without a clear current bottleneck.

## Verification

- `pnpm --filter @blackbox/web exec vitest run shell-overlay-navigation`
- `pnpm --filter @blackbox/web exec vitest run src/components/app-shell`
- `pnpm test:web`
- `pnpm test:backend`
- `pnpm test:api-client`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
