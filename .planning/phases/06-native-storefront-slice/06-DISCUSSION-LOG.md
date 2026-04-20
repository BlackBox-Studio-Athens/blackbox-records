# Phase 6 Discussion Log

## Locked Storefront Defaults

- `/shop/` becomes a native storefront inside the static Astro site.
- The storefront uses one unified `CatalogItem` projection over releases and distro.
- The storefront reads temporary `VariantSnapshot` data through a stable contract before live backend/Stripe reads are required.
- Release pages link to canonical shop pages, not external storefront URLs.

## Backend Boundary

- The frontend does not move to Workers in this phase.
- The frontend does not talk directly to Stripe or D1.
- The storefront contract must remain stable so Worker-backed reads can replace temporary data later.

---
*Logged: 2026-04-20*
