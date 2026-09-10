## Why

Store Distro format links currently jump into a long page that still presents every other format group. On mobile, selecting a format does not produce a focused result and leaves the visitor with avoidable scrolling and unclear state.

## What Changes

- Split the current combined `7-inch & 10-inch Vinyl` browse group into exact `Vinyl 7-inch` and `Vinyl 10-inch` groups derived from the existing Distro format data.
- Change the JavaScript-enhanced `/store/distro/` format navigation from jump-only links to one active format selection at a time.
- Keep `All formats` as the default and reset action; selecting a populated format shows only that group's existing presentation and current item count.
- On controller connection, use a valid canonical Distro group fragment once as the initial selection, then perform the final scroll/focus after that group is presented so direct links, Store All links, and format switches land correctly.
- Keep the existing greater-than-six Coverflow threshold in `All formats`; when one format is explicitly selected, reuse the existing Coverflow for any selected group with more than one item, while a single-item group remains a one-card grid.
- Make the mobile disclosure close after selection and expose the current selection clearly in both mobile and desktop navigation.
- Keep ordinary fragment links and the complete server-rendered catalog as the no-JavaScript fallback.
- Start Distro search from `All formats`, preserve existing search matching, and clear transient format state on route exit or shell snapshot restoration.
- Keep canonical card nodes, source order, Store requests, commerce authority, and search-owned `hidden` state unchanged; format selection uses data markers plus CSS instead of writing competing `hidden` attributes.
- Add no route, query-string state, ongoing hash synchronization, observer, dependency, carousel, pagination, or duplicate catalog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `distro-format-discovery`: Replace the combined small-vinyl browse shelf with separate `Vinyl 10-inch` and `Vinyl 7-inch` groups in canonical physical-type order.
- `distro-format-jump-navigation`: Replace enhanced jump-only behavior with exact 7-inch/10-inch groups, focused single-format selection, and ordered select-then-scroll behavior while preserving progressive fragment navigation and server-derived group authority.
- `distro-coverflow-catalog-disclosure`: Reuse the existing Coverflow for an explicitly selected group with two or more items while retaining the greater-than-six threshold in `All formats`.
- `sveltia-editorial-operations`: Keep separate 10-inch and 7-inch intro fields mapped to their corresponding separated browse shelves.

## Impact

- `apps/web/src/components/store/StoreDistroCatalog.astro`
- Existing Distro group derivation, search/format interaction code, and shell snapshot sanitation
- Distro format-navigation styles and focused unit/source-contract tests
- Browser Use verification for direct, Store All-linked, and shell-managed navigation at desktop and narrow mobile widths
- No content schema, backend, Stripe, D1, checkout, stock, dependency, or catalog-membership change
