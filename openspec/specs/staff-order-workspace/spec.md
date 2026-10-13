# staff-order-workspace Specification

## Purpose

Enable authenticated staff to inspect recent orders and operational exceptions without changing payment, stock, notification, or dispatch state.

## Requirements

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

### Requirement: Orders support complete server-side search and cursor pagination

The workspace SHALL search all authorized orders by order reference, customer name/email, and payment reference using bounded cursor pages. Payment and email filters SHALL apply before pagination. The default page size is 25 with a server maximum of 50. Creation time and order identity establish stable ordering. Visible information updates every sixty seconds and on stale return or reconnect; hidden and offline views pause reads. This supersedes the latest-100 subset and routine refresh controls.

#### Scenario: Operator filters payment state

- **WHEN** the operator selects paid, pending payment, not paid, needs review, or all
- **THEN** the protected query retrieves recent orders for that selection
- **AND** order age, payment status, available correlation reference, and notification-attention state are visible without opening each detail.

#### Scenario: Operator filters notification attention

- **WHEN** the operator filters pending or needs-review notifications
- **THEN** filtering applies to the complete authorized server-side result set before pagination
- **AND** Next and Previous preserve the current search and payment filter.

#### Scenario: An older session is known

- **WHEN** the operator submits a Checkout Session identifier or opens its protected detail link
- **THEN** the workspace uses the existing exact session lookup independently of the recent list
- **AND** a missing order is shown as not found without implying the payment never occurred.

#### Scenario: An order has no session identifier

- **WHEN** such an order appears in the recent list
- **THEN** its returned facts remain inspectable
- **AND** the workspace does not fabricate a reference or session detail URL.

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

### Requirement: Private order views handle failures and concurrency safely

The workspace MUST keep order data out of persistent browser storage and public artifacts, and SHALL provide accessible loading, empty, error, and stale states.

#### Scenario: A later selection supersedes a request

- **WHEN** filters or selected sessions change before an earlier response returns
- **THEN** the earlier response cannot replace the current selection or list.

#### Scenario: Refresh fails

- **WHEN** previously loaded data remains after a failed refresh
- **THEN** the workspace clearly labels it stale and identifies the last successful read
- **AND** an accessible manual retry remains available.

#### Scenario: A new filter or lookup fails

- **WHEN** a newly requested payment filter or session lookup fails
- **THEN** previously loaded results are not presented as belonging to that new query
- **AND** any retained data remains explicitly associated with its previous query and read time.

#### Scenario: Private information is rendered

- **WHEN** the workspace displays order/contact information
- **THEN** it escapes text, honors no-store reads, and stores no order payload in localStorage, sessionStorage, analytics, public build output, or logs
- **AND** detail URLs contain only the selected session identity, not contact or address data
- **AND** list/detail selection and status feedback are usable by keyboard on narrow and wide screens.

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
