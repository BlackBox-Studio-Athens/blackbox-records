## Why

Checkout validates stock before creating Stripe Checkout but decrements it only after payment, so two shoppers can pay for the same final unit. The existing pending CheckoutOrder already has the right lifetime and ownership to be the hold; separate reservation tables would duplicate it.

## What Changes

- Treat CheckoutOrder with status pending_payment, together with its aggregated CheckoutOrderLine rows, as the temporary checkout stock hold.
- Make checkoutSessionId nullable and unique and add one fixed checkoutExpiresAt value.
- Create the pending order and all lines atomically before calling Stripe.
- Calculate effective availability as the lower of physical and online stock minus quantities in pending-payment order lines.
- Create Stripe Checkout with the same fixed 30-minute expiry and private app order ID metadata, then bind the session ID to the existing order.
- Use guarded order transitions for paid, expired, and failed outcomes; pending_payment also covers asynchronous payment pending.
- Keep stale cleanup bounded and provider-confirmed. Listing reads never call Stripe.
- Do not add reservation tables, a reservation ID, another state machine, a reserved counter, Durable Objects, Queues, or Workflows.

## Capabilities

### New Capabilities

- checkout-stock-reservations: CheckoutOrder-backed temporary stock holds and effective availability.

### Modified Capabilities

- commerce-checkout: Checkout creates the app order before the provider session and binds one bounded Stripe session to it.
- orders-stock-operator: Paid and non-paid reconciliation consume or release the same pending order through compare-and-set transitions.

## Impact

- Sequence: implement after the settled Store Offer and Price Authority code contract is present. Deployed UAT proof for `stabilize-store-listing-prices` remains a rollout gate, not a repo-local implementation blocker.
- CheckoutOrder and CheckoutOrderLine schema, checkout-start ordering, availability reads, Stripe metadata and expiry, webhook reconciliation, paid stock transaction, local D1 tests, and UAT smoke.
- No new runtime dependency or infrastructure product.
- add-paid-order-delivery-outbox must build on the final transaction from this change.
