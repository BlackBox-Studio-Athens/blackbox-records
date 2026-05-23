## 1. Baseline

- [x] 1.1 Confirm the change is current with `openspec show adopt-execa-process-orchestration --json`.
- [x] 1.2 Confirm the change validates before code edits with `openspec validate adopt-execa-process-orchestration --strict`.
- [x] 1.3 Inspect the current launcher contracts in `package.json`, `apps/web/package.json`, `.run/BlackBox Local Stack.run.xml`, and `.run/Stripe Sandbox Smoke.run.xml`.
- [x] 1.4 Inspect current process orchestration in `scripts/start-local-stack.ts`, `scripts/start-stripe-mock.ts`, and `apps/web/scripts/start-static-site-dev.mjs`.
- [x] 1.5 Record the current local-stack behavior that must not drift: command names, args, cwd, env overlays, ports, stdio, signal handling, unexpected-exit handling, and port failure messages.

## 2. Dependency and Helper Shape

- [x] 2.1 Add `execa` as a direct root `devDependency`.
- [x] 2.2 Introduce a shared local process helper under `scripts/` for repo-owned development scripts.
- [x] 2.3 Keep the helper independent from Stripe, D1, Wrangler, Astro, WebStorm, checkout, and deployment concepts.
- [x] 2.4 Model finite commands separately from long-running service commands.
- [x] 2.5 Preserve inherited stdio by default so local developer output remains familiar.
- [x] 2.6 Preserve command label logging while ensuring environment values and secrets are not printed.
- [x] 2.7 Preserve Windows command execution without keeping the current hand-written `cmd.exe /d /s /c` adapter unless tests prove it is still required.
- [x] 2.8 Keep port checks explicit and deterministic rather than hiding them inside the process helper.

## 3. Characterization Tests

- [x] 3.1 Keep or extend current local-stack plan tests for all three modes: `stripe-test`, `stripe-mock`, and `stripe-mock-api`.
- [x] 3.2 Add helper tests for finite command success and non-zero failure.
- [x] 3.3 Add helper tests for failed process start with a service label in the error path.
- [x] 3.4 Add helper tests for unexpected long-running process exit triggering sibling shutdown.
- [x] 3.5 Add helper tests for parent shutdown terminating long-running children in reverse launch order where practical.
- [x] 3.6 Add helper tests proving env overlays are applied without printing env values.
- [x] 3.7 Use lightweight fixture child processes or Node one-liners; do not start Wrangler, Astro, Go, or stripe-mock in unit tests.

## 4. First Refactor: Local Stack

- [x] 4.1 Move `scripts/start-local-stack.ts` execution mechanics onto the shared helper.
- [x] 4.2 Preserve `buildStackPlan` behavior and existing exported test seams unless a clearer test seam is introduced.
- [x] 4.3 Preserve preparation command order: local D1 prepare before mode-specific seed.
- [x] 4.4 Preserve long-running service order for each mode.
- [x] 4.5 Preserve fixed port checks for `12110`, `12111`, `12112`, `8787`, and `4321`.
- [x] 4.6 Preserve fail-closed occupied-port behavior before any preparation or long-running command starts.
- [x] 4.7 Preserve frontend env overlays for `PUBLIC_BACKEND_BASE_URL` and `PUBLIC_CHECKOUT_CLIENT_MODE`.
- [x] 4.8 Preserve inherited stdio for preparation and long-running commands.
- [x] 4.9 Preserve unexpected child exit behavior: log the labeled service, terminate remaining services, and exit non-zero.
- [x] 4.10 Preserve parent `SIGINT` and `SIGTERM` behavior: terminate children and avoid leaving the local stack running.
- [x] 4.11 Preserve `pnpm dev:stack:stripe-test`, `pnpm dev:stack:stripe-mock`, and `pnpm dev:stack:stripe-mock-api` package scripts.
- [x] 4.12 Preserve `.run/BlackBox Local Stack.run.xml` as the committed WebStorm default stack launcher.

## 5. Optional Follow-On Refactors

- [x] 5.1 Evaluate `scripts/start-stripe-mock.ts` after the local-stack refactor is stable.
- [x] 5.2 Refactor `scripts/start-stripe-mock.ts` only if the helper clearly reduces long-running `go run` and shutdown code without changing proxy behavior.
- [x] 5.3 Preserve existing stripe-mock proxy patch tests if `scripts/start-stripe-mock.ts` changes.
- [x] 5.4 Evaluate `apps/web/scripts/start-static-site-dev.mjs` after the helper exists.
- [x] 5.5 Refactor `apps/web/scripts/start-static-site-dev.mjs` only if the helper can be consumed without adding fragile TypeScript loader behavior to the web package script.
- [x] 5.6 Defer smaller Wrangler `spawnSync` scripts unless they can share the helper without hiding diagnostic command details.

## 6. Automated Verification

- [x] 6.1 Run targeted backend script tests covering local-stack planning and process-helper behavior.
- [x] 6.2 Run targeted stripe-mock launcher tests if `scripts/start-stripe-mock.ts` changes.
- [x] 6.3 Run targeted static-site launcher tests if `apps/web/scripts/start-static-site-dev.mjs` changes or tests are added for it.
- [x] 6.4 Run `pnpm test:unit`.
- [x] 6.5 Run `pnpm check`.
- [x] 6.6 Run `pnpm build`.
- [x] 6.7 Re-run `openspec validate adopt-execa-process-orchestration --strict`.

## 7. Mandatory Manual Validation for Long-Running Refactors

- [x] 7.1 If `scripts/start-local-stack.ts` changes, launch the `BlackBox Local Stack` path or its exact `pnpm dev:stack:stripe-mock` equivalent and confirm it starts stripe-mock, Worker, and the static site.
- [x] 7.2 If `scripts/start-local-stack.ts` changes, validate occupied-port failure remains clear before child processes are launched.
- [x] 7.3 If `scripts/start-local-stack.ts` changes, stop the launcher and confirm long-running child processes are terminated.
- [x] 7.4 If any local static site path changes, validate the local rendered site with the native Codex Browser Use plugin.
- [x] 7.5 If the mock checkout stack changes, validate the deterministic local mock checkout path still loads: `http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/`.
- [x] 7.6 If `scripts/start-stripe-mock.ts` changes, validate the proxy listens on `http://127.0.0.1:12110` and shuts down with the launcher.
- [x] 7.7 Record manual validation evidence and any cleanup needed for occupied ports or child processes.

## Validation Notes

- `pnpm dev:stack:stripe-mock` failed closed with `Port(s) already in use: 4321. Stop the existing local stack and retry.` before preparation commands when a local dummy listener occupied port `4321`.
- `pnpm dev:stack:stripe-mock` started preparation commands, `stripe-mock` via `pnpm stripe-mock:local`, the Worker via `pnpm dev:backend:mock`, and the static site via `pnpm site:dev`.
- Native Codex Browser validation loaded `http://127.0.0.1:4321/blackbox-records/store/disintegration-black-vinyl-lp/checkout/` with title `Disintegration Checkout | Store | Blackbox Records`, heading `Checkout`, Stripe checkout text present, document ready state `complete`, and no browser warning/error logs.
- Native Browser screenshot evidence was saved to ignored local evidence path `.codex-artifacts/checkout-browser-validation.png`.
- The Codex PTY did not deliver an interrupt to the launcher during shutdown validation, so that PTY behavior is not treated as launcher evidence. Known long-running child PIDs on ports `12110`, `12111`, `12112`, `8787`, and `4321` were explicitly stopped, and a follow-up port check found no listeners on those ports.
