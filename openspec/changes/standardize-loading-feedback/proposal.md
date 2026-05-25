## Why

Current loading and pending states are handled surface-by-surface, so some paths clearly show progress while others look disabled, empty, or re-render abruptly. The store item `Checking Checkout` to `Add To Cart` swap is one visible symptom; the same review should cover checkout, shell navigation, overlays, embedded player loading, admin boot, and protected stock operations.

## What Changes

- Define a repo-wide loading feedback standard for visible async UI states.
- Inventory every shopper-facing, operator-facing, and admin-facing loading or pending state in the Astro/React frontend.
- Replace ambiguous disabled-only states with explicit loading affordances, stable geometry, accessible status text, and domain-specific copy.
- Align checkout readiness, checkout start, checkout return, shell navigation, overlay, player, CMS boot, and stock-operation pending states with the standard.
- Add focused component/unit coverage for state transitions and accessibility attributes.
- Add Browser Use validation for local rendered loading states that can only be judged visually.
- Keep browser StoreCart, checkout, stock, and provider authority boundaries unchanged.

## Capabilities

### New Capabilities

- `loading-feedback`: Defines the cross-surface UI contract for async loading, pending, confirming, opening, saving, and refreshing states.

### Modified Capabilities

- `commerce-checkout`: Store item purchase actions, checkout readiness, hosted checkout start, and checkout return status must use explicit, accessible loading feedback without exposing provider internals or browser-owned authority.
- `app-shell-and-player`: Shell route transitions, overlays, and embedded player loading must keep visible progress, stable focus/geometry, and accessible busy/status semantics.
- `orders-stock-operator`: Protected stock-operation reads and mutations must make loading, refreshing, saving, and disabled states explicit for operators.
- `tooling-validation`: UI loading-feedback changes must include focused tests and Browser Use visual validation where rendered timing and layout are part of acceptance.

## Impact

- `apps/web/src/components/ui/spinner.tsx`
- `apps/web/src/components/ui/button.tsx`
- New or updated shared loading feedback primitives under `apps/web/src/components/ui/`
- `apps/web/src/components/store/StoreItemPurchaseActions.tsx`
- `apps/web/src/components/store/CheckoutOfferStatus.tsx`
- `apps/web/src/components/store/CheckoutReturnStatus.tsx`
- `apps/web/src/components/store/*.{test,tsx,ts}`
- `apps/web/src/components/app-shell/AppShellRoot.tsx`
- `apps/web/src/components/app-shell/view/ShellOverlayPanel.tsx`
- `apps/web/src/components/app-shell/view/ShellPlayerSurface.tsx`
- `apps/web/src/components/app-shell/navigation/*`
- `apps/web/src/components/stock/StockOperationsApp.tsx`
- `apps/web/src/pages/admin/index.astro`
- `apps/web/src/styles/global.css`
- Relevant tests under `apps/web/src/components/**`
- Browser Use validation evidence for representative local routes
