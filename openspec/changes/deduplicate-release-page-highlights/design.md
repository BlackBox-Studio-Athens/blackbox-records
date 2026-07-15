## Context

`/releases/` loads the date-sorted Release collection, splits it into out-now and upcoming groups, selects one featured release and one nearest upcoming release, then renders the unfiltered collection as cards. The highlighted entries therefore appear twice. The upcoming aside currently shows title, artist, and date but no artwork, even though every Release already requires `cover_image`, `title`, `artist`, and `release_date`.

## Goals / Non-Goals

**Goals:**

- Give each Release entry one top-level role on `/releases/`: featured, selected upcoming, or remaining catalog.
- Keep the current featured and upcoming selection rules, including the existing no-out-now fallback.
- Make the selected upcoming release understandable after its duplicate card is removed.
- Preserve catalog order, responsive image handling, app-shell navigation, and accessibility.

**Non-Goals:**

- New Release fields, conditional content validation, assets, components, dependencies, or CMS changes.
- Changing release-date semantics, catalog sorting, detail routes, player behavior, commerce actions, or later upcoming releases.
- Moving every future release into the upcoming highlight; only the nearest selected upcoming release receives that role.

## Decisions

1. Extend the existing pure release-feature seam with one page-selection function that returns the featured entry, selected upcoming entry, and remaining entries. It will reuse `splitReleaseCatalogByAvailability`, preserve the current fallback and input order, and exclude the two selected object references from the remainder. This keeps the invariant in one testable place instead of duplicating filters in page markup.
2. Render `ReleaseCard` only for the remaining entries and calculate eager/lazy card loading from that filtered list. Omit the catalog-grid section when no entries remain so one- and two-release catalogs do not leave an empty region.
3. Keep the upcoming treatment inside the existing feature article. Add a linked Astro `<Image>` using the required cover image and alt fallback, then retain linked title, artist, and semantic release date as guaranteed information. Render summary and formats only when present. Do not add listen, preorder, or store actions in this change.
4. Keep the featured artwork as the page's only priority image. Give upcoming artwork a responsive card-scale width ladder and normal loading priority, consistent with the existing `site-images` baseline.
5. Extend `release-feature.test.ts` with focused role-partition cases, then run the repository behavior gates and Browser Use at mobile and desktop widths on both direct and shell-managed `/releases/` navigation.

## Risks / Trade-offs

- [Reference-based exclusion assumes the selector returns entries from its input array] → Keep selection and filtering inside the same pure function and lock the invariant with its unit test.
- [Removing highlighted cards can leave a short or empty grid] → Keep later upcoming and older releases in existing order, and omit the grid wrapper only when the remainder is empty.
- [Upcoming artwork competes with the featured image] → Use card-scale responsive widths without priority loading and verify first-viewport behavior in Browser Use.
- [Optional summaries or formats are absent] → Guaranteed artwork, title, artist, and date remain sufficient; optional fields render only when available.
