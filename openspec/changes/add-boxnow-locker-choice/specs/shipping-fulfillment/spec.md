## MODIFIED Requirements

### Requirement: Greece-only manual BOX NOW scope

The system SHALL keep current checkout shipping Greece-only with manual BOX NOW fulfillment.

#### Scenario: Greek checkout starts

- **GIVEN** a shopper starts checkout in the current shipping scope
- **WHEN** Stripe Checkout is created
- **THEN** Stripe collects Greek shipping address and contact details
- **AND** the browser submits the BOX NOW locker the shopper chose, or the map-unavailable fallback, to `StartCheckout`
- **AND** no BOX NOW API, partner portal or Send parcel request is made by the system.

### Requirement: BOX NOW data minimization

The system MUST avoid persisting raw BOX NOW widget, API, credential, voucher, label, tracking automation, or portal payloads in v1. It MAY persist only the chosen locker's ID, name, address, postcode and country, the locker an operator records as used, and the BOX NOW parcel numbers an operator enters at dispatch.

#### Scenario: Paid Greek order needs fulfillment

- **GIVEN** a paid Greek order exists
- **WHEN** operators create a BOX NOW shipment manually
- **THEN** the repo stores only Worker-owned order/payment and approved minimal shipping-mode data needed for handoff
- **AND** the staff dispatch mark stores only whether the order is shipped, when it last changed, which operator changed it, the locker used and the entered parcel numbers.

#### Scenario: The locker map reports a selection

- **WHEN** BOX NOW's map reports a chosen locker to the page
- **THEN** only the locker ID, name, address, postcode and country are kept
- **AND** other widget fields, map keys and request data are discarded.

### Requirement: Delivery promises match manual BOX NOW operations

The system MUST disclose the Greek BOX NOW locker method, coverage, delivery timing, the locker the shopper chooses and BOX NOW's full-locker redirection before payment. Accepted carts and destinations MUST fit the approved shipment agreement without undisclosed post-payment charges. Existing restrictions on country scope, automation and BOX NOW data remain in force.

#### Scenario: A shopper reviews delivery terms

- **WHEN** delivery is offered
- **THEN** the shopper can find the gross charge, supported destinations, realistic timing, that they choose the locker at checkout, and that BOX NOW moves a parcel to the nearest locker when the chosen one is full
- **AND** collection of a street address does not promise home delivery
- **AND** no copy promises a reserved compartment.

#### Scenario: A cart cannot be fulfilled under the advertised policy

- **WHEN** its destination, quantity or parcel requirements are unsupported
- **THEN** the order cannot become payable under that policy
- **AND** the system does not collect an undisclosed surcharge after payment or use a non-Greece fallback.

#### Scenario: An unusual item requires manual repacking

- **WHEN** physical packing finds a box set, sleeve, protection or sealed carton outside the assumed model
- **THEN** the operator verifies/repackages at BlackBox's cost without a later customer top-up
- **AND** the shared model is not claimed as measured fit or a verified maximum, and no new per-product onboarding/measurement approval gate is introduced.

## ADDED Requirements

### Requirement: Shopper chooses a BOX NOW locker before payment

Checkout SHALL let the shopper choose a Greek BOX NOW locker on BOX NOW's public map before payment. The map SHALL load only after the shopper asks for it. The Worker SHALL accept a submitted locker only when its ID, name and country are present, bounded in length and the country is `GR`, and SHALL store it with the order.

#### Scenario: Shopper chooses a locker

- **WHEN** the shopper taps Find a locker and selects a locker on the map
- **THEN** the page shows the locker in BlackBox type and enables Continue to payment
- **AND** the Worker saves that locker on the pending order before Stripe Checkout is created.

#### Scenario: Checkout opens without a locker

- **WHEN** checkout loads and no locker has been chosen in this visit
- **THEN** no BOX NOW script, frame or request loads until the shopper taps Find a locker or Use this locker
- **AND** Continue to payment stays disabled with a visible reason.

#### Scenario: Submitted locker data is invalid

- **WHEN** Start Checkout receives a locker with a missing ID or name, an over-long value or a country other than `GR`
- **THEN** the request is rejected before any stock hold or Stripe Session is created
- **AND** no partial locker is stored.

### Requirement: Checkout falls back when the locker map is unavailable

When BOX NOW's map fails to load or report a selection within a bounded time, checkout SHALL let the shopper continue without a locker. The order SHALL then record that no locker was chosen, and staff SHALL arrange the locker after payment as before this change.

#### Scenario: The map does not load

- **WHEN** the map script or frame fails or times out after the shopper taps Find a locker
- **THEN** the panel explains that the locker will be arranged by email after payment
- **AND** Continue to payment becomes available without a locker.

#### Scenario: A fallback order is paid

- **WHEN** an order paid through the fallback reaches Staff
- **THEN** it shows that the customer chose no locker
- **AND** the confirmation email and order complete page say BlackBox will contact the customer about the locker.
