## Why

Frontend and generated-client tests currently use scattered HTTP fakes. MSW can centralize request/response fixtures for browser-facing checkout and stock API tests without replacing backend route tests.

## What Changes

Add MSW as a test-only HTTP mocking layer for representative frontend/API-client tests, with handlers aligned to generated public/internal API shapes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tooling-validation`: Adds MSW HTTP mocking boundaries.

## Impact

- Future code changes may touch web test setup, package dependencies, shared handlers, and representative checkout/stock tests.
- Browser Use remains required for rendered UI behavior changes.
