# Design

## Context

See proposal.md for motivation. Constraints that shape the approach:

- `apps/web/src/components/ui/button.tsx` (`buttonVariants`, cva) already exists and is imported by 13 callers; `apps/staff` has its own copy and is out of scope.
- `global.css` has three layers of button styling: `@layer components` classes (lose to utilities), inline utility strings (win over components), and unlayered rules from ≈line 3980 that override both (`.store-item-page :is(p,button,a…)` at ≈5602 strips caps and tracking; 5317 restyles coverflow buttons; 5478/5490 resize gallery buttons).
- Listen is a separate Astro component (`MusicStreamingServiceListenTrigger.astro` + `MusicEqualizer.tsx`) with CSS pinned by `music-listen-trigger-css.test.ts` (base `min-height: 2.75rem`, `outline: 2px solid`, no `translateY`, `animation-iteration-count: 2`).
- The header cart button is lazy-loaded through `ShellPortalOutlets.tsx` into `Header.astro`'s `[data-store-cart-header-root]`; `app-shell-code-splitting.test.ts` asserts exact source strings and `scripts/check-runtime-bundle-graphs.ts` requires it to stay lazy. The outlets bundle is eager and must not import `store-cart.ts` (zod).
- `activeShellPathname` (base path stripped) is already a prop of the outlets; `isCurrentPath(pathname, '/store/')` in `platform/utils/urls.ts` is what the header nav uses for `aria-current`.
- Adding to the cart already opens the drawer (`store-cart-bridge.ts:79`). Drawer close does not return focus today (Radix `triggerRef` is null and the drawer unmounts).
- Google's Bebas Neue is caps-only. The site loads it as `--font-display` (`font-display` utility).
- The active change `clarify-store-sold-out-presentation` specifies the purchase status at ≈54px high and at most 14rem wide in the purchase slot.

## Goals / Non-Goals

**Goals:**

- One source of truth for public button styling; callers pass variant, size and tone context only.
- No visual growth on touch; tap targets still 44px.
- Every adopted idea implemented as a small state on an existing component, not a new widget.
- Zero change to accessible names, data attributes and e2e selectors except the second Stop press.

**Non-Goals:**

- Staff workspace buttons, header navigation links, store category tabs and format links.
- Replacing Listen's component, equalizer or motion.
- Any change to cart, price or stock authority; the subtotal in the Checkout action is the existing browser projection.

## Decisions

1. **The primitive owns everything, callers own nothing.** `buttonVariants` gets the base (`rounded-none border font-display uppercase tracking-[0.06em] pt-px`, single focus ring, `transition-[color,background-color,border-color,box-shadow] duration-200`, hover under `@media (hover: hover)`), sizes `sm` 32 / `default` 36 / `lg` 44 / `icon` 36 / `icon-lg` 44, variants `default | outline | ghost | link | chip`. The component emits `data-variant` and `data-size` so CSS can address it. Alternative considered: keep per-site classes in `global.css` and thin the primitive; rejected because the cascade traps come from exactly that split.
2. **Touch halo, not touch growth.** `after:absolute after:-inset-1` on coarse pointers (`[@media(pointer:coarse)]:after:content-['']`) enlarges the hit box to 44 without a visual change. Alternative: `min-h-11` on coarse pointers (the canvas's idea 4); rejected by the user.
3. **Tone by attribute inheritance.** `[data-tone='store'] [data-slot='button'][data-variant='outline']` and the services twin live in `global.css` using the existing `--store-accent*` / `--services-accent*` tokens. Surfaces set `data-tone` once (store layout, item and checkout pages, cart drawer, services page and form). Alternative: a `tone` prop on every button; rejected because it re-creates per-button accent choices the design bans.
4. **Status element for non-buyable state.** `StoreItemPurchaseActions` renders a `<p role="status">` styled by a small `StatusChip`-like class at the L geometry (44 × 14rem) instead of a disabled `Button`; store cards keep their existing beside-price chip. Keeps the other change's geometry contract (14rem) while lowering height with the family.
5. **Cart visibility in the outlets, not the bridge.** One condition at the portal: `storeCartHeaderContainer && (storeCartState.lines.length > 0 || isCurrentPath(activeShellPathname, '/store/'))`. The bridge stays presentation-free (spec 292–310). The header root reserves `2.25rem` square so the nav never shifts. Alternative: CSS `visibility: hidden` with the button mounted; rejected because unmounting also skips the lazy chunk on non-store pages.
6. **Focus return reuses the overlay pattern.** Opening the drawer records the focused element (Add to cart or the header control); on close `AppShellRoot` focuses it while connected, else `[data-store-cart-trigger]`, else `main[data-app-shell-main]`, through the existing `scheduleOverlayTriggerFocusRestore` helper rather than a new mechanism.
7. **In-place feedback is local component state with timers.** Added (4s), Undo (6s, paused while focused), Stop? (3s) and the quote-ready fill are `useState` + `setTimeout` inside the component that already owns the control; timers clear on unmount. No new events. Undo restores through `restoreCartLine` (position and quantity kept) and the shell's existing persistence path. The drawer's Checkout amount is the delivery quote total the drawer already displays, reported by `CartDeliverySummary`; a browser subtotal would contradict the Total row above it.
8. **Listen label only.** `.music-listen-trigger` gains the Bebas label, `gap: 0.5rem`, a label span with `margin-right: -0.06em` and `padding-top: 1px`; standalone min-height becomes `2.75rem`. Nothing else in the block changes, so the pinned test assertions hold.
9. **Deletion is part of the change.** Superseded classes are removed in the same commit as their last caller so the cascade cannot reassert them; the `.store-item-page` rule excludes `[data-slot='button']`.

## Risks / Trade-offs

- [Unlayered `global.css` rules reassert old styling on some page] → run the browser pass on every page type; grep for `button` selectors under ≈3980 before closing.
- [Bebas caps at 13px read small for some visitors] → labels stay ≥13px, contrast ≥8:1; the design system permits Inter for text actions, which stay Inter 13/500.
- [`smoke-content-preview.mjs` waits for a header "Cart" button on non-store pages] → switch that hydration wait to `[data-app-shell-mobile-navigation-trigger]`; keep the Store page "Cart, 1 item" wait.
- [Player e2e specs press Stop once] → update the specs to press twice; the armed state keeps the accessible name.
- [`clarify-store-sold-out-presentation` cites ~54px] → this change lowers the height to 44 and keeps the 14rem width; note it in that change's validation when it lands.
- [Late cart count after hydration] → the bridge chunk already sets the count late; a 200ms opacity fade on mount hides the pop.

## Migration Plan

No data or deployment steps. Commit per coherent step (primitive, callers, cart, ideas, CSS deletion, Listen, docs). Rollback is a revert of the change's commits; no persisted state changes.
