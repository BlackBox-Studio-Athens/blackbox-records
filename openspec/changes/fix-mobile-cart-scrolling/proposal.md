# Fix mobile cart scrolling

## Why

The mobile cart extends below the viewport on UAT and PRD. Only its item list can scroll, leaving Checkout and Continue Shopping unreachable and preventing shoppers from returning to the Store to add another product.

## What Changes

- Scroll the cart heading, items and delivery information in one viewport-bounded pane.
- Keep Checkout and Continue Shopping visible in a nonshrinking footer; retain Continue Shopping for an empty cart.
- Preserve modal isolation, focus return, browser cart persistence and player continuity.
- Run cart browser tests in the mobile project and cover small phones, overflowing carts and repeated purchases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commerce-checkout`: The responsive cart must keep shopping actions reachable while its contents scroll.

## Impact

Public web cart layout, existing Playwright cart tests and mobile project selection. No public API, cart storage, Worker, stock or payment contract changes. Release through the existing UAT candidate and PRD promotion gates.
