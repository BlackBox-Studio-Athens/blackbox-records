## Why

Several useful follow-ups are easy to lose and cross multiple existing surfaces: Distro discovery, catalog categories, music-link completeness, catalog ownership, performance follow-up polish, and the current Artists search threshold. This change records the work as research-first backlog so later implementation starts from verified requirements.

## What Changes

- Research and define Distro search, category ordering, and a possible smaller-vinyl category.
- Research and define a lightweight Bandcamp/Tidal link-discovery report for artists and releases.
- Reconcile the responsibilities and relationships of Releases, Distro, and Store.
- Replace the abrupt Home hero threshold exit with a bounded, reduced-motion-safe fade after current performance ownership closes.
- Hide Artists search until the roster contains more than five artists.
- Research a BlackBox-native version of Rough Trade's browse/discovery pattern: category navigation plus a featured vinyl showcase rail.
- Research scroll-first Distro browsing for a growing catalog, with one visible item at a time on mobile and horizontally browsable category rails.
- Keep all implementation blocked until the research decisions are recorded.

## Capabilities

### New Capabilities

- `catalog-discovery`: Research-backed discovery and information architecture for Distro, music links, and catalog ownership.

### Modified Capabilities

None.

## Impact

- Likely content and UI surfaces: Distro page, Artists page, Releases page, Store catalog, and Home hero visuals.
- Likely data/tooling surfaces: Astro content collections, catalog-data/store derivation, player provider metadata, and a manual audit report.
- No API, dependency, commerce-authority, or content mutation is authorized by this backlog entry.
