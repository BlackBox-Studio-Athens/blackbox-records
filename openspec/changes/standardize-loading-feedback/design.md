## Context

The frontend already has a shadcn-style `Button` and `Spinner`, plus several bespoke loading treatments. The current state is uneven:

- Store item purchase actions can render a disabled outline button labeled `Checking Checkout`, then swap to `Add To Cart`.
- Checkout start disables the Stripe CTA and shows separate status copy below the Stripe button, while the button itself loses the Stripe badge without an inline loading affordance.
- Checkout return renders an almost empty pending section with only screen-reader text.
- App-shell route navigation has a top loading bar and transition veil.
- Overlay and embedded player surfaces share a loading card with a spinner and generic `loading` label.
- The protected stock app disables controls during reads and writes, but save and refresh buttons do not expose inline pending intent.
- The admin CMS boot page has explanatory copy but no explicit busy semantics beyond `aria-live`.

The implementation should keep the existing monochrome BlackBox visual language, Tailwind v4, shadcn-ui primitives, and current authority boundaries. Loading feedback must clarify uncertainty without implying the browser owns checkout, stock, payment, or provider state.

A disposable local HTML demo under `.codex-artifacts/loading-feedback-demo.html` was created before implementation to review the interaction direction. It is not source-of-truth application code, but implementation should preserve the approved direction: stable action geometry, inline button pending states, supportive under-button status copy, visible checkout-return pending state, and explicit stock-operation pending labels.

## Goals / Non-Goals

**Goals:**

- Establish one loading-feedback contract for every visible async UI state.
- Replace disabled-only pending states with explicit visual and accessible feedback.
- Preserve button and panel geometry during pending to avoid jarring swaps.
- Use domain-specific copy such as `Checking availability`, `Opening Stripe Checkout`, `Refreshing stock`, and `Saving StockChange`.
- Keep duplicate submissions blocked while making that blocked state understandable.
- Add focused tests for loading state rendering, disabled state, live regions, and transition outcomes.
- Validate representative rendered states with Browser Use where visual timing, layout, or motion matters.

**Non-Goals:**

- Do not change checkout authority, StoreCart authority, stock authority, Stripe behavior, D1 schema, or Worker API contracts.
- Do not add a new state-management library.
- Do not replace the existing shadcn-style `Button`, `Spinner`, `Card`, `Sheet`, or Tailwind setup.
- Do not redesign the storefront, checkout page, stock app, CMS, player, or app shell beyond loading feedback.
- Do not use skeletons for known actions. Skeletons are acceptable only when the layout content is truly unknown.

## Decisions

### Use a small shared loading primitive set

Create or refine small primitives around the existing shadcn components:

- `LoadingInline`: spinner plus label for inline button/status usage.
- `LoadingButtonContent` or equivalent helper for action buttons.
- `LoadingStateBlock`: compact panel/status block for empty data while an async read is in flight.

Rationale: repeated ad hoc markup is the source of inconsistency. A small primitive keeps behavior consistent without introducing a design-system rewrite.

Alternative considered: install more shadcn components such as Skeleton or Progress everywhere. Rejected because most affected surfaces are known actions or known panels, not unknown page structure.

### Treat loading by intent, not by implementation detail

Use these categories:

- `checking`: verifying availability, capabilities, payment return state, or remote data.
- `opening`: handing off to another surface, such as hosted Stripe Checkout.
- `refreshing`: re-reading already visible data.
- `saving`: mutating operator-owned stock data.
- `loading`: booting an app or embed where the user is waiting for a surface to become interactive.

Rationale: users need to know what is happening to their intent. `Loading` alone is acceptable only for generic boot/embed cases.

### Keep actions visually stable while pending

Action buttons that become available after a check should keep comparable height, width, visual weight, and placement from first paint through ready/unavailable states. Pending buttons should use `disabled`, `aria-busy="true"`, inline spinner, and stable min-width.

Rationale: a disabled outline button that becomes a primary button looks like the UI changed its mind. Stable geometry and an explicit spinner make the wait apparent without creating layout shift.

### Use accessible status semantics deliberately

Interactive pending controls should expose `aria-busy` on the control or immediate region. Non-interactive pending panels should use `role="status"` with `aria-live="polite"`. Decorative spinner SVGs can remain `aria-hidden` when visible text names the state; icon-only loading must provide an accessible label.

Rationale: loading feedback must work for screen-reader users and keyboard users, not only visually.

### Preserve domain authority boundaries in copy

Storefront copy should say `Checking availability` or `Confirming price and availability`, not `Checking Stripe` or `Checking D1`. Checkout handoff can say `Opening Stripe Checkout` because Stripe is user-visible at that point. Stock operator copy can use `Saving StockChange` and `Saving StockCount` because those are protected operator terms.

Rationale: public shopper UI must stay browser-safe and avoid provider/internal leakage, while operator UI can use repo-owned operational vocabulary.

### Browser Use is required for rendered loading proof

Use component/unit tests for deterministic state contracts. Use Browser Use for at least these rendered paths:

- Store item route with delayed Store Offer read.
- Checkout page with delayed checkout readiness and delayed start handoff.
- Checkout return route with delayed payment-state read.
- App-shell section navigation and overlay loading.
- Player modal embed loading.
- Protected stock app loading, refresh, and save states where local auth/setup permits.

Rationale: button width, layout stability, visual affordance, and overlay/player loading are rendered UX behaviors that unit tests alone do not prove.

## Risks / Trade-offs

- [Risk] Loading primitives become over-general and add abstraction noise. Mitigation: keep primitives small, local to UI behavior, and migrate only repeated patterns.
- [Risk] Loading copy accidentally exposes provider or runtime internals. Mitigation: test shopper copy and review against `commerce-checkout` browser-safe capability rules.
- [Risk] Spinner usage becomes visual clutter. Mitigation: use inline spinners for actions, compact status blocks for panels, and keep route-level indicators reserved for navigation.
- [Risk] Browser Use validation is hard for very fast states. Mitigation: use mocked/delayed APIs in component harnesses or local test routes where needed, and document any state that cannot be visually held.
- [Risk] Stock UI validation may require protected operator context. Mitigation: unit-test the state rendering and use Browser Use when local protected route access is available.

## Migration Plan

1. Audit and classify all loading and pending surfaces in `apps/web/src`.
2. Revisit the approved disposable demo and translate the interaction direction into repo-native components.
3. Add shared loading primitives around the existing `Spinner` and `Button`.
4. Update store item purchase actions first because it is the reported symptom and a reusable action-button pattern.
5. Update checkout readiness detail, under-CTA status copy, checkout start, and checkout return pending states.
6. Update shell overlay/player loading copy and semantics while preserving current transition behavior.
7. Update stock operations read, refresh, search, StockChange, and StockCount pending states.
8. Review admin CMS boot semantics and visual affordance.
9. Add tests with delayed API doubles for every changed state.
10. Run `pnpm test:unit`, `pnpm check`, `pnpm build`, OpenSpec validation, and Browser Use checks.

Rollback is a normal git revert because this change is frontend UI behavior only and does not alter persisted data, checkout contracts, stock contracts, or provider state.

## Open Questions

- None for planning. Implementation may decide exact component names after reading the current shadcn local component style.

## Implementation Inventory

The implementation inventory classified loading feedback under `apps/web/src` as follows:

- `checking`: `StoreItemPurchaseActions` Worker Store Offer reads, checkout readiness capability and Store Offer reads, and checkout return payment-status reads.
- `opening`: hosted Stripe Checkout start in `CheckoutOfferStatus`.
- `refreshing`: selected-variant stock refresh after explicit refresh and after successful StockChange or StockCount mutations.
- `saving`: protected StockChange and StockCount form submissions in `StockOperationsApp`.
- `loading`: app-shell route loading, overlay partial fetch, embedded player iframe preparation, stock workspace boot, selected-stock load, and Decap CMS boot.
- `disabled-only`: store purchase pending, checkout start, stock search, stock refresh, StockChange submit, and StockCount submit were converted to visible pending controls with busy semantics.
- `empty-pending`: checkout return pending, overlay loading, player loading, initial stock metrics, and empty stock search were converted or kept as visible status blocks.
- `already-compliant`: image `loading="lazy"` attributes, content field names containing "loading", route prefetch, StoreCart storage, checkout/stock API contracts, and local demo surfaces are not async pending UI that requires production changes.

The disposable demo at `.codex-artifacts/loading-feedback-demo.html` was re-opened from the original checkout because it is not present in the fresh `origin/main` worktree. The repo implementation kept only the accepted direction from that artifact: stable hard-edged action geometry, inline pending button labels, supportive status copy, visible checkout-return pending state, and explicit stock operation labels.

No backend, D1, Stripe, StoreCart authority, Worker API, Decap configuration, admin auth, shell page cache, overlay cache, player iframe cache, or routing contract changes were made.

## Rendered Validation Notes

Local rendered validation used `pnpm site:dev` at `http://127.0.0.1:4321/blackbox-records/`.

Browser Use was unavailable in this Codex session: tool discovery exposed DevTools browser tools but did not expose the Browser Use tool namespace. DevTools MCP was used as the documented fallback.

DevTools fallback checks:

- Store item route `/blackbox-records/store/disintegration-black-vinyl-lp/` rendered the purchase action in a stable disabled state after the unavailable local API response. The transient `Checking availability` state could not be held visually without a controlled API delay; focused unit tests cover the pending label, spinner, `disabled`, and `aria-busy`.
- Checkout return route `/blackbox-records/store/disintegration-black-vinyl-lp/checkout/return/?session_id=cs_test_hold` rendered the non-final retry state after the local API 404. The transient `Confirming Payment` panel could not be held visually without a controlled API delay; focused unit tests cover the visible pending panel, busy status semantics, and action suppression.
- Shell overlay route validation opened an artist overlay from the homepage, kept the close control focused, and preserved loaded overlay content. The loading overlay resolved too quickly to hold visually; focused unit tests cover the `Loading detail` status block and busy semantics.
- Player validation opened the release player modal and loaded the Bandcamp iframe. The loading player state resolved too quickly to hold visually; focused unit tests cover the `Loading player` status block and copy that avoids implying playback.
- Stock route `/blackbox-records/stock/` rendered the protected stock page and showed the expected local API 404 status because no protected local operator API was running. Focused unit tests cover the initial `Loading stock workspace` pending state, stock loading labels, and disabled controls.

The fallback browser console showed only the expected local stock API 404 during protected stock validation. The smallest stronger follow-up is to expose Browser Use in the session and run the same routes with a controlled delayed API fixture or route interception so transient pending states can be visually held.
