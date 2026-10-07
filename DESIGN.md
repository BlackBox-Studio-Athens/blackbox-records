---
name: BlackBox Records
description: Monochrome editorial label site and storefront for BlackBox Records.
colors:
  void-background: '#0d0d0d'
  ink-foreground: '#f5f5f5'
  black-card: '#0f0f0f'
  charcoal-surface: '#141414'
  hover-surface: '#161616'
  soft-muted: '#b3b3b3'
  hard-border: '#262626'
  deep-border: '#2b2b2b'
  primary-inverse: '#090909'
  control-ink: '#e8e8e8'
  services-rose: '#8a495a'
  services-rose-hover: '#a76376'
  services-rose-active: '#c78997'
  store-blood: '#922f3f'
  store-blood-hover: '#b4465a'
  store-blood-active: '#cf6b80'
  preorder-sea-green: '#2d766a'
  preorder-sea-green-active: '#4ca999'
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
- Sparse rose and blood accents reserved for services and store intent.
- Square or hard-edged cards, flat by default, with image motion used carefully.
- Content-owned copy and metadata, never debug labels or backend identifiers.

## 2. Colors

The palette is near-black and off-white with two muted red families for section-specific intent and one sea green reserved for pre-orders.

### Primary

- **Ink Foreground** (#f5f5f5): Primary text, primary filled buttons, active shell states, and high-contrast marks.
- **Void Background** (#0d0d0d): Site body and default page background.

### Secondary

- **Store Blood** (#922f3f): Store and checkout accent. Use for commerce context, never as a general brand wash.
- **Services Rose** (#8a495a): Services and inquiry accent. Use for service affordances, form focus, and restrained section details.
- **Preorder Sea Green** (#2d766a, text on dark #4ca999, surface `rgba(45, 118, 106, 0.16)`): The wait for copies that are not on the shelf yet; the complement of Store Blood. Tokens `--preorder-accent`, `--preorder-accent-active` and `--preorder-accent-surface`. Allowed on pre-order badges and the Pre-order filter (outline and tinted text), the 3px base line of the Pre-order button, the 2px top edge of pre-order panels, and the outline of the facts list and ships-together notice. Text on dark uses the active tone (6.5:1 on Charcoal Surface); the only fill is the Pre-order button on hover and focus, with Ink Foreground text (4.9:1). Never on resting controls, page washes or ordinary items.

### Neutral

- **Black Card** (#0f0f0f): Popovers, cards, and framed panel bases.
- **Charcoal Surface** (#141414): Catalog cards, footer, artist surfaces, and repeated editorial modules.
- **Hover Surface** (#161616): Hover and focus-within tonal lift for cards.
- **Soft Muted** (#b3b3b3): Secondary body text, metadata, and subdued labels.
- **Hard Border** (#262626): Default token border and input stroke.
- **Deep Border** (#2b2b2b): Explicit editorial dividers, image frames, and card borders.
- **Primary Inverse** (#090909): Text on the light primary button.

### Named Rules

**The Monochrome Owns The Page Rule.** Black, charcoal, off-white, and gray must carry the screen. Accent color clarifies a route or action; it must not recolor the whole product.

**The Commerce Is Subordinate Rule.** Store Blood can identify the store path, but checkout UI must still look like BlackBox, not a payment provider, marketplace, or Shopify theme.

**The Sea Green Marks The Wait Rule.** Preorder Sea Green appears only where an item or order waits for copies. It outlines and underlines; it does not fill resting controls, wash sections or tint ordinary items.

## 3. Typography

**Brand Display Font:** Veneer, with Bebas Neue, Impact, and sans-serif fallback.
**UI Display Font:** Bebas Neue, with Impact and sans-serif fallback.
**Body Font:** Inter, with Helvetica Neue, Arial, and sans-serif fallback.
**Label/Mono Font:** Geist Mono, with Courier New and monospace fallback.

**Character:** Brand display type is physical, letterpress, loud, and poster-like. UI display type stays compressed and clean for dense cards and controls. Body type is quiet, practical, and readable, with labels pushed into uppercase tracking for editorial metadata.

### Hierarchy

- **Display** (900, `clamp(2.35rem, 8.5vw, 4.15rem)`, 0.98 line-height): Veneer for homepage hero, public route heroes, artist detail H1s, and major release/artist feature titles.
- **Headline** (900, `clamp(1.7rem, 6vw, 2.65rem)`, 0.98 line-height): Veneer for public section titles, distro group headings, service offering titles, and editorial route panels.
- **Title** (900, `clamp(1.55rem, 4.6vw, 2.05rem)`, 0.98 line-height): Veneer for public artist, release, distro, store, and service content titles.
- **Body** (400, `0.95rem`, 1.7 line-height): Paragraph copy, service descriptions, checkout explanations, and artist profile text. Keep long prose near 65 to 75 characters per line.
- **Label** (500, `0.72rem`, 0.22em tracking): Eyebrows, metadata, nav labels, status labels, and section kickers.
- **Mono** (400, `0.74rem`, 0.12em tracking): Technical-feeling but public-safe small metadata where monospace is already used.

### Named Rules

**The Public Title Rule.** Veneer owns public content titles: artist names, release names, distro/store item names, cart and checkout line item names, service offering titles, group headings, route heroes, and major editorial feature titles. Bebas Neue remains the compact UI display face for navigation, buttons, prices, cart/checkout chrome, totals, controls, labels, stock operations, order-state surfaces, metadata-heavy panels, and any surface where texture would slow scanning.

**The Store Listing Scale.** Store listing cards use Veneer weight 900 for source-cased item titles at the existing responsive 20–24px size. The entire credit underneath, “by” and the unchanged artist or label name, uses Inter weight 400 at the existing 14px size, 1.4 line height and muted color. Existing artist links remain independent. This applies across All, BlackBox Releases, Distro and populated Merch; item pages, cart, checkout and order confirmation retain their existing typography.

**The Metadata Is Quiet Rule.** Labels may be uppercase and tracked, but they stay small. Do not let metadata compete with release, artist, or item names.

## 4. Elevation

The system is flat by default. Depth comes from tonal separation, borders, image frames, sticky positioning, overlays, and state changes. Shadows are rare and reserved for modal/player surfaces that must sit above the document.

### Shadow Vocabulary

- **Catalog Rest** (`box-shadow: none`): Default catalog, artist, release, news, and distro cards.
- **Music Trigger Glow** (`0 0 0 1px rgba(245, 245, 245, 0.12), 0 0 1.05rem rgba(245, 245, 245, 0.12), inset 0 0 0 1px rgba(245, 245, 245, 0.05)`): Hover/focus emphasis for listen actions only.
- **Overlay Panel** (`0 28px 90px rgba(0, 0, 0, 0.56)`): App-shell overlays and modal-level surfaces.
- **Mini Player** (`0 14px 30px rgba(0, 0, 0, 0.32)`): Floating player continuity surface.

### Named Rules

**The Flat By Default Rule.** Repeated content cards do not lift. They shift border and background only.

**The Shadow Means Floating Rule.** If a surface has a heavy shadow, it must be a modal, overlay, mini player, or similarly floating UI.

## 5. Components

### Buttons

Buttons are hard, typographic controls with direct action language: one family (`apps/web/src/components/ui/button.tsx`), three sizes, one focus ring. They sit behind the artwork; nothing glows except Listen.

- **Shape:** Square (`0`) everywhere, including shared primitives. No pills.
- **Type:** Bebas Neue caps, 0.06em tracking, nudged 1px down to centre the caps. Text actions (Remove, Back to Store, Refresh status) stay Inter 13/500 with an underline.
- **Sizes:** 32px for chips, sort and view toggles; 36px for every action and icon control; 44px for commerce decisions and anything sharing a row with a 44px input or Listen. On coarse pointers an invisible halo makes every control 44px tappable; the drawn size never changes.
- **Primary:** Control Ink (#e8e8e8) face with Primary Inverse text, lifting to Ink Foreground on hover. One filled primary per view, except Store cards, where each buyable card carries its own Buy.
- **Outline:** Charcoal Surface face with a Deep Border edge; hover lifts face and edge. Inside store or services surfaces (`data-tone`) the edge takes Store Blood or Services Rose automatically, never per button. Icon controls keep a quieter neutral edge.
- **Quiet:** Soft Muted text with a hairline underline that grows from the centre on hover.
- **Chips:** Charcoal face and quiet edge; selected chips gain an ink border and a check mark, and may show their result count.
- **States:** Hover is tonal and only on hover-capable devices; press darkens the face; nothing moves. Focus is a 2px ink ring at 2px (amber on Listen). Disabled drops to 45%. Loading keeps the width, sets `aria-busy` and changes the label.
- **Status is not a control:** Ordinary unavailable items show Sold Out or Out of Stock in the purchase slot. An active pre-order with unavailable copies follows the approved reference exception: its truthful status badge sits below the identity, with a genuinely disabled gray Pre-order control at the bottom. Ordering remains unavailable.

**The Feedback Stays In Place Rule.** Add to cart says Added, Remove leaves an Undo line, Stop asks once, and Pay fills when the shipping quote is ready. No toasts or confirmation dialogs for these.

**The Header Cart Rule.** The bag control appears when the cart has items or the shopper is on a store route; its box is reserved so the navigation never shifts.

### Chips

Chips and badges are compact metadata, not decorative pills.

- **Style:** Small uppercase labels, tracked text, subdued gray or section accent, and thin borders.
- **State:** Selected or active states may use Store Blood or Services Rose only in the route where that meaning is already established.

### Pre-order components

Pre-orders reuse the existing button, chip and card families and add only Sea Green marks. Rules live in `apps/web/src/styles/global.css`.

- **Badge** (`.store-item-card__preorder` on cards; `.preorder-badge` elsewhere): the status chip's box with a 1px Sea Green outline. Card badges use Ink Foreground text, sit left-aligned below artist and format, and retain Only N left when present. `Digital out now` (`.store-item-card__release-status`) is the neutral twin. Exhausted active pre-orders show their availability badge and disabled action without release/ship badges; ended pre-orders have no pre-order badge and use ordinary Buy.
- **Pre-order button** (`.preorder-action`): the primary button with a 3px Sea Green base line; hover and focus-visible fill the face Sea Green with Ink Foreground text. Standard footprint: 224 x 54 px on desktop, full width on mobile. The approved Home film scene alone uses a 300 x 54 px desktop Store Item link.
- **Facts** (`.preorder-facts`): label and value rows in a Sea Green outline, Inter, 4.5:1 text.
- **Ships-together notice** (`.preorder-notice`, `.preorder-rail`): outlined, tinted panel with a two-step rail; Today is solid, the arrival step (`--later`) is dashed because its date is an estimate.
- **Panel edge** (`.preorder-edge`): 2px Sea Green top edge for the return page panel.
- **Store filter and notes** (`.store-preorder-filter`, `.store-preorder-notes`): a 44px chip with the pre-order count (ink border and check mark when selected) and a three-note strip with a Sea Green top edge.
- **Home section** (`.home-preorders`): successive release chapters after the existing introduction and before News. The approved film scene centers the artist, large Veneer title, truthful badges, Bebas price, pre-order link and one complete sharp sleeve over a small silent native backdrop. Shipping stays by the purchase action, shown once. Its no-video companion uses the release's own band photograph, one sleeve, identity and shell Listen, then facts and a separate purchase band. Mobile preserves the wide film with opaque copy below; the band photograph remains complete with an overlapping sleeve. Missing photographs use a purposeful cover-only layout. Artwork comes from accepted originals, never sampled screenshots; film posters never repeat a sleeve.
- **Home motion exception, approved 5 October 2026:** muted inline footage plays only when visible and eligible, pauses offscreen/when hidden or while a shell music session exists, and honors manual pause. The background text play button is removed; eligible automatic motion keeps only an accessible pause/resume icon. Reduced motion/data saving retain the complete poster experience without a background-play override. Only explicit Watch mounts a centered player and Close button below the film, full-width within 16px mobile gutters and capped at 65rem on desktop. It contains no duplicate sleeve or album details. Closing removes the panel and returns visible focus to Watch. Listen stays with the media actions. Every viewport uses ordinary flow; no competing audio, intercepted scrolling, sticky spacer, video scrubbing or added motion library.
- **Home refinement, approved 5 October 2026:** Base sweep raises the purchase action's Sea green fill over 240ms on hover or keyboard focus; it stays static at rest, preserves the label/control position and switches immediately with reduced motion. Artwork is noninteractive. Accepted artist paths become subtle profile links. Retain a clearly spaced “Pre-order & delivery information” link, and omit repeated payment/whole-parcel text on Home. A small down-arrow links to the next chapter with a descriptive accessible name.
- Other pre-order surfaces retain existing motion and Veneer/Bebas sizes. Home alone uses the approved larger feature title; every interactive target remains at least 44px.

### Cards / Containers

Cards are editorial frames for images and text.

- **Corner Style:** Square by default (`0`), even when built with shared Card primitives.
- **Background:** Charcoal Surface or Black Card, with image frames on Void Background.
- **Shadow Strategy:** No shadow at rest. Hover changes border and background, not position.
- **Border:** Deep Border for explicit frames, Hard Border for tokenized primitives.
- **Internal Padding:** Usually `1rem` to `1.5rem`; dense metadata panels may use `0.75rem`.
- **Page frame:** Header, editorial routes and footer share one frame, `.layout-container`: `--page-max-width` (72rem) with `--page-gutter` steps of 16, 24 and 32px at 0, 640 and 1024px, never less than the safe-area inset. Pages use the class instead of their own widths; Store collections only raise `--page-max-width` to 90rem, and Home's full-bleed bands are the other exception.

### Inputs / Fields

Inputs are quiet operational controls that must not become a second visual system.

- **Style:** Void Background or near-black field with Hard Border, off-white text, and muted placeholders.
- **Focus:** Ring or accent-tinted outline. Services inquiry fields may use Services Rose focus.
- **Error / Disabled:** Disabled controls reduce opacity and remain non-interactive. Errors should be textual and visible, not color-only.

### Navigation

Navigation is compact, uppercase, and shell-owned. One link model and one `.site-nav-link` style serve the header, the phone Menu and the footer sitemap; each surface changes only size.

- Header links use 12px uppercase text with wide tracking. On every surface the current page carries the same underline under its label.
- Services and Store shift into their route accents only on hover, focus, press or the current page, never at rest, and never with side stripes.
- The phone Menu lists Home first, then the main-menu sections. Desktop shows the sections beside the logo, which links Home. The header button shows the word Menu beside its icon.
- On touch screens, Menu rows, Close and footer sitemap links are at least 44px tall, and the sitemap wraps instead of clipping.
- Mobile navigation must preserve the same shell routing behavior and not introduce real document swaps for top-level sections.

### Signature Component: Persistent Music Player

The embedded player is a shell-level continuity feature, not page-local decoration. Its modal and mini-player states may use floating shadows because they sit above the document. The mini player appears only after real embed intent and must stay compact, legible, and keyboard reachable.

### Home Motto Scrub

Approved 6 October 2026. When the Staff motto ends in Records, Art or Noise, that word cycles in this order from the written word: 1.5 s first hold, 2.8 s holds, 1.4 s scrub that leaves fast and settles into the last letter. The first change therefore finishes by about 2.9 s, well before most visitors scroll; the owner shortened the first hold from 2.5 s after seeing it on UAT. A thin white playhead travels from the start of the word to the end of the next word, so each change spans the old word's length and ends at the new word's length; behind it the next word, ahead of it the current one. Chaos from the owner's mockup rides on it: in random bursts during the first two thirds of each scrub, horizontal slices of either word tear sideways and torn fragments of a filled, mirrored session-clip waveform flash between them, all clipped to the span so nothing touches the words before it. Each word then lands clean. Monochrome only. The rest of the hero keeps its single fade-rise entrance; the glitch is reserved for the cycling word. Reduced motion keeps the written word; the cycle pauses off screen and in hidden tabs. Rejected in the rendered study: Signal (word folds into a sine), Scan (sine-displaced bands) and a background waveform window behind the word.

### Signature Component: Catalog Tile

Catalog tiles are hard-edged, image-led modules. They use square artwork frames, muted metadata rows, Veneer content titles (with the Store Listing Scale above), and subtle image scale on hover. Do not turn them into rounded ecommerce product cards.

## Staff workspace

Staff uses its own dark, sans-serif product surface built on EmDash APIs. The living [backoffice reference](docs/backoffice-design.md) supersedes the older Content landing, staging, refresh, preview-default and all-sidebar decisions.

At widths of at least 1440 px, a 72 px top bar exposes Overview, Catalog, Website, Images, Stock and Orders with labeled icons on muted gray, violet, blue, sage, copper and teal squares. Filled active backgrounds provide clear selection. Catalog and Website have optional 256 px contextual sidebars. Smaller widths use a compact header and labeled Menu drawer. Blue means action; semantic statuses retain text and icons.

The approved Staff logo is the Office stamp treatment: the selected C artwork extracted directly from the approved concept image as a transparent 686 × 162 PNG. Preserve its exact composition, lettering and Staff badge rather than recreating the endorsement in HTML. This is staff-only branding; public logo assets remain unchanged.

Editors autosave private drafts and publish explicitly. Catalog items show one Publish changes on both tabs with a count of what is not live yet; typed prices wait as EmDash drafts until that single review applies them, and stock stays immediate. Real shared-template previews start alongside editors at 1280 px and above, with remembered visibility; smaller widths use Edit/Preview tabs. Preview remains non-interactive and debounces typing for 750 ms. Review changes is a blue icon button; opening a comparison entry drives the publication preview, while Publication history opens in a right-side panel with colored status badges and expandable details. Preserve draft buffers and navigation recovery.

## 6. Do's and Don'ts

### Do:

- **Do** preserve the monochrome BlackBox visual language unless the task explicitly changes the visual direction.
- **Do** use Store Blood only for store and checkout context, and Services Rose only for service and inquiry context.
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

Listen refinement selected September 24, 2026: **Fluid five with animation**. Preserve the familiar dark face, square edges and compact label; replace the circular indicator with five amber (`#e3b56c`) bars. Use the same mark in the modal heading and minimized player. Hover/focus and modal entry run two brief cycles, then settle; reduced motion disables the animation. The mark identifies listening and never claims verified playback. Retain `Player Ready` and the existing shell-owned lifecycle. Future button studies should extend this restrained family. Cosmos Public Work remains an aesthetic reference for quiet hierarchy and image-first restraint; amber is a music accent, not a replacement global action color.

For Content, Images, Items, Stock and Orders, use the living [backoffice design reference](docs/backoffice-design.md). It records shared staff patterns, research, proposal status and validation separately from the public site's visual direction.

## Website changes review (September 2026 refinement)

Staff utilities and Overview open `/review/`. This supersedes the list-checkbox publication queue. Review discovers saved unpublished Website and Catalog entries through the EmDash workspace adapter, with search, area filters and up to 25 entries per page. Selection persists in the same tab, up to 20 entries across pages. Incomplete drafts remain visible with editing links. A final review checks saved versions; a changed version requires renewed review. The editor's Review changes shortcut finishes autosave and selects only that entry. One selected entry uses Publish change; several use Publish N changes.

Batch publication includes selling-linked entries but does not activate the shop, apply price drafts, or change stock. Entries with a price draft show it and link to the item, whose own publish review applies the price, the checkout presentation and a first sale. Pending request identities survive response loss; failed operations require a fresh review. The batch service accepts all reviewed entries in one website update.

Count stock and Finish counting replace visible Stocktake wording; internal storage identities remain compatible. Quantities read Available to buy online, with copies for music and units for merchandise. The online quantity is how many customers may buy through the website.

Review discovery uses bounded native EmDash cursor reads and existing accepted-snapshot comparisons, never private CMS table queries. The client follows sparse continuations until its page fills or reaches the end, cancelling stale searches. It does not load the entire library into browser memory or poll a global draft count. Hosted rollout still requires a Free-tier cost preflight.

### Store browsing and item information

Store cards retain their price and show a 44px Buy in the filled primary face at its right when the item is stocked, so Buy never shares the outlined look of a status; Sold Out, Out of Stock, or Currently Unavailable take Buy's place. Both wrap below the price when needed, and the purchase row reserves Buy's height so cards never grow when prices arrive. Buy reads the live offer, adds one copy and opens the cart, confirming with Added; it never links to the item page, which keeps Add To Cart. Keep artwork unobstructed and Listen in its existing row. Use readable foreground text with a subtle Store Blood outline for Sold Out and a neutral outline for the other statuses; stocked items need no additional label, except that an item whose staff enabled Show copies left and which has 5 or fewer copies online reads Only N left beside Buy in the status chip's exact box, Store Blood edge on the Store Blood surface. On its page the same words sit in a 28px tab fused to the top edge of Add To Cart, sharing its width, square 1px edge and display type, so notice and action read as one unit. No dots, pulses, countdowns or colour-only meaning: the real count carries the message. The active Coverflow card keeps its purchase row visible; below 40rem that row shows price and status without Buy, so the compact cover is not squeezed. One native link covers the card, with only the independent Listen and Buy buttons above its hit area. The title says so: it carries the text-link underline, faint at rest and full when the card link is hovered or focused, while the card's border and surface lift on hover-capable devices. Hovering Buy or Listen leaves the card at rest.

Store Listen actions use the selected Below the artwork placement: a left-aligned 112 × 44px button in a 52px row before the item title, only when a listening source exists. Source-less items start their identity directly below the artwork; the price/action row stays at the bottom. The active recording shows disabled amber **In player** status across Store, Releases and details. This denotes the shell's existing session, including a paused provider, rather than verified playback. Reopen and Stop belong to the floating player, with 44px controls on mobile. Stop or switching recordings resets the previous source's Listen controls. Keep Releases' existing placements.

Store collections use a 90rem container with 32px desktop and 16px mobile gutters. At 1024px the 13rem Artists pane sits beside the results; below it, Distro formats stay visible as wrapping square chips with counts (selected: ink border and check mark, never a horizontal scroller), and a full-width native Artist select holds the artist filter. Keep Top below it. Cards form a continuous Grid by default: four columns from 1280px, three from 640px, two from 360px, and one below. Optional Coverflow requires explicit selection.

Distro uses one mixed-format catalog of Distro sources, ordered band A–Z. Release-sourced BlackBox Store items belong to All and BlackBox Releases and are excluded from Distro. The approved lifecycle card composition keeps artist and format together without an additional New release row. Format chips filter individual cards and share the artist/text filters. Any active filter uses Grid; optional Coverflow browses the complete unfiltered list. Pre-orders are marked on cards (Pre-order badge, Pre-order button) and collected under a Pre-orders filter; see Pre-order components.

Releases sits in the page frame without an outer box; hairline rules separate lead, supporting and catalog. Phones read the lead as complete cover then copy, and the supporting release as a list row (6.5rem cover beside identity and actions, summary left to its detail page). From 1024px the lead takes 8 of 12 tracks beside the supporting release, with every column top-aligned so neither stretches the other; the lead cover stays the largest artwork and the supporting cover caps at 15rem. Releases shows each record once within its existing editorial roles. Digital release dates and physical ordering are independent: Upcoming content can announce a forthcoming vinyl edition after the digital album is out. Before ordering opens, show Vinyl coming later alongside Digital out now or a known future digital date; an undated album makes no digital availability claim. Missing or unavailable offers cannot turn an announced pressing into Sold Out. Confirmed buyable offers determine Pre-order vinyl or Buy vinyl, while exhausted active preorders and Released editions retain their actual unavailable state. Listening remains independent.

Use complete square artwork and the UI display face (Bebas Neue) for prices across cards, item pages, cart, and checkout. Store listing cards follow the Store Listing Scale: Veneer item titles above a quiet Inter “by” and artist or label name, left-aligned lifecycle badges and a stable bottom price/action row. Item pages, cart and checkout retain Veneer item titles and Inter credits; formats and controls retain their existing fonts. Cards contain the purchase facts without repeated descriptions or category labels. On item pages, cap artwork at 26rem and place it beside purchase information on desktop; mobile reads identity, artwork, purchase information. Info and populated format-matching Tracklists share the next row. Preserve More views and existing listening actions.
