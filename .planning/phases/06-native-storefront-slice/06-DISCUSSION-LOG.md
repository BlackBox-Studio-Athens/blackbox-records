# Phase 6 Discussion Log

**Date:** 2026-04-20
**Status:** Closed

## What the user locked

- The native store should be designed and embedded in the site before D1 or Stripe is required.
- The storefront, Worker runtime, and static editorial collections should share as much data as possible.
- Releases and distro items should both be able to appear as sellable items in the native shop.
- Visitors should be able to move from a release page into the shop flow for a corresponding item such as a vinyl release.
- The model should stay simple: editorial content remains in content collections, while shop-specific state sits behind a dedicated shop layer.

## Result

Phase 6 is now defined as a UI-first storefront phase:
- one shared shop projection over releases and distro
- fixture-backed offer state
- native `/shop/`, PDP, and checkout handoff shell routes
- no D1 and no Stripe requirement yet
