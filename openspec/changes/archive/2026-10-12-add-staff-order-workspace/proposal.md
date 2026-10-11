## Why

Staff can adjust stock, but order review requires protected API reads, provider dashboards, and emails. A protected order workspace will make paid orders, incomplete fulfillment, and failed secondary deliveries understandable without changing payment or dispatch authority.

## What Changes

- Add `/orders/` to the existing staff application, beside `/stock/`, with recent orders, payment-status filters, manual refresh, and a selected-order detail view.
- Reuse the existing protected order list and Checkout Session lookup APIs and generated internal client; display immutable line, monetary, contact, shipping, review, and notification facts where available.
- Clearly distinguish paid state, fulfillment-data completeness, and email/newsletter delivery state. Never imply that an email marked delivered means a parcel was shipped.
- Start with a read-only workspace. Refunds, webhook resend, dispatch records, returned-stock reconciliation, and customer contact retain their existing manual owners.
- Preserve Access/JWT protection, same-origin hosted API reads, no-store responses, and the Local loopback identity exception.

## Capabilities

### New Capabilities

- `staff-order-workspace`: Protected recent-order inspection and actionable order/delivery detail.

### Modified Capabilities

None. Existing order, stock, paid-delivery, and shipping contracts remain authoritative.

## Impact

The staff app's pages, layout/navigation and components; a staff adapter around `@blackbox/api-client` internal reads; focused UI/API-adapter tests; `docs/commerce-operations.md`. No new database fields, provider calls, public endpoints, operator roles, or runtime mutation API are needed. Coordinate hosted acceptance with `production-go-live-readiness` and the existing paid-reconciliation/VAT changes without duplicating their launch gates.
