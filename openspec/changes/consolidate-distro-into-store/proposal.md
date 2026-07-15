## Why

`Releases`, `Distro`, and `Store` currently ask visitors to browse overlapping record catalogs while only Store exposes the sellable catalog and commerce state. The selected information architecture keeps Releases as the editorial discography, makes Store the single shopping destination, and keeps `Distro` as a clear Store category rather than a competing primary section.

## What Changes

- Set the visible primary section order to `Artists · Releases · Store · Services · About` across desktop and mobile navigation, and remove Distro as a primary or footer section.
- Add one Store category navigation in the exact order `All · BlackBox Releases · Distro · Merch`.
- Give each category a progressive static route: `/store/`, `/store/blackbox-releases/`, `/store/distro/`, and `/store/merch/`.
- Derive faceted presentation memberships for canonical Store Items without changing `sourceKind`, Store Item identity, Store Offers, D1, Stripe, checkout, or stock authority:
  - BlackBox Releases includes release-sourced Store Items and canonical distro-sourced items explicitly related to a BlackBox Release.
  - Distro includes every distro-sourced Store Item, including a related BlackBox Release or exact `Clothes` record.
  - Merch additionally includes exact `Clothes` Distro records.
  - All contains every canonical Store Item exactly once.
- Render the currently empty Merch category with an honest empty state; do not invent products or introduce a speculative merch source model.
- Rehome the existing Distro search, format grouping/navigation, and bounded Coverflow catalog disclosure under the Store Distro category, preserving progressive enhancement, accessibility, canonical ordering, and performance gates.
- Replace `/distro/` with a canonical compatibility redirect to `/store/distro/`, preserve legacy format fragments, remove the legacy path from shell-section routing and the sitemap, and keep old bookmarks functional.
- Reserve the three category path segments against Store Item slug generation and validation.
- Update navigation, sitemap, app-shell, module-boundary, terminology, test, and documentation contracts to reflect the consolidated information architecture.
- Apply after the active round-two performance change is completed and archived so its detailed load, first-traversal, request, and Browser Use contracts are preserved while route names move from standalone Distro to Store Distro.

## Capabilities

### New Capabilities

- `store-catalog-categories`: Defines Store category labels, order, routes, faceted membership, collection rendering, empty-state behavior, fragment-preserving legacy Distro routing, and Store Item slug reservations.

### Modified Capabilities

- `project-language`: Defines `Store Category`, `All`, `BlackBox Releases`, `Distro`, and `Merch` as canonical shopper-facing catalog terms distinct from commerce source ownership.
- `app-shell-and-player`: Replaces standalone Distro shell navigation with exact Store category shell routes while preserving player, focus, scroll, cache, and direct-load behavior.
- `distro-format-discovery`: Applies deterministic Distro format grouping to Store Items assigned to the Store Distro category rather than every Distro content record on a standalone route.
- `distro-format-jump-navigation`: Moves progressive format navigation to the Store Distro category.
- `distro-search`: Moves route-lazy local search and its lifecycle to the Store Distro category.
- `distro-coverflow-catalog-disclosure`: Re-scopes the completed Coverflow behavior from the standalone Distro route to the Store Distro category; the completed predecessor change must be synchronized and archived before this delta is applied.
- `frontend-runtime-performance`: Replaces standalone Distro-route performance evidence with Store Distro category evidence while retaining the final round-two load and first/repeat-traversal budgets.
- `module-boundaries`: Renames and rehomes the route-lazy Store Distro search entrypoint inside the existing `storefront-catalog` module.
- `site-images`: Applies the existing Distro catalog image-delivery contract to the Store Distro category.
- `tooling-validation`: Replaces standalone Distro-route performance validation language with the Store Distro category route while preserving the final round-two profiles and focused regression gates.

## Impact

- Frontend content and routes: navigation entries, Store collection/category routes, the legacy Distro redirect, sitemap, and canonical metadata.
- Frontend catalog seams: `store-collection`, Store Item ownership relations, Distro grouping/search metadata, category membership, card rendering, and reserved Store Item slugs.
- Persistent shell: exact section matching, snapshot/history keys, route-specific search portal lifecycle, Coverflow cleanup, active Store navigation, and route tests.
- UI: Store category navigation, category counts/headings, Store Item cards, Distro format navigation/search/Coverflow, and Merch empty state.
- Architecture/docs: `storefront-catalog` entrypoints and module-boundary manifest, canonical project language, README, and project handoff notes.
- Verification: unit/route/snapshot/style tests, static build and sitemap inspection, plus native Browser Use checks at desktop and mobile widths.
- No backend API, D1 schema, Stripe catalog, checkout payload, stock, provider dependency, or new runtime dependency is required.
