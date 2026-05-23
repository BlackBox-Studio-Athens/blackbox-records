# Phase 19: Adopt Knip For Dependency And Export Audits - Discussion Log

**Date:** 2026-05-23
**Mode:** Automatic `gsd-discuss-phase 19 --auto`

## Gray Areas Resolved

| Area            | Decision                                                | Why                                                                                                                          |
| --------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Gate posture    | Report-first, not immediately mandatory in `pnpm check` | The repo has many configured, generated, route-visible, and planning surfaces that need triage before a hard gate is useful. |
| Deletion policy | No automatic deletion                                   | Knip output can point at public routes, package exports, content, or generated files that are intentionally unimported.      |
| Ownership       | Root maintenance tooling                                | The audit spans the full pnpm workspace and existing root boundary commands.                                                 |
| Existing gates  | Complement existing boundary audits                     | Knip finds unused code; dependency-cruiser and module-boundary scripts still own graph and ownership rules.                  |

## Deferred Ideas

- Hard-failing `pnpm check` on all Knip findings.
- Automated cleanup commits.
- Package export redesign driven only by audit output.
