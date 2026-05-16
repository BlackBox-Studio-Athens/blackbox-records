---
phase: 12
phase_name: modulith-boundary-hardening-planning
created: 2026-05-14
source: 12-RESEARCH.md
---

# Phase 12 - Validation Strategy

## Test Infrastructure

This phase started as planning-only and then expanded into approved boundary-hardening execution slices. The final
execution package uses the existing repo gates:

- `pnpm check`
- `pnpm test:unit`
- `pnpm build`
- `pnpm audit:module-boundaries`
- `pnpm depcruise:boundaries`

Browser Use is required for shell/admin-visible behavior when rendered shell surfaces are moved.

## Artifact Checklist

Phase 12 is valid only when:

- the backlog item exists
- the planned milestone exists
- all required phase docs exist
- the ADR exists
- `MODULES.md` exists
- the machine-readable manifest exists
- each approved module has a canvas
- temporary-open modules have explicit exit criteria
- future execution slices are branch-sized and review-sized

## Per-Artifact Review Map

- `12-SPEC.md`: requirement and boundary lock
- `12-CONTEXT.md`: planning defaults, statuses, and canonical refs
- `12-RESEARCH.md`: Spring Modulith translation and current repo evidence
- `12-01-PLAN.md`: module model and verifier design
- `12-02-PLAN.md`: app-shell, player, and StoreCart planning
- `12-03-PLAN.md`: backend commerce boundary planning
- `12-04-PLAN.md`: cms-admin, AGENTS, and branch workflow planning
- `ADR-004`: durable module-boundary policy
- `MODULES.md` and module canvases: explicit module ownership and allowed dependency source of truth
- `module-boundaries.manifest.json`: tooling-oriented ownership, dependency, and entrypoint source of truth

## Final Validation Run - 2026-05-14

### Deterministic Commands

- `pnpm check` - passed on 2026-05-14 after formatting the new planning docs; repo gates passed with existing Astro schema deprecation hints only
- `pnpm test:unit` - passed on 2026-05-14 (`apps/web`: 29 files / 166 tests, `apps/backend`: 28 files / 146 tests, `packages/api-client`: 1 file / 2 tests)

### Planning Review Notes

- Current milestone should remain `v1.1`.
- No runtime code, public contracts, or generated API files should change in this phase.
- The new milestone should be planned only, not active.
- The final Phase 12 package now locks a TypeScript-native boundary stack centered on `eslint-plugin-boundaries`,
  `dependency-cruiser`, explicit root entrypoints, and one repo machine-readable manifest.

## Execution Closure Run - 2026-05-16

### Deterministic Commands

- `pnpm audit:module-boundaries`
- `pnpm depcruise:boundaries`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`

### Closure Notes

- Every module in `.planning/codebase/module-boundaries.manifest.json` is `closed`.
- `APPROVED_OPEN_TEMPORARY_MODULES` is empty in `scripts/module-boundaries-manifest.cjs`.
- `eslint-plugin-boundaries` remains wired through `eslint.config.mjs` with `boundaries/no-unknown-files` and
  `boundaries/dependencies` as errors.
- `AppShellRoot.tsx` is 591 lines and now acts as a thin shell composition root.
- Browser Use acceptance for `12-62` covered header, footer, and mobile shell navigation, overlay open/close,
  player open/minimize/reopen/stop, StoreCart drawer open/close, and checkout CTA routing.
