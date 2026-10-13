# Proposal

## Why

Orders showed "Fulfillment data: Complete", which read like a shipped order even though it only reports whether the saved paid-order data is complete. Dispatch was tracked in a separate private record, so staff had to check two places before packing and nothing in the system prevented a second shipment. The owner chose to make Orders the dispatch record.

## What Changes

- Staff can mark a complete paid order as shipped in order detail. The mark records the operator and time and is refused when another operator already changed it.
- Staff can undo a mark after confirming it, to correct a mistake. The last change keeps its operator and time.
- The list shows Shipped or Not shipped for paid orders and gains a server-side "Not shipped" filter.
- The order detail drops the notice that pointed to the private dispatch record; the Dispatch tile replaces it.
- No carrier, tracking, voucher or BOX NOW data is stored.

## Capabilities

### Modified Capabilities

- `staff-order-workspace`: the workspace stays read-only except for one protected dispatch write.
- `shipping-fulfillment`: the stored minimal handoff data includes the staff dispatch mark.

## Impact

- **Backend:** additive D1 migration `0035_order_dispatch.sql` (table `OrderDispatch`), a protected `PUT /api/internal/orders/checkout-sessions/{checkoutSessionId}/dispatch`, a `dispatch` field on internal order reads, a `dispatch=not_shipped` search filter and regenerated internal contracts. No Prisma model change.
- **Staff:** Orders list, filter and detail.
- **Docs:** `docs/commerce-operations.md` dispatch steps.
- **Release:** migration 0035 must be applied to UAT and PRD with the release. No shopper-facing change.
