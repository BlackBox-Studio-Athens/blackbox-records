---
phase: 07-embedded-checkout-sandbox-flow
slug: worker-checkout-and-shopify-familiar-cart
status: approved-for-planning
created: 2026-04-24
design_spike: 07-CART-CHECKOUT-DESIGN-SPIKE.md
---

# Phase 7 UI Spec - Shopify-Familiar Single-Item Cart And Checkout

## Design Goal

Make buying feel immediately familiar to people who have used Shopify stores while keeping BlackBox's monochrome label identity and the current single-item, Worker-owned checkout boundary.

This spec is locked together with `07-CART-CHECKOUT-DESIGN-SPIKE.md`; implementers should treat the spike wireflows, copy decisions, and interaction decisions as binding unless a later plan explicitly supersedes them.

## Hard UX Correction

The local smoke URL is now `/store/disintegration-black-vinyl-lp/checkout/`, which describes the item option being shown.

The displayed buyable object is:

- artist: `Afterwise`
- album/release: `Disintegration`
- item option: `Black Vinyl LP`

The shopper-facing store URL must therefore describe the item option, for example:

- `/store/disintegration-black-vinyl-lp/`
- `/store/disintegration-black-vinyl-lp/checkout/`
- `/store/disintegration-black-vinyl-lp/checkout/return/`

Legacy routes such as `/store/barren-point/` remain redirects or aliases during migration, but they must not be treated as the canonical checkout URL.

## Experience Model

The Phase 7 buying path becomes:

1. Store item page shows editorial item detail, price, and availability.
2. Shopper clicks `Add To Cart`.
3. A cart drawer opens with one line item, subtotal, and checkout action.
4. Header cart icon shows count `1`.
5. Shopper clicks `Checkout`.
6. Checkout page shows an order summary and mounts Stripe embedded Checkout.
7. Return/retry pages read `CheckoutState` from the Worker.

## Scope Boundary

In scope:

- Single-item cart icon and cart drawer.
- One active line item at a time.
- Remove item.
- Continue shopping.
- Checkout CTA from drawer and PDP.
- Shopify-like checkout summary layout.
- Mobile order-summary collapse.
- Worker-owned offer and checkout API calls.

Out of scope:

- True multi-item cart.
- Quantity controls.
- Discount codes.
- Customer accounts.
- Shipping forms before Phase 9.
- Cart notes.
- Upsells/cross-sells.
- Browser-owned price, stock, payment, or order authority.

## Visual Direction

- Preserve BlackBox monochrome: black background, off-white text, muted gray borders, selective red/pink accent already used in navigation.
- Use Shopify-familiar structure but BlackBox-owned surfaces; do not use Shopify-like white-box theme visuals.
- Avoid generic SaaS checkout styling. The checkout should feel like a label merch desk translated into a familiar ecommerce layout.
- Cart drawer should be utilitarian and high-contrast, not flashy.
- Checkout page should be calmer than the store PDP: fewer textures, clearer hierarchy, stronger form-area focus.
- Desktop cart sheet width should land around `420-480px`.
- Mobile cart sheet is full-height by default; do not use a bottom drawer unless implementation testing proves full-height harms usability.

## Layout Contracts

### Header Cart Icon

- Add a quiet line-style cart icon button to the persistent shell header.
- Show a small count badge only when the cart has one item.
- Keep it accessible with a label such as `Open cart`.
- Do not show it in operator-only `/stock/` context unless the app shell already renders there.

### Cart Drawer

Use shadcn `Sheet`.

- Desktop: right-side sheet.
- Mobile: full-height sheet.
- Header: `Cart`.
- Empty state: `Your cart is empty`, `Continue Shopping`.
- Filled state:
  - cover image
  - item title
  - artist/subtitle
  - option label
  - price display
  - availability label
  - remove action
  - subtotal
  - checkout action
  - note that shipping/taxes are handled at checkout where applicable

### Store Item Page

- Primary action becomes `Add To Cart` when the item can be checked out.
- Do not keep `Buy Now` as the primary label. If a secondary fast path exists, it must still set the cart item and route through the canonical checkout URL.
- Unavailable items show disabled action and a calm explanation.
- Keep editorial content and image composition from Phase 6.

### Checkout Page

- Desktop: two-column layout.
  - Left/main column: checkout step status and embedded Stripe mount.
  - Right column: order summary with image, title, option, price, subtotal, availability.
- Mobile:
  - Collapsible order summary at the top.
  - Embedded Checkout below.
- Direct checkout page loads must recover without prior cart state by reading static item data and Worker offer state.
- Add familiar breadcrumbs or step labels only if they are truthful:
  - `Cart`
  - `Checkout`
  - `Return`
- Do not fake steps for shipping/payment that Stripe owns.

## Copy Contract

Use direct ecommerce language:

- `Add To Cart`
- `Cart`
- `Checkout`
- `Continue Shopping`
- `Remove`
- `Subtotal`
- `Order Summary`
- `Payment is handled securely by Stripe`

Avoid:

- internal names such as `StoreItemSlug`, `VariantId`, `StartCheckout`
- phase language such as `Phase 7`
- debug labels
- `Buy merch`
- fake scarcity

## Component Strategy

Existing shadcn primitives are preferred:

- `Button`
- `Badge`
- `Card`
- `Sheet`
- `Separator`
- `Input` only if needed for future forms

If a primitive is missing, add it through the shadcn registry and keep styling aligned with the current monochrome system.

## State Contract

Browser cart state may store only app-safe display and routing values:

- canonical item-option slug
- variant id
- title
- subtitle/artist
- option label
- image reference/display URL
- price display
- availability label

Browser cart state must not store:

- Stripe secret keys
- Stripe price IDs
- D1 IDs
- authoritative stock counts
- paid/order state
- actor email

Cart state is single-item and replace-on-add. Adding a second item replaces the existing item rather than creating another line.

## Accessibility Contract

- Cart icon is keyboard reachable and labeled.
- Drawer traps focus and returns focus to opener.
- Remove and checkout actions are buttons, not clickable divs.
- Order summary collapse uses a real button and announces expanded state.
- Loading/error states are visible text, not only color.
- Checkout errors use `role="alert"` where appropriate.
- Cart sheet close returns focus to the opener.

## Verification

- Browser route for the seeded item uses the new canonical item-option slug.
- Legacy `/store/barren-point/` resolves to the canonical item-option URL.
- Header cart icon opens cart drawer.
- Add To Cart updates the cart count and drawer line item.
- Remove resets the cart state.
- Checkout CTA routes to the canonical checkout page.
- Checkout page summary matches the cart line and Worker offer state.
- Embedded Checkout still starts through Worker `StartCheckout`.
- Browser payloads still include only app identities, not Stripe price IDs or secrets.
- Mobile cart drawer and checkout summary are usable.
