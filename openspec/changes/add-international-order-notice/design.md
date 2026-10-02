# Design

## Reference images

| File                                                       | Shows                                             |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [design/notice-variants.png](design/notice-variants.png)   | Strip, line and card variants with the email spec |
| [design/store-desktop.png](design/store-desktop.png)       | Strip under the Store heading, desktop            |
| [design/store-390.png](design/store-390.png)               | Strip stacked at 390px                            |
| [design/item-desktop.png](design/item-desktop.png)         | Line under the purchase action                    |
| [design/cart-390.png](design/cart-390.png)                 | Card in the cart drawer footer, above Checkout    |
| [design/checkout-desktop.png](design/checkout-desktop.png) | Card inside the checkout shipping step            |

Rendered at 1x from the canvas source with the repository's logo, Veneer font and covers. The images are visual intent, not markup. Headers, navigation, prices and product data in them are placeholders. Match the hierarchy, copy, spacing rhythm and colour roles using existing tokens, Tailwind utilities and components; do not copy hex values or inline styles.

## Decisions

- **Show to everyone.** No geolocation: the site is static Pages on the Cloudflare Free tier, and IP country misreads VPN and travelling shoppers. Greek shoppers can ignore one quiet line.
- **Place it at the decision.** Shoppers overlook site-wide banners (Baymard), so the line sits under the purchase action and the card sits beside Checkout, not only on collection pages.
- **Stay quiet.** Not dismissible, no popup, no modal, no live region, no animation. Browsing and Greek checkout stay unchanged.
- **Email, not a form.** A `mailto:` link needs no backend and keeps the closed country scope intact.
- **One component.** `InternationalOrderNotice` with `variant: 'strip' | 'line' | 'card'` and an optional `itemTitles: string[]`. One copy object, one mailto builder.

## Copy

Use this text exactly. Owner may still adjust "for now" and the address (see Open questions); keep both in the one copy object so a change is a one-line edit.

| Variant | Text                                                                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strip   | Label `Shipping`. Body `We ship within Greece only, for now.` followed by muted `Ordering from abroad? Email us and we'll arrange it with you.` Link `Email us to order`                                                |
| Line    | `Ships within Greece only. Outside Greece?` Link `Email us to order`                                                                                                                                                    |
| Card    | Title `Ordering from outside Greece?` Body `Online checkout ships within Greece only for now. Email us what you'd like and where it's going, and we'll confirm shipping and payment with you.` Link `Email us to order` |

## Email link

- Address: `support@blackboxrecordsathens.com`, the reply-to address order emails already use (`RESEND_REPLY_TO_EMAIL` in `apps/backend/wrangler.jsonc`). Do not read `purchase_information.seller.support_email`; it is a placeholder and returns null in production until that content is approved.
- Subject: `Order from outside Greece`.
- Body template, one field per line:

  ```text
  Items: <comma-separated item titles, or empty>
  Country:
  City:
  ```

- Build it with `encodeURIComponent` in a pure helper, for example `buildInternationalOrderMailto(itemTitles: string[]): string`, with a unit test covering no items, several items, and titles containing `&`, `,`, `?` and non-ASCII characters.
- Item titles: Store Item page passes the item title; cart drawer and checkout pass the current cart line titles. Store collection pages pass none.
- The link is a normal `<a href="mailto:...">` with a minimum 44px target and the trailing arrow icon used in the mocks (`aria-hidden`). Link text alone names the action.

## Variants and tokens

| Element        | Strip                                                                                                                   | Line                                      | Card                                                                                                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Container      | `aside` with `aria-label="Shipping outside Greece"`, `--secondary` surface, 1px `--store-accent` border, square corners | Plain paragraph, no box                   | `aside` with `aria-label="Ordering from outside Greece"`, 1px border: `--store-accent` in the cart drawer, `--border` inside the checkout shipping step (that step already has the accent border) |
| Label or title | `Shipping`, small uppercase tracked Inter, `--store-accent-active`                                                      | Truck icon, `aria-hidden`, `currentColor` | `Ordering from outside Greece?` in the display font (Bebas), `--store-accent-active`                                                                                                              |
| Body           | First sentence `--foreground`, second `--muted-foreground`                                                              | `--muted-foreground`                      | `--muted-foreground`                                                                                                                                                                              |
| Layout         | Desktop: one row, label, body, link. Below `md`: stacked                                                                | Wraps inline                              | Stacked                                                                                                                                                                                           |

`--store-accent` is a border colour only; accent text uses `--store-accent-active` for contrast. No emoji, no rounded cards, no shadows.

## Placements

| Placement                               | Variant | Edit point                                                                                                     | Position                                                                                     |
| --------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Store collection pages (all categories) | Strip   | `apps/web/src/layouts/StoreCollectionPage.astro`                                                               | Below the page heading and category navigation, above results                                |
| Store Item                              | Line    | `apps/web/src/pages/store/[slug]/index.astro`                                                                  | Directly after `StoreItemPurchaseActions`, before `PurchaseInformation`                      |
| Cart drawer                             | Card    | `apps/web/src/components/store/cart/StoreCartDrawer.tsx`                                                       | Footer, after the delivery summary, before the Checkout action. Only when the cart has lines |
| Checkout shipping step                  | Card    | Component that renders `CHECKOUT_SHIPPING_COPY` (`checkout-shipping-step-state.ts`, `CheckoutOfferStatus.tsx`) | Inside the shipping step, after the Greece-only delivery text, before the continue action    |

On the Store Item page, the notice must not split the fused copies-left notice and Add To Cart control; it goes after the whole purchase-actions block. At 390px the cart Checkout action must stay reachable (see `fix-mobile-cart-scrolling`).

## Open questions

Defaults are implemented unless the owner answers otherwise before acceptance:

1. Address: `support@` (default) or `info@`?
2. Keep "for now"? It suggests international shipping is planned.
3. Show to everyone without geolocation (default yes)?
4. Keep the Store Item line (default yes)?
