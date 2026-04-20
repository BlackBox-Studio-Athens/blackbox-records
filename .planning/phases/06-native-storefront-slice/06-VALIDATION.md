# Phase 6 Validation

## Required Checks

- `/shop/` is native and no longer redirect-only.
- `ShopItem` projection is explicit and stable.
- Temporary `OfferSnapshot` contract exists and matches future backend expectations.
- Release pages can link into canonical shop routes.
- No direct Stripe or D1 dependency is introduced in the frontend.

## Review Questions

- Is any frontend route coupled to backend or Stripe identifiers?
- Is any temporary offer field leaking into editorial content collections?
- Would the storefront survive a swap from temporary offer data to backend offer data unchanged?

---
*Validation updated: 2026-04-20*
