## Why

Current backend tests are fast Node Vitest tests. Some HTTP route, binding, and D1 seams need real Cloudflare Worker runtime semantics without replacing the existing fast test loop.

## What Changes

Add a focused Worker-runtime Vitest test path for backend runtime seams, using local-only bindings and no remote D1 or real secrets.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tooling-validation`: Adds focused Workers-pool testing rules.

## Impact

- Future code changes may touch `apps/backend/package.json`, a Worker Vitest config, and representative backend tests.
- Existing `pnpm test:unit` behavior should stay stable unless explicitly approved.
