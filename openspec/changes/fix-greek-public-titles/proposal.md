# Proposal

## Why

Veneer and the shipped Bebas Neue contain no Greek glyphs. Public Greek and mixed titles therefore combine incompatible rendered families, as verified on the live Store.

## What Changes

- Use existing self-hosted Inter 600 for each complete public content title containing Greek.
- Preserve Latin-only titles and each surface's casing, scale, wrapping, links and accessible names.
- Cover Store Grid/Crate, details, cart/checkout, artist/release/news titles, Services and Home preorders through one shared script decision.
- Verify rendered fonts and narrow widths before the authorized UAT and PRD release.

## Capabilities

### New Capabilities

- `public-title-typography`: Whole-title script coverage and the approved Greek exception to the Public Title Rule.

### Modified Capabilities

- `store-catalog-categories`: Permit the Greek exception while preserving listing roles and behavior.

## Impact

Frontend only: ui-foundation's existing utils export, public renderers, shared CSS, tests and DESIGN.md. No dependencies, font assets, CMS snapshots, catalog, price, stock, payment or staff changes. Existing main contains unpublished shipping-email work that must remain unpublished.
