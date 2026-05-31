## Context

Current local script orchestration is spread across multiple files:

- `scripts/start-local-stack.ts` coordinates D1 preparation, optional Stripe seed data, long-running stripe-mock, Worker, and static-site processes.
- `scripts/start-stripe-mock.ts` starts `go run github.com/stripe/stripe-mock@latest`, waits for the upstream mock API, and serves a compatibility proxy.
- `apps/web/scripts/start-static-site-dev.mjs` starts Astro on a fixed host and port and manually handles Windows command launching and signals.
- Smaller backend seed/readiness scripts use `spawnSync` for Wrangler calls.

The highest-value complexity is in `scripts/start-local-stack.ts`, because it mixes command planning with process execution, Windows command adaptation, inherited stdio, fixed-port readiness, signal forwarding, and cascading shutdown.

## Direction

Optimize for removing the most orchestration complexity immediately.

The first implementation slice should introduce a shared local process helper and refactor `scripts/start-local-stack.ts` onto it. This is intentionally more ambitious than a tiny proof-of-concept, because the local stack launcher is the canonical WebStorm entrypoint and currently duplicates the exact concerns Execa is meant to simplify.

The shared helper should be narrow and script-owned, not a general framework. It should express the local script contracts already present in the repo:

```text
Script plan
  |
  +-- finite preparation command
  |     - command + args
  |     - cwd
  |     - env overlay
  |     - inherited stdio
  |     - non-zero exit stops launcher
  |
  +-- long-running service command
        - command + args
        - cwd
        - env overlay
        - inherited stdio
        - optional readiness port
        - unexpected exit stops siblings
        - parent SIGINT/SIGTERM terminates children
```

## Proposed Helper Responsibilities

The helper should own process mechanics, while each launcher keeps its domain plan.

Candidate responsibilities:

- Run a finite command with inherited stdio and return/throw a normalized result.
- Start a long-running command with inherited stdio and a descriptive label.
- Merge `process.env` with command-specific environment overrides.
- Prefer Execa's programmatic command execution and Windows binary resolution instead of repo-local `cmd.exe /d /s /c` adaptation.
- Preserve explicit command logging before launch.
- Preserve redaction boundaries by never printing full environment values.
- Track long-running child processes in launch order and terminate them in reverse order.
- Surface failed start and unexpected exit with the existing user-facing service label.
- Keep port readiness checks explicit and deterministic.

Candidate non-responsibilities:

- It should not know Stripe, D1, Wrangler, Astro, or WebStorm concepts.
- It should not add retries beyond existing readiness polling semantics.
- It should not introduce a daemon, process supervisor, or persistent state.
- It should not broaden command output capture unless a specific script needs redaction or assertions.

## First Slice

Refactor `scripts/start-local-stack.ts` first.

Preserve:

- `pnpm dev:stack:stripe-test`
- `pnpm dev:stack:stripe-mock`
- `pnpm dev:stack:stripe-mock-api`
- preparation command order
- service start order
- fixed ports `12110`, `12111`, `12112`, `8787`, and `4321`
- fail-closed behavior when ports are occupied
- inherited stdio
- split-port frontend env overlays
- `PUBLIC_CHECKOUT_CLIENT_MODE` values
- WebStorm `BlackBox Local Stack` launcher behavior
- unexpected child exit behavior: stop remaining services and exit non-zero
- parent signal behavior: stop children without leaving the stack running

The implementation should keep command planning tests close to the current local-stack tests, then add helper-level tests for lifecycle behavior that cannot be covered by pure plan assertions.

## Follow-On Candidates

After the local stack is stable, consider moving these scripts onto the helper only if the diff removes duplication:

1. `scripts/start-stripe-mock.ts`
   - Good candidate for long-running child handling and signal cleanup.
   - Higher manual validation cost because it starts `go run` and a local HTTP proxy.
   - Should preserve the proxy patching tests and add lifecycle coverage before changing process handling.

2. `apps/web/scripts/start-static-site-dev.mjs`
   - Good candidate for fixed-port behavior and Windows command simplification.
   - Requires care because it is currently ESM JavaScript under the web package, while the likely helper will be TypeScript under root scripts.
   - If importing a TypeScript helper from this Node script adds loader complexity, defer this file or keep a tiny JavaScript-compatible adapter.

3. Backend seed/readiness scripts using `spawnSync`
   - Lower priority unless repeated Wrangler command execution remains noisy after the first slice.
   - Refactor only when the shared helper can be used without hiding command details needed for local diagnostics.

## Testing Strategy

Add characterization coverage before replacing process mechanics where practical.

Minimum targeted coverage:

- Local stack command plan remains unchanged for all three modes.
- Finite command failure exits with the same status behavior.
- Failed process start reports the service label.
- Unexpected long-running child exit terminates siblings and exits non-zero.
- Parent shutdown terminates children in reverse launch order.
- Command env overlays preserve existing values and add script-specific public env values.
- Command logging prints command names and args but not secrets.

Use lightweight fixture child scripts or Node one-liners for lifecycle tests. Avoid starting Wrangler, Astro, Go, or real stripe-mock inside unit tests.

## Manual Validation Policy

Manual launcher validation is mandatory for any refactor that touches a long-running script. This includes `start-local-stack`, `start-stripe-mock`, `start-static-site-dev`, `start-cms-dev`, and `start-decap-proxy` if they are changed in this OpenSpec change.

For the first slice, manual validation should prove:

- `BlackBox Local Stack` still invokes `pnpm dev:stack:stripe-mock`.
- The stack fails clearly when a required fixed port is already occupied.
- The stack starts the mock Stripe API, Worker, and static site in order.
- The deterministic mock checkout URL still loads through the static site.
- Stopping the launcher stops long-running child processes.
- Browser validation uses the native Codex Browser Use plugin for the local static site, following repo policy.

## Risks

- Execa's nicer Windows resolution can still differ from the current explicit `cmd.exe` wrapping. This must be tested on this Windows setup.
- Converting one script to a shared helper can overfit the helper to the first caller. Keep the helper small and name it around process orchestration, not local stack business concepts.
- Long-running process promises can create double-handling if both process events and promise rejection paths trigger shutdown. The implementation should centralize unexpected-exit handling.
- Manual validation can leave ports occupied after a failed attempt. The validation notes should record cleanup steps if that happens.

## Decision Log

- First target: `scripts/start-local-stack.ts`.
- First slice includes a shared local process helper.
- Manual launcher validation is mandatory for every long-running script refactor in this change.
- Follow-on scripts are allowed only when they reduce duplicated lifecycle code without changing documented commands.
