# Proposal

## Why

PRD members can record stock on retained catalog items but cannot set their first selling price. Selling expects completed price setup, while new-item setup deliberately rejects existing identities and stock. The missing path is initial pricing on the retained variant.

## What Changes

- Add Set price for an eligible withheld variant, preserving its identity, stock/history, pauses and publication state.
- Reuse EmDash source/revision reads, existing editorial controls, money validation, Stripe gateway and catalog journal.
- Show a useful action for ready, incomplete or blocked setup; resume accepted initial-price work through the existing journal.
- Load Selling on entry or explicit refresh and refresh after success. Add a direct same-item Stock handoff.
- Verify the new path with focused Local tests and a small hosted smoke, using the existing release process.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-item-management`: Retained-item initial pricing, actionable readiness/recovery and the Stock → Selling handoff.
- `stripe-catalog-field-ownership`: Explicit initial Price Authority for eligible retained variants, preserving existing valid authority.

## Impact

Extend the staff Selling components, protected catalog routes/client, existing source/Stripe adapters and operation journal. Add a readiness read, an initialization command and a forward compatible journal-kind migration; retain existing price, publication and public checkout contracts.

This is a low-traffic member workflow. No new dependency, CMS hook, background process, repair console or draft-sync system is needed. Exceptional legacy bindings use manual administrator review. Keep the existing money, authorization, idempotency and atomic-write safeguards.

General Back/history work stays with `fix-staff-catalog-pagination-and-back-navigation`; shopper launch stays under its existing gates. Compatible migration uses code promotion, not catalog seeding. This change contains planning only; deployment and live price operations retain their existing authorization boundaries.
