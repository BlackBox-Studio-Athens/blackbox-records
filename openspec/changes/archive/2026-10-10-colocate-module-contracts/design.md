## Context

`loadModuleBoundariesManifest()` already reads each module's `project.json` to derive roots. Module contracts were the only per-module data left in the central manifest.

## Decisions

- Shape: `metadata.boundaries = { status, exports, namedInterfaces, dependsOn, workspaceInterfaces }`, paths relative to the project root. Nx allows arbitrary `metadata`.
- The loader globs `apps/**/project.json` and `packages/**/project.json` (excluding `node_modules`, `dist`, `.nx`), maps the keys back to the in-memory names (`providedEntrypoints`, `allowedDependencies`, ...) and keeps the derived `roots` and `ownershipExceptions`. Downstream consumers are unchanged.
- The module name is the Nx project name, so the name-matching check is implicit.
- Module order follows sorted project paths, and `ownershipExceptions` follow that order. Both only feed regex unions and rule lists, so semantics are unchanged.

## Risks / Trade-offs

A project without `metadata.boundaries` is silently not a module. `workspace:architecture` and the ownership audit still fail when files are unclaimed.
