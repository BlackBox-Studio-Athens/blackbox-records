---
phase: 6
slug: native-storefront-slice
status: approved
created: 2026-04-20
---

# Phase 6 - UI Design Contract

## Experience Principles

1. The store must feel like the BlackBox site, not a separate commerce app.
2. The first native shop slice is editorial-first and projection-driven.
3. Releases and distro items share one storefront language, even if their metadata origins differ.
4. The checkout route exists in this phase as an information-architecture shell, not as a live payment experience.
5. No cart, no search, no marketplace density, no fake scarcity.

## Route Contract

- `/store/` - native collection view
- `/store/[slug]/` - native store item detail view
- `/store/[slug]/checkout/` - non-transactional checkout handoff shell that Phase 7 will activate

## Collection View

- Intro block uses the current BlackBox display language, not generic ecommerce framing.
- Grid mixes release-derived and distro-derived entries in one unified shelf.
- Each card includes:
  - image
  - compact metadata row
  - title
  - subtitle (`artist` or `artist_or_label`)
  - short summary
  - fixture-backed price label
  - `View Item` CTA
- No filters, no sort controls, no stock countdown copy, and no collection metrics dashboard.

## Store Item Detail View

- Layout remains two-column on desktop and stacked on mobile.
- Content order:
  1. metadata row
  2. title
  3. subtitle
  4. price label
  5. format/group metadata
  6. editorial summary
  7. `Buy Now` CTA
  8. quiet support note
- `Buy Now` routes to `/store/[slug]/checkout/`.
- Do not surface canonical-path/debug panels or extra commerce chrome on the PDP.

## Checkout Handoff Shell

- This route exists in Phase 6 but does not process payment yet.
- It shows:
  - item summary block
  - clear page heading `Checkout`
  - calm explanatory copy that this route will host the secure payment step in the next phase
  - actions to return to the item page or store
- It must not claim payment is possible or complete in this phase.
- It must not render fake payment controls, slug/debug fields, or dense checkout widgets before Phase 7.

## Release-To-Shop Navigation

- Release pages with a mapped native store entry link to the canonical `/store/[slug]/` item page.
- If a release has no mapped native shop entry, do not invent a misleading purchase route.

## Copy Contract

- Collection CTA: `View Item`
- Item CTA: `Buy Now`
- Checkout shell note: calm, direct, transitional
- Tone remains curator-like and low-drama

## Non-Goals

- No live Stripe embed in this phase
- No order confirmation language
- No browser-authoritative stock states
- No duplicate media library for shop-only images
