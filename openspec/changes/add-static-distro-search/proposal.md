## Why

The Distro route server-renders 79 records across five populated groups, but visitors must scan the full page. The Artists route already provides the needed accessible, exact-first, route-lazy search foundation.

## What Changes

- Reuse the Artists search control, count, clear action, empty state, accessibility behavior, exact-first matching, and Fuse.js fallback on Distro.
- Generalize only the matcher input so Distro can search title, `artist_or_label`, exact group, and format.
- Hide unmatched cards, then empty chunks and groups, without changing category or item order; clearing restores the server-rendered document.
- Keep the complete catalog available without JavaScript and clear search state from app-shell snapshots and route exits.
- Load search only on Distro and enforce the existing Distro load, layout, and long-task budgets without a new service or dependency.

## Capabilities

### New Capabilities

- `distro-search`: Defines static, accessible, route-lazy Distro filtering and its progressive-enhancement and performance boundaries.

### Modified Capabilities

None.

## Impact

- Existing Artists matcher/search seams and Distro-specific search UI.
- Distro card/group markup and app-shell portal lifecycle.
- Focused matcher, DOM, shell, accessibility, and performance checks.
