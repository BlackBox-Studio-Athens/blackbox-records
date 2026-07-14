## Why

The 54-item mobile Vinyl 12-inch group makes visitors traverse most of the Distro page before they can compare formats, while the measured full-length horizontal rail made late-item discovery worse. A bounded BlackBox 3D Coverflow can provide an intentional six-record preview, then reveal the existing scan-friendly catalog only when requested.

## What Changes

- Add a mobile-only 3D Coverflow preview to populated Distro groups containing more than six records, using the first existing six-item chunk in canonical order rather than inventing featured content.
- Provide bounded Previous/Next controls, visible position and total counts, ordinary card-link navigation, and one `View all {count}` action that promotes the group into its existing vertical catalog.
- Treat preview, full catalog, and active search results as exclusive browse modes; active search always forces full results, and clearing search leaves the full catalog visible.
- Preserve the server-rendered full catalog as the no-JavaScript and unsupported-browser baseline, and enhance only when the native View Transition path is available.
- Reuse the existing cards, six-item chunk wrappers, Distro search lifecycle, format navigation, and BlackBox visual language without duplicate catalog markup, a carousel library, or another dependency.
- Require reduced-motion behavior and measured mobile interaction, layout, accessibility, and shell-lifecycle checks before completion.

## Capabilities

### New Capabilities

- `distro-coverflow-catalog-disclosure`: Defines eligible groups, BlackBox 3D Coverflow behavior, exclusive browse modes, progressive fallback, accessibility, and performance boundaries.

### Modified Capabilities

None.

## Impact

- Frontend surfaces: Distro grouped-route markup, page-local enhancement logic, card presentation, and Distro styles.
- Existing seams: populated browse groups from `organize-distro-format-discovery`, Distro search from `add-static-distro-search`, format navigation from `add-distro-format-jump-navigation`, and the current six-card chunk structure.
- Verification: focused browse-state tests plus Browser Use and interaction traces at 320px and 390px.
- No content model, catalog order, API, commerce authority, route, dependency, or deployment change.
