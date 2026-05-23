## Context

The current approved shipping scope is Greece-only manual BOX NOW fulfillment. Shiplemon is a later non-Greece courier-flow provider, not a BOX NOW replacement.

## Goals / Non-Goals

**Goals:**

- Add Worker-owned quotes for supported non-Greece destinations.
- Keep provider credentials and raw provider data server-side.
- Create shipments after verified payment and operator confirmation.

**Non-Goals:**

- Reopen BOX NOW automation.
- Add non-EU customs modeling.
- Expose public tracking pages or scheduled tracking polling in the first slice.

## Decisions

- Public quote responses contain app-owned quote IDs and safe display fields only.
- `StartCheckout` accepts a `shippingQuoteId` only after the Worker validates quote freshness, destination, and cart fingerprint.
- Shipment labels, invoice URLs, provider IDs, and raw Shiplemon payloads stay internal.

## Risks / Trade-offs

- Missing package profiles must fail closed or route to review.
- Provider failures must not undo paid order state or stock reconciliation.
- Account-specific Shiplemon behavior may require revalidation before implementation.
