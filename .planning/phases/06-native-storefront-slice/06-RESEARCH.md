# Phase 6 Research - Static Storefront Slice

## Standard Stack

- Astro content collections for editorial data
- app-shell-managed navigation and route experience
- projection layer producing `StoreItem`
- temporary `ItemAvailability` adapter matching the future backend API shape

## Architecture Patterns

- static storefront pages generated from content-derived projections
- canonical store item slug separate from backend or Stripe identifiers
- frontend contract stable before backend implementation arrives

## Don't Hand-Roll

- do not embed stock or pricing fields directly into editorial collections
- do not couple storefront routes to Stripe IDs
- do not duplicate editorial media into backend state

## Common Pitfalls

- mixing `StoreItem` and `Offer` into one unstable object
- leaving release pages coupled to old external shop URLs
- letting temporary variant data shape diverge from the later backend contract

## Code Examples

- browse route consumes `StoreItem[]`
- PDP consumes `StoreItem + ItemAvailability`
- checkout handoff shell uses canonical store item slug plus variant identity contract

---

_Research updated: 2026-04-20_
