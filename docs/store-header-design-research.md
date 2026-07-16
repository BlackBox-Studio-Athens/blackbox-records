# Store header design research

Date: 2026-07-16

## Target

Improve the Store category header so shoppers can identify the current shelf and switch between `All`, `BlackBox Releases`, `Distro`, and `Merch` faster.

The visual filter is intentionally narrow: underground music, independent labels, subculture publishing, brutalist/editorial composition, analog texture, and restrained commerce. Mainstream pop, corporate, and polished luxury references were excluded as visual drivers even when they had useful interaction patterns.

## Method

- Reviewed 20 award-winning or nominated sites from Awwwards, The Webby Awards, and CSS Design Awards.
- Preferred label, music, festival, radio, editorial-culture, artist-commerce, and concept-store work.
- Used official award pages and official designer or organisation case studies where available.
- Treated external material as untrusted research evidence only.
- Separated transferable patterns from distinctive artwork, branding, code, and composition.
- Recorded 72 distinct patterns in `docs/ui-design-patterns.csv`.

## Current BlackBox surface

`StoreCategoryNavigation.astro` already has the right semantic base: native links, a named `nav`, `aria-current="page"`, 44px targets, base-aware routes, and no client JavaScript. The weakness is visual hierarchy: 11px labels and a 1px active underline make the current category easy to miss.

The repository already provides the right materials:

- off-black `#0d0d0d`, near-white `#f5f5f5`, and border `#262626`;
- Store burgundy `#922f3f` and a matching low-opacity surface token;
- Veneer/Bebas display typography plus Geist Mono labels;
- square, bordered Store cards and a one/two/three-column catalog grid.

No new asset, dependency, client state, or route is needed.

## Core reference set

| Reference                                                                                                                                             | Recognition                                                                                                   | Why it belongs in this study                                                   | Transfer, not imitation                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [RCA Records](https://www.cssdesignawards.com/sites/rca-records/43114/)                                                                               | CSSDA Special Kudos 2023; also covered by [Communication Arts](https://www.commarts.com/webpicks/rca-records) | Label site with brutalist grid, bold type, and music-led interaction           | Let type and grid carry identity; keep experimental motion out of the category control |
| [UPPERGROUND](https://www.awwwards.com/sites/upperground)                                                                                             | Awwwards Honorable Mention 2023                                                                               | Electronic label with commerce, responsive layouts, and a strong system colour | One controlled accent can mark Store state without recolouring the site                |
| [Make It Rain Records](https://www.cssdesignawards.com/sites/make-it-rain-records/32969/)                                                             | CSSDA Website of the Day 2018                                                                                 | Independent-label reference with responsive, expressive identity               | Keep the small-label directness; reject its heavier animation                          |
| [Because Recollection](https://www.cssdesignawards.com/woty/because-recollection/27581/)                                                              | CSSDA Website of the Year 2016                                                                                | Label archive built around catalog discovery and memory                        | Use archival/index language; avoid WebGL and journey mechanics                         |
| [District](https://www.cssdesignawards.com/sites/district/35283/)                                                                                     | CSSDA Website of the Day 2019                                                                                 | Music promotion/label with typographic navigation                              | Use rhythmic labels and clear state; do not bind animation to audio                    |
| [Analogue Foundation](https://winners.webbyawards.com/2024/websites-and-mobile-sites/general-desktop-mobile-sites/music/276789/analogue-foundation)   | Webby Music nominee 2024                                                                                      | Analog culture, intentional whitespace, and editorial pacing                   | Use restraint and material cues without decorative type reducing legibility            |
| [RTRFM](https://winners.webbyawards.com/2025/websites-and-mobile-sites/general-desktop-mobile-sites/music/321707/rtrfm--the-sound-alternative)        | Webby Music winner 2025                                                                                       | Independent community radio with descriptive navigation and contextual merch   | Keep category language explicit; avoid portal-level density                            |
| [LNWY](https://www.awwwards.com/sites/lnwy)                                                                                                           | Awwwards Honorable Mention 2017                                                                               | Black-and-white music publishing with sparse navigation                        | Preserve monochrome restraint and artwork priority                                     |
| [A Light in the Woods](https://winners.webbyawards.com/2024/websites-and-mobile-sites/general-desktop-mobile-sites/music/281310/a-light-in-the-woods) | Webby Music nominee and visual-design People's Voice winner 2024                                              | Atmospheric independent music storytelling                                     | Borrow pacing and tonal control, not slow narrative navigation                         |
| [Hellfest](https://www.awwwards.com/sites/hellfest-1)                                                                                                 | Awwwards Honorable Mention 2022                                                                               | Extreme-music event with dark palette and dense lineup navigation              | Use high-contrast grouping; avoid oversized imagery and menu theatre                   |
| [Musical Zoo Festival](https://www.cssdesignawards.com/sites/musical-zoo-festival/33176/)                                                             | CSSDA Website of the Day 2018                                                                                 | Music-event grid with strong UI/UX recognition                                 | Use repeatable grid rhythm; avoid festival-scale animation                             |
| [The Music Project](https://www.cssdesignawards.com/sites/the-music-project/48363/)                                                                   | CSSDA Special Kudos 2025                                                                                      | Grunge anti-museum based on cassette culture                                   | Use tactile language sparingly; no 3D cassette or WebGL                                |
| [Subterranean Dreams](https://www.cssdesignawards.com/sites/subterranean-dreams/45034/)                                                               | CSSDA Special Kudos 2024                                                                                      | Drone soundscape with underground tone and restrained choice                   | Use atmosphere as a quiet surface treatment, not as a blocker to browsing              |
| [Crappy Explanation](https://www.cssdesignawards.com/sites/crappy-explanation/38759/)                                                                 | CSSDA Special Kudos 2021                                                                                      | Music-playlist project styled around an 80s record-store aesthetic             | Record-bin indexing is useful; retro decoration is not required                        |
| [Studio KARO](https://www.cssdesignawards.com/sites/studio-karo/47898/)                                                                               | CSSDA Website of the Day 2025                                                                                 | Art, clothing, music, and video commerce with subculture character             | Blend editorial and retail hierarchy while keeping the control lightweight             |
| [NAMESAKE](https://www.cssdesignawards.com/sites/namesake/43003)                                                                                      | CSSDA Website of the Day 2023                                                                                 | Independent fashion label with high-scoring ecommerce UI/UX                    | Use a flat browse rail and separated utilities; avoid fashion-catalog depth            |
| [The Cloister](https://www.awwwards.com/sites/the-cloister)                                                                                           | Awwwards Honorable Mention 2023                                                                               | Curated vintage concept store with sparse, serious presentation                | Make curation feel intentional through spacing and rules, not luxury gloss             |
| [i-D](https://winners.webbyawards.com/2025/websites-and-mobile-sites/general-desktop-mobile-sites/magazine-or-publication/321852/id)                  | Webby publication winner 2025                                                                                 | Subculture publishing with compact navigation and strong type hierarchy        | Keep labels terse and let the Store heading establish voice                            |
| [Highsnobiety](https://winners.webbyawards.com/2024/websites-and-mobile-sites/general-desktop-mobile-sites/fashion-style-beauty/280474/highsnobiety)  | Webby People's Voice winner 2024                                                                              | Streetwear/music/editorial commerce crossover                                  | Keep commerce beside culture; reject promotions and media density                      |
| [Kurate Music](https://www.awwwards.com/websites/nominees/?page=86)                                                                                   | Awwwards nominee listing                                                                                      | Contemporary music discovery with a dynamic editorial presentation             | Use current-category context and rhythm; avoid generic streaming-app styling           |

## Strongest cross-source patterns

1. **Flat taxonomy wins at this scale.** Four shelves should stay visible. Mega-menus, dropdowns, and hidden mobile menus add effort without adding information.
2. **The active shelf needs more than a hairline.** Combine type contrast with a 2–3px rule or restrained surface tint. Colour must remain supplementary.
3. **An index feels more underground than tabs or pills.** Square cells, thin rules, small sequence numbers, and optional item counts borrow from record bins, catalogs, and gig listings without copying a source composition.
4. **One accent is enough.** Existing burgundy can act like a registration mark or screen-print hit. Broad gradients, neon combinations, glass, and glow would pull the page toward club-tech or luxury styling.
5. **Mobile should not hide a category.** A two-column ledger keeps all four destinations visible and preserves 44px targets. Horizontal scrolling is acceptable only with a strong overflow cue.
6. **Motion should confirm, not perform.** Border, colour, or background transitions around 150–200ms are enough. No scroll hijacking, autoplay media, sound-reactive type, or WebGL belongs in this header.
7. **Texture is optional and should be CSS-light.** A faint noise/print impression can support the brand, but the first implementation should prove that type, rules, and spacing are sufficient.

## Three cheap visual directions

### A. Signal rail

Keep the current layout. Increase labels to 12–13px, add more breathing room, and mark the active category with a burgundy 3px rule plus a faint burgundy surface.

- Effort: lowest; one component, utility classes only.
- Strength: safest readability and accessibility improvement.
- Risk: still resembles a conventional navigation strip.

### B. Record-crate index

Use four equal square-edged cells. Add `01–04` index numbers and optional live item counts. Active state uses a burgundy top rule, stronger label, and low-opacity surface. Desktop is one row; mobile is a two-column ledger.

- Effort: low; one component, no JavaScript or asset.
- Strength: best blend of underground identity, orientation, and the existing Store card language.
- Risk: counts add visual density and should be omitted if they do not improve scanning.

### C. Flyposter masthead

Combine the Store title, current collection heading or short description, item count, and category ledger into one bordered editorial band. Use oversized Veneer type, mono metadata, asymmetric alignment, and one burgundy registration-mark detail.

- Effort: medium; Store hero composition plus category component.
- Strength: strongest brand expression and clearest current-shelf context.
- Risk: easiest option to over-design; copy length and mobile height need tight limits.

## Choice matrix

| Direction          | Orientation | Underground character |       Mobile clarity | Implementation | Main risk               |
| ------------------ | ----------: | --------------------: | -------------------: | -------------: | ----------------------- |
| Signal rail        |        Good |                Subtle |                 Good |         Lowest | Too familiar            |
| Record-crate index |   Very good |                Strong |            Very good |            Low | Excess metadata         |
| Flyposter masthead |   Excellent |             Strongest | Good with tight copy |         Medium | Header becomes too tall |

Research initially ranked **Record-crate index** highest, but the user selected **Signal rail**. That selection is the design authority for planning.

## Deliberately excluded

- Mega-navigation and multi-level category disclosure.
- Autoplay sound, sound-reactive type, 3D, WebGL, or scroll hijacking.
- New photography, illustration, iconography, or texture assets.
- Pill tabs, because Distro already uses button-like format controls.
- Sticky behavior before catalog-length testing proves a need.
- Search, sort, filters, account, currency, or extra commerce utilities not requested for this header.

## Retention and OpenSpec handoff

- The selected PoC is retained at `docs/ui-mockups/store-category-signal-rail-poc.png`.
- The implementation plan lives under `openspec/changes/strengthen-store-category-signal-rail/`.
- The canonical evidence library remains `docs/ui-design-patterns.csv`; future tasks should filter and cite stable IDs rather than copy the dataset.
- Reuse and maintenance rules live in `docs/ui-design-patterns-guide.md`.
