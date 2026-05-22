# Phase 18: Remove Valibot And Standardize On Zod - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `18-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 18-remove-valibot-and-standardize-on-zod
**Mode:** automatic `gsd-discuss-phase --auto`
**Areas discussed:** validator standard, Valibot boundary, warning cleanup

---

## Validator Standard

| Option                 | Description                                                       | Selected |
| ---------------------- | ----------------------------------------------------------------- | -------- |
| Standardize on Zod     | Keep repo-authored runtime validation and OpenAPI schemas on Zod. | yes      |
| Standardize on Valibot | Migrate direct schemas to Valibot.                                | no       |
| Mixed validators       | Allow Zod, Valibot, and ArkType by local preference.              | no       |

**Auto choice:** Standardize on Zod.

---

## Valibot Boundary

| Option                 | Description                                                     | Selected |
| ---------------------- | --------------------------------------------------------------- | -------- |
| Remove direct usage    | Replace any repo-authored Valibot imports and manifest entries. | yes      |
| Force lockfile removal | Replace upstream dependencies to remove transitive Valibot.     | no       |
| Ignore entirely        | Leave direct usage if found.                                    | no       |

**Auto choice:** Remove direct usage.

---

## Warning Cleanup

| Option                    | Description                                            | Selected |
| ------------------------- | ------------------------------------------------------ | -------- |
| Opportunistic Zod cleanup | Fix small deprecated Zod calls if behavior-preserving. | yes      |
| Broad schema rewrite      | Redesign all content schemas.                          | no       |
| Leave warnings forever    | Treat all warnings as irrelevant.                      | no       |

**Auto choice:** Opportunistic Zod cleanup.

## the agent's Discretion

Where to document the validator policy and whether to add an automated direct-Valibot audit.

## Deferred Ideas

Replacing Prisma to remove transitive Valibot, ArkType adoption, and validation benchmark work.
