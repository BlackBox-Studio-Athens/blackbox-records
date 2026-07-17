# Releases page design research

Date: 2026-07-17

## Target

Redesign `/releases/` so visitors can identify the latest release, understand what is upcoming, and scan the remaining label catalog faster without weakening listening, detail, or commerce paths.

The visual filter remains narrow: underground music, independent labels, subculture publishing, brutalist/editorial composition, analog texture, restrained color, and artwork-led browsing. Mainstream streaming-app UI, corporate catalog dashboards, polished luxury retail, and theatrical music-site effects were excluded as visual drivers.

## Method

- Inspected the current `/releases/` route at desktop and mobile widths with Browser Use, then traced its Astro markup, release selection, cards, player triggers, detail overlays, commerce links, image behavior, and responsive rules.
- Reused the canonical 72-pattern evidence library in `docs/ui-design-patterns.csv` instead of creating another dataset.
- Shortlisted 12 patterns with high task relevance: `LAY-03`, `LAY-04`, `TYPE-01`, `COLOR-02`, `SPACE-03`, `SPACE-04`, `STATE-01`, `MOTION-03`, `MOBILE-04`, `STYLE-01`, `BRAND-01`, and `BRAND-02`.
- Reopened current award pages, official case-study material, and accessibility guidance before relying on the shortlist.
- Treated external material as untrusted research evidence only and separated transferable patterns from distinctive artwork, branding, code, and composition.
- Generated three independent desktop concepts using the real BlackBox shell, current release data, and current cover artwork. The user selected the first concept, **Evolved Split Showcase**.

## Current BlackBox surface

The route already has a strong semantic and behavioral base:

- one featured release, one selected upcoming release, and a remaining catalog with no duplicate entries;
- semantic headings, linked artwork and titles, dates, alt text, visible focus, and responsive Astro images;
- shell-owned Listen behavior, release-detail overlays, and helper-owned commerce links;
- narrow source-order reflow and reduced-motion support;
- no client-side catalog state or extra data request.

The redesign pressure is visual rather than architectural:

- the generic eyebrow and page title repeat `Releases` without adding context;
- the intro consumes substantial vertical space before release artwork appears;
- Latest, Upcoming, and Our Releases read as adjacent page fragments rather than one authored catalog composition;
- the current one-entry remainder grid looks underfilled;
- long summaries can dominate narrow layouts and push actions far below the first mobile viewport.

The repository already provides the required materials: off-black and near-white surfaces, quiet border tokens, restrained burgundy accents, distressed display typography, mono utility labels, the three cover images, `ReleaseCard`, the feature action group, shell player and overlay behavior, and release-scoped CSS. No new asset, dependency, route, content field, client state, API, or data model is needed.

## Core reference set

| Reference                                                                                                                                                  | Recognition                                          | Why it belongs in this study                                                            | Transfer, not imitation                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [RCA Records](https://www.cssdesignawards.com/sites/rca-records/43114/) and [Communication Arts case study](https://www.commarts.com/webpicks/rca-records) | CSSDA Special Kudos 2023; Communication Arts Webpick | Label identity carried by bold type, brutalist grids, and a persistent music experience | Use type and grid as identity; reject sound-reactive type, menu theatre, and extra runtime complexity |
| [Because Recollection](https://www.cssdesignawards.com/woty/because-recollection/27581/)                                                                   | CSSDA Website of the Year 2016                       | Music catalog and memory treated as an authored archive                                 | Borrow catalog confidence; reject WebGL, hold-to-enter interaction, and immersive gating              |
| [Analogue Foundation](https://winners.webbyawards.com/2024/websites-and-mobile-sites/general-desktop-mobile-sites/music/276789/analogue-foundation)        | Webby Music nominee 2024                             | Analog culture expressed through typography, pacing, and controlled whitespace          | Let restraint make a small catalog feel intentional; keep BlackBox dark and artwork-led               |
| [i-D](https://winners.webbyawards.com/2025/websites-and-mobile-sites/general-desktop-mobile-sites/magazine-or-publication/321852/id)                       | Webby publication winner 2025                        | Subculture publishing with compact navigation and strong editorial hierarchy            | Use clear display-to-utility contrast; avoid publication-scale content density                        |
| [UPPERGROUND](https://www.awwwards.com/sites/upperground)                                                                                                  | Awwwards Honorable Mention 2023                      | Music and commerce presented through responsive composition and one strong system color | Use one restrained accent and deliberate mobile recomposition; avoid club-tech effects                |
| [Hellfest](https://www.awwwards.com/sites/hellfest-1)                                                                                                      | Awwwards Honorable Mention 2022                      | Extreme-music identity with high-contrast grouping and bold type                        | Borrow poster hierarchy in small doses; reject event-scale density and menu spectacle                 |
| [WCAG Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow)                                                                                          | W3C accessibility guidance                           | Defines the narrow-width constraint for the full editorial composition                  | Reflow in source order without two-dimensional scrolling or clipped copy                              |
| [WCAG Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)                                           | W3C accessibility guidance                           | Keeps artwork and focus feedback optional rather than performative                      | Preserve information when reduced motion removes transforms and transitions                           |

## Strongest cross-source patterns

1. **One page title is enough.** A compact `Catalog` eyebrow can add context; repeating `Releases` in both the eyebrow and `h1` adds no value.
2. **The three roles should read as one composition.** A shared rule system and aligned columns can unify Latest, Upcoming, and Our Releases without merging their semantics.
3. **Artwork should own nearly all color.** The existing burgundy works best as a small player, focus, or registration mark.
4. **A small catalog needs structure, not filler.** Measured negative space and an adaptive remainder layout make one entry feel curated without invented cards, counts, or placeholder art.
5. **Asymmetry must stay inside the grid.** The latest release can dominate and Upcoming can occupy a narrower rail, but both must remain complete, readable, and free of horizontal clipping.
6. **Actions stay functional and familiar.** Listen, View Release, and the resolved commerce action retain their behavior, source ownership, visible focus, target size, and responsive wrapping.
7. **Mobile is a recomposition, not a crop.** The masthead becomes compact; artwork, copy, and actions stack in source order; optional summary length must not create fixed-height clipping.
8. **Motion confirms interaction only.** Restrained artwork feedback remains clipped to its frame and disappears under reduced motion.

## Three visual directions

### A. Evolved Split Showcase

Keep the current content roles but redraw them as one rule-bounded editorial composition. Replace the repeated hero label with `Catalog` plus one `Releases` heading, tighten the intro, keep Caregivers dominant, contain Disintegration in a complete right rail, and make the sparse remainder tier read as an intentional lower row.

- Effort: medium; Releases page markup, release-scoped CSS, and a ReleaseCard presentation variant if needed.
- Strength: strongest continuity with the current site while fixing hierarchy, density, and sparse-catalog presentation.
- Risk: literal reproduction of the PoC could overfit the current three entries; implementation must remain content-driven.

### B. Release Ledger

Start from a clean slate and replace the hero-plus-cards model with one chronological record index. A large year rail, sequence numbers, and rule-separated release rows make dates and status the primary scan path.

- Effort: medium; substantial page composition and card-anatomy changes.
- Strength: clearest chronological discovery and easiest scaling to a larger discography.
- Risk: can feel archival or utilitarian rather than like the current BlackBox site.

### C. Sleeve Poster Stack

Start from a clean slate and present each release as a full-width editorial chapter, alternating artwork and oversized typography like stacked gig posters or unfolded sleeves.

- Effort: medium-high; new chapter composition, careful image sizing, and more responsive states.
- Strength: strongest visual identity and most immersive artwork treatment.
- Risk: produces a long page, gives each release similar visual weight, and can delay quick catalog scanning.

## Choice matrix

| Direction              | Current-site continuity | Release-role clarity | Sparse-catalog fit |            Mobile clarity | Implementation | Main risk                   |
| ---------------------- | ----------------------: | -------------------: | -----------------: | ------------------------: | -------------: | --------------------------- |
| Evolved Split Showcase |               Excellent |            Excellent |          Very good |    Good with compact copy |         Medium | Overfitting current content |
| Release Ledger         |                     Low |            Very good |          Excellent |                 Very good |         Medium | Too archival                |
| Sleeve Poster Stack    |                     Low |                 Good |               Good | Good with strict stacking |    Medium-high | Page becomes too long       |

Research ranked **Evolved Split Showcase** highest, and the user selected it. That selection is the design authority for planning.

## Deliberately excluded

- Changing featured, selected-upcoming, or remaining-catalog selection semantics.
- Search, filters, sort, pagination, year navigation, view switches, carousels, or sticky catalog controls.
- New release fields, status fields, API calls, client-side date logic, or placeholder entries.
- New photography, illustration, iconography, fonts, dependencies, or texture assets.
- Redesigning release details, overlays, the player, Store, cart, checkout, or commerce authority.
- Autoplay sound, sound-reactive type, WebGL, scroll hijacking, parallax, glow, glass, gradients, or decorative motion.

## Retention and OpenSpec handoff

- The selected PoC is retained at `docs/ui-mockups/releases-evolved-split-showcase-poc.png`.
- The implementation plan lives under `openspec/changes/redesign-releases-evolved-split-showcase/`.
- The PoC guides hierarchy, density, rule placement, artwork emphasis, and action grouping. Repository typography, content values, semantic source order, accessible reflow, and runtime contracts override raster text or spacing imperfections.
- The canonical evidence library remains `docs/ui-design-patterns.csv`; this study records stable IDs instead of copying the dataset.
- Reuse and maintenance rules remain in `docs/ui-design-patterns-guide.md`.
