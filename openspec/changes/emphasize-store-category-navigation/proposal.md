# Proposal

## Why

The Store's All / BlackBox Releases / Distro navigation is easy to overlook beside the catalogue. Give these choices stronger typography and a clearer position, with a visual review before implementation.

## What Changes

- Implement the user-selected Centered + larger canvas treatment, with 18px desktop and 16px mobile semibold labels.
- Increase category-label prominence while retaining the square edges, active underline, restrained Store accent, and readable focus state.
- Keep complete labels and comfortable touch targets on narrow screens, including the optional populated Merch category.
- Center the content-width group and each wrapped row, retaining complete category labels and native links.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: Refine the signal-rail hierarchy and responsive composition while preserving category discovery, routes, and native links.

## Impact

Implementation owner: the Store category styles in `apps/web/src/styles/global.css`, with focused browser coverage in `e2e/store-formats.spec.ts`. The shared `StoreCollectionPage.astro` supplies the navigation to collection pages; its native-link markup remains unchanged. No new dependency, content field, API, or commerce authority is required.
