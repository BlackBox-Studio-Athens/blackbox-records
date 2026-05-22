# Phase 17: Adopt Slugify For Slug Tooling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `17-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 17-adopt-slugify-for-slug-tooling
**Mode:** automatic `gsd-discuss-phase --auto`
**Areas discussed:** canonical URL safety, tooling scope, collision policy

---

## Canonical URL Safety

| Option                  | Description                                   | Selected |
| ----------------------- | --------------------------------------------- | -------- |
| Preserve existing slugs | Treat current public slugs as canonical data. | yes      |
| Regenerate all slugs    | Rewrite existing slugs from titles/names.     | no       |
| Runtime normalization   | Normalize route params on every request.      | no       |

**Auto choice:** Preserve existing slugs.

---

## Tooling Scope

| Option                    | Description                          | Selected |
| ------------------------- | ------------------------------------ | -------- |
| Central wrapper           | Wrap slugify in one repo-owned API.  | yes      |
| Direct imports everywhere | Let call sites use slugify directly. | no       |
| No dependency             | Keep ad hoc slug behavior.           | no       |

**Auto choice:** Central wrapper.

---

## Collision Policy

| Option             | Description                                   | Selected |
| ------------------ | --------------------------------------------- | -------- |
| Detect first       | Report collisions for committed/public slugs. | yes      |
| Auto suffix always | Append counters silently.                     | no       |
| Ignore collisions  | Trust content authors.                        | no       |

**Auto choice:** Detect first.

## the agent's Discretion

Wrapper location, exact function names, and whether draft-only unique slug suggestions ship in the first slice.

## Deferred Ideas

Existing slug migrations and public URL renames.
