# Design

## Store Item and information pages as shell pages

`parseShellSectionRoute` gains two kinds:

- `store-item` for `/store/<slug>/`. Store collection routes match first, and `/store/checkout/` is excluded by name, so checkout, checkout return and item-scoped checkout stay full documents. A distinct kind keeps the Store collection behaviour keyed on `store` (listing prices, search portal, loading feedback) off item pages.
- `information` for `/terms/`, `/privacy/` and `/withdrawal/`.

The pages are complete `SiteLayout` documents, so the existing snapshot loader fetches them, adopts their page stylesheets and swaps `<main>`. Their islands use `client:load`, which the shell's own island already registers, and the snapshot code already restores island server markup and removes the country-gated notice. The shell refreshes Store image gallery targets after every apply. An unknown slug answers 404, and the loader's failure path falls back to native navigation, so the route matcher does not need the catalog.

Back from a Store Item now returns to the Store through the shell, not a fresh document. The Crate already restored its place from `history.state`, but the Store search's first sync still carries the initial All formats choice. After a full load the Crate module arrived after that sync; after shell navigation the module is cached, so the restored Crate mounted first and read the stale sync as a format choice that closed it. The Crate switch now loads a restoring Crate only after the first sync, which gives both paths the same order.

A section swap keeps the full-page presentation. An overlay would have changed the Store Item's layout and needed a design pass; the swap needs none.

## Bandcamp house appearance

`buildBandcampPlayerProvider` validates as before, then rebuilds the URL from the entity. The live player (fetched 2026-10-11) adds `theme-dark` and inverted icons when `bgcol` is dark, and skips its own background when `transparent` is set, so the modal surface shows through. Only `tracklist=false` differs by entity, because Bandcamp's track share code emits it. The schema accepts any URL the provider accepts, instead of requiring the stored value to equal the rebuilt one.
