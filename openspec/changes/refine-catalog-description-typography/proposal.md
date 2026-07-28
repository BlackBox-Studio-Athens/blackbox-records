## Why

The Store already gains useful editorial hierarchy from its restrained mix of display, mono, and body typography, while Distro group introductions and highlighted Release summaries still blend into ordinary body copy. Reusing the existing mono face in those three bounded roles adds character without reducing readability across dense catalog cards or detail prose.

## What Changes

- Render Distro browse-group introduction copy with the existing mono font family.
- Render optional `Latest out now` and `Upcoming` Release summaries with the same mono font family.
- Preserve current size, line height, color, width, spacing, casing, wrapping, optional-content behavior, and document structure.
- Keep Store orientation copy, Distro and Release card summaries, item details, and long-form prose on the body font.
- Add focused source-contract coverage for the included and excluded typography roles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: Define the typography boundary for Distro browse-group introductions while preserving body typography for orientation and item descriptions.
- `release-catalog-presentation`: Define the typography boundary for highlighted Release summaries while preserving body typography for catalog cards and detail prose.

## Impact

- Affects public catalog presentation in `apps/web/src/styles/global.css` and focused Vitest source-contract coverage.
- Adds no route, content schema, component markup, public API, runtime state, dependency, or font-loading change.
