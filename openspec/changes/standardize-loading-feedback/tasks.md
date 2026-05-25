## 1. OpenSpec And Inventory

- [x] 1.1 Re-read `proposal.md`, `design.md`, and all spec deltas for `standardize-loading-feedback`.
- [x] 1.2 Inventory all loading, pending, disabled-during-async, route transition, overlay, player, checkout, admin boot, and stock operation states under `apps/web/src`.
- [x] 1.3 Classify each inventory item as `checking`, `opening`, `refreshing`, `saving`, `loading`, `disabled-only`, `empty-pending`, or `already-compliant`.
- [x] 1.4 Record the final implementation inventory in `design.md` or an implementation note before closing the first slice, including any intentionally excluded false positives such as image lazy-loading attributes or content names.
- [x] 1.5 Confirm no backend, D1, Stripe, StoreCart authority, or Worker API contract changes are needed.
- [x] 1.6 Re-open the approved disposable demo at `.codex-artifacts/loading-feedback-demo.html` and translate only the accepted interaction direction into repo-native components.

## 2. Shared Loading Feedback Primitives

- [x] 2.1 Audit the local `Button` and `Spinner` component APIs before adding new UI primitives.
- [x] 2.2 Add a small inline loading primitive for spinner-plus-label usage in buttons and compact status rows.
- [x] 2.3 Add a compact loading status block for panels or empty pending regions.
- [x] 2.4 Ensure primitives support visible labels, screen-reader labels when needed, `aria-busy`, `role="status"`, and `aria-live="polite"` without forcing decorative copy.
- [x] 2.5 Ensure primitives preserve project styling: monochrome, rectangular controls, Tailwind v4, shadcn conventions, lucide spinner, and no new UI dependency.
- [x] 2.6 Add focused tests for primitive rendering, accessible labels, hidden decorative spinner behavior, and reduced-motion-safe class usage where applicable.

## 3. Store Item Purchase Actions

- [x] 3.1 Update `StoreItemPurchaseActions` so Worker Store Offer reads render an explicit busy purchase action instead of an ambiguous disabled-only outline state.
- [x] 3.2 Change pending purchase copy from `Checking Checkout` to user-level availability copy such as `Checking availability` or `Confirming availability`.
- [x] 3.3 Preserve stable purchase-button height, primary placement, and minimum width across pending, ready, unavailable, and fallback states.
- [x] 3.4 Add `aria-busy` or equivalent accessible state for the pending purchase action.
- [x] 3.5 Keep StoreCart payloads browser-safe and keep Worker Store Offer authority unchanged.
- [x] 3.6 Update `StoreItemPurchaseActions` tests for pending, ready, unavailable, fallback, and failed Store Offer read states.

## 4. Checkout Page Loading States

- [x] 4.1 Update checkout readiness loading in `CheckoutOfferStatus` so capability and Store Offer reads show clear visible pending status.
- [x] 4.2 Review the readiness detail around `You will finish payment on Stripe.` and the copy rendered under the Stripe CTA so ready, pending, and error messages do not contradict each other.
- [x] 4.3 Update the Stripe checkout CTA so `isStartingCheckout` renders inline loading feedback inside the button, not only separate text below it.
- [x] 4.4 Ensure under-button status copy reinforces the current CTA state and is not the only visual loading signal.
- [x] 4.5 Ensure hosted checkout start remains duplicate-submission-safe while preserving cart and item summary context.
- [x] 4.6 Keep shopper-facing checkout loading copy browser-safe and free of provider IDs, feature flag keys, D1 bindings, Worker secret names, and raw provider errors.
- [x] 4.7 Update checkout offer state tests for loading badge/detail copy, under-button copy, and checkout-start pending CTA behavior.

## 5. Checkout Return Loading State

- [x] 5.1 Replace the visually empty checkout return pending section with a visible payment-status confirmation panel.
- [x] 5.2 Ensure checkout return pending state reserves stable vertical space and does not look like a blank page.
- [x] 5.3 Add accessible busy/status semantics and polite live announcement to the pending return panel.
- [x] 5.4 Preserve paid-order cart clearing behavior and non-paid retry flows unchanged.
- [x] 5.5 Update checkout return tests for pending, success, processing, expired, open, missing-session, and error states as needed.

## 6. App Shell Navigation, Overlay, And Player

- [x] 6.1 Review current app-shell route loading indicator and section transition behavior for visibility, stale-state cleanup, focus reset, and reduced-motion handling.
- [x] 6.2 Update shell route loading only where needed to satisfy visible progress and reduced-motion requirements without changing routing semantics.
- [x] 6.3 Update overlay loading copy from generic `loading` to a clear overlay-content loading status while preserving close behavior and focus management.
- [x] 6.4 Update player embed loading copy and busy semantics so it does not imply playback has started before iframe load and user interaction.
- [x] 6.5 Keep overlay cache, shell page cache, player iframe cache, route prefetch, and same-document navigation behavior unchanged.
- [x] 6.6 Update app-shell, overlay, route-loading, and player tests for visible loading labels, busy state, focus behavior, stale loading cleanup, and reduced-motion expectations where applicable.

## 7. Protected Stock Operations

- [x] 7.1 Update stock workspace initial load and search states to show explicit pending feedback while preserving existing status-message behavior.
- [x] 7.2 Update selected-variant refresh so the refresh button or adjacent status shows `Refreshing stock` while keeping last known stock visible.
- [x] 7.3 Update StockChange submit so the form and button show `Saving StockChange` while the mutation is in flight.
- [x] 7.4 Update StockCount submit so the form and button show `Saving StockCount` while the mutation is in flight.
- [x] 7.5 Preserve selected variant, last known stock, and typed operator input when reads or mutations fail unless the failed response proves the data invalid.
- [x] 7.6 Update stock operation tests for initial load, search, refresh, StockChange save, StockCount save, duplicate-submit blocking, and error preservation.

## 8. Admin Boot And Secondary Surfaces

- [x] 8.1 Review the Decap CMS boot page for visible loading affordance, `aria-busy`, and status semantics.
- [x] 8.2 Add or adjust CMS boot loading feedback without changing Decap configuration, admin scripts, or auth behavior.
- [x] 8.3 Review secondary matches from the inventory, including service inquiry submit, newsletter, artist filters, and demo-only surfaces.
- [x] 8.4 Update secondary surfaces only when they perform real async work or can mislead users with disabled-only pending behavior.
- [x] 8.5 Record any intentionally untouched surfaces with rationale in the implementation note.

## 9. Visual And Accessibility QA

- [x] 9.1 Verify loading labels are specific, short, and consistent with project language.
- [x] 9.2 Verify shopper-facing loading copy does not expose provider internals or authority details.
- [x] 9.3 Verify operator-facing loading copy uses canonical stock terms where appropriate.
- [x] 9.4 Verify buttons do not shift width or height jarringly when pending resolves.
- [x] 9.5 Verify loading indicators remain understandable with reduced-motion preferences.
- [x] 9.6 Verify no nested-card or decorative loading pattern was introduced.

## 10. Browser Use Validation

- [x] 10.1 Start the appropriate local stack or frontend route needed for rendered validation.
- [x] 10.2 Use Browser Use to validate the store item route pending purchase action on `/blackbox-records/store/disintegration-black-vinyl-lp/`.
- [x] 10.3 Use Browser Use to validate checkout readiness text, under-Stripe-button status copy, and checkout-start pending states on the local checkout route.
- [x] 10.4 Use Browser Use to validate checkout return pending state with a controlled or delayed checkout-state read.
- [x] 10.5 Use Browser Use to validate shell section navigation loading and at least one overlay loading state.
- [x] 10.6 Use Browser Use to validate player modal loading state.
- [x] 10.7 Use Browser Use to validate protected stock loading, refresh, and save pending states when local operator route access permits.
- [x] 10.8 Record rendered validation notes, including any Browser Use blocker and the smallest next action if a state cannot be held visually.

## 11. Repository Verification

- [x] 11.1 Run focused unit tests for changed loading primitives and affected components.
- [x] 11.2 Run `pnpm test:unit`.
- [x] 11.3 Run `pnpm check`.
- [x] 11.4 Run `pnpm build`.
- [x] 11.5 Run `openspec validate standardize-loading-feedback --type change --strict`.
- [x] 11.6 Run `openspec validate --all --strict`.
- [x] 11.7 Re-run any failed or impacted checks after final edits.

## 12. Closeout

- [x] 12.1 Confirm all inventory items are either updated, already compliant, or explicitly excluded with rationale.
- [x] 12.2 Confirm no authority boundaries changed for StoreCart, checkout, stock, Stripe, D1, or Worker APIs.
- [x] 12.3 Confirm browser validation notes distinguish unit-test evidence from rendered Browser Use evidence.
- [x] 12.4 Confirm README, AGENTS, or OpenSpec baseline docs only changed if implementation alters setup, architecture, or accepted validation policy.
- [ ] 12.5 Archive the OpenSpec change only after implementation, strict OpenSpec validation, repository gates, and required Browser Use validation are complete.
