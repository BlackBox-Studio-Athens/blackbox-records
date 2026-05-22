# Phase 18: Remove Valibot And Standardize On Zod - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Source:** Automatic `gsd-discuss-phase 18 --auto` from dependency-adoption request

<domain>
## Phase Boundary

Phase 18 standardizes repo-authored validation on Zod. It audits for direct Valibot usage, replaces any direct Valibot usage with Zod, and records the boundary if Valibot remains only as a third-party transitive dependency. It must not weaken backend OpenAPI generation, Astro content schema validation, or StoreCart parsing.

</domain>

<decisions>
## Implementation Decisions

### Validator Standard

- **D-01:** Zod is the repo-authored validation standard for this codebase.
- **D-02:** Backend HTTP contracts continue through `@hono/zod-openapi`.
- **D-03:** Astro content schemas continue through `astro/zod`.
- **D-04:** StoreCart, money, commerce IDs, quantities, and HTTP validation should use Zod when runtime validation is required.

### Valibot Boundary

- **D-05:** No repo-authored source should import Valibot directly.
- **D-06:** `pnpm why valibot --recursive` on 2026-05-22 showed Valibot only as a transitive dependency of Prisma tooling (`@prisma/dev` through `prisma` / `@prisma/client`), not as direct app usage.
- **D-07:** Do not downgrade, replace, or patch Prisma only to remove a transitive Valibot package from the lockfile.
- **D-08:** If the audit finds direct Valibot usage, replace it with Zod and add tests at that boundary.

### Warning Cleanup

- **D-09:** Existing Astro/Zod deprecation hints from content schemas are separate from Valibot removal.
- **D-10:** This phase may update deprecated Zod API usage if it is a small, behavior-preserving cleanup.
- **D-11:** Do not migrate to ArkType or Valibot as a second validator in this phase.

### the agent's Discretion

The agent may choose the exact documentation location for the validator policy and whether to add an automated dependency audit command, provided it does not create noisy gates or fail on unavoidable third-party transitive dependencies.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Validation Surfaces

- `apps/backend/src/interfaces/http/contracts/public-contracts.ts` - Zod OpenAPI contracts.
- `apps/backend/src/interfaces/http/routes/register-internal-stock-routes.ts` - route-side Zod error handling.
- `apps/backend/src/domain/commerce/ids.ts` - domain ID validation.
- `apps/backend/src/domain/commerce/quantities.ts` - quantity validation.
- `apps/web/src/content.config.ts` - Astro content schema validation.
- `apps/web/src/lib/store-cart.ts` - StoreCart runtime parsing and branded quantity.
- `apps/web/src/lib/money.ts` - money validation.

### Dependency Evidence

- `package.json`, `apps/web/package.json`, `apps/backend/package.json`, `packages/api-client/package.json` - direct dependency manifests.
- `pnpm-lock.yaml` - transitive dependency evidence.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Zod is already direct in web and backend packages.
- `@hono/zod-openapi` makes backend contract generation Zod-centered.
- Existing tests cover StoreCart and OpenAPI documents.

### Established Patterns

- Dependency decisions should distinguish direct app dependencies from transitive tool dependencies.
- Do not claim removal of a transitive package if an upstream dependency still brings it in.

### Integration Points

- Audit imports and package manifests.
- Replace any direct Valibot usage if found.
- Document Zod as the validator standard in planning/codebase docs or AGENTS only if useful.

</code_context>

<specifics>
## Specific Ideas

Add a small dependency-audit note or script that checks for direct `valibot` imports and manifest entries, while allowing Prisma's transitive dependency until Prisma removes it upstream.

</specifics>

<deferred>
## Deferred Ideas

- Replacing Prisma to remove transitive Valibot.
- Adopting ArkType or Valibot for performance.
- Broad validation-library benchmarking.

</deferred>

---

_Phase: 18-Remove Valibot And Standardize On Zod_
_Context gathered: 2026-05-22_
