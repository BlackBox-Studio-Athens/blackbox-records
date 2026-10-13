## RENAMED Requirements

- FROM: `### Requirement: Order workspace is protected and read-only`
- TO: `### Requirement: Order workspace is protected and writes only dispatch marks`

## MODIFIED Requirements

### Requirement: Order workspace is protected and writes only dispatch marks

The system MUST serve an order workspace at `/orders/` in the existing protected staff application and MUST use the existing authenticated internal order reads. Its only operational write is the protected dispatch mark.

#### Scenario: Authorized operator opens orders

- **WHEN** an operator with verified hosted Access identity opens `/orders/`
- **THEN** the workspace reads same-origin protected order APIs
- **AND** navigation between orders and the existing stock workspace is available.

#### Scenario: Access is missing or expires

- **WHEN** an order read returns 401 or 403
- **THEN** the workspace removes displayed private order data and explains the access or reauthentication requirement
- **AND** all in-flight reads are invalidated so late responses cannot restore the cleared list or detail
- **AND** it does not fall back to a public API or hosted JWT-free identity.

#### Scenario: Operator inspects an order

- **WHEN** the operator lists, selects, filters, refreshes, or looks up orders
- **THEN** no payment, stock, order transition, notification resend, customer communication, or dispatch mutation occurs
- **AND** the existing Local loopback-only identity exception remains limited to Local.

### Requirement: Order facts and notification facts remain distinct

The workspace MUST distinguish payment state, shipping-details completeness, staff dispatch marks and secondary notification status, using persisted facts and explicit unknown states.

#### Scenario: Complete paid fulfillment is available

- **WHEN** an order has current complete paid fulfillment
- **THEN** detail shows immutable item options, quantities, monetary facts, recipient/contact and Greek shipping information supplied by the protected read
- **AND** null historical monetary fields are labeled unknown rather than zero
- **AND** complete paid data does not imply the parcel is unshipped or already dispatched; only the dispatch mark does.

#### Scenario: Fulfillment needs investigation

- **WHEN** fulfillment is incomplete or the order needs review
- **THEN** detail identifies the known reason or an explicit unknown reason and directs staff to the manual exception procedure
- **AND** the order is not labeled ready for normal fulfillment.

#### Scenario: A notification is delivered

- **WHEN** a shopper-confirmation, fulfillment-email, or newsletter-registration delivery summary is displayed
- **THEN** its kind, status, attempts, and available retry/review timing remain separate from payment and physical-shipment state
- **AND** delivered notification status is never presented as parcel dispatch or proof the recipient read the email.

### Requirement: Orders can be filtered to those awaiting stock

The order workspace SHALL let staff filter to paid orders that are Awaiting Stock and SHALL show that state in the list and in order detail. The filter SHALL apply on the server before pagination and SHALL not change any order.

#### Scenario: Operator filters awaiting stock

- **WHEN** the operator turns on Awaiting stock
- **THEN** the protected query returns only paid orders with a line from a pre-order that is still open
- **AND** search, email-status filtering, Next and Previous keep working with the filter on.

#### Scenario: No pre-order is open

- **WHEN** no variant has an open pre-order
- **THEN** the filtered list is empty and says so without an error.

#### Scenario: Operator inspects an awaiting order

- **WHEN** an awaiting order appears in the list or is opened
- **THEN** it is marked Awaiting stock, and each pre-order line shows the Ship Estimate the shopper was shown
- **AND** no payment, stock, order or notification mutation is offered or performed, and dispatch changes only through the dispatch mark.

#### Scenario: Filter is restored from the address

- **WHEN** the workspace opens with the awaiting-stock filter in its address, or the operator uses Back
- **THEN** the filter and list are restored
- **AND** an unrecognised value for it is rejected like other invalid workspace addresses.

## ADDED Requirements

### Requirement: Staff record dispatch in Orders

Orders SHALL be the dispatch record. Staff SHALL mark a paid order with complete fulfillment as shipped, and MAY undo the mark after confirming. Each change SHALL record the operator and time, and the system MUST refuse a change based on a stale mark so an order cannot be marked shipped twice. No carrier, tracking or voucher data is stored.

#### Scenario: Operator marks an order shipped

- **WHEN** an operator chooses Mark shipped on a paid order with complete fulfillment
- **THEN** the order shows Shipped with the operator and time
- **AND** it leaves the Not shipped list.

#### Scenario: Two operators mark the same order

- **WHEN** a second operator submits a mark based on the order's earlier state
- **THEN** the write is refused with a conflict, the order is reloaded and the first mark stays.

#### Scenario: Operator undoes a mistaken mark

- **WHEN** an operator chooses Mark not shipped and confirms
- **THEN** the order shows Not shipped with that operator and time and returns to the Not shipped list.

#### Scenario: Order is not ready to ship

- **WHEN** an order is not paid or its fulfillment is incomplete or unavailable
- **THEN** no dispatch control is offered and the protected write refuses a change.

#### Scenario: Write lacks same-origin proof

- **WHEN** a dispatch write lacks verified operator Access, a same-origin Origin or `X-Blackbox-Request: 1`
- **THEN** it is refused without reading or changing the order.

#### Scenario: Operator filters unshipped orders

- **WHEN** the operator turns on Not shipped
- **THEN** the protected query returns only paid orders without a current shipped mark before pagination
- **AND** search, the other filters, Next and Previous keep working, and the filter is kept in the address.
