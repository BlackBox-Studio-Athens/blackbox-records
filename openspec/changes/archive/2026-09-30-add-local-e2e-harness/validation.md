# Validation and handoff

## Scope and decisions

- Product Environment: Local; repository tooling and documentation only. No application source changed.
- Acceptance row: boundaries/tooling/instructions. The new harness itself was exercised against the shell/player/routing behaviors it covers; hosted, provider and release acceptance do not apply.
- The harness stubs Worker reads, provider embeds, Google Fonts and the production analytics script, so results do not depend on the stack or external network.

## Checks

- `pnpm exec playwright test --list`: 34 tests in 4 files (13 routes on two projects, 3 shell tests on two projects, player and cart on desktop). Two tests are skipped by design in each run: the desktop-only header test on mobile and the mobile-navigation test on desktop.
- Port 4321 free: `pnpm test:e2e` started `pnpm site:dev`, 32 passed, 2 skipped, in about 3.1 minutes from a cold Astro server. Port 4321 was free afterwards.
- Background Astro (`pnpm site:dev:bg`): the runner reused it with no server start; 32 passed. The server was still running afterwards and was stopped with `pnpm site:dev:stop`.
- Full Local stack (`pnpm dev`, stripe-mock): the runner reused the built public snapshot on 4321; 32 passed in about 1.3 minutes.
- Targeted runs: `pnpm test:e2e e2e/store-cart.spec.ts` and `pnpm test:e2e -g player` each ran one test in about 12 seconds against a warm server.
- Failure artifacts were observed during development: each failed test wrote `trace.zip`, `test-failed-1.png` and `error-context.md` under `.codex-artifacts/e2e/test-results/`, and `.codex-artifacts/e2e/summary.json` was written for every run.
- ESLint and Prettier pass for the new files; Knip reports nothing for `e2e/` or the config; `pnpm agent:check` passes; `pnpm openspec -- validate add-local-e2e-harness --type change --strict` passes.

## Findings from the first runs

- Under astro dev the Store route re-renders all cards on every request (about 7 seconds per shell navigation on this machine). Assertions therefore wait up to 30 seconds.
- Built pages server-render the add-to-cart button under `client:load`; a click before hydration is ignored. The cart spec waits for that island to hydrate.
- The production analytics script at glancelytics.com currently answers HTTP 402, which surfaces as a console error on production builds. The harness stubs it; the live behavior is outside this change.

## Review

A simplicity review moved the canonical route table and slugs into `scripts/smoke-core.ts` (shared with the hosted UAT smoke, whose unit test still passes), removed Playwright settings that restated defaults, simplified the Store status assertions and kept the tooling-validation delta's Browser Use requirement unchanged apart from its continuity scenario. After those changes `pnpm test:e2e` passed again from a cold autostart: 32 passed, 2 skipped, port 4321 free afterwards.

## Final validation

- Before the review, `pnpm validate` failed twice in `workspace:architecture`: a nested Nx plugin worker missed its 10-second startup window while the tooling tests ran in parallel. The task passed when run alone, Nx reports it as flaky, and the third run passed. It is unrelated to this change.
- The final `pnpm validate` summary for the reviewed tree is retained under `.codex-artifacts/validation/`.

## Follow-ups

Worker-dependent checkout spec, CI job, Firefox project, Playwright agent scaffolding.
