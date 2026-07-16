## Why

Store orientation is currently split across a weak category indicator, generic collection panels, and a Coverflow preview whose larger catalog is easy to miss. The approved direction gives each surface one clear job while retaining BlackBox's restrained underground-label character and the existing static catalog model. The follow-up Distro pass brings its intro/search area and artwork stage into the same visual system without replacing the working catalog controller.

## What Changes

- Restyle the existing Store category navigation as the selected Signal rail: clearer mono labels, full-cell targets, square-edged grouping, and a stronger current state using type, a 3px Store-burgundy rule, and a faint Store-burgundy tint.
- Replace the All collection's repeated category and Distro information with a compact Shelf Ledger: one shelf-purpose heading, one source-derived Store total, and separate source-derived Distro format links with counts.
- Give BlackBox Releases a shorter purpose-specific panel that pairs its category label and existing description with one source-derived collection total, while retaining a safe generic presentation for other non-Distro categories.
- Recompose Distro as a compact purpose-specific orientation panel using its existing title, description, source-derived total, and search slot, while removing idle search-count duplication and retaining the separate format jump navigation.
- Make eligible Coverflow groups traverse every Store Item in canonical order while presenting at most six covers in the 3D stage, with source-derived total, active position, remaining count, secondary Previous/Next controls, and a visually primary `View all {total}` action.
- Restyle the existing Coverflow as one smaller, square-edged artwork rack that connects its overview, live record identity, and stage while retaining the current controller, modes, links, and progressive fallback.
- Make the Store-accent rail track the active record: it starts at `1 / total`, glides to each new source-derived position, and fills before the existing catalog reveal. Reduced-motion users receive the same static information and final states without animation.
- Preserve native links, `aria-current`, keyboard focus, 44px targets, no-JavaScript catalog access, a maximum six-cover stage, exclusive modes, shell restoration, search ownership, and canonical Store Item navigation.
- Use existing data, components, tokens, and controller state. Add no runtime image, dependency, content field, route, category, commerce authority, API, or duplicate catalog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: Strengthen the Store Signal rail and make the All, BlackBox Releases, and Distro orientation panels concise, purpose-specific, source-derived, responsive, and non-duplicative.
- `distro-format-jump-navigation`: Retain All-to-Distro format links, group order, counts, canonical targets, and progressive behavior while removing the repeated Distro introduction and standalone subtotal from the All panel.
- `distro-coverflow-catalog-disclosure`: Let the bounded six-position stage traverse the complete canonical group, expose the active and remaining positions, distinguish full-catalog disclosure from Coverflow navigation, and add accessible event-driven motion without changing catalog ownership or modes.

## Impact

- Web UI: `StoreCategoryNavigation.astro`, `StoreCollectionPage.astro`, `StoreDistroCatalog.astro`, `StoreDistroSearch.tsx`, narrowly scoped Store/Coverflow CSS, and the existing Coverflow controller only where current mode hooks need to drive presentation.
- Tests: Store collection rendering, Distro search presentation, static output assertions, Coverflow markup/style/controller coverage, and app-shell snapshot restoration.
- Visual evidence: `docs/ui-mockups/store-category-signal-rail-poc.png` and `docs/ui-mockups/store-orientation-approved-poc.png`; OpenSpec requirements and live source-derived values remain authoritative over raster examples.
- Research evidence: `docs/store-header-design-research.md` and `docs/ui-design-patterns.csv`, especially `LAY-01`, `HIER-02`, `HIER-04`, `SPACE-04`, `COMP-04`, `STATE-02`, `MOBILE-02`, `STYLE-02`, `BRAND-03`, and `CONV-03`, remain design inputs rather than runtime dependencies.
- Sequencing: apply after `refine-store-catalog-discovery` is accepted and archived so its conditional Merch, format-navigation, and Store-category contracts are baseline first.
- No Worker/API, D1, Stripe, checkout, StoreCart, content schema, route, dependency, runtime asset, or deployment change.
