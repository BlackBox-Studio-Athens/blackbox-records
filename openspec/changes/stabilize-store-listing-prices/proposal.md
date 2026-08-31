## Why

UAT listing prices were made unavailable by elapsed snapshot time while a full-catalog Worker Cron repeatedly hit Cloudflare's subrequest ceiling. The implemented fix makes validity state-based and uses existing targeted recovery paths.

## What Changes

- Keep an active structurally valid listing snapshot displayable regardless of age.
- Present valid null-amount pay-what-you-want snapshots as Pay what you want.
- Remove full-catalog scheduled verification and its Cron; do not restore it.
- Use signed per-variant webhooks, authoritative Store Offer/checkout reads, and a single-item manual verifier for recovery.
- Use generated Desired Price only to create missing first Price Authority; preserve a valid existing Stripe Price during normal promotion.
- Gate catalog-affecting static deployment on complete hosted listing readiness.
- Retain explicit UAT whole-catalog reset as a separate destructive operation; PRD reset remains prohibited.
- Close with one controlled UAT Dashboard replacement-price isolation proof.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- store-listing-price-presentation: Snapshot age does not invalidate a price and pay-what-you-want is ready presentation.
- stripe-catalog-sync: Targeted reconciliation replaces scheduled full-catalog scanning.
- stripe-catalog-field-ownership: Desired Price bootstraps missing Price Authority but does not replace a valid one.
- project-language: Desired Price and Catalog Promotion retain their narrowed meanings.

## Impact

- The implementation and all repository/hosted checks except one controlled UAT provider proof are complete.
- automate-cms-catalog-promotion consumes these price rules and must not redefine them.
- Main deployment and module-boundary specs already own the implemented sequencing and retired-Cron constraints; this change does not duplicate them.
- No D1 migration, new service, queue, polling system, or browser price authority.
