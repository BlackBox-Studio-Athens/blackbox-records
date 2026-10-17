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

- **Flint** (cool gray; #626e72 face and edges, white label 4.8:1, hover #4d595c, text on dark #889396 at 5.8:1 on Charcoal Surface, error text #c1cbce, surface `rgba(98, 110, 114, 0.16)`): fills Buy, Buy vinyl and Add to cart; edges browse actions (Read News, View Full Roster, Continue shopping), Sold Out and Only N left; colours tags, kickers, artist link underlines, the current-page and current-tab underline, selected filter chips and error text. Tokens `--flint-800/700/500/300` and `--flint-surface`.
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

**The Flint Means Buy And Labels Rule.** Flint fills Buy, Buy vinyl and Add to cart, edges browse actions, and carries tags, kickers, artist link underlines, current underlines, selected filters, Sold Out and error text. Never a title.

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
- **Buy:** filled Flint (#626e72) with a white label and the format mark (`StoreBuyIcon`); hover and press #4d595c with a #889396 edge. Store cards say Buy; Releases say Buy vinyl, Buy CD or Buy cassette; the item page says Add to cart.
- **Pre-order:** filled Sea Green (#2d766a) with a white label; hover and press #256258 with a #4ca999 edge.
- **Pair rule:** two adjacent actions are one filled control and its outlined twin at the same height, never two filled or two outlined side by side; a price is text, so a lone filled control may sit beside it.
- **Inverse:** Charcoal Surface face with a Flint edge and white label, for browse actions: Read News, View Full Roster and Continue shopping.
- **Outline:** Charcoal Surface face with a Deep Border edge; hover lifts face and edge. No surface recolours it. Icon controls keep a quieter neutral edge and never take an accent.
- **Listen:** the amber control, chosen by the owner over Slate on 16 October 2026: Charcoal Surface face, #e3b56c edge, white label, #e3b56c equalizer bars; hover keeps the #e3b56c edge on the amber surface. In player is #f0d7b0 on the amber surface.
- **Hero CTA:** 48px, Bebas 18px (reduced from 52px and 20px on 16 October 2026, padding 0 18px 0 22px), ink face with Primary Inverse label and a trailing arrow at rest. Hover and keyboard focus raise a Flint fill from the base edge in 240ms, turn the label white and slide the arrow 6px inside the box; reduced motion switches instantly.
- **Quiet:** Soft Muted text with a hairline underline that grows from the centre on hover.
- **Chips:** Charcoal face, quiet edge and muted label at rest; selected chips take a Flint edge on the Flint surface with a white label and a check mark, and may show their result count. The Pre-orders chip selects in Sea Green.
- **States:** Hover is tonal and only on hover-capable devices; press darkens the face; nothing moves. Focus is a 2px ink ring at 2px on every control. Disabled drops to 45%. Loading keeps the width, sets `aria-busy` and changes the label.
- **Status is not a control:** An item with no copies online shows Coming Soon, Repressing or Sold Out in the purchase slot, as staff chose. One tone per state on every surface (Store cards, item page, Releases badges, cart and checkout): a dashed neutral edge means "not here yet" (Coming Soon, Repressing), a solid Flint edge means Sold Out, and Pre-order keeps Preorder Sea Green. Status reads as plain text lines without a box: the pre-order line in Sea Green, Digital out now in Soft Muted. On the item page Coming Soon and Repressing add a small 14px leading icon (a disc, a circular arrow) and a muted line below: "First pressing on its way" or "More copies being pressed", then "· Expected Month YYYY" while that month has not passed. Sold Out has no icon or line. A technical selling pause or an unknown state shows the price only: no status and no Buy. A pre-order whose copies ran out reads like any zero-stock card, with no pre-order badge or Pre-order control. Out of Stock, Currently Unavailable and any shopper "Unavailable" label are retired.
- **Notify me:** Under a Coming Soon or Repressing status, a quiet text action with a mail icon, "Email me when it lands", opens a small form in place: an Email field, an unticked one-off consent, Send and a Cancel link. Errors sit in Flint error text (#c1cbce) after a visible "Error" label under their control; success replaces the form with an inline status. Never an outlined or red control, a modal or a toast.

**The Feedback Stays In Place Rule.** Add to cart says Added, Remove leaves an Undo line, Stop ends the player session on its first activation, and Pay fills when the shipping quote is ready. No toasts or confirmation dialogs for these.

**The Header Cart Rule.** The bag control appears when the cart has items or the shopper is on a store route; its box is reserved so the navigation never shifts.

### Chips

Chips and badges are compact metadata, not decorative pills.

- **Style:** Small uppercase labels, tracked text and thin borders. Tags (News genres) take a Flint edge with Flint text.
- **State:** Selected filter chips take Flint; the Pre-orders chip takes Sea Green. No section accents.

### Pre-order components

Pre-orders reuse the existing button, chip and card families and add only Sea Green marks. Rules live in `apps/web/src/styles/global.css`.

- **Status line** (`.store-item-card__preorder` on cards; `.preorder-badge` elsewhere): a plain Inter 13/20 text line in Sea Green (#4ca999), with no box. Card status lines sit left-aligned below artist and format, and retain Only N left when present. `Digital out now` (`.store-item-card__release-status`) is the neutral twin. A pre-order whose copies ran out reads like any zero-stock card (its Coming Soon, Repressing or Sold Out chip, no pre-order badge, no Pre-order control); ended pre-orders have no pre-order badge and use ordinary Buy.
- **Pre-order button** (`.preorder-action`): the filled Sea Green control at the one 44px size with a white label; hover and focus-visible darken it to #256258 with a #4ca999 edge.
- **Facts** (`.preorder-facts`): label and value rows in a Sea Green outline, Inter, 4.5:1 text.
- **Ships-together notice** (`.preorder-notice`, `.preorder-rail`): outlined, tinted panel with a two-step rail; Today is solid, the arrival step (`--later`) is dashed because its date is an estimate.
- **Panel edge** (`.preorder-edge`): 2px Sea Green top edge for the return page panel.
- **Store filter and notes** (`.store-preorder-filter`, `.store-preorder-notes`): a 44px chip with the pre-order count in Sea Green (Sea Green edge, Sea Green surface and a check mark when selected) and a three-note strip with a Sea Green top edge.
- **Home section** (`.home-preorders`): successive release chapters after the existing introduction and before News. The approved film scene centers the artist, large Veneer title, truthful badges, Bebas price, pre-order link and one complete sharp sleeve over a small silent native backdrop. Shipping stays by the purchase action, shown once. Its no-video companion uses the release's own band photograph, one sleeve and the identity, then the purchase column beside the summary under a facts row. Every chapter sits inside the page frame on the page ground, with no band or full-width rule (15 October 2026, mobile-layout-rhythm). The format and Bebas price share one row, and the filled Sea Pre-order and the amber Listen share the next, half each and 16px apart, on every viewport. Phones below 48rem read each chapter as a film strip inside the 16px gutters (owner's choice, 16 October 2026): a clean 16:9 band, then a 96px sleeve beside the artist link, the ink Veneer title and the format and price row, then the status line, the pair, the shipping and international lines, and one row with the terms link and, when a full video exists, Watch full video as a 44px text link in the same style after it; the facts and summary stay on the Store Item page. A release with a video always gets the band: its silent film plays there, a clip without a film shows its poster or else the artist photograph. Nothing renders over the film, poster or photograph, and tapping the band does nothing (owner, 16 October 2026). A release without a video shows its artist photograph band, and one with neither video nor photograph leads with a 160px sleeve beside the artist, title and price instead of an empty band. Between 48rem and 50rem the earlier one-column layout remains. Artwork comes from accepted originals, never sampled screenshots; film posters never repeat a sleeve.
- **Home motion exception, approved 5 October 2026:** muted inline footage plays only while at least 15% of its chapter is in view, the tab is visible, no shell music session exists and the full video is closed. The background text play button is removed, and on 16 October 2026 the owner removed the pause/resume icon on every viewport; reduced motion and data saving remain the opt-out and retain the complete poster experience without a background-play override. Only explicit Watch mounts a centered player and Close button below the film, full-width within 16px mobile gutters and capped at 65rem on desktop. It contains no duplicate sleeve or album details. Closing removes the panel and returns visible focus to Watch. Listen pairs with Pre-order; the film tools hold only Watch. Every viewport uses ordinary flow; no competing audio, intercepted scrolling, sticky spacer, video scrubbing or added motion library.
- **Home refinement, approved 5 October 2026:** The base sweep moved to the hero CTA in Flint on 15 October 2026; the Home Pre-order is the ordinary filled Sea Green control. Artwork is noninteractive. Accepted artist paths become subtle profile links. Retain a clearly spaced “Pre-order & delivery information” link, and omit repeated payment/whole-parcel text on Home. A small down-arrow links to the next chapter with a descriptive accessible name.
- Other pre-order surfaces retain existing motion and Veneer/Bebas sizes. Home alone uses the approved larger feature title; every interactive target remains at least 44px.

### Cards / Containers

Cards are editorial frames for images and text.

- **Corner Style:** Square by default (`0`), even when built with shared Card primitives.
- **Background:** Charcoal Surface or Black Card, with image frames on Void Background.
- **Shadow Strategy:** No shadow at rest. Hover changes border and background, not position.
- **Border:** Deep Border for explicit frames, Hard Border for tokenized primitives.
- **Internal Padding:** Usually `1rem` to `1.5rem`; dense metadata panels may use `0.75rem`.
- **Page frame:** Header, editorial routes and footer share one frame, `.layout-container`: `--page-max-width` (72rem) with `--page-gutter` steps of 16, 24 and 32px at 0, 640 and 1024px, never less than the safe-area inset. Pages use the class instead of their own widths; Store collections only raise `--page-max-width` to 90rem. Only the header and the Home hero film (with its still and shade) cross the gutters (15 October 2026): chapter media, facts, section and footer rules, hero divider and swipe rows stop at the frame, while veils over the fixed hero photo may still span the page without a visible edge. Modules add no second inset inside the gutter (News cards pad 16px).
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
- The phone footer is compact (198px at 390px; 301px before, 16 October 2026): the logo and the 44px social icons on one row, the 12px tagline, the sitemap in four columns of two 44px rows in its order, filled down each column (so Delivery information never sits alone; 12px labels wrap inside their row) with its Sitemap label visually hidden, then the sentence-case copyright on one 12px line beside amber Est. 2026. The top rule stops at the gutters and the meta row has none. Larger text grows it rather than clipping.
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

Releases sits in the page frame without an outer box or visible section labels (approved 11 October 2026, canvas "Releases Stacked Layouts", option A). The two featured records are identical stacked rows separated by hairline rules: a complete square cover above the copy on phones, equal cover and copy halves with a 1.5rem gap from 640px, and a 29rem cover beside top-aligned copy from 1024px, so both covers always match. Cards pair the edition action with Listen (15 October 2026, mobile-layout-rhythm). Below 640px every card reads the cover, the filled Buy or Pre-order and the amber Listen 12px below it (half the row each, 16px apart; a missing source adds nothing), the amber date and catalog line, the ink Veneer title (37.6px featured, 24.8px catalog), the artist, the formats with the Bebas price at their right (28px featured), the plain status lines and shipping line, then on featured rows the Inter summary at 1rem/1.65, which starts at three lines when long: a native Read more / Show less disclosure shares a 44px row with the "Pre-order & delivery information" link, and without it the text stays whole. From 640px the copy reads date, title (16cqi, capped at the Display maximum, 66.4px at 1440px), artist, then the price, the action and Listen in one row, formats, status, shipping, the whole summary and the terms link. The remaining catalog follows a hairline rule with a visually hidden "More releases" heading, in one, two (from 640px, matching the featured halves) or three (from 1024px) columns with 1.5rem gaps; each tile repeats the order without a summary and nothing over the artwork. Every cover is contained in the same Deep Border frame on #111 and stays at rest; pointer hover outlines it. Buy vinyl, Buy CD and Buy cassette carry the Store card's record mark in the filled Flint face on every card. The price is the Store card's: the live listing price of any ready record, shown only after the offer is read. Releases shows each record once within its existing editorial roles. Digital release dates and physical ordering are independent, and Release stage describes the music only. Each card shows one digital badge, Digital out now or "Out 14 November 2026" for a future date (none without a date), and at most one physical badge that follows the edition's offer: "Vinyl available", "Vinyl Coming Soon", "Vinyl Repressing" or "Vinyl Sold Out", in the same dashed or Flint chip tone as the Store. An announced edition without a Store Item reads Vinyl Coming Soon; a native edition shows no physical badge until its offer is read, and none for a paused offer. A shown expected month goes on the shipping line as "Expected November 2026". Buy vinyl and Pre-order vinyl keep their buttons; a non-buyable edition's action reads "Vinyl edition" (or "CD edition", "Cassette edition") in uppercase mono between muted brackets that close in and brighten while engaged. A native edition's cover links to that same edition, and pointing at the cover or the action engages both identically through the action's hover look. No decorative record is rendered behind the cover at any width or motion preference. Listening remains independent.

Use complete square artwork and the UI display face (Bebas Neue) for prices across cards, item pages, cart, and checkout. Store listing cards follow the Store Listing Scale: a plain format line, Veneer item titles, an ink Inter artist or label credit after a muted “by”, plain lifecycle status lines and a stable bottom price/action row. Item pages, cart and checkout retain Veneer item titles and Inter credits; formats and controls retain their existing fonts. Cards contain the purchase facts without repeated descriptions or category labels. On item pages, cap artwork at 26rem and place it beside purchase information on desktop; mobile reads identity, artwork, purchase information. Info and populated format-matching Tracklists share the next row. Preserve More views and existing listening actions.
