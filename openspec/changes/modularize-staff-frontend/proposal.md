## Why

Staff is one Nx module, `staff-frontend`. Any staff edit reruns the whole staff suite (19 files, 88 tests, 15.0s of which 10.1s is import time and 0.7s is the tests) and invalidates its cache. Split staff into acyclic closed modules so `pnpm test <module>`, `pnpm test:watch <module>` and Nx affected detection rerun only what an edit reaches.

## What Changes

- Carve `staff-ui`, `staff-platform`, `staff-orders`, `staff-publication`, `staff-shell`, `staff-stock` and `staff-content` out of `apps/staff/src` as closed Nx modules with their own tests; `staff-frontend` stays as the application composition root.
- Move a small set of files so the module graph is acyclic (`utils`, `StaffBack`, autosave hook, order API, publication components, `youtubeVideoId`, module-owned styles).
- Rewrite the manifest architecture test to assert the staff invariants per staff module instead of for one module.
- Trial two adoption-gated experiments after the split: `isolate: false` for staff Vitest and a `tsc`-only `check:fast` script. Each is kept only if its measurement gate passes.
- Package-level `astro check`, eslint and the build stay unchanged.

## Capabilities

### Modified Capabilities

- `module-boundaries`: staff ownership is split between the composition root and nested closed feature modules with a fixed layering.

## Impact

`apps/staff/src/**` (file moves and import paths only, no behavior change), new `project.json` files, the boundary manifest, one architecture test, `apps/staff/components.json`, `docs/agent-reference.md`, `docs/content-workspace.md`. Public web, backend, hosted environments and release flow are unaffected.
