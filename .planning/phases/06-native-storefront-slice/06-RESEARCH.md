---
phase: 6
slug: native-storefront-slice
status: ready
---

# Phase 6 Research

## Repo facts that matter

- `src/content.config.ts` already models:
  - `releases` with artist references and release imagery
  - `distro` with editorial imagery and summary fields
- `distro` still points to Fourthwall URLs today.
- `src/pages/shop/index.astro` is only a redirect.
- `src/lib/catalog-data.ts` already provides a natural home-adjacent layer for a new shop projection helper.

## Research conclusions

1. The storefront can reuse existing editorial content instead of creating a second product-content system.
2. The missing piece is a dedicated shop-facing projection layer, not more fields in the collections.
3. A fixture adapter is the safest way to make the native storefront real before D1 or Stripe becomes mandatory.
4. Release-to-shop navigation should be based on canonical native shop slugs, not legacy external URLs.

## Resulting plan shape

- define shop projection contract
- define release/distro mapping rules
- add fixture-backed offer adapter
- replace `/shop/` redirect with real collection and PDP routes
- add release-to-shop navigation and checkout handoff shell
