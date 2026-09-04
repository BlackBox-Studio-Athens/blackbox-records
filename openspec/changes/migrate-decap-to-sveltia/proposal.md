## Why

The current Decap setup carries provider-specific boot, authentication, and local proxy machinery that is costly to maintain. Sveltia can keep the existing Git-backed Astro content model while replacing that machinery with an actively maintained editor.

## What Changes

- **BREAKING**: Replace the Decap CMS runtime with pinned Sveltia CMS at `/admin/`; Decap and Sveltia will not run side by side.
- **BREAKING**: Replace Google/DecapBridge Git Gateway authentication with GitHub OAuth through the official Sveltia CMS Authenticator. Hosted editors use one designated GitHub account with repository write access.
- Replace the Astro admin page with the static admin document required by Sveltia's native local-repository workflow.
- Replace the local Decap proxy with Sveltia's browser-native local-repository workflow.
- Preserve direct publishing to `main`, content file locations, editorial meaning, collection order, public identities, collection-owned media, validation, Artist slug generation, and the seven custom preview outcomes.
- **BREAKING**: Replace obsolete `/admin/media/**` catalog image URLs with `/assets/catalog/**`; update Store consumers and generated catalog projections without redirects. Source media stays in place.
- **BREAKING**: Rename the three space-containing Distro page `group_intros` keys to native-compatible names, updating stored JSON, schema, CMS fields, and readers together while preserving labels and text.
- Allow small schema, configuration, and internal organization changes needed for native Sveltia compatibility. Prefer direct source changes and deletion over adapters, dual formats, custom widgets, or new infrastructure.
- Keep the CMS editorial-only. Commerce, stock, checkout, operator authentication, and deployment ownership remain unchanged.
- Remove Decap runtime, authentication, proxy, configuration, tests, and documentation during the cutover. No Decap rollback path remains.
- Accept in UAT before deploying the same implementation to PRD; failed acceptance is fixed forward.

## Capabilities

### New Capabilities

- `sveltia-editorial-operations`: Defines the repository-backed Sveltia editor, local and hosted access, direct publishing, content compatibility, previews, media handling, and editorial boundaries.

### Modified Capabilities

- `decap-editorial-operations`: Retires the Decap runtime, DecapBridge authentication, local proxy, and Decap-specific editor behavior.
- `tooling-validation`: Replaces Decap configuration, compatibility, and smoke requirements with focused Sveltia checks.
- `static-site-and-deployment`: Updates the read-only UAT static smoke contract from Decap/admin coverage to Sveltia/admin coverage.
- `cloudflare-free-tier-cache-policy`: Removes provider-specific Decap wording from the generic CMS cache boundary.
- `commerce-checkout`: Keeps repository-authored editorial content outside checkout authority without naming the retired editor.
- `orders-stock-operator`: Replaces Decap authentication references with the independent Sveltia GitHub and Cloudflare Access boundaries.
- `project-language`: Keeps cache terminology provider-neutral for CMS behavior.
- `site-images`: Names Sveltia as a current consumer of stable public brand assets.
- `stripe-catalog-field-ownership`: Replaces Decap-specific editorial and authority wording with Sveltia and repository-authored content.

## Impact

- Affected surfaces: `apps/web/src/pages/admin/**`, `apps/web/src/lib/admin/**`, `apps/web/public/admin/**`, CMS scripts and tests, package and deployment configuration, module-boundary declarations, and CMS documentation. The bounded content migration also touches the Distro page JSON/schema and its existing Store/Distro grouping and rendering consumers.
- External setup: one official Sveltia CMS Authenticator Worker, one GitHub OAuth app, exact UAT/PRD allowed domains, and one designated GitHub account with repository write access.
- Content migration: three Distro page copy keys only; retain their values, the other keys, Distro item `group` values, and public routes. No media relocation, database, or commerce-authority migration is required. The pre-launch catalog image URL change updates repository artifacts only; it does not apply live provider changes.
