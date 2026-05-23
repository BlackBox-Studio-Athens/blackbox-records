## Purpose

Specify Greece-only manual BOX NOW fulfillment, shipping data minimization, and deferred shipping automation boundaries.

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

### Requirement: Shipping automation reopen gate

The system SHALL require an explicit future decision before implementing BOX NOW automation or non-Greece shipping.

#### Scenario: Future shipping automation is requested

- **GIVEN** a task proposes BOX NOW API automation or non-Greece shipping
- **WHEN** work is planned
- **THEN** it must be represented as an active OpenSpec change
- **AND** provider credentials remain Worker-only or out-of-band operator credentials.
