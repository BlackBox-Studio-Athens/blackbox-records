# Design

## Context

See proposal.md for scope and C1 dependency. The planning inputs are under `S = C:/Users/SVall/AppData/Local/Temp/claude/C--Users-SVall-WebstormProjects-blackbox-records/df1730c8-1e77-423e-be64-90793f3b8df0/scratchpad`: `feedback-map.md`, `audit/audit.md`, `canvas2/project/proposal-notes.md`, `canvas2/project/proposal.css`, `canvas3/project/store-releases-notes.md` and `canvas3/project/research.md`. The owner's latest orchestrator decisions supersede the initial planning defaults and inconsistent CSS samples. This document retains the implementation decisions so the temporary inputs are not the only record.

Audit-time locations at adc595c8: `StorePreorderShowcase.tsx:317-431`, `ReleaseCard.astro:296-306`, `ArtistCard.astro:87-90`, `Footer.astro`, and `global.css:99-100,301-311,529-542,1276-1306,5973-6236,7739-7900`. The fixture measured Home showcase 390×1296, featured Release 358×1084, catalog Release 358×667, artist counter 106×82 with 35.2px value, and footer 417px at 390px. The fixture had no Home background film, so phone pause behavior was located in source, not measured.

## Goals / Non-Goals

Use the approved composition with complete artwork and natural document flow. Keep the existing Home projection/read lifecycle, release role selection, offer validation, content-owned footer copy and shell player. Layout should not require new data. No forced-height clipping, new motion library or new provider behavior.

## Decisions

The owner chose pre-redesign amber for Listen and small marks on 16 October 2026: --amber-500 #e3b56c for resting/hover edges, equalizer bars and small marks; --amber-300 #f0d7b0 for the In player label; --amber-surface rgba(227, 181, 108, 0.16) for focus rings, Listen hover and In player surfaces. --listen-bars and --listen-edge are var(--amber-500); --listen-text is var(--amber-300). The Flint neutral system also applies: 400 #abb5b8 muted text/inactive navigation, 850 #262c2e edges/borders, 900 #212729 border/input, 950 #1a2022 quiet edges, and 700 #626e72 Store search and Grid/Crate frames. Grounds, ink, Flint, Sea and restriction-only error red retain their values.

The approved 16 October 2026 revision inherits C1's Flint cool gray family (OKLCH hue 215, chroma 0.012 to 0.016): #626e72 purchase faces/edges, #4d595c hover/pressed faces, #889396 labels and underlines, #c1cbce hover/form-error text and rgba(98,110,114,.16) surfaces. Sea remains pre-order only and amber remains Listen and small marks. Error red (#bc4945 edges, #e4706a icons/text, rgba(188,73,69,.16) defined surface) belongs only to the non-Greek buyer's item page notice, Store strip, cart drawer and checkout card, whose faces stay Charcoal; never to a control face or form validation error.

### Page frame

Retain `--page-gutter: 16px` below 640px, 24px from 640px and 32px from 1024px, never smaller than the safe-area inset. At 390px content is between x=16 and x=374. Retain the existing 72rem editorial/header/footer frame and Store's 90rem maximum; this change removes bleed, not the explicit Store width allowance.

Only the header and Home hero film layer, including its still fallback/shade, may cross the content edges. Hero copy/CTA and its divider remain contained. Home chapter media/facts, section backgrounds/rules, Store category rules, swipe rows and footer/meta rules stop at their applicable frame. Modal backdrops may cover the viewport for interaction, but dialog content and controls respect safe-area/gutter padding; this is not permission for page content to bleed.

Remove second internal insets that make the frame appear wider: News card padding 20px to 16px and redundant Home facts/band padding. Preserve natural content growth at 320px and text zoom. The rejected 14px/12px gutter alternatives are settled by the owner.

### Home pre-order chapter

Keep first-paint projection inclusion, chapter order and accepted media. On phones use the approved contained 16:9 artist-photo/poster crop (358×201 at 390px), a complete square noninteractive sleeve, artist link, ink Veneer title, plain digital/pre-order status, format/price and the shared Pre-order + Listen row. The two actions are equal-width 44px controls, 16px apart; Sea #2d766a Pre-order with white label and amber #e3b56c Listen edge/#e3b56c bars with white label. Put truthful shipping by the purchase facts once, then compact readable facts/summary and existing Pre-order & delivery information / All pre-orders links. Omit missing optional content without empty panels. Do not repeat full payment/whole-parcel copy.

Contain chapter photos, films and rules. Retain original assets and recognizable subjects; the approved landscape poster crop applies to chapter backdrop, never the square sleeve. No fixed chapter-height acceptance: reduce duplicate bands/insets/oversized actions and keep actual content readable. Desktop retains its media composition while using the shared controls and frame.

Keep the Home pre-order film chapter's pause/resume control on phones and desktop as a neutral 44×44 icon with visible focus and an accessible name reflecting its state. The designer's request to remove it on phones is a declined deviation: film chapters need a user-controlled pause mechanism under [WCAG 2.2.2, Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). Manual pause remains effective when focus moves away and when returning to the chapter. Automatic visibility, hidden-tab and active-player pausing remain additional behavior, not a replacement for this control. Reduced motion, data saving, refused autoplay and source failure keep the complete poster without a misleading motion control. Preserve Watch/full-video consent, Close, Back/Forward, provider permissions, no competing audio and focus restoration. This decision concerns pre-order film chapters; other Home hero motion behavior is unchanged.

### Releases composition

Preserve existing exclusive editorial roles, role ordering, no visible page introduction and complete square contained covers. Only the following card presentation changes:

- Phone featured: cover; action pair 12px below it; amber date/catalog line; ink Veneer title 37.6px; artist; formats with Bebas price 28px at the right; plain status/shipping; summary initially at most three lines; Read more and delivery-information links in a 44px row, wrapping when needed.
- Phone catalog: cover; Buy vinyl / Buy CD / Buy cassette with the white format mark plus Listen; date; ink Veneer title 24.8px; artist; formats/price; status. No summary is added.
- Wide featured: matching approximately 462px covers in the existing 29rem region, copy beside it; date, title 66.4px, artist, then price + purchase + Listen, formats/status and full summary. Catalog retains its 32.8px desktop title and existing one/two/three-column responsive grid.
- The summary disclosure is a real keyboard-operable Read more / Show less control with expanded state and complete text available. It is omitted for absent/short summaries. Without enhancement the full summary remains available. No data truncation.
- Pre-order and ordinary purchase facts retain their authoritative meaning. Non-buyable editions keep the established edition-detail path and status; missing Listen yields no placeholder. Price on phones sits by formats after the identity, while desktop price stays beside actions. No duplicated price/read or edition action.
- Only the first featured image receives priority. Keep title detail links, artist links, shared edition/artwork target semantics, original catalog-number accessibility and independent Listen focus.

Round 2 reduces Releases card gaps and padding; the supplied 390px page-height measurement falls from 2748px to 2556px. The earlier preview estimates featured/catalog phone heights at 720/583px and desktop featured at 462px. These are comparison measurements, not fixed containers; 320px, long content and expanded summaries must grow. Read more is a disclosure, not a replacement for the existing detail link.

### Artists, swipe rows and footer

Artist counter becomes inline “1 Releases” (current wording retained) adjacent to Latest metadata, using compact UI/body-scale text rather than the bordered 106×82 block or 35.2px value. Preserve the computed count, artist order, complete photos and Latest links.

Round 2 uses two roster columns from 360px with tighter card padding and the existing 3:4 photo frame. At 390px the supplied page-height measurement falls from 3065px to 1583px. Below 360px and for enlarged text, reduce columns before identity or links clip; content grows naturally.

Home Artists/News still swipe below 40rem and keep desktop grids. Clip the row at the right content edge; the next-card peek remains inside that frame (approximately 42px for the approved News reference). Each dot has a 44×44 target, with the small current mark in amber #e3b56c, position name and aria-current. Retain script-free fade fallback and reduced motion; no page horizontal scrolling.

Round-2 phone footer targets about 200px at 390px (supplied measurement: 198px), superseding 290px. Put the production logo and social icons on one 44px row, the tagline in two 12px lines, eight links in four columns of two 44px rows filled column-first so no link sits alone, and meta in one 12px sentence-case line including Est. 2026. Preserve copy, destinations and reading order including Delivery information. Hide the Sitemap label visually on phones; retain its desktop Flint 500 #889396 treatment. Social icon controls remain 44×44 and link hover underlines use amber. Compact gaps, not targets or legal copy. Preserve Staff text's natural wrapping, allow additional height at enlarged text or narrower widths, and keep the footer visible above the minimized player.

### Research backing and alternatives

The supplied Store research supports compact mobile purchase paths: Ninja Tune places buying within one screen of a cover; Phonica keeps play near buying; reached Erased Tapes/Sacred Bones grid cards avoid long summaries. This motivates nearby paired actions and a reversible summary disclosure. It did not measure footers, so the footer target comes from the approved preview and BlackBox's own 417px audit, not a third-party benchmark. Research used headless 393×659 Chromium with locally dismissed overlays; Baymard was snippet-only and blocked sites supply no findings. No claim of a newly performed browser study is made.

Reject narrower gutters, full-bleed chapter bands, coloured titles, framed counters, removal of the phone film pause control, full-width stacked purchase buttons and fixed-height card clipping. Keep actual production Veneer instead of a substitute.

## F1–F22 coverage

C1 = accent-and-button-system; C2 = store-mobile-first-browse; C3 = mobile-layout-rhythm.

| Item | Approved answer                                                                      | Owning change                    |
| ---- | ------------------------------------------------------------------------------------ | -------------------------------- |
| F1   | Remove Store Blood and Services Rose                                                 | C1                               |
| F2   | Use chosen amber for Listen edge, bars, session state and small marks                | C1                               |
| F3   | Keep Sea exclusively for pre-orders; add Flint and amber                             | C1                               |
| F4   | Colour tags, kickers and small marks; keep all Veneer titles ink                     | C1                               |
| F5   | Use named accents at rest within monochrome grounds                                  | C1                               |
| F6   | Flint news tags and Read News inverse edge                                           | C1                               |
| F7   | Remove desktop Store side pane                                                       | C2                               |
| F8   | One toolbar row; one phone Filter sheet                                              | C2                               |
| F9   | 44px controls, only hero CTA 48px                                                    | C1                               |
| F10  | Sea Pre-order and Flint Buy filled at rest                                           | C1                               |
| F11  | Plain ink format before title, stronger artist credit, plain digital/pre-order lines | C2                               |
| F12  | Ink-faced 48px Browse the Store with Flint sweep                                     | C1; C3 preserves hero frame      |
| F13  | Home Listen uses the shared 44px family                                              | C1; C3 places the pair           |
| F14  | Shared pair and compact chapter; keep 44px phone pause/resume for film accessibility | C1 and C3                        |
| F15  | Retain dated research, evidence limits and measured browser acceptance               | C1, C2 and C3                    |
| F16  | Keep approved 16px phone gutter; remove double insets                                | C3                               |
| F17  | Contain rules/media; header and hero film are the only bleed exceptions              | C3                               |
| F18  | Compact phone footer, approximately 200px at 390px, with 44px tap rows               | C3                               |
| F19  | Inline artist release counter                                                        | C3                               |
| F20  | Release actions beside one another near cover; compact hierarchy                     | C1 pair contract; C3 composition |
| F21  | Flint Buy keeps the format mark; context-specific label                              | C1; C2 Store placement           |
| F22  | Hidden Store H1; one sheet relocates existing Distro format links and filters        | C2                               |

## Resolved open items and remaining evidence

The owner settled hero-film bleed, 16px gutters, approximately 200px footer with 44px tap rows, inline count, retained 44px phone film pause/resume, adjacent pairs, ink Veneer titles, amber marks and Flint 300 form-error text beside Error; error red is reserved for international restriction notices. C1 owns the hero CTA's 48px exception and global error/colour rules; the owner-approved 16 October 2026 CTA metrics are Bebas 18px, padding 22px start/18px end, an 11px icon gap and tagline-to-button spacing increased by 16px on phones and 24px from 48rem, with sideways-phone hero height unchanged (commit 3e8ee282). Preserve current motto content/cycling; differing screenshot word-cycle states do not authorize a copy edit.

The approved photo/poster crop is the default. Exact wrapping, long-content height, final image crop and typography need rendered implementation verification, not another palette decision. Catalog desktop was not drawn in the supplied Store/Releases board set; preserve the existing 32.8px catalog title and grid as recorded in those notes.

## Risks / Trade-offs

- Footer content may exceed the approximate height → allow wrapping/growth, retain copy and targets, compare the normal fixture separately from stress cases.
- Summary clamping can hide content from keyboard/no-JavaScript users → real disclosure and complete fallback, preserving underlying accepted text.
- A restyle can hide or break the retained film pause control → verify 44px geometry, keyboard/touch operation, persistent manual pause, reduced motion, data saving, visibility/player pause and failure posters.
- Containing the swipe peek can reduce the cue → retain a visible peek inside the frame and accessible dots.
- C2/C3 share global styles and Store frame → sequence writers and perform combined 320/390/1440 checks.

## Migration and verification

Claude owns rendering, interactions, copy and UI tests using the existing data. No dedicated Codex data, tooling or boundary implementation is required; existing data behavior is covered by shared regression verification. Update DESIGN.md's frame, Home motion/chapter, Releases order/price/summary, artist counter and footer rules. Use focused module/e2e checks and visual comparison, then final pnpm validate and one coordinated main push to UAT with source-bound evidence. No publication, PRD or provider work is implied; use the normal release recovery procedure if the UAT candidate fails.
