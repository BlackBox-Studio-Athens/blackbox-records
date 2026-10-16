# Design

## Context

See proposal.md for motivation and dependency on C1. The planning inputs are under `S = C:/Users/SVall/AppData/Local/Temp/claude/C--Users-SVall-WebstormProjects-blackbox-records/df1730c8-1e77-423e-be64-90793f3b8df0/scratchpad`: `feedback-map.md`, `audit/audit.md`, `canvas2/project/proposal-notes.md`, `canvas2/project/proposal.css`, `canvas3/project/store-releases-notes.md` and `canvas3/project/research.md`. The owner's latest orchestrator decisions supersede the initial planning defaults and inconsistent CSS samples. This document retains the implementation decisions so the temporary inputs are not the only record.

Measured Local evidence at adc595c8: `StoreCollectionPage.astro:32-60`, `StoreCategoryNavigation.astro`, `StoreBrowsePane.astro`, `StoreItemCard.astro:52-143` and `global.css:3562-3620,4141-4143,4316,5119-5182`. At 390×844 the header ends at y=80, the introduction at 188, category navigation at 254, purchase note at 309, formats at 451, toolbar at 588, view bar at 666 and first card starts at 674. Desktop first card is y=468. These are measured fixture results; proposed coordinates below are design targets.

## Goals / Non-Goals

Keep the current catalogue and browse data unchanged while relocating existing controls. Reuse the Artists sheet, format-link renderer and native dialog/history mechanisms. Preserve card identity, purchase state and player state.

Sort control is out of scope; consider it only in a separately requested follow-up. No additional ordering modes, sort data, cross-category facets, new counts, projection/schema change, remote index or dependency is needed.

## Decisions

The owner chose pre-redesign amber for Listen and small marks on 16 October 2026: --amber-500 #e3b56c for resting/hover edges, equalizer bars and small marks; --amber-300 #f0d7b0 for the In player label; --amber-surface rgba(227, 181, 108, 0.16) for focus rings, Listen hover and In player surfaces. --listen-bars and --listen-edge are var(--amber-500); --listen-text is var(--amber-300). The Flint neutral system also applies: 400 #abb5b8 muted text/inactive navigation, 850 #262c2e edges/borders, 900 #212729 border/input, 950 #1a2022 quiet edges, and 700 #626e72 Store search and Grid/Crate frames. Grounds, ink, Flint, Sea and restriction-only error red retain their values.

### Entry and toolbar

Store retains one visually hidden H1: All on /store/, or the existing category name on other routes. Canonical metadata and category links remain. Remove the visible Store/category hero and desktop 208px pane.

Below 64rem, category links precede one 44px Search Store + Filter row. Filter opens one bottom sheet with Formats, eligible Pre-orders, View and Artists, in that order. Its neutral Show N items uses the existing live result count. Show, Close, Escape and Back close the sheet and restore the trigger without scrolling the background; Forward restores available local state. Artist and Pre-orders choices retain their current live behavior. Following a format link retains the existing destination and enhancement behavior; navigation away closes the active sheet.

At 64rem and wider, Search, Formats, Artists, eligible Pre-orders, Grid/Crate and the existing result count use one 44px toolbar row. Formats and Artists use popovers. Use the compact sheet arrangement before zoom or reflow clips labels or shrinks targets. Remove the separate view bar and close incompatible overlays at the breakpoint.

A Filter badge, where shown, reports active selections already held by the UI; it does not introduce catalogue counts. Clear filters, Clear search and artists-only Clear preserve their existing scopes and canonical result order.

### Existing Distro links and counts

Formats keeps today's Distro meaning. Preserve the same ordinary links, names, physical-type order, Distro counts and fragment destinations, including All formats and distinct 12-inch, 10-inch and 7-inch vinyl choices. Counts are exactly the existing Distro-derived values; do not recompute them for All, BlackBox Releases or Merch and do not introduce facet-count logic.

On All, a format link still opens the base-aware /store/distro/#distro-group-* destination. On Distro, the existing enhancement may filter matching Distro cards in place and combine with the existing search/artist/Pre-orders behavior. Relocating these links does not turn them into category-local radios or facets.

The links must remain reachable without JavaScript and after failed enhancement. Retain server-rendered anchors in an accessible native disclosure or visible fallback; they must not exist only inside a JavaScript-only modal or popover. Legacy /distro/ redirects and Distro fragments keep their existing behavior. Keep complete no-JavaScript catalogs and avoid duplicate active browse interfaces.

Artists retains its existing normalized credits, whole collaboration/label names, option counts, Selected · N group, pinned selections, checkbox focus and Find an artist that narrows options only. Change placement, not the source derivation or matching rules.

### Catalogue order and View stay unchanged

All keeps BlackBox releases first in ascending numeric catalog-number order, followed by Distro in the existing artist/title/slug order. Other collections keep their current order. The existing `sortAllStoreCollectionEntries` in `apps/web/src/lib/store-collection.ts:79-86` and its test at `apps/web/src/lib/store-collection.test.ts:98-137` confirm this behavior. Filtering retains that order; no comparator or data work is planned.

At this revision's read, DESIGN.md's “All uses...” paragraph still described a globally alphabetical shelf. That prose is stale against the comparator and the owner's explicit decision. Claude's DESIGN.md task corrects the paragraph; this authoring pass leaves the root file untouched and preserves the existing catalog-number change.

Retain Crate's existing bin threshold, supported formats, explicit activation, gestures, item in hand, saved viewport, filter eligibility and player continuity. Relocate its existing View choice into the shared controls without adding eligibility rules. Clearing restrictions never opens Crate automatically.

### Card hierarchy and exact presentation

Use C1's approved 16 October 2026 tokens: Sea #2d766a/#4ca999 only for pre-orders; Flint #626e72 purchase faces/edges, #4d595c hover/pressed faces, #889396 label text/selected chip edges/artist underlines, #c1cbce hover/form-error text and rgba(98,110,114,.16) surface; amber #e3b56c for Listen edges/bars and small marks, #f0d7b0 for the In player label, and rgba(227, 181, 108, 0.16) for focus/hover/session surfaces. Flint's OKLCH hue 215 and chroma 0.012 to 0.016 keep it a cool gray within the monochrome page. Labels stay #f5f5f5 except the #f0d7b0 In player status label and neutral Show N items (#090909 on #e8e8e8); the white label on Flint 700 is 4.82:1, and Flint 500 text on #141414 is 5.84:1, darker than muted Flint 400 #abb5b8. Focus is 2px ink at 2px, with an amber input edge.

Error red (#bc4945 edges, #e4706a icons/text, rgba(188,73,69,.16) defined surface) is reserved for the non-Greek buyer's item page notice, Store strip, cart drawer and checkout card. Those notices keep their Charcoal faces; red never fills a control, and form validation uses Flint 300 beside Error.

1. Complete square artwork with Listen at bottom-left. Phone Listen is 44×44, named “Listen to <title> by <artist>”; desktop is labelled from 112×44. In player keeps its source-qualified state. No source means no control.
2. Format above title: plain Inter 13px/16px semibold capitals in ink, without a leading amber mark.
3. Source-cased Veneer title 20px phone / 24px desktop in ink, retaining the item link.
4. Artist immediately below: Inter medium 16px phone / 17px desktop, ink name, muted “by”, Flint underline for verified artist links.
5. Plain Inter 13px/20px digital/pre-order lifecycle text: Digital out now muted; Pre-order and shipping Sea. Sold Out and Only N left use the Flint #626e72 edge and rgba(98,110,114,.16) surface; Coming Soon and Repressing keep their dashed neutral boxes.
6. Stable price/action row: Bebas price 20px phone / 24px desktop and one filled Buy with its existing white format icon, or Pre-order. At the reference two-up width allow approximately 95px action width and 10px padding while retaining 44px height. Unbuyable states remain inert information.

At 390px, 16px gutters leave 358px for two 171px cards and a 16px gap. At 1440px, retain the Store's 90rem maximum and 32px gutters; the approved desktop target is five 259.2px columns with 20px gaps. Reduce columns before identities or actions clip; one column remains available below 360px. D3p's isolated 271px card is a comparison frame, not the grid calculation.

Place “Shipping calculated in your cart...” and the international notice strip below the product grid on every category, including below an empty state, with existing links, copy and restriction meaning. At narrower widths or enlarged text, allow wrapping instead of clipping or changing disclosure copy. Item, cart and checkout purchase information remains unchanged.

The 16 October round-2 Local reference places the first card at approximately y=243 at 390px and y=234 at 1440px with both notices below results. These supersede the earlier above-grid composition and y=298/270 measurements. The first row's artwork and identity must still be visible in the reference 390×844 first viewport. Positions and card-height estimates are not fixed CSS heights. Long content and text zoom grow naturally.

### Research backing and rejected patterns

The supplied research measured Dais at y=242 with one 44px artist row, Norman with a separate Filter layer but first product y=736 after a large introduction, Ninja Tune at y=105, Phonica at y=151 and Constellation at y=215. This supports one visible filter trigger and early product placement. Existing format links, 60+ artists, availability and View can share one layer without changing their data semantics.

Erased Tapes, Phonica and Sacred Bones emphasize artist/format; BlackBox retains title-first identity while raising those facts. Ninja Tune/Phonica place play near artwork or buying, supporting removal of the separate Listen row above the title.

These are supplied October 2026 observations from 393×659 headless Chromium, not implementation measurements. Baymard evidence was snippet-only; blocked sites and unmeasured footers supply no findings. Reject a new filtering service, cross-category facets, new counts, a second phone Artists sheet and one-up-only 390px grids.

## F1–F22 coverage

C1 = accent-and-button-system; C2 = store-mobile-first-browse; C3 = mobile-layout-rhythm.

| Item | Approved answer                                                                                     | Owning change                    |
| ---- | --------------------------------------------------------------------------------------------------- | -------------------------------- |
| F1   | Remove Store Blood and Services Rose                                                                | C1                               |
| F2   | Use chosen amber for Listen edge, bars, session state and small marks                               | C1                               |
| F3   | Keep Sea exclusively for pre-orders; add Flint and amber                                            | C1                               |
| F4   | Colour tags, kickers and small marks; keep all Veneer titles ink                                    | C1                               |
| F5   | Use named accents at rest within monochrome grounds                                                 | C1                               |
| F6   | Flint news tags and Read News inverse edge                                                          | C1                               |
| F7   | Remove desktop Store side pane                                                                      | C2                               |
| F8   | One toolbar row; one phone Filter sheet                                                             | C2                               |
| F9   | 44px controls, only hero CTA 48px                                                                   | C1                               |
| F10  | Sea Pre-order and Flint Buy filled at rest                                                          | C1                               |
| F11  | Plain ink format before title, stronger artist credit, plain digital/pre-order lines                | C2                               |
| F12  | Ink-faced 48px Browse the Store with Flint sweep                                                    | C1; C3 preserves hero frame      |
| F13  | Home Listen uses the shared 44px family                                                             | C1; C3 places the pair           |
| F14  | Shared pair and compact chapter; phone film strip; no manual motion control; reduced-motion opt-out | C1 and C3                        |
| F15  | Retain dated research, evidence limits and measured browser acceptance                              | C1, C2 and C3                    |
| F16  | Keep approved 16px phone gutter; remove double insets                                               | C3                               |
| F17  | Contain rules/media; header and hero film are the only bleed exceptions                             | C3                               |
| F18  | Compact phone footer, approximately 200px at 390px, with 44px tap rows                              | C3                               |
| F19  | Inline artist release counter                                                                       | C3                               |
| F20  | Release actions beside one another near cover; compact hierarchy                                    | C1 pair contract; C3 composition |
| F21  | Flint Buy keeps the format mark; context-specific label                                             | C1; C2 Store placement           |
| F22  | Hidden Store H1; one sheet relocates existing Distro format links and filters                       | C2                               |

## Resolved decisions and follow-ups

The orchestrator retained current catalogue ordering, Distro format destinations/counts, existing filter semantics and the below-grid purchase note and international strip. The Store format line loses the leading amber mark; Buy keeps its icon. The visible header and desktop pane still go, and Listen still moves to the artwork corner.

Sort control is a separate follow-up, not an implementation task or a data prerequisite. There are no Codex data tasks and no dedicated tooling/boundary changes identified. Claude owns the remaining presentation work; verification stays shared.

## Risks / Trade-offs

- JavaScript-only relocation can hide format links → preserve and test the ordinary-link fallback on All and Distro.
- A label or count can be accidentally re-derived during relocation → compare destinations and Distro counts with the existing rendered source, retaining current item order.
- The sheet may sit above Crate/player → preserve marked history, Back/Forward and focus restoration.
- The compact purchase note consumes space above products → measure the actual composition without hiding copy or shrinking controls.
- Shared global styles → one writer per file, C1 first, coordinate C2/C3.

## Migration and verification

Claude implements and tests the relocated controls and card presentation using the existing data. Run focused UI/module/e2e regressions and verify catalogue order, links/counts and no-JavaScript fallback without new data behavior. Update DESIGN.md's browse composition and stale All paragraph. Then run final pnpm validate and coordinate one UAT main push after all three changes pass. No provider mutation, schema backfill, PRD promotion or Content Publication is included.
