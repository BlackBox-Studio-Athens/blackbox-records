## Context

CheckoutOrder already records the provider session, status, and immutable line quantities. While status is pending_payment, those lines are exactly the quantities that must not be offered to another checkout. A separate CheckoutReservation aggregate would repeat the same identity, lines, session binding, and lifecycle.

## Goals / Non-Goals

**Goals:**

- Prevent overselling the final effective unit across concurrent checkout starts.
- Keep one order lifecycle, one line set, and one stock-consumption transaction.
- Remain safe under provider failure, delayed payment, expiry, duplicate events, and reordered events.
- Make impossible transitions unavailable through database constraints and transition-specific repository methods.

**Non-Goals:**

- Server carts, customer accounts, backorders, waitlists, reservation UI, or browser stock authority.
- A second hold table, state enum, cleanup daemon, or mutable reserved counter.
- Releasing a session that may still accept payment.

## Decisions

### Pending CheckoutOrder is the hold

CheckoutOrder keeps its existing status enum:

- pending_payment: holds stock and includes hosted checkout plus asynchronous payment pending;
- paid: terminal and consumes stock once;
- not_paid: terminal and releases the hold;
- needs_review: terminal operator state for paid reconciliation that cannot safely complete.

No reservation status or reservation identifier is added. CheckoutOrderLine is the only quantity source for the hold. New migration constraints require positive line quantity and one line per (orderId, variantId). checkoutSessionId becomes nullable but remains unique; checkoutExpiresAt is non-null for new checkout orders.

The repository exposes transition-specific compare-and-set operations rather than arbitrary status updates. Terminal rows cannot return to pending_payment. Application types distinguish sessionless pending orders, session-bound pending orders, paid orders, and terminal non-paid/review orders so code cannot assume a provider session exists.

### Derive effective availability

For each variant:

    max(0, min(Stock.quantity, Stock.onlineQuantity)
             - sum(CheckoutOrderLine.quantity
                   where CheckoutOrder.status = pending_payment))

The Store Offer detail read and checkout start use the same D1 query. Collection listing reads may consume the resulting D1 projection but never call Stripe. There is no persisted reserved quantity to reconcile.

### Insert the complete hold before Stripe

Checkout start aggregates duplicate CartLines by variant, validates positive quantities and current Store Offers, then runs one D1 transaction:

1. conditionally insert one pending CheckoutOrder only if every requested variant has sufficient effective availability;
2. insert exactly one CheckoutOrderLine per aggregated variant;
3. verify the guarded order insert succeeded.

D1 serializes the transaction boundary; the second concurrent transaction sees the first pending order. Local D1 concurrency tests are acceptance evidence, not an assumption.

The order receives an app-generated ID and fixed checkoutExpiresAt before provider work. Stripe Checkout receives that order ID in private metadata and the same expiry, 30 minutes after creation.

### Bind or terminate without inventing another state

After Stripe returns:

- bind checkoutSessionId to the same pending order and return the hosted URL;
- if provider creation failed, compare-and-set the sessionless order to not_paid;
- if session binding failed, request provider expiry;
- after confirmed expiry, compare-and-set the order to not_paid;
- if non-payable state cannot be confirmed, retain pending_payment and the stock hold.

The metadata order ID lets a later webhook locate the order and fill a still-null session ID while reconciling it. A sessionless pending order with uncertain provider state is operator-actionable; local time alone never releases it.

### Reconcile one order state

Verified outcomes map directly:

- paid checkout completion or asynchronous success: atomically write deterministic StockChange rows, decrement Stock and OnlineStock, and change pending_payment to paid;
- unpaid completion: remain pending_payment;
- asynchronous failure or session expiry: change pending_payment to not_paid without stock mutation;
- duplicate or stale events: no-op when the expected current state no longer matches.

If stock was manually reduced below the held quantity, paid reconciliation commits no partial stock mutation and moves to the established needs_review path.

### Bound stale provider checks

Normal reads do not contact Stripe. When a checkout would fail solely because expired-by-local-clock pending orders consume the requested stock, checkout start may inspect at most five oldest session-bound candidates. It releases only sessions Stripe confirms terminal and non-payable, then retries the D1 availability decision once. Provider failure remains fail-closed. Sessionless uncertain rows require operator reconciliation.

## Risks / Trade-offs

- [Missed expiry webhook leaves a hold] → Run the bounded provider-confirmed check only when the hold blocks checkout.
- [Stripe session exists but D1 binding failed] → Expire it; otherwise retain the hold and recover by metadata webhook or operator review.
- [D1 concurrency differs from assumptions] → Require a real local D1 final-unit race test before rollout.
- [Operator reduces physical stock during a hold] → Preserve operator truth and send paid reconciliation to needs review without partial writes.

## Migration Plan

1. Confirm no hosted payable legacy session lacks a recoverable CheckoutOrder.
2. Make checkoutSessionId nullable, add checkoutExpiresAt and line constraints/indexes, and regenerate Prisma.
3. Add discriminated order types, effective-availability query, and D1 concurrency tests.
4. Reorder checkout creation and add provider expiry compensation and metadata recovery.
5. Update webhook reconciliation and the existing paid transaction.
6. Deploy migration and code with checkout disabled, prove Local then UAT, and leave PRD opening to production-go-live-readiness.

Rollback disables checkout and reverts application behavior while retaining additive data. It never rewrites migration history or releases a possibly payable session.
