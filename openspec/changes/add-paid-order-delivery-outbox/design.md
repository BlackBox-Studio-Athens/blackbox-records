## Context

The first verified paid event already owns the authoritative order-and-stock transaction. Provider calls run afterward and can fail without a durable retry record. CheckoutOrder and CheckoutOrderLine already represent the purchase, so a second fulfillment snapshot model would duplicate the same fact.

## Goals / Non-Goals

**Goals:**

- Make current paid orders self-contained for receipt, newsletter, and manual Greek fulfillment.
- Make each secondary effect retryable once, independently, without weakening payment or stock authority.
- Encode lifecycle constraints in the database and repository types where practical.

**Non-Goals:**

- Generic jobs, events, payload versioning, arbitrary delivery kinds, or provider plugins.
- Historical paid-order backfill beyond an explicit migration preflight.
- Shipping-provider automation or an operator retry screen.

## Decisions

### Extend the existing purchase records

CheckoutOrder gains direct paid-only fields for:

- paid amount in minor units and currency fixed to eur;
- shopper email and optional phone;
- recipient name, address lines, city, postal code, and country fixed to GR;
- newsletter opt-in, consent timestamp, and consent-copy version.

CheckoutOrderLine gains immutable display name, optional option label, unit amount, and line amount. Checkout creation writes line snapshots from the validated Store Offer; first paid reconciliation writes the paid-only order fields.

Database nullability may remain necessary for pre-migration and non-paid rows. The repository therefore exposes a discriminated order result: non-paid rows cannot be used as paid fulfillment, and status = paid is accepted only when every required paid field and line snapshot validates. The paid transition writes the complete set atomically.

Alternative: one versioned JSON snapshot. Rejected because these are current first-class order facts, are queried by operators, and would duplicate line data.

### Add one closed delivery table

PaidOrderDelivery has:

- unique (orderId, kind);
- kind limited to shopper_confirmation, ops_fulfillment, or newsletter_registration;
- status limited to pending, delivered, or needs_review;
- attemptCount, nextAttemptAt, leaseUntil, optional provider message ID, safe reason, and timestamps.

There is no processing or failed status. A pending row with an unexpired leaseUntil is being processed; a transient failure remains pending with a future nextAttemptAt. Delivered and needs-review rows have no next attempt or active lease. Migration checks constrain kinds, statuses, attempt range, and terminal timestamps; the repository exposes transition-specific methods rather than a free-form update.

Newsletter delivery exists only when complete consent fields were committed. The unique order/kind key makes replay idempotent.

### Enqueue atomically, execute after commit

The first paid transaction commits:

1. the guarded CheckoutOrder paid transition;
2. stock changes from add-checkout-stock-reservations;
3. paid fulfillment columns and immutable line snapshots;
4. shopper and ops delivery rows;
5. the newsletter row only for valid consent.

If any statement fails, the transaction rolls back and Stripe receives a retryable reconciliation response. Provider calls begin only after commit. A provider failure changes only its delivery row and still acknowledges the completed paid reconciliation.

### Use one lease transition and one schedule

Immediate processing and scheduled processing use the same compare-and-set claim:

- select a due pending row whose lease is absent or expired;
- atomically increment attemptCount and set leaseUntil;
- on success, mark delivered;
- on a safe transient failure, clear the lease and set nextAttemptAt;
- on permanent failure, uncertain acceptance outside the idempotency window, five attempts, or 24 hours, mark needs review.

Email retries reuse the existing stable Resend idempotency key derived from order and kind. Newsletter registration reuses its existing idempotent contact identity. One hosted Worker Cron runs every 15 minutes and processes at most five due rows sequentially. Local tests invoke the same scheduled handler directly.

The Cron is a paid-delivery adapter, not a revived catalog scheduler or generic job framework. Delivery processing remains in the existing closed `orders` module behind one provided entrypoint; the Worker composition invokes that entrypoint from the scheduled handler. Implementation updates the module-boundary spec and manifest with the exact owned root, provided entrypoint, and allowed dependencies. `public-commerce-http` continues to own no scheduled interface root, and the retired catalog verification handler remains absent.

### Keep ownership narrow

Protected order reads may expose validated fulfillment fields and delivery summaries with Cache-Control: no-store. Public checkout responses expose none of them. This change does not redefine Product Environments, operator authentication, catalog promotion, or Stripe webhook endpoint ownership.

## Risks / Trade-offs

- [Provider accepted a request but the response was lost] → Reuse the same idempotency key and stop automatic retries after the bounded window.
- [Webhook and Cron race] → Claim with one compare-and-set lease; a second claimant performs no provider call.
- [Legacy paid rows lack new fields] → Preflight each environment and resolve or explicitly classify those rows before enabling delivery processing.
- [Both commerce changes edit paid reconciliation] → Land checkout holds first, then extend its single transaction.

## Migration Plan

1. Confirm both accepted prerequisite code contracts are present, then preflight existing paid rows without printing shopper data. Complete their hosted proof and archival before UAT delivery execution.
2. Add direct order/line columns, the delivery table, constraints, and indexes in one additive migration; regenerate Prisma.
3. Write line snapshots at checkout creation and validate paid-order records as a discriminated repository result.
4. Extend first paid reconciliation and replace direct webhook sends with the shared delivery processor.
5. Add the scheduled handler and focused local D1/provider tests.
6. Apply and prove in UAT before adding the same additive schema and Cron to PRD while checkout remains closed.

Rollback disables delivery execution and Cron while retaining committed paid facts and pending rows. It never rolls back paid order or stock state.
