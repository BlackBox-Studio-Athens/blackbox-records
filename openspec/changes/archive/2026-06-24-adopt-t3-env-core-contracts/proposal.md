## Why

Some script and build-time env reads duplicate parsing and defaults. A scoped `@t3-oss/env-core` adoption can make selected contracts explicit while preserving Worker secret boundaries.

## What Changes

Introduce Zod-backed env helpers for selected script or Astro build-time surfaces. Worker runtime bindings continue to come from Cloudflare/Hono `context.env`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `tooling-validation`: Adds scoped env contract helper rules.
- `static-site-and-deployment`: Clarifies public build-time env ownership.
- `commerce-checkout`: Preserves Worker-only secret and checkout configuration boundaries.

## Impact

- Future code changes may touch package dependencies, script helpers, selected env call sites, and tests.
- No env variable names should change without explicit approval.
