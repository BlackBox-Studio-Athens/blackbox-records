# Design

## Context

See proposal.md for scope. The owner approved the final preview on 15 October 2026 and authorized subsequent implementation and UAT release. This pass only prepares artifacts on main in the primary checkout.

The planning inputs are under `S = C:/Users/SVall/AppData/Local/Temp/claude/C--Users-SVall-WebstormProjects-blackbox-records/df1730c8-1e77-423e-be64-90793f3b8df0/scratchpad`: `feedback-map.md`, `audit/audit.md`, `canvas2/project/proposal-notes.md`, `canvas2/project/proposal.css`, `canvas3/project/store-releases-notes.md` and `canvas3/project/research.md`. The owner's latest orchestrator decisions supersede the initial planning defaults and inconsistent CSS samples. This document retains the implementation decisions so the temporary inputs are not the only record.

The Local audit at adc595c8 used a 390×844 touch viewport and 1440×900 desktop viewport with fixture listing offers. It measured seven control heights (28, 36, 38, 44, 48/52, 54, 56px). Relevant evidence: `apps/web/src/components/ui/button.tsx:11-67`, `apps/web/src/styles/global.css:110-148,2128-2195,5119-5244,5973-6020`, `HomeHero.astro:57-68`. These are audit-time locations, not fresh hosted measurements.

## Goals / Non-Goals

Create one shared control and colour contract consumed by both layout changes. Preserve native links, accessible states, source identity, offer validation and player lifecycle. Reuse existing primitives, format SVGs and finite equalizer animation. No dependency or data model is needed.

## Decisions

### Exact palette

| Family    | Face / edge       | Text / mark | Hover / pressed | Light mark text | Surface              |
| --------- | ----------------- | ----------- | --------------- | --------------- | -------------------- |
| Sea Green | #2d766a           | #4ca999     | #256258         | #7cc7b9         | rgba(45,118,106,.16) |
| Violet    | #7d58a0           | #b08fd0     | #664584         | #cab2e4         | rgba(125,88,160,.16) |
| Slate     | #366e99 edge only | #66a2d2     | surface below   | #91c4ee         | rgba(54,110,153,.16) |

Retain proposal token names `--sea-800/700/500/300/surface`, `--violet-800/700/500/300/surface`, `--slate-700/500/300/surface`. Ground #0d0d0d, panel #0f0f0f, charcoal #141414, neutral face #e8e8e8, pressed neutral #cfcfcf, ink #f5f5f5, inverse label #090909, muted metadata #b3b3b3, edges #2b2b2b / #1f1f1f / #4a4a4a and generic hover face #1a1a1a remain. Composite surfaces on charcoal are Sea #182422, Violet #251f2a and Slate #192229.

Sea means pre-order only: filled Pre-order / Pre-order vinyl, pre-order status, Vinyl ships, the Pre-orders selection and count. Ordinary Buy/Add to cart and Listen never use Sea.

Violet means buy and labels: Buy / Buy vinyl / Buy CD / Buy cassette / Add to cart faces; tags, kickers, artist link underline, current nav/tab underline, selected chips, Sold Out and Only N left edges/surfaces; Read News / View Full Roster / Continue shopping inverse edges. No accent-coloured titles.

Slate means Listen and small marks: Listen edge/bars, session surface, date/catalog line, swipe current dot, link hover underline, field focus edge and Est. 2026. No solid Slate action face. The subdued Slate surface is allowed for Listen hover/session feedback. Store format lines are plain Inter 13px semibold capitals in ink, without a leading Slate mark; Buy keeps its existing format icon.

Every control label is #f5f5f5, including resting chips and In player. The #090909 label on the #e8e8e8 neutral face is the exception; its label becomes white when the hero fills Violet. Muted counts/placeholder text and coloured metadata are information, not action labels. This explicitly overrides the muted chip labels and Slate In player label in proposal.css. Generic icon buttons stay neutral; an icon-only Listen remains a semantic Listen and keeps Slate bars/edge.

### Controls and motion

- Standard visible/tappable height 44px; square corners, 1px edge, Bebas Neue 16px capitals, 0.06em tracking, 1px top nudge, horizontal padding 16px, 18px icon with 8px gap; ordinary labelled minimum width 112px.
- Generic icons and phone Store Listen are 44×44. The two-up phone Store purchase action can use the approved approximately 95px width and 10px horizontal padding. These are width exceptions, never height exceptions.
- Two adjacent actions use one filled and one outlined control. On phones each takes half the available row with a 16px gap; on desktop they hug the label from 112px. Price is inert text. Non-buyable status is not a second action; absent Listen leaves one purchase control.
- Buy uses Violet #7d58a0 at rest, #664584 hover/pressed; hover edge #b08fd0. Keep the existing white format mark and finite format animation. Pre-order uses Sea #2d766a, #256258 hover/pressed, #4ca999 hover edge.
- Listen uses #141414 face, #366e99 edge, #66a2d2 bars; hover/session surface #192229 and edge #66a2d2. In player is full-opacity disabled session information with white text; generic disabled controls use 45% opacity. Existing session state does not prove provider playback.
- Inverse actions use #141414 face/#7d58a0 edge; hover #251f2a/#b08fd0. Neutral controls are Browse the Store, Pay, Subscribe, Show N items and Send inquiry.
- Every focus-visible ring is 2px #f5f5f5 at 2px offset. Inputs additionally use the Slate #66a2d2 focus edge; it never substitutes for the ring. Hover only on hover-capable pointers; transitions at most 250ms, no control movement, no retained touch-hover.
- Hero Browse the Store is the only 52px control: Bebas 20px, 0.06em, padding 24px start/20px end, 12px icon gap, trailing arrow. Violet rises from the base in 240ms using cubic-bezier(0.22,1,0.36,1); the arrow travels 6px inside the fixed box. Keyboard focus shows the same state; reduced motion changes instantly.
- Interactive text rows and swipe-dot buttons retain 44px targets. Static tags use Inter 12px/18px, 0.12em, 4px 8px padding with Violet edge/text. Kickers use Inter 12px/18px, 0.22em. Date/catalog metadata uses Inter 12px/18px, 0.18em and Slate.
- Form error text is Violet 300 #cab2e4, begins with visible Error, and retains invalid state and error/control association. Do not recolour transactional truth or change validation.

### DESIGN.md rule list for Claude

1. Replace palette frontmatter, colour sections, Key Characteristics, Commerce Is Subordinate and obsolete Do/Don't references to Store Blood/Services Rose.
2. Sharpen Sea Green Marks The Wait: resting Sea purchase fills allowed only for pre-orders.
3. Add Violet Means Buy And Labels and Slate Means Listen And Small Marks with the role map above.
4. Tighten Monochrome Owns The Page: public titles remain ink Veneer.
5. Replace three button sizes/coarse-pointer halos with 44px plus the one 52px hero exception; document width exceptions, white labels and the pair rule.
6. Retire Music Trigger Glow and the amber Listen refinement; retain finite equalizer/session semantics.
7. Replace the Store Buy Listen-chrome refinement with Violet fills and existing per-format marks.
8. Replace framed pre-order/digital browse badges with plain status lines; remove the 3px Sea action baseline and move the sweep to the Violet hero.
9. Give Sold Out and Only N left the Violet #7d58a0 edge and rgba(125,88,160,.16) surface; keep Coming Soon/Repressing as dashed neutral boxes. Update Notify me errors and form focus without changing state eligibility.
10. Remove inherited data-tone accents; document Violet current underline, Slate hover underline and selected chip meanings.
11. Record the page-frame rule, with detailed layout owned by C3; record the retained 44px Home chapter pause/resume icon on phones in C3.
12. Preserve Staff's separate design system and content-owned footer wording.

### Research backing and alternatives

The supplied October research used headless Chromium with an iPhone 15 profile (393×659), sometimes removing overlays after load. Dais exposed records at y=242 under one 44px browse row; Norman used a separate Filter layer but a 340px editorial introduction delayed its first product to y=736. Erased Tapes and Phonica made artist/format legible; Ninja Tune and Phonica kept play near artwork or buying. This supports C2's compact toolbar and filled purchase/outlined listening distinction. It is pattern evidence, not a copied visual identity or a new independent browser study. Baymard evidence was search snippets only; blocked sites and unmeasured footers are not evidence.

Retired alternatives are monochrome-only grey, Rust/Steel, Lichen/Sand, Services Rose, Sea for ordinary Buy, coloured titles, multiple size tiers and the amber Listen ring. The approved exact hex values take precedence over general palette-generation advice.

## F1–F22 coverage

C1 = accent-and-button-system; C2 = store-mobile-first-browse; C3 = mobile-layout-rhythm.

| Item | Approved answer                                                                      | Owning change                    |
| ---- | ------------------------------------------------------------------------------------ | -------------------------------- |
| F1   | Remove Store Blood and Services Rose                                                 | C1                               |
| F2   | Replace amber Listen edge, bars and session state with Slate                         | C1                               |
| F3   | Keep Sea exclusively for pre-orders; add Violet and Slate                            | C1                               |
| F4   | Colour tags, kickers and small marks; keep all Veneer titles ink                     | C1                               |
| F5   | Use named accents at rest within monochrome grounds                                  | C1                               |
| F6   | Violet news tags and Read News inverse edge                                          | C1                               |
| F7   | Remove desktop Store side pane                                                       | C2                               |
| F8   | One toolbar row; one phone Filter sheet                                              | C2                               |
| F9   | 44px controls, only hero CTA 52px                                                    | C1                               |
| F10  | Sea Pre-order and Violet Buy filled at rest                                          | C1                               |
| F11  | Plain ink format before title, stronger artist credit, plain digital/pre-order lines | C2                               |
| F12  | Ink-faced 52px Browse the Store with Violet sweep                                    | C1; C3 preserves hero frame      |
| F13  | Home Listen uses the shared 44px family                                              | C1; C3 places the pair           |
| F14  | Shared pair and compact chapter; keep 44px phone pause/resume for film accessibility | C1 and C3                        |
| F15  | Retain dated research, evidence limits and measured browser acceptance               | C1, C2 and C3                    |
| F16  | Keep approved 16px phone gutter; remove double insets                                | C3                               |
| F17  | Contain rules/media; header and hero film are the only bleed exceptions              | C3                               |
| F18  | Compact phone footer, approximately 290px at 390px, with 44px tap rows               | C3                               |
| F19  | Inline artist release counter                                                        | C3                               |
| F20  | Release actions beside one another near cover; compact hierarchy                     | C1 pair contract; C3 composition |
| F21  | Violet Buy keeps the format mark; context-specific label                             | C1; C2 Store placement           |
| F22  | Hidden Store H1; one sheet relocates existing Distro format links and filters        | C2                               |

## Resolved open items and integration

The owner settled the 52px hero, white labels, neutral submission controls, Violet Error text, 16px phone gutter, Sea-only pre-orders, Slate, Store header removal everywhere and corner Listen. The orchestrator retained today's catalogue order and Distro format links/counts, kept the compact purchase note above the grid, retained phone chapter pause/resume for accessibility, removed the Store format-line mark and set the footer target to about 290px. Preserve source copy, including the current “1 Releases” wording, unless separately edited. Preview estimation and the older “nothing was rendered” note are not implementation acceptance.

C1 modifies the complete listening-session requirement for colour; C2 subsequently replaces its Store placement scenario while retaining C1's colours and all player scenarios. C3 changes separate release/Home requirements. Reconcile catalog-number date-line wording from the still-open add-release-catalog-numbers change to Slate on integration; retain the number, semantics and wrapping. Sequence shared global.css, DESIGN.md and primitive edits with one writer. Claude owns the presentation work; no dedicated Codex data, tooling or boundary implementation is required.

## Risks / Trade-offs

- Similar Violet tags and Buy controls → static Inter outlined tags, filled Bebas actions, noninteractive status semantics and rendered phone checks.
- White-label overrides differ from CSS samples → test rest, hover, focus, selected, busy and In player explicitly.
- Fixed 44px controls with long copy → let adjacent informational text wrap and containers grow; never clip or shrink targets.
- Baseline specs contain superseded presentation text → replace full touched requirements, retain unaffected scenarios, and reconcile active sibling deltas before archive.

## Migration and verification

Implement C1 first, then C2/C3; retain all tasks unchecked until implementation evidence exists. Run focused owning-module tests and browser scenarios, then final pnpm validate and one coordinated main push to UAT. Record source fingerprints and release identity. No PRD promotion or Content Publication is implied. Recover a failed UAT candidate through the existing forward/revert release procedure, without changing stock or accepted content.
