## Purpose

Specify permanent Greece-only fulfillment, shipping data minimization, and a separate gate for any future Greek BOX NOW automation.

## Requirements

### Requirement: Greece-only manual BOX NOW scope

The system SHALL keep current checkout shipping Greece-only with manual BOX NOW fulfillment.

#### Scenario: Greek checkout starts

- **GIVEN** a shopper starts checkout in the current shipping scope
- **WHEN** Stripe Checkout is created
- **THEN** Stripe collects Greek shipping address and contact details
- **AND** the browser does not submit BOX NOW locker data to `StartCheckout`.

### Requirement: BOX NOW data minimization

The system MUST avoid persisting raw BOX NOW widget, API, credential, voucher, label, tracking automation, or portal payloads in v1.

#### Scenario: Paid Greek order needs fulfillment

- **GIVEN** a paid Greek order exists
- **WHEN** operators create a BOX NOW shipment manually
- **THEN** the repo stores only Worker-owned order/payment and approved minimal shipping-mode data needed for handoff.

### Requirement: Shipping country scope is closed

The system MUST reject non-Greece delivery and MUST NOT add a non-Greece provider, quote, or checkout path.

#### Scenario: Non-Greece delivery is submitted

- **GIVEN** a checkout or paid-order delivery address has a country other than `GR`
- **WHEN** the system validates it for payment or fulfillment
- **THEN** the request is rejected before it can become payable or ready for fulfillment
- **AND** no provider fallback broadens the supported country set.

### Requirement: BOX NOW automation reopen gate

The system SHALL require an explicit future decision before implementing BOX NOW automation, and any approved automation MUST remain Greece-only.

#### Scenario: Future shipping automation is requested

- **GIVEN** a task proposes BOX NOW API automation for Greek fulfillment
- **WHEN** work is planned
- **THEN** it must be represented as an active OpenSpec change
- **AND** provider credentials remain Worker-only or out-of-band operator credentials.

### Requirement: Manual Greek fulfillment uses the persisted paid order

The system SHALL use validated Worker-owned paid-order fields as the normal manual fulfillment handoff.

#### Scenario: Operator prepares a paid Greek order

- **WHEN** the protected order read returns complete current paid fulfillment
- **THEN** it supplies the recipient, contact, Greek address, order reference, and immutable line summary
- **AND** normal fulfillment does not require a fresh Stripe read.

#### Scenario: Paid fulfillment is incomplete

- **WHEN** required persisted fulfillment data is missing or invalid
- **THEN** the order is presented as operator-actionable
- **AND** it is not presented as ready for normal fulfillment.

### Requirement: Collected shipping details own fulfillment identity

The system MUST derive the shipment recipient and delivery address from verified Checkout shipping details, keep shopper contact separate, and never substitute billing details for missing shipping details.

#### Scenario: Billing and shipping differ

- **WHEN** a verified paid Session contains a Greek shipping address and recipient different from the buyer's billing details
- **THEN** the persisted fulfillment and operator delivery use the shipping recipient and address
- **AND** billing country does not reject an otherwise valid Greek shipment
- **AND** buyer email and optional phone remain shopper contact.

#### Scenario: Shipping data is incomplete or unsupported

- **WHEN** verified shipping lacks required recipient/address fields or its country is not `GR`
- **THEN** the order does not become ready for normal fulfillment
- **AND** billing details are not used as a fallback
- **AND** reconciliation preserves a durable review outcome or remains retryable until that outcome can be recorded.

#### Scenario: Fulfillment is replayed

- **WHEN** the same paid Session is delivered again
- **THEN** previously committed paid fulfillment facts remain immutable
- **AND** no raw billing or provider payload is added to public checkout responses or order storage.
