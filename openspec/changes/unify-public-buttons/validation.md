# Validation

Product Environment: Local only. The browser pass used the frontend-only site on `127.0.0.1:4321` (no Worker); Playwright specs stub the Worker reads they need. No UAT or PRD work was performed.

## Acceptance rows

- **Shell/player/routing:** applies. `pnpm test:app-shell` and `pnpm test:e2e` passed; the serial e2e run reported 33 passed, 2 skipped, 0 unexpected (two-worker runs each hit one dev-server timeout unrelated to buttons). The specs cover Stop needing two presses with the player kept after the first, Added right after Add to cart, focus returning to Add to cart and to the header cart control after Escape, Undo taking focus and waiting while focused (Playwright clock; removing the pause makes the spec fail), keyboard focus drawing a solid ring on the header cart control, and the cart control being absent on Home with an empty cart but present on Store.
- **Commerce/checkout:** partial. Unit tests cover the pay control (outlined "Waiting for shipping quote", then filled with the amount), the drawer's quoted total, line restore at its index, and the acknowledged add with its pending queue. The quote-ready fill and the drawer total were not seen in a browser. The frontend-only site has no delivery quote, and there Checkout showed its label alone, as specified. The full Local stack (`pnpm dev`) started, but every Worker commerce read (`/api/store/items/<slug>`, `/api/store/listing-prices`) returned a workerd "internal error" 500, so no item was buyable. This change touches no backend source; the fault is left for a separate investigation.
- **Boundaries/tooling/instructions:** `pnpm agent:check` passed after the design document updates; `pnpm openspec -- --allow-worktree validate unify-public-buttons --type change --strict` passes.
- Staff/editor, CMS/publication and Release/environment rows do not apply: only public controls changed.

## Browser pass

Claude in Chrome (blackbox profile) was tried first, but its window was minimized (217×65 viewport), so it could not be driven. The pass used the desktop app's built-in browser at its native 1024px width and at 390×844. That pane reports `document.hasFocus() === false` and does not deliver focus events or `:focus-visible`, so the header focus ring and the Undo pause were proven in the Playwright specs above.

Observed:

- **Home:** with an empty cart the header cart control is absent and its 36×36 slot stays reserved; with one item it reads "Cart, 1 item" at 36×36. Read News (ghost) and View Full Roster (outline) are 36px, Subscribe (primary) is 44×144, and the footer social links are 36×36 outline icons. All labels are Bebas Neue on square controls.
- **Store at 390px:** the cart control and menu toggle match (36×36, same face and ink) and carry the −4px coarse-pointer halo for a 44px target. There is no horizontal overflow. The pressed Grid or Coverflow chip shows its check.
- **Cart drawer** (store item page, two items): the drawer carries the store tone. Checkout is a 44px ink control showing its label alone while the quote is unavailable; Continue Shopping is outlined in the store accent. Remove leaves "Removed Disintegration · Undo" in place with focus on Undo, a draining hairline and a polite announcement, then the empty state. The header control stays on the store route and reads "Cart". Closing with no focused opener returns focus to the header control.
- **Services:** both outline controls take the services accent. Start an Inquiry stretched to 704px as a grid item (as on `main`); it now keeps its natural width (138×36).
- **Releases:** the feature row pairs Listen (standalone, 44px) with View Release and Shop Release (outline, 44px). Release detail pairs Shop Release (ink, 44px) with Listen; All Releases (outline) and Artist Page (ghost) are 36px.
- **Player:** the modal's Close is a 36px outline control. Provider chips show pressed (Bandcamp) against quiet (Tidal); closing returns focus to Listen.
- **Mobile navigation:** Close is a full-width ghost control at the foot of the sheet.
- **404:** responds 404; Home (ink) and Go Back (outline) use Bebas 14, and Home resolves to `/blackbox-records/`.
- **Reduced motion:** from the live CSSOM, the feedback hairline animates only under `prefers-reduced-motion: no-preference`; the cart slot fade and the Listen equalizer have `reduce` overrides; controls carry `motion-reduce:transition-none`. Reduced motion was not emulated.
- **Console:** no script errors. Resource 404s came from Worker reads absent in the frontend-only site (`/api/store/listing-prices`, offer reads) and from the intentional 404 page.

Not seen in a browser, with the covering check:

- Added and early add handling need a ready offer: store-cart e2e and cart bridge unit tests.
- Stop? and the minimized player: the Bandcamp embed refused to load in the pane (third-party cookies blocked); player-continuity e2e and player surface tests.
- Roster chips with counts render only with more than five artists (Local has three); the same chip variant was seen on the store view toggles.
- The external ↗ mark: no Local release has an external commerce link.
- The checkout quote-ready fill and the drawer total need a delivery quote: pay control and drawer unit tests.

Screenshots are retained under `.codex-artifacts/browser/unify-public-buttons/`.

## Decisions made during implementation

- The drawer's Checkout shows the quoted total (VAT and shipping) rather than the browser subtotal, so it never shows an amount the Worker would not charge.
- Closing the drawer returns focus to what opened it, then to the header control, then to `main`.
- Undo pauses while focused and receives focus.
- An Add to cart pressed before the shell's cart loads is queued and applied once the cart connects; the control says Added only when the cart confirms the item.

## Remaining verification

- See the quote-ready fill and the drawer total on the full Local stack once its Worker reads work, then on UAT under the release process.
- Safari does not focus buttons on click; focus then returns to the header control. Not observed.

Final validation summaries are retained under `.codex-artifacts/validation/`.
