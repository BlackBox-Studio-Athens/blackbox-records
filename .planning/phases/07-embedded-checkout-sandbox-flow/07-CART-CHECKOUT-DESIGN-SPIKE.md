# Phase 7 Cart And Checkout Design Spike

## Objective

Lock the shopper-facing cart and checkout interaction model before `07-05` implementation resumes. This spike keeps the flow single-item, uses Shopify as a familiarity reference, and keeps all payment authority in the Worker plus Stripe.

## Reference Patterns To Adopt

- Shopify Dawn-style cart drawer structure:
  - drawer/sheet opened from a header cart icon
  - line item image, title, option label, price, remove action
  - subtotal block
  - clear checkout action
  - continue-shopping escape
- Shopify checkout familiarity:
  - checkout page separates order summary from payment/action area
  - mobile checkout can collapse/expand order summary
  - checkout styling stays simple, high-contrast, and low-distraction
- shadcn implementation primitives:
  - `Sheet` for desktop and mobile cart surface
  - `Button`, `Badge`, `Card`, `Separator`
  - no custom modal framework unless shadcn primitives are insufficient

## Reference Patterns To Reject

- No Shopify Dawn Liquid, CSS, JavaScript, icons, or theme assets.
- No true multi-item cart.
- No quantity controls.
- No discount code field.
- No customer account entry.
- No cart notes.
- No shipping form before Phase 9.
- No browser-owned price, stock, payment, or order authority.

## Canonical Item URL Flow

The current local smoke item is displayed as:

- artist: `Afterwise`
- release: `Disintegration`
- option: `Black Vinyl LP`

Canonical shopper URLs:

- item page: `/store/disintegration-black-vinyl-lp/`
- checkout page: `/store/disintegration-black-vinyl-lp/checkout/`
- return page: `/store/disintegration-black-vinyl-lp/checkout/return/`

Compatibility URLs:

- `/store/barren-point/`
- `/store/barren-point/checkout/`

Compatibility URLs should redirect or resolve safely to the canonical URLs. They must not be rendered as the primary shopper-facing route in links, cart state, checkout actions, or docs.

## Desktop Wireflow

```text
Header
┌─────────────────────────────────────────────────────────────┐
│ Logo              Releases Artists Distro About Store   Cart│
│                                                        [0/1]│
└─────────────────────────────────────────────────────────────┘

PDP
┌──────────────────────────────┬──────────────────────────────┐
│ Cover image                  │ Release                       │
│                              │ DISINTEGRATION                │
│                              │ Afterwise                     │
│                              │ Option: Black Vinyl LP        │
│                              │ €28.00 / Available            │
│                              │ [ Add To Cart ]               │
└──────────────────────────────┴──────────────────────────────┘

Cart Sheet, right side
                                  ┌────────────────────────────┐
                                  │ Cart                    ×  │
                                  │────────────────────────────│
                                  │ [img] Disintegration       │
                                  │       Afterwise            │
                                  │       Black Vinyl LP       │
                                  │       €28.00       Remove  │
                                  │────────────────────────────│
                                  │ Subtotal            €28.00 │
                                  │ Shipping calculated later  │
                                  │ [ Checkout ]               │
                                  │ [ Continue Shopping ]      │
                                  └────────────────────────────┘

Checkout
┌────────────────────────────────────────┬─────────────────────┐
│ Checkout                               │ Order Summary       │
│ Worker eligibility / Stripe mount      │ [img] Disintegration│
│ [ Embedded Stripe Checkout ]           │ Black Vinyl LP      │
│                                        │ Subtotal €28.00     │
└────────────────────────────────────────┴─────────────────────┘
```

## Mobile Wireflow

```text
Header
┌────────────────────────────┐
│ Logo        Store   Cart 1 │
└────────────────────────────┘

PDP
┌────────────────────────────┐
│ Cover image                │
│ DISINTEGRATION             │
│ Afterwise                  │
│ Black Vinyl LP             │
│ €28.00 / Available         │
│ [ Add To Cart ]            │
└────────────────────────────┘

Cart Sheet, full height
┌────────────────────────────┐
│ Cart                    ×  │
│ [img] Disintegration       │
│ Black Vinyl LP             │
│ €28.00          Remove     │
│────────────────────────────│
│ Subtotal €28.00            │
│ [ Checkout ]               │
│ [ Continue Shopping ]      │
└────────────────────────────┘

Checkout
┌────────────────────────────┐
│ [ Show Order Summary ]     │
│ Checkout                   │
│ [ Embedded Stripe Checkout]│
└────────────────────────────┘
```

## Interaction Decisions

- `Add To Cart` sets/replaces the single cart item and opens the cart sheet.
- Header cart button opens the cart sheet.
- `Remove` clears cart state and keeps the shopper on the current page.
- `Continue Shopping` closes the sheet and returns focus to the opener.
- `Checkout` routes to the canonical checkout URL for the single item.
- Checkout page can recover from direct load without prior cart state by reading static item data plus Worker offer state.
- Empty cart checkout attempts must not start `StartCheckout`.

## Visual Decisions

- Cart sheet width on desktop: narrow ecommerce side panel, roughly 420-480px.
- Cart sheet on mobile: full-height sheet, not bottom drawer by default, to protect readability and focus.
- Header cart icon should be visually quiet: line icon plus small count badge.
- Drawer background: BlackBox dark surface, not pure Shopify white.
- Borders: thin muted gray, aligned to existing store cards.
- Accent: existing subdued red/pink only for active/focus/critical emphasis.
- Checkout page should be calmer than PDP: fewer decorative textures, stronger form and summary hierarchy.

## Copy Decisions

Use:

- `Add To Cart`
- `Cart`
- `Checkout`
- `Continue Shopping`
- `Remove`
- `Subtotal`
- `Order Summary`
- `Payment is handled securely by Stripe`

Do not use:

- `Buy merch`
- `Variant`
- `StoreItem`
- `StartCheckout`
- `Phase 7`
- `Mock checkout` in production-facing copy

## Acceptance Checks

- The implementer can build cart icon, drawer, PDP action, checkout summary, and mobile behavior without making design decisions.
- The UX remains familiar to Shopify shoppers but visually BlackBox-owned.
- The route correction is handled before cart behavior depends on canonical URLs.
- The single-item cart does not imply quantity or multi-line support.
