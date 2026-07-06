## Context

Current frontend checkout documents are generated per `StoreItem` at `/store/{storeItemSlug}/checkout/` and `/store/{storeItemSlug}/checkout/return/`. The cart drawer computes checkout URL from `StoreCart.primaryLineItem`, which is the first normalized cart line. That made sense for the earlier single-item checkout milestone, but it now leaks the first item slug into a checkout that can contain multiple lines.

The Worker checkout API is already cart-capable. `POST /api/checkout/sessions` accepts `lines[]`, validates every `CartLine`, and creates one Stripe-hosted Checkout Session. The route problem is therefore mostly document routing, return URL generation, tests, docs, and smoke fixtures.

The store item URL model also needs a clear near-term boundary. Current catalog projection creates one `StoreItem` from one release or distro entry and one primary availability. A full product page with multiple variants would require catalog/content and Store Offer changes beyond a route rename.

## Goals / Non-Goals

**Goals:**

- Make checkout document URLs cart-scoped:
  - `/store/checkout/`
  - `/store/checkout/return/`
- Keep item pages focused on store item discovery and add-to-cart actions.
- Keep browser checkout payloads limited to app-owned identities and cart lines.
- Preserve Worker authority over price, stock, availability, Stripe Price mapping, order state, and return URL allowlisting.
- Keep legacy item-scoped checkout URLs from stranding shoppers during rollout.
- Document a conservative format/variant URL direction.
- Update tests, smoke references, and docs in the same slice.

**Non-Goals:**

- Do not build a full multi-variant product page in this change.
- Do not change the public checkout API path `/api/checkout/sessions`.
- Do not add account-backed carts, server-side cart persistence, discounts, quantity rules beyond current `CartQuantity`, or new payment providers.
- Do not expose Stripe Price IDs, D1 IDs, stock counts, or authoritative prices to browser state.
- Do not remove current one-`StoreItem`-per-format catalog behavior.

## Decisions

### Decision: Checkout documents become cart-scoped static routes

Create static Astro pages for:

- `apps/web/src/pages/store/checkout/index.astro`
- `apps/web/src/pages/store/checkout/return/index.astro`

The cart drawer CTA links to `/store/checkout/` regardless of which line was added first. The checkout page reads the browser `StoreCart` on load, displays all cart lines, then starts hosted checkout by sending `lines[]` to the Worker.

Alternative considered: keep `/store/{slug}/checkout/` and improve the copy to say "cart checkout." Rejected because the URL still encodes the wrong mental model for multi-line checkout and future variants.

### Decision: Item-scoped checkout URLs become compatibility routes

Keep `/store/{storeItemSlug}/checkout/` and `/store/{storeItemSlug}/checkout/return/` as compatibility entry points for one rollout window. The old checkout route should render a noindex compatibility shell when a direct load has no browser `StoreCart`, so bookmarked item-scoped checkout links do not strand shoppers on an empty cart page. If the browser cart already has lines, the old checkout route may redirect or link to the new cart-scoped checkout page.

The compatibility shell may use a valid `storeItemSlug` only to help the shopper recover intent, for example by linking back to the item page or offering the same add-to-cart action. It must not treat the route slug as checkout authority; hosted checkout still starts only from browser `StoreCart` lines and Worker validation.

Return-route compatibility must preserve query parameters. An old URL shaped like `/store/{storeItemSlug}/checkout/return/?session_id=<id>` must forward or render with the same `session_id`, so checkout state lookup still works.

Alternative considered: delete item-scoped routes immediately. Rejected because local scripts, UAT smoke, browser history, and Stripe return URLs may still reference old paths during transition.

### Decision: Worker return/cancel URLs use the cart-scoped checkout path

Update `createPublicCheckoutReturnUrl()` and `createPublicCheckoutCancelUrl()` so fallback URLs are:

- success: `{returnTarget.baseUrl}/store/checkout/return/?session_id={CHECKOUT_SESSION_ID}`
- cancel: `{returnTarget.baseUrl}/store/checkout/`

`returnTarget.baseUrl` is the configured return target origin plus any configured path prefix, for example `https://blackbox-studio-athens.github.io/blackbox-records`. Referer validation must accept the cart-scoped checkout path only under an allowed return target. During compatibility, it may also accept item-scoped checkout referers and normalize generated success/cancel URLs to cart-scoped paths.

Alternative considered: keep success/cancel tied to the primary checkout line for traceability. Rejected because checkout session/order state already carries line identities; the URL should describe the shopper document, not the first line.

### Decision: Store item pages stay item-scoped

Keep item pages at `/store/{storeItemSlug}/`. The item page remains the place to inspect one sellable item and add it to cart. Checkout no longer lives beneath that page.

Alternative considered: add `/cart/checkout/`. Rejected because existing IA already groups commerce under `/store/`, and `/store/checkout/` is the smallest clear change.

### Decision: Store item checkout path projection is removed

Current `StoreItem.checkoutPath` points to item-scoped checkout. The implementation must remove `checkoutPath` entirely from the public Store Item projection. Any catalog field-ownership references to `checkoutPath` must be removed so `storePath` remains item-owned and cart checkout comes from a cart checkout helper.

Alternative considered: rename `checkoutPath` to a compatibility-only field. Rejected because no current shopper flow should need an item-owned checkout path after cart-scoped checkout exists; compatibility paths belong in route files or route-local helpers, not Store Item projection.

### Decision: Cart checkout reserves the `checkout` store slug

The cart-scoped checkout route uses `/store/checkout/`, so `checkout` becomes a reserved store route segment. Store Item slug generation and collision checks must reject `checkout` before static route generation.

Alternative considered: rely on Astro route precedence if a future Store Item slug becomes `checkout`. Rejected because route conflict would be subtle and content-authored.

### Decision: Paid checkout cart clearing stays paid-only

The existing return status component clears `StoreCart` only after Worker state reports a paid checkout. This behavior stays unchanged unless implementation finds a concrete bug.

Alternative considered: clear cart immediately on return route load. Rejected because unpaid, expired, failed, or still-processing sessions should not discard browser convenience state.

### Decision: Format URLs stay one `StoreItem` per format for now

For releases that need separate vinyl and CD sellable options, keep separate Store Item slugs in the near term, for example:

- `/store/example-album-vinyl/`
- `/store/example-album-cd/`

This matches current content and backend assumptions: one `storeItemSlug`, one primary `variantId`, one Store Offer read.

Future product-style pages can be planned later when the catalog model can expose multiple offers under one page. That later design would need a product identity separate from `storeItemSlug`, a variant selector UI, Store Offer list handling, stock display rules, and cart snapshot creation for the selected `variantId`.

Alternative considered: implement `/store/example-album/` with vinyl/CD selector in this change. Rejected as larger than the URL cleanup and likely to mix two migrations.

## Risks / Trade-offs

- Old Stripe sessions return to item-scoped paths during deployment overlap -> keep compatibility routes and make return status component tolerate both paths during rollout.
- Old bookmarked item-scoped checkout links can load with an empty `StoreCart` -> use a noindex compatibility shell that helps recover item intent without treating the slug as checkout authority.
- GitHub Pages static hosting may not support first-class redirects the same way Cloudflare Pages does -> use noindex compatibility documents where needed.
- Browser `StoreCart` can be empty on `/store/checkout/` direct load -> render an empty-cart checkout state with a clear return-to-store action; do not invent server cart state.
- `StoreItem.checkoutPath` can keep old item-scoped checkout visible through helpers, catalog projection, or tests -> remove it from Store Item projection and update field ownership.
- Return URL generation can drop the configured path prefix for GitHub Pages -> preserve the allowed return target base URL, including optional path prefixes, in success and cancel URLs.
- Future Store Item content can claim slug `checkout` -> reserve that segment and test the collision path.
- New cart-scoped pages can sit outside closed module ownership -> update the module-boundaries manifest with the new route roots/entrypoints.
- Old return compatibility can drop `session_id` -> preserve query parameters through redirects or compatibility shell state.
- Tests and smoke scripts may keep hidden item-scoped assumptions -> update route constants and grep for `/checkout/` fixture paths.
- Multi-variant product pages remain unresolved -> document one-`StoreItem`-per-format as the current rule; defer selector work to a separate change.
- Return URL validation could become too broad -> only allow configured origins and exact cart checkout paths, plus explicit item-scoped compatibility paths during rollout.

## Migration Plan

1. Add cart-scoped checkout and return pages.
2. Point the cart drawer checkout CTA to `/store/checkout/`.
3. Update checkout page props and components so they no longer require a page `storeItemSlug` for document identity.
4. Update Worker success/cancel URL creation and tests.
5. Keep item-scoped checkout routes as compatibility routes.
6. Remove `StoreItem.checkoutPath` from Store Item projection, update catalog field ownership, reserve `checkout`, and update module-boundary manifest entries.
7. Update smoke route constants, docs, and OpenSpec references.
8. Run unit tests, boundary audits, `pnpm check`, `pnpm build`, and Browser Use validation for cart checkout.
9. After a later release window, remove or harden item-scoped compatibility routes only through a separate OpenSpec change.

## Open Questions

- None.
