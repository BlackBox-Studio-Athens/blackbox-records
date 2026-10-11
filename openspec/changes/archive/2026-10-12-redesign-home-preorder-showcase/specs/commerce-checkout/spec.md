## ADDED Requirements

### Requirement: UAT test checkout reset is isolated and explicit

A maintenance command SHALL target only the UAT commerce database and real Stripe test credentials. It MUST default to dry-run, require one variant, refuse more than 25 matching pending Sessions, reject environment/database/provider overrides and redact order/provider references. It MUST preserve stock quantities, order lines and history.

#### Scenario: Operator ends an unpaid test checkout

- **WHEN** the operator applies a reset and Stripe confirms the bound test Session is open and unpaid with matching order metadata
- **THEN** the command expires the whole Session through Stripe before releasing the pending hold
- **AND** only confirmed expired unpaid Sessions become not paid, including mixed carts
- **AND** conditional status and payment guards preserve concurrent payment or review changes.

#### Scenario: Payment or provider state cannot safely close

- **WHEN** a Session is paid, processing, live, mismatched, unavailable or has an ambiguous expiration result
- **THEN** the command preserves its hold by default
- **AND** no local deadline alone establishes nonpayment.

#### Scenario: Operator explicitly retires missing legacy UAT test references

- **WHEN** the operator supplies both apply and retire-missing, Stripe returns resource missing for a test Session, the local deadline has passed and no local payment fact exists
- **THEN** the order becomes needs review without inventing an unsupported reason and stops reserving UAT copies
- **AND** payment correlation and history remain intact without asserting nonpayment or provider closure
- **AND** this exception is unavailable for PRD, live references or current deadlines.

## MODIFIED Requirements

### Requirement: Hosted Checkout expiry tolerates creation latency

The system MUST request expiry 31 minutes after pending-order creation: Stripe's native 30-minute minimum plus a one-minute creation allowance. It MUST preserve this timestamp across retries, retain the provider-accepted expiry on the CheckoutOrder, and release held stock only after definitive non-creation or provider-confirmed terminal non-payable state. The browser cart SHALL reserve no stock.

#### Scenario: Hold creation consumes time

- **WHEN** hold creation and transport consume less than the one-minute allowance
- **THEN** the persisted outgoing expiry still meets Stripe's 30-minute minimum
- **AND** the accepted session expiry is recorded with its binding.

#### Scenario: Provider rejects the requested expiry

- **WHEN** Stripe definitively rejects creation because the requested expiry is invalid
- **THEN** checkout returns a browser-safe failure and releases its sessionless hold
- **AND** the application does not create a replacement Session inside that failed attempt.

#### Scenario: SDK retries creation

- **WHEN** the same checkout creation is retried
- **THEN** its order-derived idempotency key and every request parameter, including expiry, remain identical
- **AND** retry does not extend the reservation or create a second Session for that order.

#### Scenario: Provider outcome or binding is uncertain

- **WHEN** a timeout, network failure, provider 5xx, missing usable URL, or binding failure leaves creation or payment eligibility uncertain
- **THEN** the pending hold remains recoverable through the same order identity
- **AND** local time alone does not release the hold.

#### Scenario: Stripe confirms unpaid expiry

- **WHEN** the signed expiry webhook reconciles an expired unpaid Session
- **THEN** the pending order becomes not paid and its copies become available without another shopper attempting checkout
- **AND** duplicate or late events cannot release a paid or processing order.

### Requirement: Checkout creates app authority before provider authority

The system MUST create the complete pending CheckoutOrder hold before requesting a Stripe Checkout Session.

#### Scenario: Checkout starts

- **WHEN** the Worker validates the cart, Store Offers, price mappings, Greece shipping scope, and effective availability
- **THEN** it commits the pending order and lines before calling Stripe
- **AND** the browser receives only the hosted checkout URL or a browser-safe failure.

#### Scenario: Hosted checkout is created

- **WHEN** Stripe accepts the request
- **THEN** the session uses the saved 31-minute deadline, including its one-minute creation allowance
- **AND** the accepted expiry is retained on the bound pending order
- **AND** private metadata carries only the app order identity needed for recovery.
