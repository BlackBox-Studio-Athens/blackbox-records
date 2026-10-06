# Validation and handoff

## Scope and decisions

- Product Environment: Local. Repository tooling, CI workflow definitions, agent hooks and instructions; no application runtime change.
- Acceptance row: boundaries/tooling/instructions. Product browser, CMS publication and provider acceptance do not apply to these edits. Release/environment acceptance is not claimed: the workflow changes are unobserved until an authorized push and promotion.
- Implementation was done by subagents on disjoint files. The parent reviewed, probed the guards, fixed integration defects and ran the consolidated validation.
- The Nx cache in `check-candidate` was dropped after investigation (see design.md, Decision 8).

## Measured on 2026-10-01

Same machine as the baseline in design.md. Other agent sessions were active, and checkouts that do not yet contain this change do not take slots, so these are loaded-machine numbers.

| Case                                         | Before                                                               | After                              | Tasks executed                     |
| -------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------- | ---------------------------------- |
| Unchanged tree, validate again               | not measured                                                         | 6.1 s and 9.0 s                    | 0 of 63                            |
| Documentation-only edit                      | 368 s (run `2026-10-01T16-13-18`, root tasks only)                   | 21.6 s                             | formatting only                    |
| Root `package.json` edit, lockfile unchanged | every task invalidated (380 s for the equivalent uncached run below) | 101.2 s                            | 10 root tasks; 52 of 63 from cache |
| Single web module edit (`player`)            | about 80 s (module-review.md, frontend scenario at parallel 3)       | 83.1 s                             | 14; 218 task-seconds               |
| Tooling change that invalidates everything   | 8 min 37 s uncached full run at parallel 2 (module-review.md)        | 379.7 s                            | 63, stopped at the first failure   |
| Second validation in the same checkout       | failed on the lock                                                   | waited 4.6 s, then passed in 6.1 s | 0 of 63                            |

Targets from design.md:

- Documentation-only validation under 10 s: not met. 21.6 s, of which Nx without its daemon takes about 14 s. An unchanged tree validates in 6 to 9 s.
- Single-module validation at most 60 s: not met. 83 s. The floor is package-level type-aware lint (33 s) and type check (31 s), the tests of eight dependent modules, and root format, architecture and lint (65 task-seconds). This change does not reduce that floor.
- No whole-suite browser run by an agent: enforced. See the refusals below.
- Push to UAT live in about 7 min: unobserved.

## Guards

- Live refusals in this checkout, each exiting non-zero in 0.5 to 1.8 s before any work: `pnpm validate:full`, `pnpm validate --no-cache`, `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm lint`, bare `pnpm test:e2e`, `pnpm test:e2e -g .`, `node --import tsx scripts/validate.mjs --full`, `pnpm --filter @blackbox/web test`, `pnpm --filter @blackbox/backend test:node`, `pnpm --filter @blackbox/api-client check`, `pnpm test` inside `apps/web`, `pnpm check` inside `apps/backend`, `pnpm test:unit` inside `apps/staff`, and `pnpm feedback:grant-full 5` from an agent shell.
- Live allowances: `pnpm validate --plan`, `pnpm local:status`, `pnpm feedback:report`, the guard under `GITHUB_ACTIONS=true`, and a package suite started as an Nx task.
- The Claude Code hook is active in running sessions: it denied a bare `pnpm test:e2e` and a direct run of a release-tier script during implementation, and other sessions in this checkout were denied `pnpm build` five times. Hook cost: median 128 ms for an allowed command, 211 ms for a denied one.
- A 46-command probe of the hook matcher during review found five gaps (direct `nx affected`, runners by file path, a bare package directory, release-tier validation modes, release-tier script files). All are closed and pinned in the hook test table.
- `scripts/feedback-contract.test.mjs` fails on an unclassified root command, an unguarded release-tier command or package suite, an unguarded listed script file, a run configuration without the override, and missing hooks.

## Checks

- Final `pnpm validate` on the reviewed tree: passed; the summary path is in ignored `.codex-artifacts/feedback-loop/final-verification.json`.
- `pnpm openspec -- validate enforce-scoped-feedback-loop --type change --strict`: valid.
- `pnpm agent:check`: passes as part of `workspace:architecture`.
- Workflow contracts: `scripts/pages-workflow-contract.test.ts` and `apps/backend/test/scripts/catalog-promotion-workflows.test.ts` pass in `workspace:test-release` and `backend-tooling:test`. actionlint reported no findings on the workflows; shell bodies were not linted because shellcheck is not installed.
- Narrowed inputs: miss, hit, miss checks for eight root targets and the root manifest check are recorded in ignored `.codex-artifacts/feedback-loop/nx-inputs-verification.md` and `toolchain-input-verification.md`.

## Defects found by the consolidated validation and review

- The stack launcher imported the new `.mjs` resource helper without a type declaration; the backend type check failed. Fixed with `scripts/local-resources.d.mts`.
- `@blackbox/backend` lint and type check did not declare root `scripts/**` as inputs although 38 backend files import them. Fixed; this predates the change.
- `backend-tooling:test` reads workflow files, both `package.json` files and backend configuration without declaring them. Fixed; this predates the change.
- `pnpm dev:stack:stripe-mock-api` started a root script that did not exist. Added `dev:backend:mock-api` and a test that every root script the launcher starts exists.

## Adversarial review of the commits

Five independent reviewers (guards, runner, cache inputs, CI, local resources) examined commits `657c7247` and `9d1f3bc4`, and a skeptic per dimension tried to refute each finding. 16 findings were confirmed and fixed; 6 were refuted. Detail is in ignored `.codex-artifacts/feedback-loop/review-findings.json`.

- High: `backend-tooling:test` read web content and library files it did not declare as inputs, so it could be restored stale. Its inputs now cover every file its tests read; `architecture-tests:test` had the same gap for the HTTP sources and `project.json` files it checks.
- Guards: the hook allowed a denied command when its denial log could not be written; ESLint and Prettier on a bare package source root, a top-level directory or a repository-wide glob passed the hook; a Vitest name filter alone exempted a package-wide run; PowerShell commit messages containing a backtick code span were denied; a grant expiring mid-run aborted the editor browser step.
- Runner: a queue ticket or slot whose PID was reused could block every validation; `pnpm test` and `pnpm test:changed` ignored Ctrl+C while waiting for slots.
- CI: a manual UAT dispatch with a candidate run id failed its identity check; the publication media cache never pruned, so it would fill and stop saving.
- Local resources: `site:dev:bg` was no longer idempotent; a stale stack lease gave no recovery hint; the Chrome lease followed the session's working directory instead of this repository; the status command mislabelled port 4321 when a linked worktree ran the stack.
- Not done, by choice: ignoring a stack lease whose port is unbound (a race could let two stacks start; the error now names the lease file to delete), and a unit test pinning the two test projects' inputs (it would only restate the configuration).

## Unverified

- A real `pnpm validate:editor` with a grant expiring mid-run, a hard-killed slot holder on Windows, and a second `site:dev:bg` in the primary checkout; each is covered by unit tests or by reading the tool's source.
- Hosted behavior of the new push and promotion shape, including timings, the media cache, staff previews on retained bytes and the e2e suite on Linux.
- The Codex hook at runtime (its configuration is covered by the contract test) and the Chrome lease in a live session.
- A linked worktree serving and testing on its own port in the real repository; it was exercised in a throwaway repository and unit tests.
- Cross-checkout slot queuing with real validations; it is covered by tests with real processes, and only checkouts that contain this change take slots.

## Follow-up

- Task 9.4: reconcile the two superseded requirements once `shorten-validation-release-feedback` is archived.
- After the next authorized push and promotion, record `pnpm ci:speed` and `pnpm feedback:report` here.
- The remaining single-module floor is package-level lint and type check, the root lint that reruns for application changes, and Nx start-up without its daemon.
