## Why

Several local scripts manage child processes, ports, readiness, stdio, and Windows behavior manually. Execa can reduce process orchestration complexity when applied narrowly.

The preferred direction is to remove the most local orchestration complexity immediately, not just prove Execa with a low-risk wrapper. The first implementation slice should introduce a shared local process helper and move the local stack launcher onto it, because that script currently owns the heaviest combination of finite commands, long-running child processes, port readiness, signal handling, and unexpected-exit cleanup.

## What Changes

Adopt Execa for selected repo-owned scripts where it improves command execution, exit handling, signal forwarding, Windows behavior, and testability without changing documented commands.

The first slice will:

- Add Execa as a direct root development dependency.
- Introduce a repo-local process orchestration helper for scripts that need consistent finite-command and long-running-process behavior.
- Refactor `scripts/start-local-stack.ts` first, preserving the `dev:stack:stripe-test`, `dev:stack:stripe-mock`, and `dev:stack:stripe-mock-api` package scripts and their WebStorm launcher behavior.
- Use the helper from additional local orchestration scripts only when doing so removes duplicated process lifecycle code without changing user-visible commands.
- Make manual launcher validation mandatory for any refactor that touches a long-running local script, even when package script names and run configuration files stay unchanged.

The change does not introduce a new runtime capability, checkout flow, deployment target, or production process supervisor.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tooling-validation`: Adds process orchestration refactor rules.

## Impact

- Future code changes may touch `scripts/start-local-stack.ts`, `scripts/start-stripe-mock.ts`, `apps/web/scripts/start-static-site-dev.mjs`, related tests, and root dependencies.
- The first slice should also add a shared helper under `scripts/` for local process orchestration and targeted tests for that helper.
- WebStorm launcher targets and package script names must remain stable.
- Long-running script refactors require manual launcher validation through the native Codex Browser Use path after automated checks pass.
