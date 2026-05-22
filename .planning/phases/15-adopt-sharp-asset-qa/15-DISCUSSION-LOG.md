# Phase 15: Adopt Sharp Asset QA - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `15-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 15-adopt-sharp-asset-qa
**Mode:** automatic `gsd-discuss-phase --auto`
**Areas discussed:** adoption scope, asset rules, integration boundary

---

## Adoption Scope

| Option                 | Description                                                                 | Selected |
| ---------------------- | --------------------------------------------------------------------------- | -------- |
| Read-only QA tool      | Use Sharp to inspect committed assets and fail with actionable diagnostics. | yes      |
| Runtime image pipeline | Replace Astro image handling or add dynamic resizing.                       | no       |
| Bulk optimizer         | Generate resized/converted outputs now.                                     | no       |

**Auto choice:** Read-only QA tool.
**Notes:** This matches current repo architecture and avoids changing hosting/runtime behavior.

---

## Asset Rules

| Option                    | Description                                                             | Selected |
| ------------------------- | ----------------------------------------------------------------------- | -------- |
| Focused standards         | Validate favicon metadata and documented content-image standards first. | yes      |
| Exhaustive media pipeline | Try to classify and transform every asset in one pass.                  | no       |
| Manual checklist only     | Document rules without adding a command.                                | no       |

**Auto choice:** Focused standards.
**Notes:** The plan should prefer deterministic checks with clear skipped-file reporting.

---

## Integration Boundary

| Option                    | Description                                           | Selected |
| ------------------------- | ----------------------------------------------------- | -------- |
| Package-local command     | Add a web package script and tests.                   | yes      |
| Global runtime dependency | Add Sharp to backend/Worker paths.                    | no       |
| External service          | Introduce Cloudflare Images or another image service. | no       |

**Auto choice:** Package-local command.

## the agent's Discretion

Exact command names, helper file names, and whether root wrappers are added.

## Deferred Ideas

Image rewriting, generated optimized variants, and CMS upload transforms.
