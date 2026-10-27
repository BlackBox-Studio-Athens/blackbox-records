---
name: BlackBox Records
description: Monochrome editorial label site and storefront for BlackBox Records.
colors:
  void-background: '#0d0d0d'
  ink-foreground: '#f5f5f5'
  black-card: '#0f0f0f'
  charcoal-surface: '#141414'
  hover-surface: '#161616'
  soft-muted: '#abb5b8'
  hard-border: '#212729'
  deep-border: '#262c2e'
  primary-inverse: '#090909'
  control-ink: '#e8e8e8'
  sea-green: '#2d766a'
  sea-green-pressed: '#256258'
  sea-green-text: '#4ca999'
  flint: '#626e72'
  flint-pressed: '#4d595c'
  flint-text: '#889396'
  flint-error: '#c1cbce'
  amber: '#e3b56c'
  amber-light: '#f0d7b0'
typography:
  display:
    fontFamily: 'Veneer, Bebas Neue, Impact, sans-serif'
    fontSize: 'clamp(2.35rem, 8.5vw, 4.15rem)'
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: '0.04em'
  headline:
    fontFamily: 'Veneer, Bebas Neue, Impact, sans-serif'
    fontSize: 'clamp(1.7rem, 6vw, 2.65rem)'
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: '0.04em'
  title:
    fontFamily: 'Veneer, Bebas Neue, Impact, sans-serif'
    fontSize: 'clamp(1.55rem, 4.6vw, 2.05rem)'
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: '0.035em'
  body:
    fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: '0.95rem'
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 'normal'
  label:
    fontFamily: 'Inter, Helvetica Neue, Arial, sans-serif'
    fontSize: '0.72rem'
    fontWeight: 500
    lineHeight: 1
    letterSpacing: '0.22em'
  mono:
    fontFamily: 'Geist Mono, Courier New, monospace'
    fontSize: '0.74rem'
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: '0.12em'
rounded:
  none: '0'
  sm: '0.1rem'
  md: '0.225rem'
  lg: '0.35rem'
  pill: '999px'
spacing:
  xs: '0.5rem'
  sm: '0.75rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
  section: '4rem'
components:
  button-primary:
    backgroundColor: '{colors.control-ink}'
    textColor: '{colors.primary-inverse}'
    rounded: '{rounded.none}'
    padding: '0 0.75rem'
  button-outline:
    backgroundColor: '{colors.charcoal-surface}'
    textColor: '{colors.ink-foreground}'
    rounded: '{rounded.none}'
    padding: '0 0.75rem'
  catalog-card:
    backgroundColor: '{colors.charcoal-surface}'
    textColor: '{colors.ink-foreground}'
    rounded: '{rounded.none}'
    padding: '1.25rem'
  input:
    backgroundColor: '{colors.void-background}'
    textColor: '{colors.ink-foreground}'
    rounded: '{rounded.md}'
    padding: '0.5rem 0.75rem'
---

# Design System: BlackBox Records

## 1. Overview

**Creative North Star: "The Working Distro Table"**

BlackBox Records should feel like a physical label surface translated to the web: black record sleeves, photocopied show listings, practical service notes, a curated distro table, and a player that stays out of the way until the listener asks for it. The system is dark by default because the site is built around music imagery, night venues, record artwork, and focused browsing.

The visual system is editorial first and commercial second. Storefront, checkout, shipping, and service inquiry screens must stay inside the same monochrome language instead of turning into a generic ecommerce product flow. The work should feel direct and label-operated, not corporate, cute, or algorithmically polished.

**Key Characteristics:**

- Monochrome surfaces with low-contrast tonal layering.
- Condensed uppercase display type for identity and section rhythm.
- Three fixed accents at one level: Sea Green for pre-orders, Flint for buying and the labels you read, amber for listening and small marks.
- Square or hard-edged cards, flat by default, with image motion used carefully.
- Content-owned copy and metadata, never debug labels or backend identifiers.

## 2. Colors

The palette is near-black and off-white with three fixed accent roles (accent-and-button-system, 15 October 2026): Sea means pre-order, Flint means buy and labels, amber means listen and small marks. Flint, a cool gray (OKLCH h215, chroma 0.012 to 0.016), replaced Violet on 16 October 2026 so the third role reads as a neutral rather than a third hue. The owner chose the pre-redesign amber over Slate for Listen and small marks on 16 October 2026. Store Blood, Services Rose, Violet and Slate are retired. Every Veneer title, ground, card and line of body copy stays ink or grey.

### Primary

- **Ink Foreground** (#f5f5f5): Primary text, primary filled buttons, active shell states, and high-contrast marks.
- **Void Background** (#0d0d0d): Site body and default page background.

### Secondary

- **Flint** (cool gray; #626e72 face and edges, white label 4.8:1, hover #4d595c, text on dark #889396 at 5.8:1 on Charcoal Surface, error text #c1cbce, surface `rgba(98, 110, 114, 0.16)`): fills Buy, Buy vinyl and Add to cart; edges browse actions (Read News, View Full Roster, Continue shopping), Store Sold Out and Only N left; colours tags, kickers, artist link underlines, the current-page and current-tab underline, selected filter chips and error text. Tokens `--flint-800/700/500/300` and `--flint-surface`.
- **Amber** (edges, text and marks #e3b56c, light #f0d7b0, surface `rgba(227, 181, 108, 0.16)`, 16 October 2026): Listen edge and equalizer bars, In player, the date and catalog line, current dots, link hover underlines, input focus edges, footer meta and Est. 2026. Tokens `--amber-500/300` and `--amber-surface`.
- **Preorder Sea Green** (#2d766a, hover #256258, text on dark #4ca999, surface `rgba(45, 118, 106, 0.16)`): The wait for copies that are not on the shelf yet. Tokens `--sea-800/700/500/300` and `--sea-surface`; `--preorder-accent`, `--preorder-accent-active` and `--preorder-accent-surface` remain as aliases. It fills the Pre-order control at rest (Ink Foreground label, 4.9:1), colours the plain pre-order status line and the Pre-orders chip count and selection (6.5:1 on Charcoal Surface), and draws the 2px top edge of pre-order panels and the outline of the facts list and ships-together notice. Never on page washes or ordinary items.
- **Error red** (#bc4945 edge, #e4706a icon and text at 6.0:1 on Charcoal Surface, surface `rgba(188, 73, 69, 0.16)`; OKLCH h25, the warm opposite of the cool accents): Error red marks the international restriction notices only (Ships within Greece only, the Store strip, the cart drawer and checkout cards). Icon, edge and text; never a control face. Form errors stay Flint error text after their "Error" label. Tokens `--error-700/500` and `--error-surface`.

### Neutral

- **Black Card** (#0f0f0f): Popovers, cards, and framed panel bases.
- **Charcoal Surface** (#141414): Catalog cards, artist surfaces, and repeated editorial modules. The footer sits on the Void ground.
- **Hover Surface** (#161616): Hover and focus-within tonal lift for cards.
- **Soft Muted** (Flint 400, #abb5b8; was #b3b3b3): Secondary body text, metadata, "by" credits, dates, counts, status lines such as Digital out now, and inactive header links. 9.3:1 on Void, 8.8:1 on Charcoal.
- **Hard Border** (Flint 900, #212729; was #262626): Default token border, input stroke and the Store category tab line.
- **Deep Border** (Flint 850, #262c2e; was #2b2b2b): Explicit editorial dividers, image frames, card borders, footer rules and control rest edges; the quiet edge is Flint 950 (#1a2022; was #1f1f1f).
- **Primary Inverse** (#090909): Text on the light primary button.

### Named Rules

**Flint tints every neutral that carries information** (round 2, 16 October 2026). Muted text, hairlines, card borders and control rest edges are Flint steps at the lightness of the pure greys they replaced (OKLCH h215, C .008 to .012), so contrast holds and the site reads as a tinted monochrome rather than pure black and white. The Store search edge and the Grid / Crate frame take Flint 700. Grounds (#0d0d0d, #141414, #0f0f0f), Ink, Sea, amber and the error red stay as they are.

**The Monochrome Owns The Page Rule.** Black, charcoal, off-white, and gray must carry the screen. Accent color clarifies an action or a label; it must not recolor the whole product. Every Veneer title stays Ink Foreground.

**The Flint Means Buy And Labels Rule.** Flint fills Buy, Buy vinyl and Add to cart, edges browse actions, and carries tags, kickers, artist link underlines, current underlines, selected filters, Store Sold Out and error text. Editorial Releases has the scoped Sold out exception below. Never a title.

**The Amber Means Listen And Small Marks Rule.** Amber draws the Listen edge and bars, In player, the date and catalog line, current dots, format marks, hover underlines, focus edges and footer meta. Never a face or a title.

**The Commerce Is Subordinate Rule.** Checkout UI must still look like BlackBox, not a payment provider, marketplace, or Shopify theme. No route has its own accent.

**The Sea Green Marks The Wait Rule.** Preorder Sea Green appears only where an item or order waits for copies: it fills Pre-order and Pre-order vinyl at rest, marks every pre-order status, and appears nowhere else. It does not wash sections or tint ordinary items.

## 3. Typography

**Brand Display Font:** Veneer, with Bebas Neue, Impact, and sans-serif fallback.
**UI Display Font:** Bebas Neue, with Impact and sans-serif fallback.
**Body Font:** Inter, with Helvetica Neue, Arial, and sans-serif fallback.
**Label/Mono Font:** Geist Mono, with Courier New and monospace fallback.

**Character:** Brand display type is physical, letterpress, loud, and poster-like. UI display type stays compressed and clean for dense cards and controls. Body type is quiet, practical, and readable, with labels pushed into uppercase tracking for editorial metadata.

**Greek public-title exception (approved 18 October 2026).** A public content title containing Greek uses the existing self-hosted Inter at weight 600 for its entire text, including Latin words in mixed titles. Latin-only titles retain Veneer. Preserve each surface's casing, size, wrapping, links and layout. This applies to the Public Title Rule and Store Listing Scale below; credits, prices, controls and Staff keep their existing treatment.

### Hierarchy

- **Display** (900, `clamp(2.35rem, 8.5vw, 4.15rem)`, 0.98 line-height): Veneer for homepage hero, public route heroes, artist detail H1s, and major release/artist feature titles.
- **Headline** (900, `clamp(1.7rem, 6vw, 2.65rem)`, 0.98 line-height): Veneer for public section titles, distro group headings, service offering titles, and editorial route panels.
- **Title** (900, `clamp(1.55rem, 4.6vw, 2.05rem)`, 0.98 line-height): Veneer for public artist, release, distro, store, and service content titles.
- **Body** (400, `0.95rem`, 1.7 line-height): Paragraph copy, service descriptions, checkout explanations, and artist profile text. Keep long prose near 65 to 75 characters per line.
- **Label** (500, `0.72rem`, 0.22em tracking): Eyebrows, metadata, nav labels, status labels, and section kickers.
- **Mono** (400, `0.74rem`, 0.12em tracking): Technical-feeling but public-safe small metadata where monospace is already used.

### Named Rules

**The Public Title Rule.** Veneer owns public content titles: artist names, release names, distro/store item names, cart and checkout line item names, service offering titles, group headings, route heroes, and major editorial feature titles. Bebas Neue remains the compact UI display face for navigation, buttons, prices, cart/checkout chrome, totals, controls, labels, stock operations, order-state surfaces, metadata-heavy panels, and any surface where texture would slow scanning.

**The Store Listing Scale.** Store listing cards (store-mobile-first-browse, 15 October 2026) read artwork, format, title, artist, status, then price and action. The actual format precedes the title as a plain ink Inter 13/16px semibold capitals line, without a leading mark. Titles stay Veneer weight 900, source-cased, at the existing responsive 20–24px size. The credit underneath uses Inter medium at 16px on phones and 17px on desktop: a muted “by” and the unchanged artist or label name in ink, with a Flint underline on verified artist links, which remain independent. Lifecycle status is plain text; prices are Bebas 20px on phones and 24px on desktop beside one filled action. This applies across All, BlackBox Releases, Distro and populated Merch; item pages, cart, checkout and order confirmation retain their existing typography.

**The Metadata Is Quiet Rule.** Labels may be uppercase and tracked, but they stay small. Do not let metadata compete with release, artist, or item names.

## 4. Elevation

The system is flat by default. Depth comes from tonal separation, borders, image frames, sticky positioning, overlays, and state changes. Shadows are rare and reserved for modal/player surfaces that must sit above the document.

### Shadow Vocabulary

- **Catalog Rest** (`box-shadow: none`): Default catalog, artist, release, news, and distro cards.
- **Overlay Panel** (`0 28px 90px rgba(0, 0, 0, 0.56)`): App-shell overlays and modal-level surfaces.
- **Mini Player** (`0 14px 30px rgba(0, 0, 0, 0.32)`): Floating player continuity surface.

### Named Rules

**The Flat By Default Rule.** Repeated content cards do not lift. They shift border and background only.

**The Shadow Means Floating Rule.** If a surface has a heavy shadow, it must be a modal, overlay, mini player, or similarly floating UI.

## 5. Components

### Buttons

Buttons are hard, typographic controls with direct action language: one family (`apps/web/src/components/ui/button.tsx`), one size, one focus ring. They sit behind the artwork; nothing glows.

- **Shape:** Square (`0`) everywhere, including shared primitives. No pills.
- **Type:** Bebas Neue caps, 0.06em tracking, nudged 1px down to centre the caps. Text actions (Remove, Back to Store, Refresh status) stay Inter 13/500 with an underline. Store Clear filters is the approved exception (9 October 2026): Inter 700 at 16px (15px in the phone filter row) with a 2px underline and a leading × mark.
- **Sizes:** One drawn size, 44px, for every action, chip, toggle, text-action row and icon control (accent-and-button-system, 15 October 2026). The Home hero Browse the Store is the single 48px exception (52px until 16 October 2026). Labels are Bebas 16px caps, padding 0 16px, minimum width 112px for actions.
- **Labels:** Every control label is white (#f5f5f5), except on the ink-faced neutral, whose label stays Primary Inverse.
- **Neutral (ink face):** Control Ink (#e8e8e8) face with Primary Inverse text, lifting to Ink Foreground on hover: Pay, Subscribe, Show N items, Send inquiry and the hero CTA at rest.
- **Buy:** filled Flint (#626e72) with a white label; hover and press #4d595c with a #889396 edge. Store listing cards say Buy and use static 18px Disc3 for every format. Releases say Buy vinyl, Buy CD or Buy cassette: vinyl uses Disc3, while CD/cassette retain `StoreBuyIcon`. The item page keeps Add to cart.
- **Pre-order:** filled Sea Green (#2d766a) with a white label; hover and press #256258 with a #4ca999 edge.
- **Home pre-order Soft edge** (approved 19 October 2026): all video, photograph and cover-only showcase actions keep their 44px box and stationary label. Hover and keyboard focus fade to Sea 800 in 385ms and reveal a 1px Sea 500 line from its centre in 700ms, 6px from each side and 4px above the bottom, with transparent ends and 72% final opacity. Use `cubic-bezier(.22,.61,.36,1)` and a 455ms exit; desktop press is immediate. This Home-only exception supersedes the general 250ms hover limit. Touch or non-hover/coarse input uses a 220ms press and 180ms retreat, holding quick-tap decoration until 220ms from pointer down without delaying native navigation. Reduced motion removes transitions and the visual hold. Preserve the shared focus outline and touch halo; Store and Releases keep their existing treatment.
- **Pair rule:** two adjacent actions are one filled control and its outlined twin at the same height, never two filled or two outlined side by side; a price is text, so a lone filled control may sit beside it.
- **Inverse:** Charcoal Surface face with a Flint edge and white label, for browse actions: Read News, View Full Roster and Continue shopping.
- **Outline:** Charcoal Surface face with a Deep Border edge; hover lifts face and edge. No surface recolours it. Icon controls keep a quieter neutral edge and never take an accent.
- **Listen:** the amber control, chosen by the owner over Slate on 16 October 2026: Charcoal Surface face, #e3b56c edge, white label, #e3b56c equalizer bars; hover keeps the #e3b56c edge on the amber surface. In player is #f0d7b0 on the amber surface.
- **Hero CTA:** 48px, Bebas 18px (reduced from 52px and 20px on 16 October 2026, padding 0 18px 0 22px), ink face with Primary Inverse label and a trailing arrow at rest. Hover and keyboard focus raise a Flint fill from the base edge in 240ms, turn the label white and slide the arrow 6px inside the box; reduced motion switches instantly.
- **Quiet:** Soft Muted text with a hairline underline that grows from the centre on hover.
- **Chips:** Charcoal face, quiet edge and muted label at rest; selected chips take a Flint edge on the Flint surface with a white label and a check mark, and may show their result count. The Pre-orders chip selects in Sea Green.
- **States:** Hover is tonal and only on hover-capable devices; press darkens the face; nothing moves. Focus is a 2px ink ring at 2px on every control. Disabled drops to 45%. Loading keeps the width, sets `aria-busy` and changes the label.
- **Status is not a control:** An item with no copies online shows Coming Soon, Repressing or Sold Out in the purchase slot, as staff chose. Store cards, item page, cart and checkout share these tones; editorial Releases follows the approved quiet exception below: a dashed neutral edge means "not here yet" (Coming Soon, Repressing), a solid Flint edge means Sold Out, and Pre-order keeps Preorder Sea Green. Outside approved Home video/photo desktop media backplates above 800px, status reads as plain text lines without a box: the pre-order line in Sea Green, Digital out now in Soft Muted. On the item page Coming Soon and Repressing add a small 14px leading icon (a disc, a circular arrow) and a muted line below: "First pressing on its way" or "More copies being pressed", then "· Expected Month YYYY" while that month has not passed. Sold Out has no icon or line. A technical selling pause or an unknown state shows the price only: no status and no Buy. A pre-order whose copies ran out reads like any zero-stock card, with no pre-order badge or Pre-order control. Out of Stock, Currently Unavailable and any shopper "Unavailable" label are retired.
- **Notify me:** Under a Coming Soon or Repressing status, a quiet text action with a mail icon, "Email me when it lands", opens a small form in place: an Email field, an unticked one-off consent, Send and a Cancel link. Errors sit in Flint error text (#c1cbce) after a visible "Error" label under their control; success replaces the form with an inline status. Never an outlined or red control, a modal or a toast.

**The Feedback Stays In Place Rule.** Add to cart says Added, Remove leaves an Undo line, Stop ends the player session on its first activation, and Pay fills when the shipping quote is ready. No toasts or confirmation dialogs for these.

**The Header Cart Rule.** The bag control appears when the cart has items or the shopper is on a store route; its box is reserved so the navigation never shifts.

**Purchase flow refinement, approved 20 October 2026.** The header bag uses the existing ghost icon control, with no permanent rectangle on ordinary pages or checkout; preserve its 44px target, count, supplementary Cart label and keyboard focus. Keep Continue to Payment in the native ink face and center the official white Powered by Stripe badge beneath that button. Item purchase information follows the action as one short shipping note and Delivery & returns link; existing authoritative pre-order facts stay above the action, without repeated prose beneath it. Cart and checkout show costs before delivery and conditional ships-together information. Checkout keeps the address/locker clarification before payment and secondary policy/help and the existing legal-guarantee disclosure after the handoff. Preserve full accepted policy documents, contextual privacy and optional newsletter consent, global withdrawal access, product safety, artwork, typography, page columns and responsive layout.

### Chips

Chips and badges are compact metadata, not decorative pills.

- **Style:** Small uppercase labels, tracked text and thin borders. Tags (News genres) take a Flint edge with Flint text.
- **State:** Selected filter chips take Flint; the Pre-orders chip takes Sea Green. No section accents.

### Pre-order components

Pre-orders reuse the existing button, chip and card families and add only Sea Green marks. Rules live in `apps/web/src/styles/global.css`.

- **Status line** (`.store-item-card__preorder` on cards; `.preorder-badge` elsewhere): a plain Inter 13/20 text line in Sea Green (#4ca999), with no box outside approved Home video/photo media backplates above 800px. Card status lines sit left-aligned below artist and format, and retain Only N left when present. `Digital out now` (`.store-item-card__release-status`) is the neutral twin. A pre-order whose copies ran out reads like any zero-stock card (its Coming Soon, Repressing or Sold Out chip, no pre-order badge, no Pre-order control); ended pre-orders have no pre-order badge and use ordinary Buy.
- **Pre-order button** (`.preorder-action`): the filled Sea Green control at the one 44px size with a white label; hover and focus-visible darken it to #256258 with a #4ca999 edge.
- **Facts** (`.preorder-facts`): label and value rows in a Sea Green outline, Inter, 4.5:1 text.
- **Ships-together notice** (`.preorder-notice`, `.preorder-rail`): outlined, tinted panel with a two-step rail; Today is solid, the arrival step (`--later`) is dashed because its date is an estimate.
- **Panel edge** (`.preorder-edge`): 2px Sea Green top edge for the return page panel.
- **Store filter and notes** (`.store-preorder-filter`, `.store-preorder-notes`): a 44px chip with the pre-order count in Sea Green (Sea Green edge, Sea Green surface and a check mark when selected) and a three-note strip with a Sea Green top edge.
- **Home section** (`.home-preorders`): successive release chapters after the existing introduction and before News. The approved film scene centers the artist, large Veneer title, truthful badges, Bebas price, pre-order link and one complete sharp sleeve over a small silent native backdrop. Shipping stays by the purchase action, shown once. Its no-video companion uses the release's own band photograph, one sleeve and the identity, then the purchase column beside the summary under a facts row. At 800 CSS pixels and below chapters retain their current frame/composition; above 800px the accepted Thursday exception below applies. The format and Bebas price share one row, and the filled Sea Pre-order and the amber Listen share the next, half each and 16px apart at 800px and below and in cover-only chapters. Phones below 48rem read each chapter as a film strip inside the 16px gutters (owner's choice, 16 October 2026): a clean 16:9 band, then a 96px sleeve beside the artist link, the ink Veneer title and the format and price row, then the status line, the pair, the shipping and international lines, and one row with the terms link and, when a full video exists, Watch full video as a 44px text link in the same style after it; the facts and summary stay on the Store Item page. A release with a video always gets the band: its silent film plays there, a clip without a film shows its poster or else the artist photograph. Nothing renders over the film, poster or photograph, and tapping the band does nothing (owner, 16 October 2026). A release without a video shows its artist photograph band, and one with neither video nor photograph leads with a 160px sleeve beside the artist, title and price instead of an empty band. Between 48rem and 50rem the earlier one-column layout remains. Artwork comes from accepted originals, never sampled screenshots; film posters never repeat a sleeve.
- **Home motion exception, approved 5 October 2026:** muted inline footage plays only while at least 15% of its chapter is in view, the tab is visible, no shell music session exists and the full video is closed. The background text play button is removed, and on 16 October 2026 the owner removed the pause/resume icon on every viewport; reduced motion and data saving remain the opt-out and retain the complete poster experience without a background-play override. Only explicit Watch mounts a centered player and Close button below the film, full-width within 16px mobile gutters and capped at 65rem on desktop. It contains no duplicate sleeve or album details. Closing removes the panel and returns visible focus to Watch. Listen pairs with Pre-order at 800px and below and in cover-only chapters; above 800px video Listen joins Watch at lower-right and photo-backed Listen follows identity. Every viewport uses ordinary flow; no competing audio, intercepted scrolling, sticky spacer, video scrubbing or added motion library.
- **Home refinement, approved 5 October 2026:** The base sweep moved to the hero CTA in Flint on 15 October 2026; Home Pre-order now uses the approved 19 October Soft edge treatment described under Buttons. Artwork is noninteractive. Accepted artist paths become subtle profile links. Retain a clearly spaced “Pre-order & delivery information” link, and omit repeated payment/whole-parcel text on Home. A small down-arrow links to the next chapter with a descriptive accessible name.
- Other pre-order surfaces retain existing motion and Veneer/Bebas sizes. Home alone uses the approved larger feature title; every interactive target remains at least 44px.

**Thursday desktop restoration, approved 19 October 2026:** Above 800 CSS pixels restore Thursday adc595c8 with current controls: video spans the viewport, with centred 780px/88% copy, dark status backplates, complete 220px sleeve and a 920px minimum scene that grows with content; Listen joins Watch at lower-right. Photo-backed chapters contain the complete photograph in a 520px band over blurred same-photo fill, with sleeve left and identity/status/Listen right; facts span below, then summary left and purchase/terms right. Current Pre-order/Listen are 168×44px at default text size and grow with text enlargement. Use CSS-only responsive placement with one visible/focusable Listen; preserve source IDs, shell synchronization, HomePreorderAction/Soft edge, data and playback fixes. Cover-only chapters and section links retain the current frame/placement. Everything at 800px and below is unchanged. Codex owns this local-only slice by explicit override; no Pause restoration, new API/dependency, commit, push, deployment or publication.

### Cards / Containers

Cards are editorial frames for images and text.

- **Corner Style:** Square by default (`0`), even when built with shared Card primitives.
- **Background:** Charcoal Surface or Black Card, with image frames on Void Background.
- **Shadow Strategy:** No shadow at rest. Hover changes border and background, not position.
- **Border:** Deep Border for explicit frames, Hard Border for tokenized primitives.
- **Internal Padding:** Usually `1rem` to `1.5rem`; dense metadata panels may use `0.75rem`.
- **Page frame:** Header, editorial routes and footer share one frame, `.layout-container`: `--page-max-width` (72rem) with `--page-gutter` steps of 16, 24 and 32px at 0, 640 and 1024px, never less than the safe-area inset. Pages use the class instead of their own widths; Store collections only raise `--page-max-width` to 90rem. Header and Home hero film (with still/shade) retain their bleed; approved Home video/photo-backed chapters also span the viewport above 800px. Cover-only chapters, every chapter at 800px and below, section/footer rules, hero divider and swipe rows stop at the frame, while veils over the fixed hero photo may still span the page without a visible edge. Modules add no second inset inside the gutter (News cards pad 16px).
- **Artists roster:** phones from 360px show two columns with 16px row and 12px column gaps; the photo keeps its whole 3:4 frame, the copy pads 12px, the title drops to 20px and the count stacks above Latest, whose hairline becomes a top rule. One column below 360px, two from 640px, three from 1280px.
- **Artist release count:** roster cards show the count as inline information beside Latest: a Bebas 28px number with its 12px tracked label as rendered ("1 Releases"), no box or gradient, a hairline before the Flint Latest label and the amber date; the pair wraps when text grows (15 October 2026).

### Inputs / Fields

Inputs are quiet operational controls that must not become a second visual system.

- **Style:** Void Background or near-black field with Hard Border, off-white text, and muted placeholders.
- **Focus:** Ring plus an amber (#e3b56c) focus edge on every field.
- **Error / Disabled:** Disabled controls reduce opacity and remain non-interactive. Errors should be textual and visible, not color-only.

### Navigation

Navigation is compact, uppercase, and shell-owned. One link model and one `.site-nav-link` style serve the header, the phone Menu and the footer sitemap; each surface changes only size.

- Header links use 12px uppercase text with wide tracking. On every surface the current page carries the same underline under its label.
- The current page's underline is Flint (#889396) for every section; hover stays ink. No route has its own accent, and never side stripes.
- The phone Menu lists Home first, then the main-menu sections. Desktop shows the sections beside the logo, which links Home. The header button shows the word Menu beside its icon.
- On touch screens, Menu rows, Close and footer sitemap links are at least 44px tall, and the sitemap wraps instead of clipping.
- The owner-approved Flowing links footer (19 October 2026, `redesign-footer-flowing-links`) uses a 56px desktop logo beside the full Staff description and existing 44px social controls. Below 720px the logo is 44px; below 460px logo/socials share the first row and the description follows at 12px. The sitemap flows in DOM order at every width, browsing links before configured Delivery information, withdrawal and available privacy, with 44px-high targets and 13px Inter labels. Support links are muted, footer hover/focus is amber and the shared Flint current-page underline remains. Copyright and amber Est. sit above the exact AI assistance disclosure, separated from navigation by an inset rule. Both rules align with the shared page frame. Normal reference ceilings are 380px at 320px, 360px at 390px, 285px at 768px and 245px at 1440px; longer content and enlarged text grow naturally. This supersedes the old 200px/four-column prescription without removing its historical evidence.
- Home News and Artists swipe below 40rem inside the frame: the row is clipped at the gutters and the next card peeks about 42px. Each position dot is a 44 × 44px button with a small amber current mark.
- Mobile navigation must preserve the same shell routing behavior and not introduce real document swaps for top-level sections.

### Signature Component: Persistent Music Player

The embedded player is a shell-level continuity feature, not page-local decoration. Its modal and mini-player states may use floating shadows because they sit above the document. The mini player appears only after real embed intent and must stay compact, legible, and keyboard reachable.

### Home Motto Scrub

Approved 6 October 2026. When the Staff motto ends in Records, Art or Noise, that word cycles in this order from the written word: 1.2 s first hold, 2.3 s holds, 1.1 s scrub that leaves fast and settles into the last letter. The first change therefore finishes by about 2.3 s, well before most visitors scroll; the owner shortened the first hold from 2.5 s after seeing it on UAT, and on 14 October 2026 asked for the whole cycle a tad faster (from 1.5 / 2.8 / 1.4 s). A thin white playhead travels from the start of the word to the end of the next word, so each change spans the old word's length and ends at the new word's length; behind it the next word, ahead of it the current one. Chaos from the owner's mockup rides on it: in random bursts during the first two thirds of each scrub, horizontal slices of either word tear sideways and torn fragments of a filled, mirrored session-clip waveform flash between them, all clipped to the span so nothing touches the words before it. Each word then lands clean. Monochrome only. The rest of the hero keeps its single fade-rise entrance; the glitch is reserved for the cycling word. Reduced motion keeps the written word; the cycle pauses off screen and in hidden tabs. Rejected in the rendered study: Signal (word folds into a sine), Scan (sine-displaced bands) and a background waveform window behind the word.

### Home Hero Film

Requested 14 October 2026, after reviewing live probes. The owner's session montage loops silently over the hero still, in high-contrast grayscale baked into the files so the Monochrome Owns The Page rule holds without a runtime filter. The BlackBox Studio logo burned into the source footage must never appear on the site; every delivered crop excludes it. Portrait screens get a 9:16 centre crop, wider screens a landscape crop. The film fades in over the still once it plays and follows the Home motion exception: muted and inline, only while at least half the hero is in view and the tab is visible, and paused during a music session. The owner removed the hero's pause/resume button on 14 October 2026 after UAT review; pausing is automatic only. Reduced motion, data saving, a failed source and refused autoplay keep the still. A lighter film-only shade keeps darkening only behind the header and tagline (revised 14 October 2026 after UAT review found the first grade hazy). The motto scrub, ghost fade and scroll cue are unchanged. On 16 October 2026 the owner, seeing the still flash on PRD, ruled that the film must render first: on a visit that can play it, the film starts loading while the page parses and the hero keeps its dark ground until the film plays, with no still before it or between orientation crops. The still shows at once without JavaScript, with reduced motion or data saving, on a failed source or refused autoplay, and after 2.5 s when the film has not started. The same day the owner asked for a slightly smaller Browse the Store set further down: the CTA is 48px and sits 2.5rem below the tagline on phones and 3rem from 48rem (1.25rem on sideways phones, keeping the round-1 height).

### Signature Component: Catalog Tile

Catalog tiles are hard-edged, image-led modules. They use square artwork frames, muted metadata rows, Veneer content titles (with the Store Listing Scale above), and subtle image scale on hover. Do not turn them into rounded ecommerce product cards.

Release catalog numbers (approved 15 October 2026, "option 1, date line") sit at the end of the existing date line on the release page and every Releases card, after a middle dot: `Jun 2026 · BBR#002`. They take the line's muted uppercase style and add no badge, stamp or new row. Never set them over cover artwork.

## Staff workspace

Staff uses its own dark, sans-serif product surface built on EmDash APIs. The living [backoffice reference](docs/backoffice-design.md) supersedes the older Content landing, staging, refresh, preview-default and all-sidebar decisions.

At widths of at least 1440 px, a 72 px top bar exposes Overview, Catalog, Website, Images, Stock, Orders and Stats with labeled icons on muted gray, violet, blue, sage, copper, teal and straw-yellow squares. Filled active backgrounds provide clear selection. Catalog and Website have optional 256 px contextual sidebars. Between 1440 and 1919 px the header utilities move into the Menu drawer. Smaller widths use a compact header and labeled Menu drawer. Stats (approved 12 October 2026, "A · Summary sentence") opens with one plain sentence with bold figures, then visits per day as Recharts bars (busiest day labelled, today lighter, dashed daily average), a devices sentence with a donut, and ranked rows of member-readable page and source names with a share of visits. Store and Google search (approved 13 October 2026, "Visits first") add an orders clause and paid orders per 100 visits to the sentence, open the rail with a paid-total comparison bar and orders, items and checkouts marked by a trend icon and signed change, and put a search-terms table under the visits chart. It uses one violet accent for visits plus tinted neutrals, static charts, lucide icons and monochrome brand marks. Blue means action; semantic statuses retain text and icons.

Stats now follows the approved **Daily brief** (19 October 2026), superseding the earlier Stats arrangements above. Design from 320 px upward: one readable period control, a short sentence of actual figures, then separate Visits, Store and Google Search reports with restrained violet, sage and warm neutral bars. Explore opens the source detail with draft filters, removable selections, metric choices, day/week/month grouping, tap/keyboard inspection and an optional date table. Blue denotes actions. Keep 44 px targets, honest missing-data gaps and source-specific timezone/coverage notes; never fabricate history. The eight date choices are Today, Yesterday, 7 days, 30 days, 90 days, This month, 12 months and Custom. Only Custom renders Start date and End date. Dates and filters apply explicitly and survive Back/Forward; Cancel preserves the applied selection.

Overview is stats-led (approved 27 October 2026, option A "Brief, then to-do"): a period control, one sentence of figures, four ruled figure rows with signed text changes in the Stats source colours, a read-time line, counted To do rows and outline quick actions. Details live in the [backoffice reference](docs/backoffice-design.md). All area titles share one 28 px (24 px phone) scale, and the phone header names the current area.

The approved Staff logo is the Office stamp treatment: the selected C artwork extracted directly from the approved concept image as a transparent 686 × 162 PNG. Preserve its exact composition, lettering and Staff badge rather than recreating the endorsement in HTML. This is staff-only branding; public logo assets remain unchanged.

Editors autosave private drafts and publish explicitly. Catalog items show one Publish changes on both tabs with a count of what is not live yet; typed prices wait as EmDash drafts until that single review applies them, and stock stays immediate. Real shared-template previews start alongside editors at 1280 px and above, with remembered visibility; smaller widths use Edit/Preview tabs. Preview remains non-interactive and debounces typing for 750 ms. Review changes is a blue icon button; opening a comparison entry drives the publication preview, while Publication history opens in a right-side panel with colored status badges and expandable details. Preserve draft buffers and navigation recovery.

## 6. Do's and Don'ts

### Do:

- **Do** preserve the monochrome BlackBox visual language unless the task explicitly changes the visual direction.
- **Do** keep the three accent roles fixed: Sea Green only for pre-orders, Flint for buying and labels, amber for listening and small marks.
- **Do** keep release, artist, distro, and news cards square, flat, and image-led.
- **Do** keep checkout and shipping states understandable through text, structure, and disabled/action states, not color alone.
- **Do** validate rendered UI changes with Browser Use first, with DevTools only as the documented fallback.
- **Do** respect reduced-motion preferences for hero animation, route transitions, overlays, player UI, and card effects.

### Don't:

- **Don't** make public pages look like a generic ecommerce grid, SaaS landing page, polished corporate music platform, Shopify clone, marketplace catalog, or debug-heavy admin UI.
- **Don't** introduce pastel ecommerce styling, neon music-app cliches, crypto/nightclub gradients, glassmorphism, decorative metric blocks, or fake urgency. The opt-in Only N left notice shows a real count of 5 or fewer and never animates.
- **Don't** expose Stripe IDs, stock counts (except the staff-enabled Only N left notice), backend identifiers, BOX NOW raw payloads, or internal runtime details in shopper-facing UI.
- **Don't** add rounded card-heavy layouts where a hard editorial frame or full-width section is more appropriate.
- **Don't** use side-stripe borders, gradient text, or repeated icon-card grids as a shortcut for hierarchy.
- **Don't** move player behavior into page-local scripts or break shell-owned top-level navigation continuity.

# Backoffice guidance

## Design inspiration and component studies

For reference research, start with the personal [Design Library](C:/Users/SVall/.codex/design-library/README.md), which maps shared sources, inventories and reusable pattern evidence. [BlackBox design references and decisions](docs/design-inspiration.md) retains project studies and selections. The [pattern application guide](docs/ui-design-patterns-guide.md) explains the local application table and stable pattern IDs.

Listen refinement selected September 24, 2026: **Fluid five with animation**. Preserve the familiar dark face, square edges and compact label; replace the circular indicator with five bars in amber (#e3b56c), restored over Slate on 16 October 2026. Use the same mark in the modal heading and minimized player. Hover/focus and modal entry run two brief cycles, then settle; reduced motion disables the animation. The mark identifies listening and never claims verified playback. Retain `Player Ready` and the existing shell-owned lifecycle. Future button studies should extend this restrained family. Cosmos Public Work remains an aesthetic reference for quiet hierarchy and image-first restraint; amber is the listening accent, not a replacement global action color. Store Buy refinement selected 7 October 2026 and recoloured 15 October 2026: Buy on Store cards is the filled Flint control with the Rim add record mark (`apps/web/src/components/store/StoreBuyIcon.tsx`), 18px; Pre-order is the filled Sea Green control. Format icons selected 8 October 2026: the mark follows the card's format (vinyl, CD or cassette; other goods keep the record) as realistic layered SVGs whose light, shell and plus stay still while the print or reels turn. The vinyl label flick was restored on 13 October 2026; release-card records stay removed. One flick plays on tap, mouse entry or keyboard focus: one turn in 1 s, starting at speed and coasting to rest, so it reads before the phone bag opens. No continuous motion; reduced motion disables it.

For Content, Images, Items, Stock and Orders, use the living [backoffice design reference](docs/backoffice-design.md). It records shared staff patterns, research, proposal status and validation separately from the public site's visual direction.

## Website changes review (September 2026 refinement)

Staff utilities and Overview open `/review/`. This supersedes the list-checkbox publication queue. Review discovers saved unpublished Website and Catalog entries through the EmDash workspace adapter, with search, area filters and up to 25 entries per page. Selection persists in the same tab, up to 20 entries across pages. Incomplete drafts remain visible with editing links. A final review checks saved versions; a changed version requires renewed review. The editor's Review changes shortcut finishes autosave and selects only that entry. One selected entry uses Publish change; several use Publish N changes.

Batch publication includes selling-linked entries but does not activate the shop, apply price drafts, or change stock. Entries with a price draft show it and link to the item, whose own publish review applies the price, the checkout presentation and a first sale. Pending request identities survive response loss; failed operations require a fresh review. The batch service accepts all reviewed entries in one website update.

Count stock and Finish counting replace visible Stocktake wording; internal storage identities remain compatible. Quantities read Available to buy online, with copies for music and units for merchandise. The online quantity is how many customers may buy through the website.

Review discovery uses bounded native EmDash cursor reads and existing accepted-snapshot comparisons, never private CMS table queries. The client follows sparse continuations until its page fills or reaches the end, cancelling stale searches. It does not load the entire library into browser memory or poll a global draft count. Hosted rollout still requires a Free-tier cost preflight.

### Store browsing and item information

Store cards retain their price and show a 44px Buy in the filled Flint face at its right when the item is stocked, so Buy never shares the outlined look of a status; Coming Soon, Repressing or Sold Out take Buy's place, with a shown expected month inside the same chip ("Coming Soon · Nov 2026"); a paused or unknown state shows the price alone. Both wrap below the price when needed, and the purchase row reserves Buy's height so cards never grow when prices arrive. Buy reads the live offer, adds one copy and opens the cart, confirming with Added; it never links to the item page, which keeps Add To Cart. Keep artwork unobstructed and Listen in its existing row. Use readable foreground text with a solid Flint outline for Sold Out and a dashed neutral outline for Coming Soon and Repressing; stocked items need no additional label, except that an item whose staff enabled Show copies left and which has 5 or fewer copies online reads Only N left beside Buy in the status chip's exact box, Flint edge on the Flint surface. On its page the same words sit in a 28px tab fused to the top edge of Add To Cart, sharing its width, square 1px edge and display type, so notice and action read as one unit. No dots, pulses, countdowns or colour-only meaning: the real count carries the message. In the Crate the item in hand is its own card beside the bin, so its purchase row and Buy stay visible at every width. One native link covers the card, with only the independent Listen and Buy buttons above its hit area. The title says so: it carries the text-link underline, faint at rest and full when the card link is hovered or focused, while the card's border and surface lift on hover-capable devices. Hovering Buy or Listen leaves the card at rest.

Store Listen actions sit on the artwork's bottom-left corner (15 October 2026), only when a listening source exists: icon-only 44 × 44px below 40rem, named “Listen, <title> by <artist>”, and labelled 112 × 44px from 40rem. Only the button takes input there, so the card link answers everywhere else; the Crate's item in hand lists Listen in flow, since its sleeve is the artwork. Source-less items show no control; the price/action row stays at the bottom. The active recording shows disabled amber **In player** status across Store, Releases and details. This denotes the shell's existing session, including a paused provider, rather than verified playback. Reopen and Stop belong to the floating player, with 44px controls on mobile. Stop or switching recordings resets the previous source's Listen controls. On Releases, Listen sits directly below the artist in every card, featured or catalog, never over the artwork.

Store collections use a 90rem container with 32px desktop and 16px mobile gutters, a visually hidden H1 (All or the category name, as on Releases) and no visible Store / category introduction or side pane (15 October 2026). Category links come first, then one 44px toolbar row; the purchase note follows the grid (or the empty state) as one compact line on every viewport, with the international strip right after it (16 October 2026). Below 1024px the row holds Search Store and one Filter chip (white label, an applied-choice count in Flint, its box reserved) that opens one bottom sheet with Formats, Availability (Pre-orders), View (Grid / Crate) and Artists, in that order, and a neutral ink Show N items; the sheet has its own Back entry. From 1024px the row holds Search, a Formats menu, an Artists menu, Pre-orders, Grid / Crate and the result count; the menus are native popovers with no history entry. Formats keep the existing Distro links and Distro counts (on phones as wrapping square chips, selected in Flint with a check mark, never a horizontal scroller); without JavaScript, Formats and Filter open the native Formats menu, so the links stay reachable. The Artists filter accepts several artists (approved 9 October 2026): a checkbox list with counts and no All artists choice, a Find an artist box that narrows the unticked names, and ticked artists pinned above the list under Selected · N with an artists-only Clear; a moved checkbox keeps focus. The desktop Artists chip reads Artists · N and takes the Flint selected edge while artists are ticked. Cards form a continuous Grid by default: five columns from 1280px (259.2px at 1440), four from 1024px, three from 640px, two from 360px, and one below, with 20px gaps on desktop and 16px on phones. The optional Crate requires explicit selection and browses one format at a time, the way a record shop keeps stock: Vinyl 12-inch in a crate and CDs in a CD bin, both flipping, and Tapes spine-out in a rack. A format gets a bin from 7 items; All formats is always the Grid. Grid and Crate form one 44px switch in the toolbar row, which stays under the header on desktop; on phones it sits in the Filter sheet's View section, and a choice there closes the sheet before the Crate opens. Two segments in a Flint 700 frame, each with a drawn glyph (2×2 grid; a stacked crate), the pressed one in ink, shown only while the Grid holds a format with a bin. The bin stands its sleeves with A–Z divider tabs and a back board carrying the logo; the item in hand's own card sits beside it on desktop and below it on phones, with a letters rail and a counter. A drag past a sleeve's tipping point drops it onto the pile, and one drag, flick or wheel notch turns one sleeve.

All uses one complete mixed-source catalog: BlackBox releases first, in ascending catalog-number order, then Distro by displayed artist/band or label credit A–Z, then item title and slug (sortAllStoreCollectionEntries). Pre-orders have no sorting priority, and there is no Sort control. Grid, the Crate's bins and artist/text filters retain that sequence. BlackBox Releases, Merch and the Home pre-order showcase retain their existing ordering rules.

Distro uses one mixed-format catalog of Distro sources, ordered band A–Z. Release-sourced BlackBox Store items belong to All and BlackBox Releases and are excluded from Distro. The approved lifecycle card composition keeps artist and format together without an additional New release row. Format links filter individual cards in place and share the artist/text filters; on All they open the matching Distro group. Any search, artist or pre-order filter uses Grid; in the Crate the format links walk between bins, and All formats returns to the Grid. Pre-orders are marked on cards (Pre-order badge, Pre-order button) and collected under a Pre-orders filter; see Pre-order components.

Releases sits in the page frame without an outer box or visible section labels. Preserve two stacked featured rows, complete square covers, equal cover/copy halves with 1.5rem gaps from 640px and 29rem covers from 1024px. Catalog remains one/two/three columns with 1.5rem gaps. Source order/roles remain editorial and offers never reorder them. Native artwork and purchase actions share the existing edition destination/feedback; title links reach release detail. Listening stays independent. The approved quiet revision below supersedes former internal card ordering, bracketed edition links and release badges.

**Quiet default with intrinsic release controls, approved 20 October 2026.** Cards share one DOM/visual order: title/band (4px gap), purchase/status plus optional Listen then the existing price in one wrapping action row (12px after identity, 16px gaps), formats (4px after that row), supplied shipping/applicable terms (8px after facts), digital date/catalog (12px after the final group), then editorial summary/Read more. Catalog type is Veneer 32/36, Inter 16/24, format/helper 13/20, Bebas price 24/28 and metadata 12/18; preserve larger featured/detail headings and existing featured prices. Controls use intrinsic width without growth: a minimum of 112×44px, 16px horizontal padding, 16px Bebas labels, 18px icons and 8px icon/text gaps, consistently on phone/desktop and in existing detail controls. Labels may wrap within the available container under enlarged text. Price is plain centered text directly after Listen, without auto far-edge margin. Controls/price wrap in DOM order at narrow widths. Preserve outer geometry; detail retains its purchase block, copy/date positions and no-price policy.

**Quiet release states and access.** Stocked ready offers use Flint Buy vinyl/CD/cassette or Sea Pre-order for open preorders. Coming soon/Repressing are static dashed Flint statuses. Sold out has a solid 1px #bc4945 edge, pale text and transparent/near-black interior on editorial Releases cards and direct/overlay purchase blocks only: an explicit exception to the older Flint-only Sold Out/red reservation. Other Store surfaces retain their palette. Unknown/pending/paused has no public state or Buy; any matching ready record retains price, including depleted/paused. Remove routine In stock, Digital out now, duplicate badges and View details from these release surfaces. Physical format text is an underlined native link with minimum 44×44px target only to verified existing destinations; announced may use release detail, unmapped formats stay plain, no invented CD path. Vinyl uses static 18px Disc3; CD/cassette retain existing marks. Native actions navigate rather than add to cart. Listen/In player stays independent; missing Listen adds no placeholder. Card metadata reads Digital release · [date] plus catalog with semantic time; omit only the digital fragment without a date. Offers never rewrite it. Detail labels its existing date Digital release without duplicate purchase metadata; a dateless detail omits the entire digital label/date/separator fragment and keeps its catalog number. Supplied shipping remains independent of digital timing; preorder terms are conditional with no reserved blank row. Preserve SSR/failure/disposal/cache reset.

**Store BUY reuse, approved 20 October 2026 after Local release review.** Store Grid and Crate listing BUY controls use the same intrinsic geometry as the accepted release actions: minimum 112×44 CSS px, 16px inline padding, 16px default Bebas label, 18px static Disc3 and 8px icon/text gap, without flex growth. The label stays Buy for every format, including vinyl, CD, tape and merch. Pre-order retains its truthful label and Sea face; Adding/Added retain the static icon. Keep the existing price row, right-aligned Buy placement, Grid/Crate composition and authoritative offer/cart behavior. This supersedes the earlier Store-unchanged scope for listing BUY appearance only. Item Add to cart, payment, retry and status commands retain their existing treatment.

**Phone Store BUY line, approved 22 October 2026.** Below 40rem the card is too narrow for the price and the 112px control side by side. BUY and Pre-order keep the 18px Disc3, 16px Bebas label and 44px height, but take their own full-width line under the price (12px inline padding, no minimum width). The price row reserves 88px so cards keep their height; a price without BUY sits on the bottom line. From 40rem the side-by-side row is unchanged.

**Phone buy bar, approved 22 October 2026 (UX-laws review, option A "Rise", shown only before reaching the action).** Below 40rem a Store item page whose inline purchase action is still below the viewport shows a flat bar fixed to the bottom edge: the Bebas price, the item's own status line (the Sea pre-order line, or Only N left) and the same 44px purchase control with the same label, Adding/Added and cart opening. A Deep Border top edge on Black Card, no blur and no shadow. It rises in 300 ms (`cubic-bezier(0.16, 1, 0.3, 1)`) and leaves in 195 ms (`cubic-bezier(0.7, 0, 0.84, 0)`), transform and opacity only, with explicit resting values; it is simply present at first paint, and reduced motion changes state instantly. Once the shopper reaches the inline action it leaves and stays away below it, returning only above it; it is `inert` while hidden. The open mini player lifts above it. Status-only items, the per-item checkout page and widths from 40rem show no bar. Preview: `.codex-artifacts/design-review/ux-laws-2026-10-22/buy-bar-review.html`.

**Forms and long text (UX-laws review, 22 October 2026).** The newsletter reads email, consent, then Subscribe at every width, with a consent error directly under its checkbox. Services General asks for no extra details; Send Inquiry keeps the neutral ink face. News articles read in a 46rem card at 16px and the About text column stops at 46rem; in both, running paragraphs stop at 34rem, about 70 characters. The cart drawer shows no implementation note; while the delivery quote is pending it keeps the Items, Delivery and Total rows, with the cart's own fixed-price subtotal in Items. A cart holding a pre-order shows Checkout on the Sea Green face with its light label; other carts keep the ink face.

**Late release offer correction.** When a successful live read withdraws the currently focused Buy, focus its existing mapped format/edition link before removing the action, with the existing title destination as fallback when available. Never focus static status or add a visible replacement link. Preserve focus elsewhere, projected Buy/focus on failed reads, and disposal/navigation cancellation.

**Release sizing research.** Human Local feedback rejected the earlier full-column width and requested price beside actions. Design Library SPACE-01/UX-Fitts informed target size and hierarchy. [Carbon button guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) distinguish intrinsic label-plus-padding from fluid/grid widths without prescribing a universal ratio; [WCAG Target Size Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) describes 44px targets at AAA. Numeric BlackBox values are project choices, not universal empirical ratios or an AA requirement. Reuse the existing primitive with scoped CSS; no Carbon styling/dependency or global button-system change.

Use complete square artwork and the UI display face (Bebas Neue) for prices across cards, item pages, cart, and checkout. Store listing cards follow the Store Listing Scale: a plain format line, Veneer item titles, an ink Inter artist or label credit after a muted “by”, plain lifecycle status lines and a stable bottom price/action row. Item pages, cart and checkout retain Veneer item titles and Inter credits; formats and controls retain their existing fonts. Cards contain the purchase facts without repeated descriptions or category labels. On item pages, cap artwork at 26rem and place it beside purchase information on desktop; mobile reads identity, artwork, purchase information. Info and populated format-matching Tracklists share the next row. Preserve More views and existing listening actions.
