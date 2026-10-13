# Design

## Storage

`OrderDispatch` holds one row per order: `orderId` (primary key, references `CheckoutOrder`), `shippedAt` (null when not shipped), `updatedAt` and `updatedBy` (operator email). A separate table keeps the Prisma `CheckoutOrder` model and its generated client unchanged; the repository uses raw D1 like order withdrawals.

## Concurrency

The write is one conditional upsert. The request carries `expectedShipped`; the row changes only when the current mark matches, and a missing row counts as not shipped. Two operators marking the same order produce one `updated` and one `409 dispatch_conflict`, so an order cannot be marked shipped twice.

## Write route

`PUT /api/internal/orders/checkout-sessions/{checkoutSessionId}/dispatch` with `{ shipped, expectedShipped }` (the two must differ). It requires operator Access, a same-origin `Origin` and `X-Blackbox-Request: 1`, like catalog price writes. Only paid orders with current complete fulfillment can change (`409 dispatch_not_ready` otherwise). The response is the updated order read.

## Reads

Every internal order read includes `dispatch: { shippedAt, updatedAt, updatedBy }`, with nulls when no mark was ever recorded. Search accepts `dispatch=not_shipped`, which selects paid orders without a current mark before pagination. The id list is bounded by D1's parameter limit; a backlog near 100 unshipped orders needs a SQL join instead.

## Staff

Detail shows a Dispatch tile next to Payment, Shipping details and Notifications, with the last change's time and operator. "Mark shipped" saves directly; "Mark not shipped" opens the house confirmation dialog. A conflict shows its message and reloads the order. The list shows Shipped or Not shipped on paid rows and a "Not shipped" checkbox kept in the address as `dispatch=not_shipped`.
