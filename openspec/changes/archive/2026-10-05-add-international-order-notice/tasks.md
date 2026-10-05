# Tasks

Read [design.md](design.md) and the PNGs and sources in [design/](design/) first. Use existing tokens, Tailwind utilities and components; the mocks' inline styles are reference only.

## 1. Notice

- [x] 1.1 Add the country gate from design.md: one shared lookup of same-origin `/cdn-cgi/trace`, `loc` parsing, `sessionStorage` cache, fail-hidden. Unit-test parsing (`GR`, `US`, `XX`, `T1`, missing `loc`, malformed body), timeout and non-OK responses, cache hit and blocked storage, and that concurrent callers share one request.
- [x] 1.2 Add `InternationalOrderNotice` (`variant: 'strip' | 'line' | 'card'`, optional `itemTitles`) beside the other Store shopper components, with one copy object and the pure `buildInternationalOrderMailto` helper. It renders nothing until the gate resolves to a country outside Greece. Unit-test the helper (no items, several items, `&` `,` `?` and non-ASCII titles) and each variant's copy, landmark label, `orders@` href, and hidden states.
- [x] 1.3 Research the feature's lifetime against the actual shipping authority. Keep it isolated and active until shipping expands, without an independent flag. Document deletion points and require accurate partial-expansion replacement or full-scope removal in the shipping expansion release.

## 2. Placements

- [x] 2.1 Store collection pages: render the strip as a client island in `StoreCollectionPage.astro` for every category, without item titles.
- [x] 2.2 Store Item: render the line as a client island after `StoreItemPurchaseActions` with the item title. Keep the copies-left notice fused to Add To Cart.
- [x] 2.3 Cart drawer: render the card in the footer before Checkout when the cart has lines, passing current line titles. Extend `StoreCartDrawer.test.tsx`.
- [x] 2.4 Checkout shipping step: render the card after the Greece-only delivery text, passing cart line titles, with the neutral border variant. Extend the existing checkout shipping test.

## 3. Acceptance

- [x] 3.1 Extend `e2e/store-cart.spec.ts` (or add a focused spec) with `/cdn-cgi/trace` stubbed: as `loc=US`, assert the strip on a Store collection page, the line on a Store Item and the card in the cart drawer, each with the expected `mailto:` href; as `loc=GR` and as a failed request, assert none render. Run `pnpm test:e2e e2e/<spec>.spec.ts`.
- [x] 3.2 Browser pass on Local at desktop and 390px with the `sessionStorage` override from design.md: compare each placement with its PNG, keyboard focus on each link, 200% zoom, cart Checkout still reachable at 390px, player continuity across Store navigation, no console errors. Confirm nothing renders without the override.
- [x] 3.3 Run `pnpm validate` and `pnpm openspec -- validate add-international-order-notice --type change --strict`. Record source-bound evidence in `validation.md` per `docs/agent-workflow.md`. Do not push; release is a separate step.
- [ ] 3.4 After UAT deploy (separate release step): confirm `/cdn-cgi/trace` returns `loc` on the UAT host, the notice is hidden from a Greek connection and shown from a non-Greek one (VPN or remote browser), and the mail link opens addressed to `orders@`.

## 4. Approved line accent follow-up

- [x] 4.1 Apply the owner's Rule accent to the existing line truck and shipping rule with `--store-accent-active`. Keep the question muted, email foreground and all copy, whitespace, layout, typography, focus and behavior intact. Adapt the existing copy unit check and add desktop/390px color assertions to the item E2E.
- [x] 4.2 Update only the Item and notice-variants reference sources and PNGs, verify normal-font desktop/390px color, focus, target size and overflow, then run scoped store-cart and item E2E checks, strict OpenSpec and `pnpm validate`. Record a new source-bound checkpoint; retain earlier neutral-line evidence as history and leave UAT task 3.4 pending.
