# Proposal

## Why

Repeated purchase explanations obscure the item, cost summary and next action. The approved 20 October 2026 draft gives each purchase stage the information it needs while retaining the BlackBox identity and statutory disclosures.

## What Changes

- Use the existing ghost icon treatment for the header cart, keeping its count, tooltip, touch target and keyboard focus.
- Place the unmodified official white Stripe badge below the existing payment handoff button.
- Keep the item purchase block compact, show pre-order facts only for real pre-orders, and place delivery and conditional order notices after the cost summary.
- Retain full accepted policy documents, contextual privacy, optional consent, withdrawal access, legal guarantees and product safety.
- Preserve the surrounding layout, payment authority and existing failure/recovery behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shopper-purchase-information`: Context-specific short disclosures with full policy and statutory access retained.
- `commerce-checkout`: Brand-consistent cart and payment controls, with costs preceding conditional explanations.

## Impact

Public storefront, cart, checkout, the shared price-disclosure string and focused presentation tests. No API shapes, content schemas, dependencies, catalog facts, charges or consent semantics change. Local implementation and a scoped local commit are authorized; push, publication and deployment require a later human decision.
