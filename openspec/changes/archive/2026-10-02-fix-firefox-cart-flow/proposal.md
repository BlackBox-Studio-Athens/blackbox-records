# Proposal

## Why

Android Firefox shoppers report that a multi-item cart stops scrolling and BUY stops responding after dismissal. Isolated UAT desktop Firefox checks passed, but the cart lacks an obvious close control and its heading scrolls away.

## What Changes

- Pin Cart and a visible 44px Close above the existing scroll pane; retain the pinned Checkout and Continue Shopping footer.
- Exercise Firefox desktop and compact touch viewports alongside Chromium cart coverage, including all dismissal paths and subsequent BUY.
- Install Firefox in public end-to-end CI and retain real Android UAT acceptance as a PRD promotion prerequisite.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commerce-checkout`: Reachable cart dismissal and continued shopping in compact viewports.

## Impact

Public store-cart UI, its browser tests, Playwright project configuration and public acceptance CI. No storage, Worker, pricing, payment or public API changes. This follows `fix-mobile-cart-scrolling`; its historical evidence remains unchanged.
