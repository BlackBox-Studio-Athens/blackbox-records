## Context

Artists, Store, and About render their level-one headings through `InternalPageHero`, whose title rule uses `clamp(2.35rem, 8.5vw, 4.15rem)`. Services owns a custom intro surface with a smaller `clamp(2.15rem, 9.5vw, 3.35rem)` title, while the completed Releases redesign owns a custom intro with a much larger `clamp(4rem, 13vw, 7.75rem)` title.

The shared hero currently renders any truthy supporting label without comparing it to the title. This produces `Store` / `Store` on the base Store route. Services bypasses the shared hero and hardcodes `Services` above CMS-authored title `Services`. Releases also bypasses the shared hero, but its `Catalog` / `Releases` identity is already distinct and belongs to the completed `redesign-releases-evolved-split-showcase` change.

These pages are static Astro documents that can also be swapped into the persistent app shell. The fix must preserve one `h1`, existing title-transition identity, custom intro surfaces, metadata, and shell behavior.

## Goals / Non-Goals

**Goals:**

- Give Artists, Releases, Store, Services, and About the exact responsive title typography already used by `InternalPageHero`.
- Render canonical distinct pairs: `Roster` / `Artists`, `Catalog` / `Releases`, `Store` / the active Store Category (`All` on `/store/`), `What We Do` / `Services`, and `About` / `The Label`.
- Prevent every `InternalPageHero` caller from displaying a supporting label that repeats its title after case and whitespace normalization.
- Cover the shared safeguard and custom Releases/Services headers with focused automated regression checks.

**Non-Goals:**

- Rebuilding the Releases showcase or Services intro surface.
- Changing browser metadata titles, primary navigation labels, routes, Store Category membership, content schemas, CMS fields, or shell navigation.
- Creating a page-identity registry, component variant system, new design token, or dependency.
- Standardizing secondary headings, detail-page title scale, spacing, colors, borders, or imagery beyond behavior inherited from the shared hero rule.

## Decisions

### 1. Reuse the existing shared hero title rule

The custom Releases and Services `h1` elements will also use `internal-page-hero__title`. That existing rule remains the single owner of the shared display font, responsive size, line height, letter spacing, and balanced wrapping. Their route-specific title classes retain only layout or surface-specific rules such as margin, color, overflow handling, and text transformation; conflicting typography declarations are removed.

This keeps Artists, Store, and About unchanged while making equal computed typography the default for the two custom primary-section headers.

**Alternative:** introduce a new generic title class or token and migrate every caller. Rejected because the required typography already exists and a rename would add churn without changing behavior.

**Alternative:** copy the current clamp into the two route-specific selectors. Rejected because three independent declarations can drift again.

### 2. Preserve both custom intro compositions

Releases keeps its route-local header, `Catalog` eyebrow, `transition:name="internal-page-hero-title"`, 87rem canvas, and Evolved Split Showcase. Services keeps its patterned surface, intro copy, and inquiry action. Only the shared title class and Services eyebrow copy change.

The completed `redesign-releases-evolved-split-showcase` change must be archived before implementation because it owns the current Releases markup, CSS, and focused test. This change then builds on that baseline instead of reopening its layout decisions.

**Alternative:** replace both custom intros with `InternalPageHero`. Rejected because it would discard intentional route-specific structure outside the requested title fix.

### 3. Omit repeated supporting labels inside the shared hero

A small pure resolver in `apps/web/src/lib/page-identity.ts` will normalize the supporting label and title by trimming, collapsing whitespace, and applying case folding. It returns no supporting label when the normalized values match or the label is empty, and otherwise returns the authored label unchanged. `InternalPageHero` uses that resolved value to render the optional badge while always rendering the `h1`.

The same resolver is exercised directly by unit tests and supplies the normalization rule used by custom-header contract checks. This tests omission behavior rather than only checking that expected source text exists; it is not a registry and owns no page copy.

Omission is safer than throwing during a static build: content-driven news or detail pages remain publishable and still expose their required level-one heading. It also avoids inventing replacement copy that the component does not own.

**Alternative:** fail the build on duplicate copy. Rejected because an editorial collision should degrade to one clear heading rather than block the whole site.

**Alternative:** centralize all page identities in a new registry. Rejected because Store and content-driven pages already have appropriate owners.

### 4. Use existing copy owners for canonical identities

The base Store category keeps metadata title `Store`, but its existing category `heading` changes from `Store` to `All`; `StoreCollectionPage` continues rendering `Store` as the supporting label and `category.heading` as the `h1`. Other Store Category headings remain unchanged.

Services changes only its route-owned eyebrow literal from `Services` to `What We Do`; the existing CMS-authored hero title remains `Services`. Artists, About, and Releases retain their current distinct pairs.

### 5. Use focused contract tests plus rendered acceptance

Automated coverage will verify:

- normalization and duplicate-label omission through the pure page-identity resolver, plus `InternalPageHero` wiring to its resolved value;
- the shared title class on shared, Releases, and Services headings with no competing route-specific font scale;
- exact distinct custom pairs `Catalog` / `Releases` and `What We Do` / `Services`;
- `All` as the base Store heading while Store metadata and other category identities remain unchanged.

Browser Use acceptance will compare computed title typography across all five primary sections at desktop, 390px, and 320px, on direct loads and shell-managed navigation. It will also verify one `h1`, expected supporting copy, preserved Releases transition/layout, preserved Services action, no horizontal overflow, and no console errors.

## Risks / Trade-offs

- **[Risk]** The smaller Releases title changes the emphasis selected by its prior redesign. **Mitigation:** preserve the complete route-local composition and change only title typography explicitly approved for consistency.
- **[Risk]** A shared-hero editorial title may equal its section label unexpectedly. **Mitigation:** omit only the redundant supporting badge and retain the `h1`, metadata, and page content.
- **[Risk]** Route-specific CSS can later reintroduce a competing title size. **Mitigation:** focused source-contract coverage requires the shared class and rejects route-local font-size ownership for Releases and Services.
- **[Trade-off]** Custom headers are protected by tests rather than runtime suppression. **Mitigation:** both custom primary headers are explicit, static surfaces covered by one focused contract.

## Migration Plan

1. Archive the completed `redesign-releases-evolved-split-showcase` change and confirm its requirements are baseline.
2. Add focused regression assertions and confirm they fail for the current duplicate identities and divergent title scales.
3. Add shared-hero normalization, update Store and Services copy, and reuse the existing hero title rule from Releases and Services.
4. Run unit, check, build, strict OpenSpec validation, diff checks, and Browser Use acceptance.

Rollback is a normal revert of the component, Store registry, two route files, CSS, tests, and this change. No data, schema, API, or deployment rollback is required.

## Open Questions

None. Title scale, Services copy, Store copy, duplicate handling, and enforcement scope are user-confirmed.
