# Tasks

## 1. Implementation

- [x] 1.1 In `shell-page-snapshot.ts`, remember each `astro-island`'s markup when the shell first reads or applies it, and restore that markup and `ssr` in the cached clone.

## 2. Verification

- [x] 2.1 Add `e2e/shell-islands.spec.ts`; it fails before the fix (stale typed email, then no submission) and passes after.
- [x] 2.2 Add the unit test; `pnpm test:app-shell` passes.
- [x] 2.3 Run `pnpm test:e2e`, `pnpm validate` and strict OpenSpec validation on the final tree. See `validation.md`.
