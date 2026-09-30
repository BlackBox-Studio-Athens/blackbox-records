# Proposal

## Why

The public header's shopping-bag icon has an accessible name but no visible label. A brief Cart label on hover and keyboard focus makes its purpose clear without changing the compact header.

## What Changes

- Add the approved compact, square Cart tooltip beneath the header button.
- Support delayed hover, immediate keyboard focus, Escape dismissal, hover persistence, reduced motion and direct touch activation.
- Retain the cart count, accessible name, click callback and shell-owned cart/player behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: Require a visible supplementary label for the header cart control on hover and keyboard focus.

## Impact

Public `StoreCartButton` presentation and its existing tests. No public API, dependency, commerce authority or routing changes.
