# Tasks

Read [design.md](design.md) and the PNGs in [design/](design/) first. Use existing tokens, Tailwind utilities and components; the mocks' inline styles are reference only.

## 1. Notice

- [ ] 1.1 Add `InternationalOrderNotice` (`variant: 'strip' | 'line' | 'card'`, optional `itemTitles`) beside the other Store shopper components, with one copy object and the pure `buildInternationalOrderMailto` helper from design.md. Unit-test the helper (no items, several items, `&` `,` `?` and non-ASCII titles) and each variant's copy, landmark label and href.

## 2. Placements

- [ ] 2.1 Store collection pages: render the strip in `StoreCollectionPage.astro` for every category, without item titles.
- [ ] 2.2 Store Item: render the line after `StoreItemPurchaseActions` with the item title. Keep the copies-left notice fused to Add To Cart.
- [ ] 2.3 Cart drawer: render the card in the footer before Checkout when the cart has lines, passing current line titles. Extend `StoreCartDrawer.test.tsx`.
- [ ] 2.4 Checkout shipping step: render the card after the Greece-only delivery text, passing cart line titles, with the neutral border variant. Extend the existing checkout shipping test.

## 3. Acceptance

- [ ] 3.1 Extend `e2e/store-cart.spec.ts` (or add a focused spec) to assert the strip on a Store collection page, the line on a Store Item, and the card in the cart drawer, each with the expected `mailto:` href. Run `pnpm test:e2e e2e/<spec>.spec.ts`.
- [ ] 3.2 Browser pass on Local at desktop and 390px: compare each placement with its PNG, keyboard focus on each link, 200% zoom, cart Checkout still reachable at 390px, player continuity across Store navigation, no console errors.
- [ ] 3.3 Run `pnpm validate` and `pnpm openspec -- validate add-international-order-notice --type change --strict`. Record source-bound evidence in `validation.md` per `docs/agent-workflow.md`. Do not push; release is a separate step.
