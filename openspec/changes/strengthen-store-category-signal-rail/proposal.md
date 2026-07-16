## Why

Store orientation is currently split across a weak category indicator, generic collection panels, and a Coverflow preview whose larger catalog is easy to miss. The approved direction gives each surface one clear job while retaining BlackBox's restrained underground-label character and the existing static catalog model.

## What Changes

- Restyle the existing Store category navigation as the selected Signal rail: clearer mono labels, full-cell targets, square-edged grouping, and a stronger current state using type, a 3px Store-burgundy rule, and a faint Store-burgundy tint.
- Replace the All collection's repeated category and Distro information with a compact Shelf Ledger: one shelf-purpose heading, one source-derived Store total, and separate source-derived Distro format links with counts.
- Give BlackBox Releases a shorter purpose-specific panel that pairs its category label and existing description with one source-derived collection total, while retaining a safe generic presentation for other non-Distro categories.
- Make eligible Coverflow groups disclose catalog depth explicitly with source-derived total, six-item preview, remaining count, a labelled continuation rail, secondary Previous/Next controls, and a visually primary `View all {total}` action.
- Add one-shot, event-driven Coverflow disclosure motion: the preview rail draws on entry, the remaining count appears, and disclosure fills the rail before the existing catalog reveal. Reduced-motion users receive the same static information and final states without animation.
- Preserve native links, `aria-current`, keyboard focus, 44px targets, no-JavaScript catalog access, Coverflow's existing six-node preview and exclusive modes, shell restoration, search ownership, and canonical Store Item navigation.
- Use existing data, components, tokens, and controller state. Add no runtime image, dependency, content field, route, category, commerce authority, API, or duplicate catalog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: Strengthen the Store Signal rail and make the All and BlackBox Releases orientation panels concise, purpose-specific, source-derived, responsive, and non-duplicative.
- `distro-format-jump-navigation`: Retain All-to-Distro format links, group order, counts, canonical targets, and progressive behavior while removing the repeated Distro introduction and standalone subtotal from the All panel.
- `distro-coverflow-catalog-disclosure`: Make the bounded preview's total and remaining catalog explicit, distinguish full-catalog disclosure from preview navigation, and add accessible event-driven motion without changing catalog ownership or modes.

## Impact

- Web UI: `StoreCategoryNavigation.astro`, `StoreCollectionPage.astro`, `StoreDistroCatalog.astro`, narrowly scoped Store/Coverflow CSS, and the existing Coverflow controller only where current mode hooks need to drive presentation.
- Tests: Store collection rendering, static output assertions, Coverflow markup/style/controller coverage, and app-shell snapshot restoration.
- Visual evidence: `docs/ui-mockups/store-category-signal-rail-poc.png` and `docs/ui-mockups/store-orientation-approved-poc.png`; OpenSpec requirements and live source-derived values remain authoritative over raster examples.
- Research evidence: `docs/store-header-design-research.md` and `docs/ui-design-patterns.csv`, especially `LAY-01`, `HIER-02`, `HIER-04`, `SPACE-04`, `COMP-04`, `STATE-02`, `MOBILE-02`, `STYLE-02`, `BRAND-03`, and `CONV-03`, remain design inputs rather than runtime dependencies.
- Sequencing: apply after `refine-store-catalog-discovery` is accepted and archived so its conditional Merch, format-navigation, and Store-category contracts are baseline first.
- No Worker/API, D1, Stripe, checkout, StoreCart, content schema, route, dependency, runtime asset, or deployment change.
