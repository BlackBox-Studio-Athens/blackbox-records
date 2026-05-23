# Phase 19: Adopt Knip For Dependency And Export Audits - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning
**Source:** Automatic `gsd-discuss-phase 19 --auto` from dependency-adoption request

<domain>
## Phase Boundary

Phase 19 adopts `knip` for repo-owned dependency, export, and unused-file auditing. It should make stale code easier to find in the pnpm monorepo, but the first slice is report-first and triage-focused. It must not delete route files, content entries, generated OpenAPI/Prisma output, D1 migrations, archived planning records, or package exports without concrete ownership evidence.

</domain>

<decisions>
## Implementation Decisions

### Adoption Scope

- **D-01:** Treat Knip as a maintenance audit companion to the existing ESLint, dependency-cruiser, module-boundary, and commerce-boundary checks.
- **D-02:** Add a root audit command first; do not immediately make the normal `pnpm check` gate fail on all Knip findings.
- **D-03:** Configure the audit for the current workspace packages: root scripts, `@blackbox/web`, `@blackbox/backend`, and `@blackbox/api-client`.
- **D-04:** Use Knip to surface unused dependencies, exports, and files, but require human review before deleting anything that may be route-visible, generated, configured, or externally consumed.

### Ignore Policy

- **D-05:** Generated Prisma files, generated OpenAPI client/schema files, archived planning output, and historical evidence directories should not create noisy audit findings.
- **D-06:** Astro route files, content collection entries, public assets, D1 migrations, GitHub workflow references, package exports, and WebStorm launcher contracts are not dead merely because imports do not reference them.
- **D-07:** Every committed ignore should include a nearby reason or config naming that makes the boundary legible.

### Integration Boundary

- **D-08:** Knip may add a dedicated command such as `pnpm audit:unused` or `pnpm knip`; wiring into `pnpm check` is allowed only after the first triage baseline is stable.
- **D-09:** Knip must complement, not replace, `dependency-cruiser`, `eslint-plugin-boundaries`, `scripts/audit-module-boundaries.ts`, or `scripts/audit-commerce-boundaries.ts`.
- **D-10:** Full implementation validation still requires the repo's standard gates if behavior or scripts change.

### the agent's Discretion

The agent may choose the exact Knip config filename, command name, and initial fail/pass behavior, provided the first implementation is reversible, does not delete files, and documents any intentional ignores.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Repo Policy

- `.planning/ROADMAP.md` - Phase 19 scope and success criteria.
- `AGENTS.md` - required command policy, generated-file policy, and verification gates.
- `.planning/codebase/MODULES.md` - module ownership and boundary intent.
- `.planning/codebase/module-boundaries.manifest.json` - machine-readable module ownership.

### Audit Surfaces

- `package.json`, `apps/web/package.json`, `apps/backend/package.json`, `packages/api-client/package.json` - workspace scripts and dependencies.
- `eslint.config.mjs`, `.dependency-cruiser.cjs`, `scripts/module-boundaries-manifest.cjs` - existing boundary tooling.
- `apps/backend/src/generated/**`, `packages/api-client/src/generated/**`, `apps/backend/openapi/*.json` - generated surfaces that need explicit treatment.
- `apps/web/src/pages/**`, `apps/web/src/content/**`, `apps/web/public/**`, `.github/workflows/**` - configured or route-visible surfaces that import graphs may not fully explain.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- The root already has `audit:module-boundaries`, `depcruise:boundaries`, and `audit:commerce-boundaries` scripts.
- The repo already excludes generated files from ESLint and treats module ownership as a documented source of truth.

### Established Patterns

- Dependency/tooling adoption phases stay one package per phase unless implementation risks are identical.
- Audit commands should be deterministic, Windows-compatible, and runnable without a dev server.
- Planning/history artifacts are frequently useful evidence; audit tooling should not normalize them away.

### Integration Points

- Add `knip` as a root dev dependency.
- Add a root command and config.
- Add documentation or validation notes explaining the first-pass baseline and any deferred findings.

</code_context>

<specifics>
## Specific Ideas

Start with `pnpm audit:unused` as a report-first command. Configure entrypoints for package exports, scripts, Astro routes, Wrangler config, GitHub workflows, and generated clients before treating findings as deletion candidates.

</specifics>

<deferred>
## Deferred Ideas

- Making Knip mandatory inside `pnpm check`.
- Automatic deletion of reported files.
- Replacing dependency-cruiser or existing module-boundary audits.
- Broad package export redesign.

</deferred>

---

_Phase: 19-Adopt Knip For Dependency And Export Audits_
_Context gathered: 2026-05-23_
