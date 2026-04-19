# Phase 2: Native Catalog And Embedded Checkout Slice - Discussion Log

**Date:** 2026-04-19
**Status:** Finalized into `02-CONTEXT.md`

## Summary

This discussion defined the first native storefront slice as a deliberately small MVP: a hand-picked distro subset, browsed in-site, flowing through a product detail page into a dedicated single-item embedded checkout route.

## Discussion Trail

### First slice scope
- User chose a hand-picked distro subset rather than all current distro items.
- User described this as the slice to target against Stripe sandbox later.
- Current milestone remains planning-only, so no sandbox integration work is being done yet.

### Store structure
- User accepted the recommended `collection page + product detail page` structure.
- This rejects the more compressed `grid card -> direct checkout` model for the MVP slice.

### Checkout entry posture
- User accepted the recommended dedicated checkout route.
- User asked to generally copy the Shopify experience.
- Follow-up clarified that the MVP should use `single-item buy now`, not a cart.

### Catalog ownership/presentation
- User accepted the recommended split where Astro content remains the presentation/editorial layer and Stripe-backed data supplies sellable product/price truth.

## Notes for planning

- The first Phase 2 plan set should treat `/shop/` as the native transactional route and keep `/distro/` as an editorial surface unless later planning finds a better reason to merge them.
- UI details such as density, product-detail hierarchy, and exact route naming can stay flexible until `$gsd-ui-phase 2`.
- Because Phase 1 execution has not yet normalized all stale wording in repo docs, downstream planners should follow Phase 1 context/research over older `embedded_page` and Supabase references where they conflict.

---

*Decisions are captured in `02-CONTEXT.md`; this file preserves the reasoning trail.*
