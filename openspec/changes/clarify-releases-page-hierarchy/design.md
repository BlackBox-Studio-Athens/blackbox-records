## Context

The current `/releases/` route already has the correct content partition. `selectReleasePageEntries` chooses the newest out-now release for the Feature Wall, the nearest future release for one selected upcoming treatment, and leaves every other Release entry in catalog order. On 2026-07-15 that produces Caregivers as `Latest out now`, Disintegration as `Upcoming`, and Anarchotribal as the sole remaining catalog entry.

The visual seam is narrower than the data model. The selected upcoming treatment is nested inside the Feature Wall article, while the remaining grid follows without a heading. Live inspection at 1280 CSS pixels confirmed that the current Feature Wall is the page's strongest element; narrow inspection confirmed that the same source order can reflow without a second navigation or interaction model. Repo history also records Draft A, `Feature Wall`, as the selected direction in `apps/web/src/pages/demo/release-feature-drafts.astro`.

Three visual directions were reviewed. Option 1 is selected and refined after implementation review: a dominant latest-release region and a smaller artwork-backed Upcoming rail share the wide layout, while `Our Releases` begins directly beneath the Feature Wall in the main column instead of waiting for the taller rail. The current outlined action group remains part of the Feature Wall: the standalone Listen control with its indicator, View Release, and the commerce link returned by `getReleaseCommerceLink`.

This route is a static Astro editorial surface inside the persistent app shell. Release detail links open through existing overlays, Listen uses the shell-owned player, and the optional commerce action comes from `getReleaseCommerceLink`. The concurrent `refine-store-catalog-discovery` change may rename that returned commerce label, so this change must render the helper result without owning its copy or destination.

## Research Findings

The strongest recurring label pattern is an editorial anchor followed by a schedule cue and then an archive:

- [International Anthem](https://www.intlanthem.com/) pairs a dominant current-release treatment with a separate cover-led [release archive](https://www.intlanthem.com/releases/). This supports keeping BlackBox's Feature Wall and separating the catalog beneath it.
- [Thrill Jockey](https://www.thrilljockey.com/) and [Sacred Bones](https://www.sacredbonesrecords.com/) use explicit preorder or upcoming and out-now group labels. The useful lesson is named temporal hierarchy, not their shop controls.
- [Domino](https://www.dominomusic.com/releases/labels/domino?page=1) orders compact release metadata clearly around artwork, artist, title, date, and format. [Erased Tapes](https://www.erasedtapes.com/store/releases) demonstrates a quieter image-led back-catalog grid.
- [Sub Pop](https://www.subpop.com/releases) and [4AD](https://shop.4ad.com/new-releases?lang=en_US) add list or grid switches, pagination, filters, and year groupings for large catalogs. BlackBox has three current Release entries, so those controls would add state without improving discovery.
- [Ninja Tune](https://ninjatune.net/releases) makes status and actions highly visible, while [Mute](https://mute.com/) uses a strong release hero. BlackBox should borrow status clarity but not their action density or carousel behavior.

The responsive contract follows [WCAG reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow), [minimum target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), and [information and relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html): named sections, semantic heading order, text status, visible focus, and no two-dimensional scrolling at 320 CSS pixels.

## Goals / Non-Goals

**Goals:**

- Preserve the current Feature Wall as the dominant first release treatment.
- Preserve the current Feature Wall action group and its player, detail, commerce, focus, and wrapping behavior.
- Make `Upcoming` and `Our Releases` separate, scannable editorial sections without leaving a catalog-sized gap beneath the Feature Wall.
- Reuse the existing restrained artwork hover/focus motion across all three tiers and keep reduced motion authoritative.
- Strengthen temporal labels, simplify divider rules, and keep the catalog heading subordinate to the page title.
- Keep every Release entry in exactly one existing presentation role.
- Reuse current content, image handling, link behavior, card behavior, and responsive breakpoints.
- Keep direct loads and app-shell replacements semantically and visually equivalent.

**Non-Goals:**

- Changing which release is featured, selecting more than one upcoming release, or changing catalog order.
- Adding release status fields, filters, search, pagination, year grouping, a carousel, new components, or dependencies.
- Redesigning release detail overlays, the player, the existing Feature Wall controls, Store, commerce actions, or content schemas.
- Reworking the noindex release-feature drafts page.

## Decisions

### Preserve role selection and the Feature Wall

Keep `selectReleasePageEntries` and its unit coverage unchanged. The current selector already solves exclusivity and the existing static-build date rules. The Feature Wall keeps its large artwork, label, title, artist/date/format line, summary, and current outlined action group. That group continues to render the standalone accent Listen trigger first, View Release second, and the optional resolved commerce link third. The Listen indicator and shell-player data contract, detail-overlay navigation, visible focus, target sizing, and responsive wrapping remain unchanged.

Alternative considered: move every future release into an Upcoming collection. Rejected because the request is visual, the current selector intentionally promotes one nearest future release, and broadening the role contract would add helper, test, and image-loading work without being required for the three requested tiers.

### Give each role a semantic section

Keep the Feature Wall article focused on its artwork and copy. Move the existing selected-upcoming markup into a sibling `Upcoming` section with its own `h2`; render its title as the nested release heading. On wide screens, use a two-row asymmetric grid: the Feature Wall owns the first row of the larger main column, Upcoming owns the smaller right-hand rail and may span both rows, and `Our Releases` starts in the second main-column row. Source and keyboard order remain Feature Wall, Upcoming, then Our Releases, so narrow screens stack in that order without CSS ordering.

If `upcomingReleaseEntry` is absent, omit the entire Upcoming section. If `remainingReleaseEntries` is empty, omit the entire Our Releases section. No empty-state copy or placeholder art is needed.

Alternative considered: keep Upcoming visually nested and add only an archive heading. Rejected because it leaves the first two roles reading as one compound component and does not meet the requested three-tier hierarchy.

### Use one strong treatment per tier

The Feature Wall remains dominant apart from the layout wrapper needed to place its sibling rail and catalog row. Upcoming becomes a restrained vertical editorial panel using its existing linked Astro image, status label, title, artist, semantic full date, optional summary, and formats. Its art and type remain clearly smaller than the Feature Wall, and it gains no new Listen, preorder, or Store action. `Latest out now` and `Upcoming` use the same compact, high-contrast temporal-label treatment; `Our Releases` is sized as a section heading below the page title rather than as a competing display title. Repeated adjacent borders are removed so each region uses one quiet separator instead of a box of rules. At narrow widths, the layout becomes one column in source order; Upcoming is not converted into a horizontal scroller or overlay.

Our Releases reuses `ReleaseCard` with its existing `framed-artwork` variant in the current three, two, and one-column responsive grid. The linked Feature Wall and Upcoming artwork reuse that variant's restrained hover/focus scale and timing, with overflow clipped at the artwork boundary and motion disabled under reduced motion. This produces a coherent image interaction without a new card component, preserves the whole-card detail link and embedded-player trigger, and avoids a second metadata implementation.

Alternative considered: copy Draft B's custom discography rows. Rejected because `ReleaseCard` already owns the required artwork, artist, date, title, focus, overlay, and player contracts. A second release-row component is not justified by one remaining entry.

### Keep copy and authority at their current owners

`Upcoming` and `Our Releases` are stable route labels and can live in the page template. All authored release data continues to come from the Release collection. The latest commerce control keeps the existing action-link treatment while continuing to render `getReleaseCommerceLink().label`, `href`, `rel`, and `target` unchanged, allowing the Store change to rename native actions without a conflicting Releases-page rule. `Shop Release` is the current visible label, not copy owned by this change.

Release-date roles remain static-build output. A date crossing changes the selected roles only after the next build and deploy; no browser timer or client-side date repartition is added.

### Preserve image and performance contracts

Featured artwork remains the only priority image. Upcoming artwork keeps normal lazy loading and its card-scale responsive width ladder. Remaining cards retain the existing first-three eager, later-lazy policy. The framed card variant uses the existing responsive image implementation rather than introducing another source set.

No fixed content height or horizontal scroller is added. Long titles, summaries, metadata, and action labels must wrap within their grid column. Existing `.releases-latest-feature__actions`, action-link, and standalone Listen-control behavior is reused rather than replaced. Motion stays limited to the shared artwork and focus transitions and continues to respect reduced motion.

### Verify the rendered hierarchy, not only the build

Browser Use must cover direct and shell-managed `/releases/` navigation at desktop and 320 to 390 CSS pixel widths. For current content it must confirm the compact two-row asymmetric desktop composition, `Our Releases` beginning beneath the Feature Wall, Caregivers in the Feature Wall, Disintegration in Upcoming, Anarchotribal under Our Releases, one occurrence per role, semantic heading order, shared artwork hover/focus behavior, and the current ordered Listen / View Release / resolved commerce action group. It must also confirm usable focus and links, release-overlay continuity, Listen/player behavior and indicator, the helper-owned commerce label and destination, stacked narrow reflow, reduced-motion behavior, no horizontal overflow, and a clean console.

## Risks / Trade-offs

- [Later future releases remain under the broad `Our Releases` catalog rather than the singular selected `Upcoming` treatment] -> Preserve the existing deliberate selection contract. Revisit an all-future schedule only when the product asks for it.
- [A one-entry archive can look sparse] -> Keep the grid left aligned and omit filler, counts, pagination, and decorative empty space.
- [Long optional summaries can dominate narrow layouts] -> Use intrinsic height, bounded line length, wrapping, and section spacing; do not clip content behind fixed dimensions.
- [The Store proposal also touches release commerce copy] -> Treat the helper's returned label and destination as opaque and keep Store selectors and modules untouched.
- [`global.css` may receive concurrent edits] -> Add only release-scoped selectors and preserve unrelated user changes during implementation.
- [Release roles do not change at midnight on an already deployed static artifact] -> Document and test the existing build-time behavior; do not add client-side scheduling.

## Migration Plan

1. Archive the completed `deduplicate-release-page-highlights` change so `release-catalog-presentation` is baseline.
2. Apply the selected Option 1 asymmetric layout using only Releases page markup and release-scoped CSS, reusing the existing Feature Wall actions, `ReleaseCard`, and selectors where practical.
3. Run focused checks, `pnpm test:unit`, `pnpm check`, and `pnpm build`, then complete direct and shell-managed Browser Use verification.
4. Deploy through the normal static workflow. Roll back by reverting the page and CSS change; no data or provider rollback is required.

## Open Questions

None.
