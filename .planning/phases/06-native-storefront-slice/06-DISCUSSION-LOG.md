# Phase 6 Discussion Log

## Locked Storefront Defaults

- `/store/` becomes the canonical native storefront inside the static Astro site, with `/shop/` kept only for compatibility redirects.
- The storefront uses one unified `StoreItem` projection over releases and distro.
- The storefront reads temporary `ItemAvailability` data through a stable contract before live backend/Stripe reads are required.
- Release pages link to canonical shop pages, not external storefront URLs.
- Distro cards also link to canonical store PDPs; `fourthwall_url` remains legacy metadata, not browse routing.
- The temporary variant adapter must return a calm fallback state for known store items without explicit fixture pricing.
- The Phase 6 UI should stay stripped back: no metrics dashboards, no debug path blocks, and no fake urgency copy.

## Backend Boundary

- The frontend does not move to Workers in this phase.
- The frontend does not talk directly to Stripe or D1.
- The storefront contract must remain stable so Worker-backed reads can replace temporary data later.

---
*Logged and updated through implementation review: 2026-04-21*
