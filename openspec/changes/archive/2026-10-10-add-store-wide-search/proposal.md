## Why

The All Store shelf contains the full catalog but has no search, while Distro already has an exact-first local search with accessible feedback and coverflow integration. Reusing that implementation lets shoppers find label releases and Distro items from one place.

The reviewed UAT layout also puts navigation, the large shelf introduction, and format links ahead of every record on the initial desktop and 390px mobile screens. This change owns the compact All Store discovery layout as well as search.

## What Changes

- Add Search Store on `/store/`, matching all rendered Store Items by title, artist/label, and available format/group metadata.
- Bring identifiable record artwork into the initial viewport by shortening the All introduction, compacting its Distro format handoff, and placing search next to the shelf. Preserve the monochrome identity and existing Coverflow; replace repeated All total/current/remaining metrics with one mode-appropriate count indicator.
- Extend the existing Store Distro search module and exact-first/Fuse matcher for the flat All shelf, sharing input, result feedback, matching, filtering, and cleanup behavior rather than copying a second search implementation.
- Preserve `/store/distro/` search and its format navigation, grouped order, and lifecycle behavior. Other category pages remain unchanged.
- Reveal matching items from coverflow, preserve catalog order, announce counts/empty results, and restore a clean shelf after clear or navigation.
- Retain server-rendered fallback, route-lazy loading, and the single listing-price projection per activation.

## Capabilities

### New Capabilities

- `store-search`: Whole-catalog search on the All Store route using existing local matching and presentation.

### Modified Capabilities

- `distro-search`: Allow the Store-owned search module to also serve the All route while keeping the Distro control and grouped behavior scoped to Distro.
- `store-catalog-categories`: Add compact All orientation and count presentation, replacing the old All-search prohibition while preserving flat-category coverflow and canonical cards.
- `frontend-runtime-performance`: Permit the shared search module on All as well as Distro without weakening disclosure or route budgets.

## Impact

`StoreCollectionPage.astro`, card search metadata, `StoreDistroSearch.tsx`, `StoreCoverflowController.ts`, app-shell lazy mounting and snapshot cleanup, and focused search/browser/performance checks. Keep the current provided module entrypoint and allowed dependencies; no hosted search service, index, new dependency, catalog field, per-item API read, sorting, pagination, or URL-persisted query is added.
