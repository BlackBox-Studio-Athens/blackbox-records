## Why

The Releases page already selects the right three content roles, but the upcoming release is nested inside the latest feature and the remaining catalog has no heading. Adopt the reviewed Option 1 direction: preserve the current `Latest out now` Feature Wall, give `Upcoming` its own smaller right-hand rail on wide screens, and place `Our Releases` below as a distinct catalog tier without turning this route into another Store surface.

## What Changes

- Preserve the existing role selection: newest out-now release as the feature, nearest future release as the selected upcoming release, and every other entry in the remaining catalog with no duplicates.
- Keep the current dominant `Latest out now` Feature Wall, including its artwork, summary, and existing outlined action group: Listen, View Release, and the resolved commerce action.
- Move the selected upcoming treatment into its own visibly headed `Upcoming` section, rendered as a smaller sibling rail beside the Feature Wall on wide screens and stacked after it on narrow screens.
- Add an `Our Releases` heading and a quiet image-led presentation for the existing remaining catalog grid.
- Omit the `Upcoming` or `Our Releases` section when its role has no entry instead of rendering filler or an empty frame.
- Preserve release content fields, detail routes, app-shell overlays, player behavior, responsive image handling, keyboard access, and reduced-motion behavior.
- Keep Store routes, categories, cards, pricing, availability, checkout, commerce authority, and content schemas unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: Refines the existing exclusive featured, selected-upcoming, and remaining-catalog roles into a clear `Latest out now`, `Upcoming`, and `Our Releases` visual hierarchy without changing selection semantics.

## Impact

- Releases-page markup in `apps/web/src/pages/releases/index.astro`, existing `ReleaseCard` reuse, and release-scoped rules in `apps/web/src/styles/global.css`.
- Existing selection logic and tests in `apps/web/src/lib/release-feature.ts` and `apps/web/src/lib/release-feature.test.ts` remain unchanged unless implementation exposes a genuine presentation regression.
- Browser verification for direct and shell-managed `/releases/` at desktop and mobile widths, including the selected asymmetric layout, semantic order, existing action controls, focus, player triggers, overlays, and horizontal reflow.
- No API, dependency, migration, content-schema, Store data, checkout, or deployment change.
- Apply after the completed `deduplicate-release-page-highlights` change is archived. Keep the concurrent `refine-store-catalog-discovery` change independent: this change consumes any existing release commerce link as-is and does not modify Store or commerce-link ownership.
