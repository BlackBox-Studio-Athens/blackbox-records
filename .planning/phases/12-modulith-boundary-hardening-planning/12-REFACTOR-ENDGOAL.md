---
phase: 12
status: active
created: 2026-05-16
---

# Phase 12 Refactor End Goal

## North Star

Phase 12 ends when the repo no longer relies on large mixed implementation files or informal folder ownership for its
main commerce and shell behavior. The target is a TypeScript-native modulith: each module owns a small, named behavior
area; callers use documented entrypoints or named interfaces; and boundary violations fail through the normal repo gates.

The refactor is complete only when the codebase is easier to change because important behavior is local, characterized,
and protected by the boundary stack. It is not complete merely because `AppShellRoot.tsx` is shorter or because the
manifest passes.

## End-State Shape

- `AppShellRoot.tsx` is a thin composition root:
  - React state, refs, and rendering stay there only when they are genuinely composition concerns.
  - Routing, overlay, history, scroll/focus, prefetch, player coordination, and StoreCart bridge behavior live in named
    app-shell helpers with direct tests.
  - Browser-visible shell behavior remains unchanged: same-document section navigation, overlay continuity, scroll/focus
    reset, player open/minimize/reopen/stop behavior, and StoreCart drawer behavior.
- `cms-admin` no longer has one mixed Decap configuration hotspot:
  - admin route surfaces, Decap YAML generation, content-schema field generation, hosted auth/base-path handling, and
    media routing have explicit helpers or entrypoints with tests.
  - shopper-facing catalog, checkout, stock, order, Stripe, D1, and BOX NOW behavior remain outside `cms-admin`.
- Closed commerce modules stay closed:
  - Worker-owned checkout, orders, stock, public commerce HTTP, and operator stock behavior keep their existing runtime
    contracts and source-of-truth boundaries.
  - Static frontend code does not gain backend secrets, D1 authority, Stripe server behavior, BOX NOW credentials, or
    generated API edits outside the normal generator flow.
- `platform-shared` shrinks toward bootstrap-only use:
  - it must not collect business policy, shell behavior, checkout rules, StoreCart authority, or admin-specific details.

## Boundary Enforcement Target

Phase 12 uses `eslint-plugin-boundaries` as the primary import/entrypoint gate, not as passive documentation:

- `eslint.config.mjs` loads `.planning/codebase/module-boundaries.manifest.json` through
  `scripts/module-boundaries-manifest.cjs`.
- `boundaries/no-unknown-files` and `boundaries/dependencies` are errors for covered module roots.
- `pnpm check` must continue to run lint, type checks, `pnpm audit:module-boundaries`, `pnpm depcruise:boundaries`, and
  `pnpm audit:commerce-boundaries`.
- `dependency-cruiser` remains the graph/cycle companion check.
- The manifest, `.planning/codebase/MODULES.md`, and module canvases move together when ownership, dependencies,
  entrypoints, statuses, or exception policy change.

## Done Means

- `app-shell` and `cms-admin` either satisfy their exit criteria and move out of `open-temporary`, or any remaining
  temporary-open status is backed by explicit, narrow, still-actionable closure criteria.
- No new `open-temporary` modules were introduced as a convenience escape hatch.
- No compatibility facades were added to keep old deep-import paths alive.
- New or moved behavior has local characterization tests before or with the extraction.
- Required gates pass on the final tree:
  - `pnpm audit:module-boundaries`
  - `pnpm depcruise:boundaries`
  - `pnpm test:unit`
  - `pnpm check`
  - `pnpm build`
- Browser Use acceptance is completed for shell/admin-visible behavior when Browser Use is available. If unavailable, the
  blocker is recorded with evidence and not replaced by an external browser.

## Stop Conditions

Stop extracting and reassess when the next move is only cosmetic, creates a shallow wrapper, changes public behavior,
requires a product decision, weakens module ownership, or cannot be verified with focused tests plus the normal repo
gates.
