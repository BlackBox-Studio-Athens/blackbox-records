# Phase 6 Validation

## Required Checks

- `/store/` is native and `/shop/` redirects to it.
- `/store/[slug]/` and `/store/[slug]/checkout/` are native static routes.
- `CatalogItem` projection is explicit and stable.
- Temporary `VariantSnapshot` contract exists, matches future backend expectations, and supplies a calm fallback state for known catalog items without explicit fixture pricing.
- Release pages and distro cards link into canonical store routes instead of raw external shop URLs.
- No direct Stripe or D1 dependency is introduced in the frontend.

## Review Questions

- Is any frontend route coupled to backend or Stripe identifiers?
- Is any temporary variant field leaking into editorial content collections?
- Is any distro browse surface still resolving through `fourthwall_url` instead of canonical store PDP routing?
- Would the storefront survive a swap from temporary variant data to backend variant data unchanged?

---
*Validation updated: 2026-04-21 after storefront review and simplification*

