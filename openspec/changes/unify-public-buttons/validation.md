# Validation

Product Environment: Local only. No UAT or PRD work was performed. Browser checks used this worktree's frontend site, without the real Worker; Playwright specs stub the Worker reads they need.

## Acceptance rows

- **Shell/player/routing:** applies. `pnpm test:app-shell` passed. The final serial e2e run (desktop and 390px mobile projects) reported 34 passed, 2 skipped, 0 failed. It ran against this worktree's site on `127.0.0.1:4331` through an ignored override config, because another session's astro dev held 4321 and `pnpm test:e2e` would have reused it. The specs cover Stop needing two presses with the player kept after the first, Added right after Add to cart, focus returning to Add to cart and to the header cart control after Escape, Undo taking focus and waiting while focused (Playwright clock; removing the pause makes the spec fail), keyboard focus drawing a solid ring on the header cart control, the cart control being absent on Home with an empty cart but present on Store, and the checkout pay control filling in place when the quote arrives. Webfonts are stubbed in e2e, so the Bebas metrics behind that last check rest on the Chrome measurement below.
- **Commerce/checkout:** partial. Unit tests cover the pay control view, the drawer's quoted total, line restore at its index, and the acknowledged add with its pending queue. Chrome showed the drawer total and the pay control fill against a stub Worker. The real Worker path is unverified: the full Local stack (`pnpm dev`) started, but every Worker commerce read (`/api/store/items/<slug>`, `/api/store/listing-prices`) returned a workerd "internal error" 500. This change touches no backend source; the fault is left for a separate investigation.
- **Boundaries/tooling/instructions:** `pnpm agent:check` passed after the design document updates; `pnpm openspec -- --allow-worktree validate unify-public-buttons --type change --strict` passes.
- Staff/editor, CMS/publication and Release/environment rows do not apply: only public controls changed.

## Chrome pass

Claude in Chrome on the blackbox profile, against this worktree's astro dev on `127.0.0.1:4331` with `PUBLIC_BACKEND_BASE_URL` pointing at a stub Worker on 8797. The stub served the e2e fixture payloads plus a delivery quote delayed by 2.5s. Ports 4321 and 8787 were held by other sessions.

- **Store, empty cart:** the header shows "Cart" on the store route.
- **Item page:** "Checking availability" shows as a busy outline control, then "Add To Cart". A real click turns it into "Added" (outline, width held at 224px) with its hairline and announces "Added to cart"; it returns to "Add To Cart" after four seconds.
- **Drawer:** once the quote lands, Checkout is a 44px ink control reading "Checkout €32.50" (€28.00 plus €4.50 shipping). Continue Shopping is outlined in the store accent; Remove and the steppers are 36px.
- **Checkout:** the pay control reads "Waiting for shipping quote" (outline, busy, disabled), then fills as "Continue to Stripe Checkout €32.50", enabled, without moving.
- **Home, one item:** "Cart, 1 item" at 36×36 with its count bubble. Remove leaves Undo focused with its countdown paused (hairline hidden), still in place about ten seconds later, and the header control disappears because the cart is empty off the store. Undo restores the line, focuses its Remove and brings the control back.
- **Console:** no errors on Home, Store, Checkout and the release page.

Chrome treated its window as occluded even when it was in front (`visibilityState` hidden), which pauses `requestAnimationFrame` and sometimes blocked screenshots. Focus return after Escape runs in an animation frame, so the Playwright spec (focus back on the header control with a solid ring) is its evidence. Stop? was not driven in Chrome because that means clicking into the real Bandcamp embed, which could start playback; the player-continuity spec covers it.

## Built-in browser pass

The desktop app's built-in browser ran first (1024px, and 390px with a coarse pointer). It reports no window focus, so it showed layout and state but not focus behaviour.

- **Home:** with an empty cart the header cart control is absent and its 36×36 slot stays reserved; with one item it reads "Cart, 1 item" at 36×36. Read News (ghost) and View Full Roster (outline) are 36px, Subscribe (primary) is 44×144, and the footer social links are 36×36 outline icons. All labels are Bebas Neue on square controls.
- **Store at phone width:** at 390px the cart control and menu toggle match (36×36, same face and ink), there is no horizontal overflow, and the pressed Grid or Coverflow chip shows its check. At 375px, taps 3.5px outside the menu toggle and 5.5px outside an S chip land on every side; taps 6px and 8px out miss.
- **Cart drawer without a quote:** Checkout shows its label alone. Remove leaves "Removed Disintegration · Undo" in place with focus on Undo and a polite announcement; the header control stays on the store route and reads "Cart". Closing with no focused opener returns focus to the header control.
- **Services:** both outline controls take the services accent.
- **Releases:** the feature row pairs Listen (standalone, 44px) with View Release and Shop Release (outline, 44px). Release detail pairs Shop Release (ink, 44px) with Listen; All Releases (outline) and Artist Page (ghost) are 36px.
- **Player:** the modal's Close is a 36px outline control. Provider chips show pressed (Bandcamp) against quiet (Tidal); closing returns focus to Listen.
- **Mobile navigation:** Close is a full-width ghost control at the foot of the sheet.
- **404:** responds 404; Home (ink) and Go Back (outline) use Bebas 14, and Home resolves to `/blackbox-records/`.
- **Reduced motion:** from the live CSSOM, the feedback hairline animates only under `prefers-reduced-motion: no-preference`; the cart slot fade and the Listen equalizer have `reduce` overrides; controls carry `motion-reduce:transition-none`. Reduced motion was not emulated.

Not seen in a browser, with the covering check:

- Stop? and the minimized player: player-continuity e2e and player surface tests.
- Roster chips with counts render only with more than five artists (Local has three); the same chip variant was seen on the store view toggles.
- The external ↗ mark: no Local release has an external commerce link.

Screenshots are retained under `.codex-artifacts/browser/unify-public-buttons/`.

## Fixes from the browser passes

- Start an Inquiry stretched to 704px as a grid item (as on `main`); it now keeps its natural width (138×36).
- The checkout pay control dropped 2.5px when the quote arrived, because the Bebas amounts stretched the quote rows from 20px to 20.8px. With `leading-none` on those amounts the summary stays 76px in both states.
- The touch halo is positioned inside the 1px border, so it reached 42px. Its insets are now 5px (7px for S), which reach 44px.

## Decisions made during implementation

- The drawer's Checkout shows the quoted total (VAT and shipping) rather than the browser subtotal, so it never shows an amount the Worker would not charge.
- Closing the drawer returns focus to what opened it, then to the header control, then to `main`.
- Undo pauses while focused and receives focus.
- An Add to cart pressed before the shell's cart loads is queued and applied once the cart connects; the control says Added only when the cart confirms the item.

## Remaining verification

- The real Worker quote path: on the full Local stack once its Worker reads work, then on UAT under the release process.
- Safari does not focus buttons on click; focus then returns to the header control. Not observed.

Final validation summaries are retained under `.codex-artifacts/validation/`.
