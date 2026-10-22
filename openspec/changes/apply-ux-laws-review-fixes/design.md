# Design

## Context

See proposal.md for motivation and the delta specs for required behavior. The owner chose each fix on 22 October 2026 from before/after previews rendered against production (`.codex-artifacts/design-review/ux-laws-2026-10-22/`, including the interactive buy bar study `buy-bar-review.html`). Codex diagnosed the cart wait read-only the same day; its findings set the speed tasks.

Relevant current code:

- The item page's inline action is `StoreItemPurchaseActions.tsx`. It reads the live offer, holds `cartItem`, and confirms Added through `STORE_CART_ITEM_ADDED_EVENT`.
- The cart drawer copy is `STORE_CART_DRAWER_COPY` and the header in `StoreCartDrawer.tsx`.
- `DeliverySummary.tsx` renders the drawer pending state as one text line. The checkout review presentation already reserves rows with `…`. `useDeliveryQuote` always waits 250 ms before requesting.
- `NewsletterSignupForm.tsx` renders the email/Subscribe row, then consent, then status and error.
- `ServicesInquiryForm.tsx` maps services to `SERVICES_INQUIRY_DETAIL_PROMPTS` and renders Send Inquiry with `variant="outline"`.
- The floating player is `.music-streaming-service-embedded-player-mini-player`, fixed at the bottom with its own transform transition.
- The intent-warm selector in `AppShellRoot.tsx` lists `[data-store-item-add-to-cart]`, but Store cards use `[data-store-card-buy]`.

## Goals / Non-Goals

**Goals:**

- Reuse existing purchase, cart, button and token primitives; add no dependencies.
- Keep every animated property on transform or opacity, with zero layout during transitions.
- Split work by ownership: Claude owns presentation and its tests, Codex owns request timing, warm-up and Worker reads.

**Non-Goals:**

- No new 404 page and no change to the desktop Release link (declined).
- No speculative quotes, Stripe price caching or quote start at add time (declined for now).
- No change to checkout authority, prices, consent semantics or API shapes.

## Decisions

1. **The buy bar lives inside `StoreItemPurchaseActions`.** It reuses the component's state and click handler, so labels, the offer read, Adding/Added and the cart opening stay identical. A separate island would duplicate the offer read; a shell-owned bar would need a new cross-module contract.
   - The bar renders only when an actionable `cartItem` exists. It is `position: fixed` below 40rem and `display: none` from 40rem.
   - Its control repeats the inline action's accessible name. Inline remains the primary DOM action; the bar is an `aria-hidden="false"` region labelled "Quick purchase", and it is `inert` while hidden.
2. **One IntersectionObserver sentinel drives state.** It observes a zone from the inline action's top to the page end: the bar shows while that zone does not intersect the viewport. A fast fling is handled because the zone is tall.
   - The preview proved that two separate sentinels miss jumps.
   - No scroll listeners. Alternative considered: CSS scroll-driven animation. Rejected because "only before reaching" needs a one-way state, and Firefox lacks view timelines.
3. **Motion is CSS transitions on transform and opacity with explicit resting values.**
   - Values: `translateY(0)` and `opacity: 1` at rest; 300 ms `cubic-bezier(0.16, 1, 0.3, 1)` in; 195 ms `cubic-bezier(0.7, 0, 0.84, 0)` out.
   - The preview measured zero layouts per transition only after replacing `transform: none` with explicit values, which avoids layer churn.
   - Transitions switch on after first paint, so the bar is present at load without an entrance. Reduced motion removes the transitions.
4. **The player stacks through CSS `:has()`, not shared JS.**
   - While shown, the bar keeps `--buy-bar-height` current on the document element from a ResizeObserver.
   - `:root:has(.store-buy-bar[data-shown='true'])` translates the open mini player up by that height. The player owner keeps its own transition, so there is one writer per property.
   - Implementation finding: shell navigation swaps page content without unmounting the island, so a portal in `body` and a root attribute both outlived the page. The bar therefore renders inside the page content (fixed to the viewport, verified flush with its bottom edge), and the `:has()` lift ends as soon as the bar leaves the document.
5. **Drawer pending rows reuse the review presentation path.**
   - `DeliverySummary` gets the local subtotal from `getCartSubtotalDisplay` through its drawer caller.
   - It shows that subtotal only when every line is fixed-price in one currency, and `…` otherwise.
   - The quoted value always replaces it. Alternative considered: … for every row (option B), which the owner rejected for C.
6. **The newsletter keeps one form and changes order only.** The consent label moves between the email field and Subscribe at all widths. The error paragraph renders directly after the consent label when the target is consent, and stays at its current place for email and form errors.
7. **Services General has no details prompt.**
   - The General entry leaves the prompt map; the field renders only for services that have one.
   - The submit body omits `serviceDetails` for General even if state still holds text.
   - Send Inquiry drops `variant="outline"` for the default ink variant, as DESIGN.md already specifies.
8. **Reading widths are scoped CSS.** The News article card gets `max-width: 46rem` and a 1rem body from 640px; the About text column gets `max-width: 46rem`. Phone layouts are untouched.
   - Measured during implementation: a 46rem column alone gave about 84 (News) and 97 (About) characters per line, not the roughly 66 estimated in the review previews.
   - On 22 October 2026 the owner chose, from a second before/after board, to keep the 46rem card and cap running paragraphs at 34rem (about 70 characters). The cap is `.news-markdown-content > *` and `.about-prose` paragraphs; the About contact directory keeps the full 46rem.
9. **Codex owns these non-UI parts:**
   - First quote immediate: the hook skips the timer when it has no prior result for this mount.
   - `[data-store-card-buy]` added to the warm-up selector.
   - Worker quote path: reuse the identity and projection already read, run independent reads with `Promise.all`, and keep the final stock and hold read after the provider read.
   - Slug redirect: the mechanism follows how the public gateway serves News routes.
   - Codex returns a diff and tests; Claude integrates.
10. **The slug rename is content.** The article's slug changes in the CMS draft and goes live only through Content Publication, which the owner approves separately. The redirect ships with the code release and is harmless before the rename because the old route still exists.

## Risks / Trade-offs

- **The bar and inline action expose two controls with the same name to assistive technology.** The bar is `inert` while hidden and is only shown when the inline action is off screen, so at most one is reachable at a time.
- **The shown local subtotal can differ from the quoted Items amount.** It is shown only for fixed prices in one currency, and the quote replaces it in place. Checkout authority is unchanged.
- **An immediate first quote can be followed by a quick quantity edit, so one extra request may be sent.** The abort and latest-wins rules already cover this. The effect on Worker usage is negligible.
- **The redirect could ship before the CMS rename.** The redirect target only resolves after publication. Codex sequences the redirect behind the published slug, or makes it conditional, and states which.
- **The buy bar's smoothness is measured only in headless Chromium.** Verify on a real phone during acceptance.

## Migration Plan

UI and non-UI parts merge on `main` as one change, validated by `pnpm validate`, then follow the normal Software Release to UAT and PRD. The slug rename follows separately through Content Publication. Rollback is a normal revert; no data migration.

## Open Questions

- Which gateway file owns News redirects. Codex resolves this during implementation; the behavior is fixed by the spec.
