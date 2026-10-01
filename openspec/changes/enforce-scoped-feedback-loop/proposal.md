# Proposal

## Why

Agents still wait minutes between an edit and a released change, although Nx affected selection and a shared cache exist. Measurements from 2026-09-29 to 2026-10-01 show why: agents ran whole-project commands about 93 times against 35 focused tests, root workspace tasks rerun on any file change (31% of 79,252 executed task-seconds), concurrent worktrees inflate task times 3 to 12 times, and every push spends about 8 minutes on browser and provider suites. The scoped path is written in instructions and is not enforced, and worktrees contend for CPU, port 4321 and the shared Chrome profile. See [design.md](design.md) for the measurements.

## What Changes

- One committed policy file classifies every root command and states the machine slot budget, guarded command patterns, suite tiers and lease times. Scripts and agent hooks read it; a contract test fails when a script or hook is not covered by it.
- **BREAKING:** whole-project commands (`validate:full`, `validate:checks`, `validate:editor`, `test:unit`, package-wide tests, bare `check`, `build`, `lint`, bare `test:e2e`, cache-disabling flags) are refused locally unless the maintainer issued a time-boxed grant. CI is unaffected.
- Agent hooks for Claude Code and Codex deny raw bypasses of those guards and name the scoped command to use.
- A machine-wide slot budget shared by every worktree bounds validation concurrency. A run takes the free slots or waits in order and reports which checkout it waits behind. Focused tests never wait.
- `pnpm validate` formats changed files before checking, converges after a concurrent source edit instead of failing, tolerates a slow Nx plugin worker, and identifies source through git instead of hashing every file twice.
- Root workspace tasks declare the inputs they read, so documentation and OpenSpec edits select no code task. A weekly uncached full run in CI is the backstop for an under-declared input.
- **BREAKING:** each linked worktree serves and tests the public site on its own stable port; the primary checkout keeps 4321. `pnpm test:e2e` no longer tests whatever serves 4321. The full Local stack is a machine singleton with a lease, and the shared Chrome profile has an idle-expiring lease enforced by a hook.
- **BREAKING:** a push to `main` builds, deploys UAT and verifies the hosted release identity. UAT static smoke, provider smoke, staff previews in Chromium and Firefox, and the whole local e2e suite move to PRD promotion, which runs them before any PRD mutation. Manual smoke workflows remain.
- CI restores publication media from a digest-verified cache.
- Agent instructions shrink to "focused test while editing, `pnpm validate` at completion"; a report command prints the task-time aggregate used as the baseline.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tooling-validation`: policy-driven command guards, machine-wide slots, converging validation, declared workspace inputs, per-worktree site port, stack and browser leases, e2e scope, and provider smoke timing.
- `software-release-promotion`: a push produces a deployed UAT candidate without browser acceptance; promotion runs hosted acceptance before PRD mutation; publication media restore may use a digest-verified cache; staff previews leave candidate preparation.

## Impact

`feedback-policy.json`, validation and test wrappers under `scripts/`, new guard, slot, local-resource and hook scripts, `package.json` scripts, `nx.json`, root `project.json`, `playwright.config.ts`, public-site dev launchers, `.claude/settings.json`, `.codex/hooks.json`, committed run configurations, `.github/workflows/pages.yml` and `uat-release-sequence.yml`, a new scheduled full-validation workflow, publication restore, workflow contract tests, environment verification, agent instructions and operational docs. No runtime application code, dependency, hosted configuration or credential changes. Hosted effects stay unobserved until an authorized push.
