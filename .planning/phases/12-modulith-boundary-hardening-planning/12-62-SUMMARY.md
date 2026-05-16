# 12-62 Summary: App-Shell View Extraction

## Outcome

Extracted render-only shell surfaces from `AppShellRoot.tsx`.

`AppShellRoot.tsx` now stays at 591 lines and keeps behavior wiring, state, refs, routing, overlay, player, StoreCart, and
portal coordination in one composition root. JSX-heavy surfaces live in `components/app-shell/view/`, which gives the
app-shell folder a clearer structure without changing shopper-visible shell behavior.

## Changes

- Added `MobileNavigationSheet`.
- Added `ShellOverlayPanel`.
- Added `ShellPlayerSurface`.
- Added `ShellPortalOutlets`.
- Added render characterization tests for overlay panel and player surface markup.
- Updated the app-shell module canvas and Phase 12 tracking docs.

## Verification

- `pnpm --filter @blackbox/web exec vitest run src/components/app-shell/view/ShellOverlayPanel.test.tsx src/components/app-shell/view/ShellPlayerSurface.test.tsx`
- `pnpm audit:module-boundaries`
- `pnpm depcruise:boundaries`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- Browser Use:
  - header section switch: passed
  - footer section switch: passed
  - mobile nav section switch: passed
  - overlay open/close: passed
  - player open/minimize/reopen/stop: passed
  - StoreCart drawer open/close and checkout CTA path: passed
  - console cleanliness: no React/app exceptions; static-site checkout showed expected local 404s for backend API
    capability/item endpoints while the backend was not running
