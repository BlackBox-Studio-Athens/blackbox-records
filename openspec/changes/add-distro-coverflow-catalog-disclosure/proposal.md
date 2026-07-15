## Why

After the required format reorganization, Distro still contains 53-item Vinyl 12-inch and 19-item CD groups that make visitors traverse most of the page before they can compare formats. A measured full-length horizontal rail made late-item discovery worse; a bounded BlackBox 3D Coverflow can instead provide an intentional six-record preview and reveal the existing scan-friendly catalog on request. The format navigation also needs to remain reachable after a visitor jumps deep into the catalog.

## What Changes

- Add a responsive, artwork-only 3D Coverflow preview to populated Distro groups containing more than six records, using the first existing six-item chunk in the catalog's authored `order` rather than randomizing or adding a second curation model, and tune the stage separately for mobile and desktop widths.
- Provide bounded Previous/Next controls, source-derived preview and catalog counts, concise accessible card names, one prominent shared active-record status, deliberate card-link activation, and one `View all {count}` action that reveals the existing vertical catalog with the selected record kept in context.
- Treat preview, full catalog, and active search results as exclusive browse modes; active search always forces full results, and clearing search leaves the full catalog visible.
- Keep the existing format navigation sticky below the site header across catalog groups, add one native `Top` return action, and offset group targets so headings remain visible below both navigation layers.
- Server-render the initial Coverflow state to remove the catalog-to-Coverflow load flash, gate its presentation before paint on 3D transform support, and preserve the full catalog as the no-JavaScript and unsupported-browser baseline.
- Reuse the existing cards, six-item chunk wrappers, Distro search portal/controller, format navigation, and BlackBox visual language without duplicate catalog markup, another client island, a carousel library, or another dependency.
- Require reduced-motion behavior and measured direct-load, shell-entry, interaction, layout, accessibility, zoom, and shell-lifecycle checks before completion.

## Capabilities

### New Capabilities

- `distro-coverflow-catalog-disclosure`: Defines eligible groups, BlackBox 3D Coverflow behavior, exclusive browse modes, progressive fallback, accessibility, and performance boundaries.

### Modified Capabilities

- `distro-format-jump-navigation`: Keeps the server-derived format links reachable while browsing deep groups and adds one progressive return-to-top action.

## Impact

- Frontend surfaces: Distro grouped-route markup, the search predecessor's Distro portal/controller, app-shell snapshot sanitization, card presentation, and Distro styles.
- Existing seams: populated browse groups from `organize-distro-format-discovery`, Distro search from `add-static-distro-search`, format navigation from `add-distro-format-jump-navigation`, and the current six-card chunk structure.
- Verification: focused browse-state tests plus Browser Use and interaction traces at 320px, 390px, and desktop width.
- No content model, catalog order, API, commerce authority, route, dependency, or deployment change.
