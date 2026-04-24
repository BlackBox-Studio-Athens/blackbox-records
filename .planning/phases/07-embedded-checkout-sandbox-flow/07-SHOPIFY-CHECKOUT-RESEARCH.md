# Phase 7 Shopify-Familiar Cart And Checkout Research

## Objective

Research enough Shopify-style buying conventions to guide a BlackBox-owned cart and checkout UX without copying Shopify theme code or introducing true multi-item cart complexity.

## Sources

- Shopify Theme Store, Dawn preset: https://themes.shopify.com/themes/dawn/presets/dawn
- Shopify Dawn source, cart drawer snippet: https://github.com/Shopify/dawn/blob/main/snippets/cart-drawer.liquid
- Shopify Help Center, checkout style customization: https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/checkout-style
- shadcn registry search confirmed available primitives for `sheet`, `drawer`, `separator`, and `badge`.
- `07-CART-CHECKOUT-DESIGN-SPIKE.md` records the resulting wireflows and locked interaction decisions.

## Findings

1. Dawn is an official free Shopify theme and explicitly lists cart-and-checkout features such as cart notes, in-store pickups, and quick buy. It also emphasizes checkout speed as a theme-store value. The useful pattern for BlackBox is not visual cloning; it is familiar ecommerce affordances.
2. Dawn's cart drawer is structured around an accessible drawer/dialog, cart line table, product image/title/options, per-line price, quantity controls, remove controls, footer totals, tax/shipping note, and checkout action. For BlackBox v1, keep the drawer, item row, subtotal, continue shopping, remove, and checkout action. Defer quantity controls and multi-line totals.
3. Shopify checkout guidance recommends simple, high-contrast checkout styling because shoppers enter sensitive shipping and payment details there. For BlackBox, this supports a calmer checkout surface: monochrome, sparse, legible, and not over-animated.
4. Shopify checkout has an order summary pattern that is especially familiar on mobile through a show/hide order summary. For BlackBox, the static shell can own the summary while Stripe embedded Checkout owns payment fields.
5. The current BlackBox route identity is misleading for the local buyable item. `/store/barren-point/checkout/` is actually presenting Afterwise's `Disintegration` with the `Black Vinyl LP` option. The next implementation slice should fix shopper-facing URL semantics before cart UX lands.

## Adopted Patterns

- Header cart icon with count badge.
- Single-item cart drawer opened after Add To Cart.
- Drawer line item with image, artist/release title, option label, price, availability, remove action, and Checkout CTA.
- Checkout page two-column desktop layout with a Shopify-like order summary on the side and embedded Stripe Checkout as the primary form area.
- Mobile checkout order summary collapse.
- Continue shopping/back-to-store affordance.
- Clear unavailable state that prevents checkout without hiding the item.

## Rejected Patterns

- Do not copy Dawn Liquid, CSS, icons, or theme assets.
- Do not add multi-item cart, quantity stepper, discount code, customer accounts, cart notes, or shipping forms in Phase 7.
- Do not try to restyle Stripe's embedded payment internals beyond the supported Stripe surface.
- Do not make browser cart state authoritative for price, stock, payment, or order state.

## Design Implication

Phase 7 needs a UI contract before further checkout work:

- A shopper thinks in terms of an item option: `Disintegration` by `Afterwise`, `Black Vinyl LP`.
- The URL should use an item-option slug such as `/store/disintegration-black-vinyl-lp/`, while legacy slugs redirect.
- The cart is a familiar single-item presentation shell over the existing Worker-owned `StartCheckout`.
- The checkout page should feel familiar to Shopify buyers, but remain recognizably BlackBox: monochrome, editorial, and low-noise.
- The implementation should use the spike's locked decisions: right-side desktop `Sheet`, full-height mobile `Sheet`, single-item replace-on-add state, and direct checkout recovery from static item plus Worker offer state.
