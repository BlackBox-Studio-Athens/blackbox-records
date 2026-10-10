## Why

Each module's public API and allowed dependencies live in one central manifest, away from the code they describe. In the Nx and package ecosystem, a module owns its contract beside its code (like a package `exports` map), so editors of a module see and change its API together with it.

## What Changes

- Move each module's status, exports, named interfaces, allowed dependencies and workspace interfaces from the central manifest into its `project.json` under `metadata.boundaries`, with paths relative to the project root.
- Derive the module map in `loadModuleBoundariesManifest()` from the Nx projects that carry `metadata.boundaries`. The loaded manifest is unchanged, so ESLint, dependency-cruiser and the audit consume the same shape.
- Keep workspace-package policy and entrypoint policy in the central manifest.

## Capabilities

### Modified Capabilities

- `module-boundaries`: Module contracts are owned by each module's `project.json`; the central manifest keeps workspace-package policy.

## Impact

35 `project.json` files, the central manifest, and `scripts/module-boundaries-manifest.cjs`. No enforcement change: the loaded manifest is deep-equal to the previous one. No dependency, runtime or deployment change.
