# Design

## Context

See [proposal.md](proposal.md) for motivation. Earlier work (`improve-ci-pipeline-speed`, `accelerate-validation-and-releases`, `shorten-validation-release-feedback`, `add-local-e2e-harness`) delivered Nx affected selection, module-owned tests, split release preparation and a deterministic e2e harness. Nx 23.2.1 already shares its cache and task database across every checkout of this repository under `~/.nx/<workspace-id>`, so a new worktree does not start cold.

Measurements taken on 2026-10-01 (Windows 11, i5-8600K, 6 logical processors, 32 GB):

| Measurement                                   | Value                                                                                                                                                                                            | Source                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `pnpm validate` passing runs, last three days | median 166 s, p75 316 s, range 36 to 611 s; 22 passed, 7 failed, 1 invalidated after 943 s                                                                                                       | `.codex-artifacts/validation/*/summary.json`       |
| Executed Nx tasks, 2.4 days                   | 3,395 tasks, 79,252 task-seconds; 1,923 cache hits                                                                                                                                               | task history in `~/.nx/b86e1106e080a2ea/databases` |
| Share of executed task time                   | root `workspace` tasks 31.0%, module tests 36.3%, package lint 16.8%, package typecheck 9.4%, tooling tests 5.2%, builds 1.3%                                                                    | same                                               |
| Contention inflation, average over minimum    | `@blackbox/web:lint` 22 s to 87 s (max 656 s); `workspace:test-tooling` 8.5 s to 77 s; `workspace:architecture` 2 s to 23 s                                                                      | same                                               |
| `workspace:format` failures                   | 22                                                                                                                                                                                               | same                                               |
| Wrapper overhead outside Nx                   | median 8 s, maximum 154 s                                                                                                                                                                        | summaries                                          |
| Commands agents ran (Claude sessions)         | `pnpm validate` 48, `pnpm test:e2e` 24 plus 9 raw `playwright test`, `validate:editor` 12, focused `pnpm test <x>` 35                                                                            | session transcripts                                |
| Push to accepted UAT                          | about 12 min typical (run 36859506583); 955 s median in the September baseline                                                                                                                   | `gh run view`, `docs/validation-feedback.md`       |
| CI steps on that run                          | `validate:checks` 263 s; UAT publication restore 97 s, PRD 51 s; UAT build 128 s; staff previews 185 s plus 26 s browser install; UAT quick checks 54 s plus 19 s; provider smoke 42 s plus 23 s | same run                                           |
| PRD promotion                                 | 4 to 5 min                                                                                                                                                                                       | runs 36894123055, 36732672779                      |

Constraints: Cloudflare stays on Free. The repository is public, so standard GitHub runner minutes are not a budget. Hosted effects cannot be observed without a push the maintainer authorizes. The checkout is shared by several agent threads, some in linked worktrees.

## Goals / Non-Goals

**Goals**

- The scoped path is the only path an agent can take without the maintainer, enforced by committed configuration.
- Docs-only validation under 10 s; single-module validation at most 60 s when the machine is otherwise idle; task durations under load within about 1.5 times their uncontended minimum.
- No whole-suite browser run by an agent on a development machine.
- Push to UAT live in about 7 min.

**Non-Goals**

- Per-worktree full Local stacks. 65 files reference ports 4321 and 8787.
- Module-level lint or typecheck. They are type-aware and cost about 22 s uncontended; revisit only if they still dominate.
- Running e2e against a built site instead of the dev server.
- Changing the main-worktree rule for OpenSpec work.

## Decisions

### 1. One policy file is the source of truth

`feedback-policy.json` at the repository root holds the tier of every root command, the slot budget, deny rules with their scoped alternatives, the grant settings and local-resource settings. `scripts/feedback-policy.mjs` loads it and resolves the shared state directory. Scripts and hooks import that module; none restates a rule. A contract test enumerates `package.json` scripts and hook configurations and fails on an unclassified command, an unguarded release-tier command or a missing hook.

Alternative considered: rules in `AGENTS.md`. Rejected: the transcripts show instructions are not followed under pressure, and instructions cannot stop a command.

### 2. Shared state lives in the git common directory

`git rev-parse --git-common-dir` resolves to the primary checkout's `.git` from every linked worktree, including the Codex worktrees under `~/.codex/worktrees`. Slots, the queue, the grant, the port registry, both leases and the history log live in `<common>/blackbox-feedback/`. It needs no configuration, is never committed, and disappears with the repository.

Alternative considered: `~/.nx` or a temp directory. Rejected: a second clone would share state it should not, and temp directories are cleared.

### 3. Two guard layers

- **Scripts** (fail closed; cover every tool and human): release-tier root commands start with `node scripts/feedback-guard.mjs <name> &&`; the validation wrapper applies the same check for its release-tier modes; the e2e wrapper refuses an unfiltered run; whole-package test and type-check suites in each package carry the same prefix and pass only as a task the task runner started; script files that perform release-tier work call the guard themselves, so starting them with `node` is refused too. The guard passes under `GITHUB_ACTIONS=true`, an active grant, or the override variable carried by committed run configurations. If the policy cannot be read, the guard refuses.
- **Agent hooks** (fail open; a fast pre-check that explains): one `PreToolUse` command hook for shell tools in `.claude/settings.json` and `.codex/hooks.json`. It derives denied commands from the policy tiers and applies the policy's deny rules to raw runners, by name or by file path, at command positions only, so text that merely mentions a command is allowed. With an active grant it still denies the grant command, the grant file path, the override variable and the task-runner marker. A hook error allows the command, because the script layer is the backstop. The hook costs one Node start, about 0.13 s per shell command.

The grant is a file with an expiry written by `pnpm feedback:grant-full <minutes>`. Only the maintainer can run it: the hook denies it to agents, and the command refuses when its environment shows an agent tool started it (`CLAUDE_CODE_CHILD_SESSION`, `CODEX_THREAD_ID`, `CODEX_CI`). `CLAUDECODE` is deliberately not a marker, because the maintainer's own IDE or app terminal can carry it. Alternative considered: an environment variable alone. Rejected: an agent can set it inline, and the maintainer could not lift the guard for a running agent session.

### 4. Slots, not reduced parallelism

Three slot files, acquired with exclusive create and reclaimed when the recorded PID is gone (the logic `acquireLock` already uses). A validation takes every free slot, at least one, and passes the count to Nx as `--parallel`. With none free it queues by ticket file in arrival order and prints the holder every 30 s. Focused tests (`pnpm test <module|file>`) take a slot only when one is free and never wait. `pnpm test` without an argument, `pnpm test:changed` and a named e2e spec wait like a validation. Three was the measured optimum for one run on this machine, so it is the machine budget.

A second validation of the same checkout waits for the first instead of failing on the per-checkout lock; Nx then restores what the first run completed.

Alternative considered: always start with lowered parallelism. Rejected by the maintainer: load can still exceed the machine.

### 5. Validation converges

- The wrapper sets `NX_PLUGIN_NO_TIMEOUTS=true` beside `NX_DAEMON=false`.
- Local mode runs the cached formatter in write mode on changed files before recording source identity.
- Source identity is `HEAD` plus the content of changed and untracked files as git reports them. The file watcher stays, because it also detects edits that were reverted during a run.
- When the watcher reports a change, the wrapper runs the same Nx command once more. Nx restores every task whose inputs did not change. A second change ends the run as invalidated.

### 6. Declared inputs for root tasks

Root tasks take named inputs for the paths they read (see the tooling-validation delta). The root contract tests are five cached groups (agent, release, runner, boundaries, content), so slow runner tests and CMS contracts rerun only for their own inputs. `scripts/check-module-projects.mjs` fails when a root task other than `format` takes documentation or OpenSpec change files as inputs. Formatting keeps whole-repository inputs; it is cached per file and costs about one second. Nx still lists root tasks for a documentation edit, because the root project owns those files, but restores them from cache. The architecture task is the exception for the four agent-guidance documents, which its check reads.

The root `package.json` leaves the `toolchain` input that every project inherits and stays an input of root tasks only. It changed in 34 commits in 30 days, mostly one-line script edits, and each one invalidated every task in the repository; dependency versions are already covered by the lockfile and tool versions by runtime inputs.

The risk is a stale pass from an input declared too narrowly. Each narrowed task is checked with the miss, hit, miss method from `shorten-validation-release-feedback/module-review.md`, and a weekly scheduled workflow runs the full suite uncached.

### 7. Site port per worktree, stack and Chrome as singletons

`scripts/local-resources.mjs` assigns the primary checkout port 4321 and each linked worktree a stable port from a registry, pruned against `git worktree list`. The site launchers and `playwright.config.ts` read it, so the harness can no longer test another checkout. `strictPort` stays. The full stack takes a lease in `scripts/start-local-stack.ts`, which owns the signal handlers that release it; the checkout that holds it serves on 4321, and other checkouts' launchers then fail clearly. Chrome use is leased per agent session by a `PreToolUse` hook on the Chrome tools, renewed on use and expiring after the idle time in the policy. The built-in browser pane is per session and needs no lease.

### 8. Browser and provider suites gate promotion, not pushes

The push path keeps checks, both target builds, UAT deployment and `verify-hosted uat`. The promotion dispatch gains parallel acceptance jobs that `deploy-prd` needs: verify UAT serves the candidate SHA, then UAT static smoke, provider smoke, staff previews in both browsers and the whole e2e suite. They run under the existing workflow-level release lock. Rerunning failed jobs keeps passed acceptance.

Publication restore reads media from an Actions cache when the file's sha256 matches the snapshot.

Alternative considered: path-conditional suites per push. Rejected by the maintainer: most pushes touch web code, so they would still run often.

Alternative considered: restoring the Nx cache in `check-candidate` between runs. Rejected after investigation: Nx 23.2.1 names its task database after the machine id (`native/db/mod.rs`, `native/machine_id/mod.rs`), ignores cache artifacts that database does not index, offers no supported setting to stabilise the id, and documents reuse of a local cache from another machine as unsupported. The cache would likely give no hits, grow on every save, and compete with the image and media caches under the repository cache limit. `check-candidate` stays uncached; it runs beside the target builds and is not the longest job on the push path.

### 9. One history log

Each local validation, guard denial and local e2e run appends one JSON line to `history.jsonl` in the shared state directory. Recording is best-effort and never changes a result. `pnpm feedback:report` prints a weekly timeline from it beside the Nx task-history aggregate, so the effect of this change can be followed over time without a service or a scheduled job. The per-run validation summaries and the per-checkout denial log remain the detail.

Alternative considered: deriving the trend from per-checkout artifacts. Rejected: they disappear with a worktree.

### Implementation partition

Agents work in the primary checkout on disjoint files. They run focused tests only; the parent runs `pnpm validate` once at the end and commits by explicit path.

| Package                     | Owns                                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 policy contract (parent) | `feedback-policy.json`, `scripts/feedback-policy.mjs`                                                                                                                                           |
| A runner                    | `scripts/machine-slots.mjs`, `scripts/validate.mjs`, `scripts/validate-local.mjs`, `scripts/test-watch.mjs`, their tests                                                                        |
| B CI                        | `.github/workflows/*`, `scripts/restore-published-content.mjs`, workflow contract tests, `scripts/verify-environment-model.ts`, release docs                                                    |
| D Nx inputs                 | `nx.json`, root `project.json`, `scripts/check-module-projects.mjs`, root `package.json` test lists                                                                                             |
| E local resources           | `scripts/local-resources.mjs`, `scripts/local-status.mjs`, `scripts/agent-hooks/browser-lease.mjs`, site launchers, `playwright.config.ts`, stack lease                                         |
| C guards                    | `scripts/feedback-guard.mjs`, `scripts/feedback-grant.mjs`, `scripts/run-e2e.mjs`, `scripts/agent-hooks/command-guard.mjs`, root `package.json` scripts, hook configuration, run configurations |
| F docs and report           | `AGENTS.md`, `docs/agent-*.md`, `docs/validation-feedback.md`, `README.md`, `scripts/feedback-report.mjs`                                                                                       |

Wiring of scripts and hooks landed last so that it did not block the work that preceded it. The parent's review then produced four fixes: the root manifest input, the per-checkout lock wait, guard gaps found by probing the matcher, and report accuracy with the history log.

## Risks / Trade-offs

- [A narrowed input misses a real dependency] → fixture checks per task, weekly uncached full run, promotion acceptance.
- [Promotion needs UAT to still serve the candidate] → promote the candidate UAT serves, or redeploy the selected one.
- [A provider outage now blocks promotion instead of a push] → the manual smoke workflows remain for diagnosis; promotion is rarer than pushes.
- [Codex hook parity] → Codex matches only its shell tool and its deny format must be confirmed; the script layer covers Codex regardless.
- [A crashed run holds a slot or lease] → PID liveness reclaim for slots and the stack; idle expiry for Chrome.
- [The guard blocks legitimate tooling work] → the maintainer issues a time-boxed grant.
- [Linux-only failures reach CI] → unchanged; `check-candidate` still runs every check before deployment.
- [The global instruction "Claude in Chrome first" raises lease contention] → that file is the maintainer's; the lease message points to named specs and the built-in pane.

## Migration Plan

1. Land packages in the order above as separate local commits on `main`. No push without the maintainer's instruction.
2. Exercise workflow edits on a throwaway branch through `workflow_dispatch` where the job does not mutate a hosted target.
3. After the next authorized push and promotion, record `pnpm ci:speed` and `pnpm feedback:report` results in this change's validation note.
4. Rollback: revert the guard commit to restore unguarded commands; revert the workflow commit to restore per-push suites. Shared state under `<common>/blackbox-feedback/` can be deleted at any time.
5. `shorten-validation-release-feedback` is unarchived and its deltas say that candidate acceptance waits for provider checks. Archive it first, then add MODIFIED deltas here for "UAT and PRD candidate artifacts are prepared independently" and "Preparation cancellation does not interrupt hosted mutations".

## Decided after implementation

- No commit-time validation gate for now (maintainer, 2026-10-02). "Run `pnpm validate` before finishing" stays an instruction: in a checkout shared by several threads a gate would let another thread's unfinished work block a commit, and an unchanged tree validates in under ten seconds. The history log shows whether commits land without a passing validation; if they do, the gate is a small addition to the command hook.
- Slots and queue tickets carry a heartbeat. A holder whose file has not been touched for 60 s is reclaimed whatever its PID, so a reused PID cannot block the machine; the per-checkout lock keeps PID-only liveness.
- The architecture task's existence check for documentation files uses `scripts/list-tree-files.mjs`, which lists files in a stable order independent of the git index.

## Open Questions

- Whether the Chrome idle time of three minutes suits long visual passes; it is one number in the policy.
- Whether per-worktree activity should move the "prepared work stays in the main worktree" requirement; outside this change.
