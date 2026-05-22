# Phase 17: Adopt Slugify For Slug Tooling - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Source:** Automatic `gsd-discuss-phase 17 --auto` from dependency-adoption request

<domain>
## Phase Boundary

Phase 17 adopts `@sindresorhus/slugify` for repo-authored slug generation and validation tooling. It centralizes slug behavior without silently changing existing public URLs, content filenames, route params, D1 mappings, Stripe mappings, or store item identities.

</domain>

<decisions>
## Implementation Decisions

### Canonical URL Safety

- **D-01:** Existing committed slugs remain canonical data unless a human explicitly approves a migration.
- **D-02:** Slugify adoption must not rename content files or public routes as a side effect.
- **D-03:** Store item slugs are commerce identities; generated fallback slugs must not replace existing explicit mappings.
- **D-04:** Legacy release IDs and current sellable item-option slugs must stay separate where the repo already distinguishes them.

### Tooling Scope

- **D-05:** Add a BlackBox-owned slug wrapper around `@sindresorhus/slugify`.
- **D-06:** Use the wrapper for new slug-generation surfaces: scripts, tests, CMS/admin helpers, and fallback slug creation.
- **D-07:** Keep slug validation explicit: generation and validation are related but not the same operation.
- **D-08:** Use `@sindresorhus/slugify@^3.0.0` or newer latest-compatible version at implementation time; `pnpm view @sindresorhus/slugify version` returned `3.0.0` on 2026-05-22.

### Collision Policy

- **D-09:** Detect collisions rather than silently suffixing public route slugs unless the specific workflow is explicitly a draft/new-entry helper.
- **D-10:** If draft tooling needs unique suggestions, uniqueness belongs in the wrapper API with tests and clear naming.

### the agent's Discretion

The agent may choose whether the wrapper lives under `apps/web/src/lib/`, `apps/web/src/lib/admin/`, or a script-only module, provided all repo-authored slug generation moves through one obvious entrypoint.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Slug Surfaces

- `apps/web/src/lib/catalog-data.ts` - store item slug derivation and explicit release slug mappings.
- `apps/web/src/lib/store-page-data.ts` - store route params.
- `apps/web/src/lib/app-shell/routing.ts` - app-shell route parsing.
- `apps/web/src/lib/admin/decap-artist-collection.ts` - Decap artist slug field config.
- `apps/web/src/content.config.ts` - content schema slug fields.
- `apps/web/src/content/**` - current slug-bearing content.

### Commerce Safety

- `.planning/UBIQUITOUS_LANGUAGE.md` - canonical commerce terms.
- `.planning/phases/10-sandbox-verification-and-release-gate/10-MULTI-ITEM-CART-WORKSTREAM.md` - StoreCart and store item identity context.
- `.planning/phases/12-modulith-boundary-hardening-planning/12-CONTEXT.md` - module boundary context.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Existing tests already assert known store item slugs and legacy-vs-canonical slug separation.
- Decap config helper tests already cover slug template output.

### Established Patterns

- Public URL changes require explicit compatibility handling.
- Content collection IDs and frontmatter slugs are both meaningful and must not be casually collapsed.

### Integration Points

- Slug wrapper should feed admin/tooling generation first.
- Runtime route parsing should validate or normalize only where behavior is already expected.

</code_context>

<specifics>
## Specific Ideas

Add a `createContentSlug` / `createStoreItemSlugSuggestion` style wrapper with options for strict validation and draft uniqueness. Keep migration reports separate from write operations.

</specifics>

<deferred>
## Deferred Ideas

- Renaming existing content files.
- Changing public URLs.
- Rebuilding D1 or Stripe mapping identities from generated slugs.

</deferred>

---

_Phase: 17-Adopt Slugify For Slug Tooling_
_Context gathered: 2026-05-22_
