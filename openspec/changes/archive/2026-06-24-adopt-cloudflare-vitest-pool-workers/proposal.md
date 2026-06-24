## Why

Current backend tests run through Node Vitest, which can miss Cloudflare Worker runtime differences around request handling, bindings, D1, and platform APIs. Runtime confidence is more important than preserving backend test speed, so the backend test plan should prefer Workers-pool coverage by default.

## What Changes

Adopt Cloudflare Workers-pool Vitest as the default backend test path, using local-only bindings and no remote D1 or real secrets. Keep a separate Node Vitest fallback only for backend tests that cannot execute in the Workers runtime, such as local scripts, generators, or process-orchestration utilities.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tooling-validation`: Makes Workers-pool the default backend runtime-confidence test rule.

## Impact

- Future code changes may touch `apps/backend/package.json`, a Worker Vitest config, backend test placement, D1 migration setup for tests, and representative backend tests.
- Existing root `pnpm test:unit` structure should stay stable, but the backend package test script may move from Node Vitest to Workers-pool Vitest.
- Backend test execution may become slower; this is an accepted tradeoff for higher Worker-runtime confidence.
