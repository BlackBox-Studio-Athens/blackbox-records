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
  services-rose: '#8a495a'
  services-rose-hover: '#a76376'
  services-rose-active: '#c78997'
  store-blood: '#922f3f'
  store-blood-hover: '#b4465a'
  store-blood-active: '#cf6b80'
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
    backgroundColor: '{colors.ink-foreground}'
    textColor: '{colors.primary-inverse}'
    rounded: '{rounded.none}'
    padding: '0.75rem 1rem'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-foreground}'
    rounded: '{rounded.none}'
    padding: '0.75rem 1rem'
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

The palette is near-black and off-white with two muted red families for section-specific intent.

### Primary

- **Ink Foreground** (#f5f5f5): Primary text, primary filled buttons, active shell states, and high-contrast marks.
- **Void Background** (#0d0d0d): Site body and default page background.

### Secondary

- **Store Blood** (#922f3f): Store and checkout accent. Use for commerce context, never as a general brand wash.
- **Services Rose** (#8a495a): Services and inquiry accent. Use for service affordances, form focus, and restrained section details.

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

**The Public Title Rule.** Veneer owns public content titles: artist names, release names, distro/store item names, service offering titles, group headings, route heroes, and major editorial feature titles. Bebas Neue remains the compact UI display face for navigation, buttons, prices, cart, checkout, stock operations, order summaries, metadata-heavy panels, and any surface where texture would slow scanning.

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

Buttons are hard, typographic controls with direct action language.

- **Shape:** Square for core public actions (`0`), modest rounding only when using shared shadcn primitives (`0.225rem` to `0.35rem`).
- **Primary:** Ink Foreground background with Primary Inverse text. Use for checkout continuation, cart checkout, and decisive actions.
- **Hover / Focus:** Keep hover tonal, not bouncy. Use background opacity or accent-border shifts, with visible focus rings from the `--ring` token.
- **Secondary / Ghost:** Transparent or charcoal surfaces with Hard Border strokes. Use for back links, cart secondary actions, and service CTAs.

### Chips

Chips and badges are compact metadata, not decorative pills.

- **Style:** Small uppercase labels, tracked text, subdued gray or section accent, and thin borders.
- **State:** Selected or active states may use Store Blood or Services Rose only in the route where that meaning is already established.

### Cards / Containers

Cards are editorial frames for images and text.

- **Corner Style:** Square by default (`0`), even when built with shared Card primitives.
- **Background:** Charcoal Surface or Black Card, with image frames on Void Background.
- **Shadow Strategy:** No shadow at rest. Hover changes border and background, not position.
- **Border:** Deep Border for explicit frames, Hard Border for tokenized primitives.
- **Internal Padding:** Usually `1rem` to `1.5rem`; dense metadata panels may use `0.75rem`.

### Inputs / Fields

Inputs are quiet operational controls that must not become a second visual system.

- **Style:** Void Background or near-black field with Hard Border, off-white text, and muted placeholders.
- **Focus:** Ring or accent-tinted outline. Services inquiry fields may use Services Rose focus.
- **Error / Disabled:** Disabled controls reduce opacity and remain non-interactive. Errors should be textual and visible, not color-only.

### Navigation

Navigation is compact, uppercase, and shell-owned.

- Header links use 12px uppercase text with wide tracking and an active underline.
- Services and Store may shift into their route accents on hover and active states.
- Mobile navigation must preserve the same shell routing behavior and not introduce real document swaps for top-level sections.

### Signature Component: Persistent Music Player

The embedded player is a shell-level continuity feature, not page-local decoration. Its modal and mini-player states may use floating shadows because they sit above the document. The mini player appears only after real embed intent and must stay compact, legible, and keyboard reachable.

### Signature Component: Catalog Tile

Catalog tiles are hard-edged, image-led modules. They use square artwork frames, muted metadata rows, Veneer content titles, and subtle image scale on hover. Do not turn them into rounded ecommerce product cards.

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
- **Don't** introduce pastel ecommerce styling, neon music-app cliches, crypto/nightclub gradients, glassmorphism, decorative metric blocks, or fake urgency.
- **Don't** expose Stripe IDs, stock counts, backend identifiers, BOX NOW raw payloads, or internal runtime details in shopper-facing UI.
- **Don't** add rounded card-heavy layouts where a hard editorial frame or full-width section is more appropriate.
- **Don't** use side-stripe borders, gradient text, or repeated icon-card grids as a shortcut for hierarchy.
- **Don't** move player behavior into page-local scripts or break shell-owned top-level navigation continuity.
