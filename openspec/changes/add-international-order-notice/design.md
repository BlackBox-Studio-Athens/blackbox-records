# Design

## Reference images

Canvas: https://claude.ai/artifact/MMtaHRBeRrdi5jHxZzfNBe (version 5, 2026-10-02). The exports below are tied to that version.

| File                                                       | Source                                                              | Shows                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| [design/notice-variants.png](design/notice-variants.png)   | [source/notice-variants.html](design/source/notice-variants.html)   | Strip, line and card variants with the email spec |
| [design/store-desktop.png](design/store-desktop.png)       | [source/store-desktop.html](design/source/store-desktop.html)       | Strip under the Store heading, desktop            |
| [design/store-390.png](design/store-390.png)               | [source/store-390.html](design/source/store-390.html)               | Strip stacked at 390px                            |
| [design/item-desktop.png](design/item-desktop.png)         | [source/item-desktop.html](design/source/item-desktop.html)         | Line under the purchase action                    |
| [design/cart-390.png](design/cart-390.png)                 | [source/cart-390.html](design/source/cart-390.html)                 | Card in the cart drawer footer, above Checkout    |
| [design/checkout-desktop.png](design/checkout-desktop.png) | [source/checkout-desktop.html](design/source/checkout-desktop.html) | Card inside the checkout shipping step            |

The sources are the canvas boards with asset paths pointing at the repository's logo, Veneer font and covers; they open directly in a browser from the checkout. Each PNG is a 1x headless Chrome render of its source at the board size (desktop 1440 or 1280 wide, phone 390 × 844). If the canvas changes, update the sources and re-render the PNGs together.

The images are visual intent, not markup. Headers, navigation, prices and product data in them are placeholders. Match the hierarchy, copy, spacing rhythm and colour roles using existing tokens, Tailwind utilities and components; do not copy hex values or inline styles. The mocks show the notice as it appears to a shopper outside Greece; shoppers in Greece see none of it.

## Decisions

Owner answers, 2026-10-02:

1. Orders go to `orders@blackboxrecordsathens.com`.
2. Keep "for now" in the copy.
3. Shoppers in Greece MUST NOT see the notice. Use the simplest Cloudflare geolocation (see Country gate).
4. Keep all four placements.

Design decisions:

- **Place it at the decision.** Shoppers overlook site-wide banners (Baymard), so the line sits under the purchase action and the card sits beside Checkout, not only on collection pages.
- **Stay quiet.** Not dismissible, no popup, no modal, no live region, no animation. Browsing and Greek checkout stay unchanged.
- **Email, not a form.** A `mailto:` link needs no backend and keeps the closed country scope intact.
- **One component.** `InternationalOrderNotice` with `variant: 'strip' | 'line' | 'card'` and an optional `itemTitles: string[]`. One copy object, one mailto builder, one country gate.

## Lifecycle and shipping expansion

Owner clarification, 2026-10-05: this feature will never be retired before online shipping expands. Keep it active while checkout and fulfillment remain Greece-only. There is no independent feature flag: its lifetime follows the shipping restriction.

Research found the current authority in the Worker: `StripeCheckoutGateway.createHostedCheckoutSession` sets `shipping_address_collection.allowed_countries` to `['GR']`, and paid-order shipping validation also rejects non-Greek destinations. `/api/store/capabilities` currently exposes checkout availability and pricing, not a destination policy. Shopper IP location is only a presentation hint; it never authorizes a shipping address.

| Option                                                       | Decision                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent source or runtime flag                           | Skip. It permits the notice to disappear while the shipping restriction still exists, and requires a second release decision. The existing native-checkout flag controls checkout availability and cannot represent shipping coverage.                                                                                                              |
| Isolated notice, removed or replaced with shipping expansion | Use now. The component owns its copy, mailto builder, country lookup and styles; four consumers supply only placement and item titles. No new runtime setting, request or backend dependency is needed.                                                                                                                                             |
| Read destination coverage from Worker capabilities           | Add with partial shipping expansion if an unsupported-destination notice remains necessary. That change must expose the actual checkout/fulfillment policy through the existing public contract and use it for the notice. Adding an unused policy API now would add schema, generated-client, caching and failure behavior without a current need. |
| Shared frontend/backend country list                         | Skip now. A browser constant would not by itself unify Stripe eligibility, paid-order validation, delivery quotes and fulfillment. Preserve Worker ownership until the expansion defines those rules.                                                                                                                                               |

This choice follows the distinction between business eligibility and release controls. Feature toggles add configuration and validation complexity and should have a deliberate lifetime; see [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html). Here the existing shipping rule supplies that lifetime.

The shipping expansion change must include notice acceptance in the same release:

- Before expanded checkout and fulfillment are available and verified, keep this feature and all four placements active. Do not remove it merely because expansion work has started or a configuration was edited.
- For partial expansion, replace the Greece-only copy and country predicate together. Continue offering email ordering for destinations checkout cannot serve, deriving destination eligibility from the Worker's shipping policy rather than another frontend country list. Test `GR`, a newly supported country, an unsupported country and unknown country lookup. IP location remains advisory.
- When checkout serves the full intended destination scope, remove the notice and country lookup. Expanded shipping acceptance must prove that no stale Greece-only notice remains and that the normal purchase/cart/checkout controls still work. Rollback must keep notice wording consistent with the effective shipping scope.

Removal is ordinary deletion, not a disabled branch: remove the imports and placements in `StoreCollectionPage.astro`, `pages/store/[slug]/index.astro`, `StoreCartDrawer.tsx` and `CheckoutOfferStatus.tsx`; delete `InternationalOrderNotice.tsx`, `international-order-notice.css`, `shopper-country.ts` and their dedicated tests; remove the public entrypoint and notice-only boundary documentation, the snapshot sanitizer's `.international-order-notice` cleanup, the five `e2e/international-order-*.spec.ts` files and their dedicated assertions/default trace stub. Verify no notice import or trace lookup remains, then run affected validation and shipping acceptance. Existing shell, cart, checkout and pricing behavior remain independently owned.

## Country gate

Cloudflare already geolocates every request. Its managed same-origin endpoint `/cdn-cgi/trace` returns plain `key=value` lines including `loc=<ISO 3166-1 alpha-2>`. It needs no Worker, Pages Function, binding or setting, and its requests do not count against Worker quotas. Verified 2026-10-02 on `blackbox-records-web.pages.dev` and `blackboxrecordsathens.com`; confirm on the UAT host during acceptance.

- Fetch `GET /cdn-cgi/trace` from the origin root, not the Astro base path, with a short timeout (about 3 seconds). Read only `loc`; never store or log the rest of the response (it includes the visitor IP).
- Show the notice only when `loc` matches `^[A-Z]{2}$` and is neither `GR` nor `XX`. Greece, unknown, Tor (`T1`), a non-OK response, a timeout or a parse failure all keep it hidden. Failing hidden protects the hard rule for Greek shoppers; checkout still rejects non-Greek addresses.
- Resolve once per tab: one shared module-level promise for all placements, cached in `sessionStorage` under `blackbox:shopper-country` (wrap every access in `try/catch`). Cache only a successful lookup.
- Render nothing until the country resolves. Static HTML contains no notice, so shoppers in Greece never see a flash. Shoppers abroad see it appear after hydration; keep it out of the first-paint path rather than reserving space.
- The persistent shell keeps the resolved value across in-shell navigation; a full reload reads the `sessionStorage` cache.
- Local: Astro dev has no `/cdn-cgi/trace`, so the notice is hidden. For a manual check, set `sessionStorage['blackbox:shopper-country'] = 'US'` and reload. E2E stubs the route (`page.route('**/cdn-cgi/trace', ...)`) with `loc=GR` and `loc=US`.
- Ceiling: Cloudflare documents `/cdn-cgi/trace` as a troubleshooting endpoint, not a geolocation API. If its format changes, the notice fails hidden. Upgrade path: return `request.cf.country` from an existing Worker read.

## Copy

Use this text exactly, kept in one copy object.

| Variant | Text                                                                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strip   | Label `Shipping`. Body `We ship within Greece only, for now.` followed by muted `Ordering from abroad? Email us and we'll arrange it with you.` Link `Email us to order`                                                |
| Line    | `Ships within Greece only. Outside Greece?` Link `Email us to order`                                                                                                                                                    |
| Card    | Title `Ordering from outside Greece?` Body `Online checkout ships within Greece only for now. Email us what you'd like and where it's going, and we'll confirm shipping and payment with you.` Link `Email us to order` |

## Email link

- Address: `orders@blackboxrecordsathens.com`. Inbound mail for the domain goes through Cloudflare Email Routing (MX `route*.mx.cloudflare.net`); Resend only sends. Verified 2026-10-02: Resend email `01a0fcfc-1f15-7a19-bca2-5441b92df292` from and to `orders@` reached `last_event: delivered`. Do not read `purchase_information.seller.support_email`; it is a placeholder and returns null in production until that content is approved.
- Subject: `Order from outside Greece`.
- Body template, one field per line:

  ```text
  Items: <comma-separated item titles, or empty>
  Country:
  City:
  ```

- Build it with `encodeURIComponent` in a pure helper, for example `buildInternationalOrderMailto(itemTitles: string[]): string`, with a unit test covering no items, several items, and titles containing `&`, `,`, `?` and non-ASCII characters.
- Item titles: Store Item page passes the item title; cart drawer and checkout pass the current cart line titles. Store collection pages pass none.
- The link is a normal `<a href="mailto:...">` with a minimum 44px target. Strip and card variants have the trailing arrow icon used in the mocks (`aria-hidden`); the line has no trailing arrow. Link text alone names the action.

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
| Store collection pages (all categories) | Strip   | `apps/web/src/layouts/StoreCollectionPage.astro` (client island)                                               | Below the page heading and category navigation, above results                                |
| Store Item                              | Line    | `apps/web/src/pages/store/[slug]/index.astro` (client island)                                                  | Directly after `StoreItemPurchaseActions`, before `PurchaseInformation`                      |
| Cart drawer                             | Card    | `apps/web/src/components/store/cart/StoreCartDrawer.tsx`                                                       | Footer, after the delivery summary, before the Checkout action. Only when the cart has lines |
| Checkout shipping step                  | Card    | Component that renders `CHECKOUT_SHIPPING_COPY` (`checkout-shipping-step-state.ts`, `CheckoutOfferStatus.tsx`) | Inside the shipping step, after the Greece-only delivery text, before the continue action    |

On the Store Item page, the notice must not split the copies-left notice fused to Add To Cart (`show-low-stock-notice`); it goes after the whole purchase-actions block. At 390px the cart Checkout action must stay reachable (see `fix-mobile-cart-scrolling`).
