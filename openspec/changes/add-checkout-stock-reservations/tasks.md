## 1. Schema and Types

- [ ] 1.1 Run `pnpm openspec:guard`, verify `stabilize-store-listing-prices` is complete and archived, and preflight hosted pending orders/sessions with redacted output; verify the settled Store Offer/Price Authority contract is present and no unrecoverable payable legacy session exists.
- [ ] 1.2 Make checkoutSessionId nullable and unique, add checkoutExpiresAt, and constrain CheckoutOrderLine to positive quantity and unique order-variant identity; verify the additive migration and regenerated Prisma client.
- [ ] 1.3 Add discriminated repository types and transition-specific methods for sessionless pending, session-bound pending, paid, not-paid, and needs-review orders; verify impossible field/status combinations cannot be constructed by application callers.

## 2. Atomic Hold and Availability

- [ ] 2.1 Reuse duplicate CartLine aggregation and implement the shared effective-availability query over pending-payment order lines; verify arithmetic and no Stripe call on listing/detail reads.
- [ ] 2.2 Insert one pending order and all aggregated lines in one guarded D1 transaction before provider work; verify all-or-none behavior for a multi-line cart.
- [ ] 2.3 Run a real local D1 race for one remaining unit and verify exactly one pending order wins.

## 3. Stripe Binding and Recovery

- [ ] 3.1 Create Stripe Checkout with the app order ID in private metadata and the same fixed 30-minute expiry; verify browser responses expose neither value as authority.
- [ ] 3.2 Bind the returned session ID to the existing order; verify provider-create failure changes a sessionless order to not_paid.
- [ ] 3.3 On bind failure, expire the provider session and release only after confirmed non-payable state; verify uncertain sessions retain the hold and metadata webhooks can recover the order.

## 4. Reconciliation

- [ ] 4.1 Map paid, unpaid, async-success, async-failure, and expiry events to guarded CheckoutOrder transitions; verify pending_payment is the only nonterminal hold state.
- [ ] 4.2 Extend first paid reconciliation to decrement stock and mark the order paid in one transaction; verify replay and reordered terminal events mutate stock at most once.
- [ ] 4.3 Add the bounded oldest-five provider check only when stale pending orders alone block checkout; verify one retry, provider-confirmed release only, and fail-closed provider errors.

## 5. Validation and Rollout

- [ ] 5.1 Run local migration, D1 rollback/concurrency tests, stripe-mock readiness, signed webhook simulation, commerce-boundary audit, pnpm test:unit, pnpm check, and pnpm build.
- [ ] 5.2 Prove UAT creation, binding, paid settlement, expiry release, and replay safety while PRD checkout remains closed.
- [ ] 5.3 Run `pnpm openspec -- validate add-checkout-stock-reservations --strict`, archive the change, then hand its final paid transaction and exact accepted commit to `add-paid-order-delivery-outbox`.
