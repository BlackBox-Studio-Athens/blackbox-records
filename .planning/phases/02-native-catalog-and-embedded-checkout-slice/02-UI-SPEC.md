---
phase: 2
slug: native-catalog-and-embedded-checkout-slice
status: approved
shadcn_initialized: true
preset: blackbox-storefront-store
created: 2026-04-19
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for the first native store slice. This phase defines the storefront feel for a hand-picked distro subset and a single-item embedded checkout flow.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | blackbox-storefront-store |
| Component library | radix via shadcn primitives |
| Icon library | lucide-react |
| Font | Bebas Neue for display, Inter for body, Geist Mono for utility/meta text |

**System rule:** Reuse the existing BlackBox visual language from `src/styles/global.css`, `DistroCard`, and the app shell. Do not introduce a second ecommerce theme, pastel palette, rounded SaaS aesthetic, or bright Shopify clone.

---

## Experience Principles

1. The store should feel like an extension of the label site, not a bolted-on commerce app.
2. The MVP is editorial first, transactional second: curated selection, product story, then buy now.
3. The shopper flow is straightforward and Shopify-like in structure, but visually BlackBox: collection -> product detail -> dedicated checkout.
4. No cart, no slide-over checkout, no modal checkout, no multi-step product configurator.
5. Stripe stays visually contained inside a dedicated checkout page, never dropped into the collection grid.

---

## Screen Contract

### `/shop/` collection view

- Purpose: present a hand-picked distro subset as the first native sellable slice.
- Layout: single curated grid, not grouped sections for the MVP slice.
- Desktop: 3-column grid.
- Tablet: 2-column grid.
- Mobile: 1-column stacked grid.
- Intro block above the grid:
  - Eyebrow: `Store`
  - Title: `Selected Distro`
  - Supporting copy: short curator-style framing, not sales-heavy copy.
- Each card reuses the existing distro-card feel:
  - image first
  - eyebrow / format metadata
  - product title
  - artist or label
  - short summary kept to 2-3 lines max
  - Stripe-backed price visible on card
  - CTA label: `View Product`
- No filters, no sort controls, no search, no inventory messaging in this phase.

### Product detail view

- Purpose: give the item enough editorial and transactional clarity before checkout.
- Layout:
  - Desktop: 2-column composition with media on the left and purchase panel on the right.
  - Mobile: stacked, media first, purchase panel second.
- Required content order:
  1. small utility metadata row
  2. product title
  3. artist / label
  4. Stripe-backed price
  5. format / subtype if present
  6. short editorial summary
  7. primary CTA
  8. quiet reassurance note
- Primary CTA: `Buy Now`
- Secondary navigation: `Back to Store`
- The purchase panel should feel anchored and decisive, but not like a sticky aggressive sales widget.
- No related products carousel in Phase 2.

### Dedicated checkout view

- Purpose: host embedded Checkout on its own in-site route.
- Layout:
  - Desktop: 2-column split, with the embedded Checkout taking the main column and a compact product summary rail beside it.
  - Mobile: product summary block above the embedded Checkout.
- Summary block includes:
  - thumbnail image
  - product title
  - artist / label
  - format
  - Stripe-backed price
- Checkout page heading should be explicit and calm:
  - Title: `Checkout`
  - Supporting line: `Secure payment powered by Stripe`
- No modal chrome, no sheet framing, no fake cart summary, no distracting upsell content.

### Cancel and return states

- Return page must not visually claim payment success as authoritative.
- Return state heading:
  - `We’re confirming your payment`
- Return state body:
  - Explain that payment confirmation is finalized after Stripe confirmation, and route the shopper back to the store or order-status messaging without declaring success too early.
- Cancel state heading:
  - `Checkout canceled`
- Cancel state body:
  - Clear, low-drama copy with a return path to the product page or store.

---

## Component Contract

### Collection card

- Base component direction: evolve `DistroCard`, do not replace it with a generic ecommerce tile.
- Card surface stays dark, flat, and squared-off.
- Add a price row and a clearer `View Product` action.
- Keep the summary shorter than the editorial `/distro/` variant.
- Hover behavior:
  - subtle image scale or lift only
  - accent shift on CTA text
  - no glow, bounce, or oversized motion

### Product purchase panel

- Use a compact vertical stack with clear hierarchy.
- Price must sit above the primary CTA.
- The CTA should be the only strong accent-filled control on the page.
- Utility metadata should use mono or compact uppercase label styling, not paragraph styling.

### Checkout summary rail

- Visually subordinate to the Stripe embed, but always readable.
- Dark card surface with a thin border.
- No dense line-item table since this is single-item buy now only.

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline separators |
| sm | 8px | Tight metadata spacing |
| md | 16px | Default component spacing |
| lg | 24px | Card interior padding and section spacing |
| xl | 32px | Grid gaps and panel spacing |
| 2xl | 48px | Section breaks between intro, grid, and detail blocks |
| 3xl | 64px | Page-level vertical rhythm on desktop |

Exceptions: `18px` mobile page gutter may remain where it aligns with the current header rhythm, and the existing `80px` header height remains unchanged.

**Spacing rule:** Product cards, purchase panels, and checkout summary blocks should breathe more vertically than horizontally. No cramped marketplace density.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.65 |
| Label | 12px | 500 | 1.3 |
| Heading | 32px | 400 | 1.05 |
| Display | 56px | 400 | 0.96 |

Additional rules:

- Display and major headings use `Bebas Neue` with uppercase tracking.
- Body copy uses `Inter`.
- Utility metadata, SKU-like labels, and compact support text may use `Geist Mono`.
- Product titles on collection cards can sit between `32px` and `36px` display treatment depending on breakpoint.
- Product detail titles may scale above the default heading role when needed, but must stay within the existing site’s display style.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#0d0d0d` | Page background, overall canvas |
| Secondary (30%) | `#141414` | Cards, panels, checkout summary, section surfaces |
| Accent (10%) | `#922f3f` | Buy Now CTA, active store nav, selected checkout emphasis, price emphasis |
| Destructive | `#6b6b6b` | Destructive or exit-confirmation language only |

Accent reserved for: `Buy Now` button, active `/shop/` nav treatment, key price emphasis, focus/selection emphasis around checkout entry. Never use the store accent on every link or every card border.

Additional tokens already available and approved for use:

- Hover accent: `#b4465a`
- Active accent: `#cf6b80`
- Accent surface wash: `rgba(146, 47, 63, 0.14)`
- Border: `#262626`
- Muted foreground: `#b3b3b3`

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Buy Now` |
| Empty state heading | `Store Incoming` |
| Empty state body | `This BlackBox selection is being assembled. Check back soon or return to the distro.` |
| Error state | `Checkout unavailable. Return to the product page and try again. If it keeps failing, contact the label.` |
| Destructive confirmation | `Leave checkout? Your order is not placed until payment is confirmed by Stripe.` |

Copy rules:

- Tone is curator-like, calm, and direct.
- Avoid hype language such as `limited drop`, `must-have`, `selling fast`, or fake scarcity.
- Do not write copy that implies payment success before webhook-confirmed fulfillment logic exists.
- Use `View Product` on collection cards, not `Add to Cart`.

---

## Interaction Contract

- Collection cards navigate to product detail; they do not start checkout directly.
- Product detail is the only place where the strong `Buy Now` action appears.
- Dedicated checkout route should preserve normal browser back behavior.
- Return and cancel states should give a clear next action:
  - return to store
  - return to product
- Embedded checkout container must appear as part of the page, not as a detached iframe gimmick.

---

## Responsive Behavior

- Mobile-first layout is mandatory.
- On mobile:
  - collection cards stack in a single column
  - product media stays above the purchase panel
  - checkout summary sits above the embedded checkout area
- On desktop:
  - product detail splits into media and purchase columns
  - checkout route uses a main content column plus summary rail
- No horizontal scrolling.
- Minimum tap target for actionable controls: `44px`.

---

## Accessibility Contract

- Focus states must remain visible against the dark theme, using the existing light ring and store accent selectively.
- All primary actions must have clear text labels; no icon-only purchase actions.
- Product images require descriptive alt text from existing content fields.
- Return/cancel states must be understandable without visual-only status indicators.
- Embedded checkout route needs a visible page heading above the Stripe surface.

---

## Motion Contract

- Keep motion restrained:
  - subtle card image movement on hover
  - simple route-loading continuity from existing app shell
  - no cart-drawer slide-ins, no parallax product gallery, no animated purchase funnel gimmicks

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | `card`, `button`, `badge`, `separator`, `skeleton` | not required |
| third-party registries | none | shadcn view + diff required before use |

---

## Non-Goals

- No cart UI
- No quantity selector
- No collection filters or sort controls
- No account area
- No inventory or “only X left” urgency language
- No success-page order authority

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-19
