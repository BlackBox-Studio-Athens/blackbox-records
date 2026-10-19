# Design

## Context

See proposal.md for scope. The owner approved the final preview on 15 October 2026 and authorized subsequent implementation and UAT release. The approved 16 October 2026 palette revision assigns buying and labels to Flint and reserves error red for international restriction notices. This pass mirrors that revision into artifacts on main in the primary checkout.

The planning inputs are under `S = C:/Users/SVall/AppData/Local/Temp/claude/C--Users-SVall-WebstormProjects-blackbox-records/df1730c8-1e77-423e-be64-90793f3b8df0/scratchpad`: `feedback-map.md`, `audit/audit.md`, `canvas2/project/proposal-notes.md`, `canvas2/project/proposal.css`, `canvas3/project/store-releases-notes.md`, `canvas3/project/research.md` and `gray-notes.md` (the approved 16 October 2026 palette values, contrast and rationale). The owner's latest orchestrator decisions supersede the initial planning defaults and inconsistent CSS samples. This document retains the implementation decisions so the temporary inputs are not the only record.

The Local audit at adc595c8 used a 390×844 touch viewport and 1440×900 desktop viewport with fixture listing offers. It measured seven control heights (28, 36, 38, 44, 48/52, 54, 56px). Relevant evidence: `apps/web/src/components/ui/button.tsx:11-67`, `apps/web/src/styles/global.css:110-148,2128-2195,5119-5244,5973-6020`, `HomeHero.astro:57-68`. These are audit-time locations, not fresh hosted measurements.

## Goals / Non-Goals

Create one shared control and colour contract consumed by both layout changes. Preserve native links, accessible states, source identity, offer validation and player lifecycle. Reuse existing primitives, format SVGs and finite equalizer animation. No dependency or data model is needed.

## Decisions

The owner chose pre-redesign amber for Listen and small marks on 16 October 2026: --amber-500 #e3b56c for resting/hover edges, equalizer bars and small marks; --amber-300 #f0d7b0 for the In player label; --amber-surface rgba(227, 181, 108, 0.16) for focus rings, Listen hover and In player surfaces. --listen-bars and --listen-edge are var(--amber-500); --listen-text is var(--amber-300). The Flint neutral system also applies: 400 #abb5b8 muted text/inactive navigation, 850 #262c2e edges/borders, 900 #212729 border/input, 950 #1a2022 quiet edges, and 700 #626e72 Store search and Grid/Crate frames. Grounds, ink, Flint, Sea and restriction-only error red retain their values.

### Exact palette

| Family    | Face / edge       | Text / mark | Hover / pressed | Light mark text | Surface                           |
| --------- | ----------------- | ----------- | --------------- | --------------- | --------------------------------- |
| Sea Green | #2d766a           | #4ca999     | #256258         | #7cc7b9         | rgba(45,118,106,.16)              |
| Flint     | #626e72           | #889396     | #4d595c         | #c1cbce         | rgba(98,110,114,.16)              |
| Amber     | #e3b56c edge only | #e3b56c     | surface below   | #f0d7b0         | rgba(227, 181, 108, 0.16)         |
| Error red | #bc4945 edge only | #e4706a     | not a control   | not assigned    | rgba(188,73,69,.16), defined only |

Use token families `--sea-800/700/500/300` and `--sea-surface`, `--flint-800/700/500/300` and `--flint-surface`, `--amber-500/300` and `--amber-surface`, plus `--error-700/500` and `--error-surface`. Ground #0d0d0d, panel #0f0f0f, charcoal #141414, neutral face #e8e8e8, pressed neutral #cfcfcf, ink #f5f5f5, inverse label #090909, muted metadata Flint 400 #abb5b8, edges Flint 850 #262c2e / Flint 950 #1a2022 / #4a4a4a and generic hover face #1a1a1a remain. Composite surfaces on charcoal are Sea #182422, Flint #202223 and amber rgba(227, 181, 108, 0.16) over charcoal. The defined error surface would composite to #2f1c1c, but is not applied to the restriction notices; their face stays Charcoal. Round 2 adds --flint-400 #abb5b8 for muted-foreground (replacing #b3b3b3), --flint-850 #262c2e for edges/borders (replacing #2b2b2b), --flint-900 #212729 for border/input (replacing #262626), and --flint-950 #1a2022 for quiet edges (replacing #1f1f1f). Store search edge and Grid/Crate frame use Flint 700; inactive nav links use Flint 400. Grounds, ink, Flint, Sea and error red remain unchanged.

Sea means pre-order only: filled Pre-order / Pre-order vinyl, pre-order status, Vinyl ships, the Pre-orders selection and count. Ordinary Buy/Add to cart and Listen never use Sea.

Flint means buy and labels: 700 #626e72 fills Buy / Buy vinyl / Buy CD / Buy cassette / Add to cart, edges tags, Sold Out and Only N left, supplies Read News / View Full Roster / Continue shopping inverse edges and fills the hero hover sweep. Flint 800 #4d595c is the hover/pressed purchase face; 500 #889396 is tag/kicker text, artist/current nav/tab underline and selected chip edge; 300 #c1cbce is hover text on Flint information and form-error text beside Error. The rgba(98,110,114,.16) surface belongs to selected chips, inverse hover and status/error panels. No accent-coloured titles.

Amber means Listen and small marks: --amber-500 #e3b56c supplies resting/hover Listen edges, equalizer bars, date/catalog lines, current swipe dots, hover underlines, input focus edges, newsletter success rule, footer meta, Est. 2026 and artist teaser meta. --amber-300 #f0d7b0 supplies the In player label. --amber-surface rgba(227, 181, 108, 0.16) supplies focus rings, Listen hover and In player surfaces. No solid amber action face. Store format lines remain plain Inter 13px semibold capitals in ink, without a leading mark; Buy keeps its existing format icon.

Error red marks the international restriction notices only: the item page's Ships within Greece only notice, Store strip, cart drawer and checkout card. Error 700 #bc4945 is the notice edge; 500 #e4706a is the icon and restriction text. Never use error red as a control face or for form validation errors.

The rule of thumb is: Sea means pre-order, Flint means buy and labels, amber means listen and small marks, error red marks the international restriction.

Every action label is #f5f5f5, including resting chips. The #090909 label on the #e8e8e8 neutral face is the exception; its label becomes white when the hero fills Flint. The In player status label uses --listen-text: var(--amber-300) (#f0d7b0). Muted counts/placeholder text and coloured metadata are information, not action labels. This overrides the muted chip labels in proposal.css. Generic icon buttons stay neutral; an icon-only Listen remains a semantic Listen and keeps amber #e3b56c bars/edge.

### Colour theory and contrast

Flint remains the cool tinted neutral at OKLCH hue 215 alongside Sea and the chosen warm amber accent. Its chroma of 0.012 to 0.016 keeps the site's monochrome character while matching the other families' lightness steps. The white #f5f5f5 label on Flint 700 is 4.82:1; Flint 500 text is 5.84:1 on Charcoal #141414 and visibly darker than muted Flint 400 #abb5b8. Flint 700 edges are 3.50:1 on Charcoal, so purchase faces and outlines remain distinct from the ground.

Error red at OKLCH hue 25 remains alongside the Sea, Flint and amber families, reserved for blocking international restriction notices. Error 500 text is 5.99:1 and error 700 edges are 3.66:1 on Charcoal. Form validation keeps Flint 300 beside its explicit Error label; this revision changes no restriction, validation or consent meaning.

### Controls and motion

- Standard visible/tappable height 44px; square corners, 1px edge, Bebas Neue 16px capitals, 0.06em tracking, 1px top nudge, horizontal padding 16px, 18px icon with 8px gap; ordinary labelled minimum width 112px.
- Generic icons and phone Store Listen are 44×44. The two-up phone Store purchase action can use the approved approximately 95px width and 10px horizontal padding. These are width exceptions, never height exceptions.
- Two adjacent actions use one filled and one outlined control. On phones each takes half the available row with a 16px gap; on desktop they hug the label from 112px. Price is inert text. Non-buyable status is not a second action; absent Listen leaves one purchase control.
- Buy uses Flint #626e72 at rest, #4d595c hover/pressed; hover edge #889396. Keep the existing white format mark and finite format animation. Pre-order uses Sea #2d766a, #256258 hover/pressed, #4ca999 hover edge.
- Listen uses #141414 face with --listen-edge and --listen-bars both var(--amber-500) (#e3b56c), at rest and on hover. Hover/session and focus-ring surfaces use --amber-surface rgba(227, 181, 108, 0.16). In player is full-opacity disabled session information with a white action label and --listen-text var(--amber-300) (#f0d7b0) status label; generic disabled controls use 45% opacity. Existing session state does not prove provider playback.
- Inverse actions use #141414 face/#626e72 edge; hover #202223/#889396. Neutral controls are Browse the Store, Pay, Subscribe, Show N items and Send inquiry.
- Every focus-visible ring is 2px #f5f5f5 at 2px offset. Inputs additionally use the amber #e3b56c focus edge; it never substitutes for the ring. Hover only on hover-capable pointers; transitions at most 250ms except the approved Home Soft edge slice below, no control movement, no retained touch-hover.
- Hero Browse the Store is the only 48px control: Bebas 18px, 0.06em, padding 22px start/18px end, 11px icon gap, trailing arrow. Flint rises from the base in 240ms using cubic-bezier(0.22,1,0.36,1); the arrow travels 6px inside the fixed box. Keyboard focus shows the same state; reduced motion changes instantly. Owner-approved 16 October 2026: tagline-to-button gap increases by 16px on phones and 24px from 48rem; sideways-phone hero height is unchanged. The CTA change is recorded in commit 3e8ee282 (`feat(web): a smaller, lower Browse the Store hero button`); verification evidence has not been supplied.
- Interactive text rows and swipe-dot buttons retain 44px targets. Static tags use Inter 12px/18px, 0.12em, 4px 8px padding with Flint edge/text. Kickers use Inter 12px/18px, 0.22em. Date/catalog metadata uses Inter 12px/18px, 0.18em and amber.
- Form error text is Flint 300 #c1cbce, begins with visible Error, and retains invalid state and error/control association. Do not recolour transactional truth or change validation.

### Home pre-order Soft edge refinement (19 October 2026)

The owner selected **Soft edge** and approved its implementation plan. The reference is the `data-variant="Soft edge"` / `data-effect="edge"` variant in `C:/Users/SVall/.codex/visualizations/2026/10/19/01a152f2-7060-7b90-bb1e-03fdc3f7fc2b/preorder-button-motion.html` (SHA-256 `d240d0b3476dad5f81aa1b626dd45950fd2f53ea62a229ef59f7bc88ca6a1f73`). The canvas opens on Slow fill and its older receipt names Slow fill; the owner's final Soft edge selection supersedes both defaults. Port the tonal face and centre-out line, not an upward fill.

- Scope all Home showcase purchase actions, including video, photograph and cover-only chapters. Retain 44px geometry, white Bebas labels, existing price/facts and the Sea Pre-order / amber Listen pair. Store/Releases pre-order actions and the separate Flint hero CTA are unchanged.
- Add one internal `aria-hidden`, noninteractive decorative layer beneath the label in `StorePreorderShowcase`. Its face and line can use their own pseudo-elements; do not replace the shared `.site-button::before` touch halo, clip that halo or obscure the focus outline. Scope styles to Home in `global.css` and leave module exports and public data/props unchanged.
- Desktop hover and keyboard focus: fade the Sea 800 face (`#256258`) over the Sea 700 rest face (`#2d766a`) in **385ms**. Reveal a **1px** Sea 500 (`#4ca999`) lower hairline in **700ms**, scaling horizontally from **0.2 to 1** around its centre and fading to **0.72 opacity**. Insets are **6px** on either side and **4px** above the bottom; transparent ends reach full line colour at 15% and 85%. Use `cubic-bezier(.22,.61,.36,1)` and a **455ms** exit. The hover border uses Sea 500. Desktop press shows the darker end state immediately. The label, hit box and neighboring content stay fixed.
- Select touch press behavior by touch events or a non-hover/coarse primary input, not by viewport width. On mobile, the face and line animate in **220ms** and retreat in **180ms**. Retain the visual press until 220ms from pointer down for quick taps, while preserving immediate native activation, modified clicks, the Store Item destination, accessible name and prefetch behavior. Mouse clicks in non-hover/coarse emulation must show the same finite animation.
- Keep the pointer state and one cancellable timer local to the rendered action. Ignore secondary buttons and additional pointers; reset on repeated presses, pointer cancellation, mouse departure, window blur and unmount. Do not delay or cancel navigation, add startup timers or perform frame-by-frame JavaScript animation. Clear pending motion/visual holds when reduced motion applies. Native fallback remains usable before hydration and without JavaScript.
- Use the shell's existing load directive for the Home showcase island. Cold entry from Services or Releases can lack Astro's idle directive and leave an idle island inert; switching this island from idle to load preserves its server markup and enables the same local handlers on direct, cold shell and cached entry without changing the shell API.
- Reduced motion removes transitions and the minimum visual hold, retains state feedback and the existing 2px ink focus ring, and leaves navigation unchanged. No idle motion, dependency, scroll listener/timeline, prototype picker, duration control or preview status message is part of production.
- Codex updates the relevant DESIGN.md button and pre-order guidance under the owner's explicit ownership override for this slice. Existing canvas checks establish preview behavior only; verify the integrated page, source-bound tests and player continuity separately.

This new slice is **Local only**. It grants no staging, commit, push, deployment or publication authorization and does not reopen or extend earlier release permissions.

### DESIGN.md rule list for Claude

1. Replace palette frontmatter, colour sections, Key Characteristics, Commerce Is Subordinate and obsolete Do/Don't references to Store Blood/Services Rose.
2. Sharpen Sea Green Marks The Wait: resting Sea purchase fills allowed only for pre-orders.
3. Add Flint Means Buy And Labels and Amber Means Listen And Small Marks with the role map above; reserve the separate error red family for international restriction notices only.
4. Tighten Monochrome Owns The Page: public titles remain ink Veneer.
5. Replace three button sizes/coarse-pointer halos with 44px plus the one 48px hero exception; document width exceptions, white labels and the pair rule.
6. Retire Music Trigger Glow; use --listen-bars and --listen-edge as var(--amber-500), --listen-text as var(--amber-300), and --amber-surface for focus rings, Listen hover and In player surfaces; retain finite equalizer/session semantics.
7. Replace the Store Buy Listen-chrome refinement with Flint fills and existing per-format marks.
8. Replace framed pre-order/digital browse badges with plain status lines; remove the 3px Sea action baseline and move the sweep to the Flint hero.
9. Give Sold Out and Only N left the Flint #626e72 edge and rgba(98,110,114,.16) surface; keep Coming Soon/Repressing as dashed neutral boxes. Update Notify me errors and form focus without changing state eligibility.
10. Remove inherited data-tone accents; document Flint current underline, amber hover underline and selected chip meanings.
11. Record the page-frame rule, with detailed layout owned by C3; record the owner's removal of manual Home chapter motion controls on every viewport, reduced motion as the opt-out and the phone film strip in C3.
12. Preserve Staff's separate design system and content-owned footer wording.

### Research backing and alternatives

The supplied October research used headless Chromium with an iPhone 15 profile (393×659), sometimes removing overlays after load. Dais exposed records at y=242 under one 44px browse row; Norman used a separate Filter layer but a 340px editorial introduction delayed its first product to y=736. Erased Tapes and Phonica made artist/format legible; Ninja Tune and Phonica kept play near artwork or buying. This supports C2's compact toolbar and filled purchase/outlined listening distinction. It is pattern evidence, not a copied visual identity or a new independent browser study. Baymard evidence was search snippets only; blocked sites and unmeasured footers are not evidence.

Retired alternatives are monochrome-only grey, Rust/Steel, Lichen/Sand, Services Rose, Sea for ordinary Buy, coloured titles, multiple size tiers. The approved exact hex values take precedence over general palette-generation advice. The owner chose pre-redesign amber for Listen and small marks on 16 October 2026; the exact values above govern every consumer.

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

## Resolved open items and integration

The owner settled the 48px hero on 16 October 2026 (CTA commit 3e8ee282), white labels, neutral submission controls, Flint 300 form-error text with international restriction notices alone in error red, 16px phone gutter, Sea-only pre-orders, amber, Store header removal everywhere and corner Listen. The orchestrator retained today's catalogue order and Distro format links/counts, placed the purchase note and international strip below the grid on every category, removed manual chapter motion controls on every viewport by the owner's knowing 16 October decision, removed the Store format-line mark and set the footer target to about 200px. Preserve source copy, including the current “1 Releases” wording, unless separately edited. Preview estimation and the older “nothing was rendered” note are not implementation acceptance.

C1 modifies the complete listening-session requirement for colour; C2 subsequently replaces its Store placement scenario while retaining C1's colours and all player scenarios. C3 changes separate release/Home requirements. Reconcile catalog-number date-line wording from the still-open add-release-catalog-numbers change to amber on integration; retain the number, semantics and wrapping. Sequence shared global.css, DESIGN.md and primitive edits with one writer. Claude owns the presentation work; no dedicated Codex data, tooling or boundary implementation is required.

## Risks / Trade-offs

- Similar Flint tags and Buy controls → static Inter outlined tags, filled Bebas actions, noninteractive status semantics and rendered phone checks.
- White-label overrides differ from CSS samples → test rest, hover, focus, selected, busy and In player explicitly.
- Fixed 44px controls with long copy → let adjacent informational text wrap and containers grow; never clip or shrink targets.
- Baseline specs contain superseded presentation text → replace full touched requirements, retain unaffected scenarios, and reconcile active sibling deltas before archive.

## Migration and verification

Implement C1 first, then C2/C3; retain all tasks unchecked until implementation evidence exists. Run focused owning-module tests and browser scenarios, then final pnpm validate and one coordinated main push to UAT. Record source fingerprints and release identity. No PRD promotion or Content Publication is implied. Recover a failed UAT candidate through the existing forward/revert release procedure, without changing stock or accepted content.
