## 1. Scope

- [x] 1.1 Choose one narrow script or Astro build-time env surface with duplicated parsing.
- [x] 1.2 Exclude Worker route/runtime binding reads from the first slice.

## 2. Implementation

- [x] 2.1 Add `@t3-oss/env-core` where the chosen helper is owned.
- [x] 2.2 Use Zod schemas for required, optional, and defaulted values.
- [x] 2.3 Preserve existing variable names, fallback semantics, and secret redaction.

## 3. Verification

- [x] 3.1 Add focused tests for valid, missing, malformed, and redacted-secret cases.
- [x] 3.2 Run relevant script dry-runs or preflights.
- [x] 3.3 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
