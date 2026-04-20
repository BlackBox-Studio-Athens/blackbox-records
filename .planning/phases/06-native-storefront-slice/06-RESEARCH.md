# Phase 6 Research - Static Storefront Slice

## Standard Stack

- Astro content collections for editorial data
- app-shell-managed navigation and route experience
- projection layer producing `CatalogItem`
- temporary `VariantSnapshot` adapter matching the future backend API shape

## Architecture Patterns

- static storefront pages generated from content-derived projections
- canonical catalog slug separate from backend or Stripe identifiers
- frontend contract stable before backend implementation arrives

## Don't Hand-Roll

- do not embed inventory or pricing fields directly into editorial collections
- do not couple storefront routes to Stripe IDs
- do not duplicate editorial media into backend state

## Common Pitfalls

- mixing `CatalogItem` and `Offer` into one unstable object
- leaving release pages coupled to old external shop URLs
- letting temporary variant data shape diverge from the later backend contract

## Code Examples

- browse route consumes `CatalogItem[]`
- PDP consumes `CatalogItem + VariantSnapshot`
- checkout handoff shell uses canonical catalog slug plus variant identity contract

---
*Research updated: 2026-04-20*

