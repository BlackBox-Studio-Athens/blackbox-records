## 1. Schema and Purchase Invariants

- [x] 1.1 Run `pnpm openspec:guard`, verify the accepted repo-local CheckoutOrder transaction and operator identity contracts are present, and record the prerequisites' hosted proof and archival as rollout gates before UAT delivery execution.
- [x] 1.2 Add direct paid-order and immutable line-snapshot columns plus PaidOrderDelivery; verify migration checks permit only the three kinds, three statuses, positive money/quantity values, EUR/GR scope, unique order-kind rows, and valid terminal timestamps.
- [x] 1.3 Regenerate Prisma and expose discriminated repository results so incomplete rows cannot be consumed as current paid fulfillment; verify repository tests reject every incomplete paid shape.

## 2. Atomic Paid Reconciliation

- [x] 2.1 Write immutable line snapshots from validated Store Offers and verify duplicate CartLines still produce one order line per variant.
- [x] 2.2 Extend first paid reconciliation to commit paid fields, stock effects, and applicable delivery rows in one transaction; verify any failed statement rolls back the complete batch.
- [x] 2.3 Preserve the original order facts and unique delivery rows on webhook replay; verify stock and delivery enqueue occur at most once.

## 3. Delivery Processing

- [ ] 3.1 Implement one compare-and-set lease path for due pending rows and verify concurrent or unexpired claims issue one provider request.
- [ ] 3.2 Route the three fixed kinds through existing Resend/newsletter gateways, reusing stable idempotency identities; verify shopper, ops, and newsletter outcomes remain independent.
- [ ] 3.3 Implement immediate processing plus a five-row 15-minute scheduled drain; verify transient failures remain pending, five attempts/24 hours end in needs review, and an empty drain is a no-op.
- [ ] 3.4 Keep processing in the existing `orders` module behind one provided scheduled-delivery entrypoint, update the module-boundary spec and manifest, and verify `public-commerce-http` still owns no scheduled root and no retired catalog scheduler returns.

## 4. Safe Reads and Evidence

- [ ] 4.1 Expose validated fulfillment and delivery summaries only through protected no-store order reads; verify public responses and logs exclude contact, address, tokens, raw provider responses, and raw Stripe data.
- [ ] 4.2 Run local migration, D1 atomicity/replay/lease tests, signed webhook simulation, scheduled-handler checks, pnpm test:unit, pnpm check, and pnpm build.
- [ ] 4.3 Prove UAT immediate success and one controlled retry with approved test recipients, run `pnpm openspec -- validate add-paid-order-delivery-outbox --strict`, and archive the change only after the exact proof tree passes.
