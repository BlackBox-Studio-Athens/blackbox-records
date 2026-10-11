## Purpose

Enable authenticated staff to inspect recent orders and operational exceptions without changing payment, stock, notification, or dispatch state.

## ADDED Requirements

### Requirement: Order workspace is protected and read-only

The system MUST serve an order workspace at `/orders/` in the existing protected staff application and MUST use the existing authenticated internal order reads without adding operational writes.

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

### Requirement: Recent-order coverage is explicit

The workspace SHALL request the latest 100 orders by creation time for the selected payment status, SHALL default to all payment statuses, and SHALL identify that its list and notification filters cover this bounded subset, not all recently updated orders.

#### Scenario: Operator filters payment state

- **WHEN** the operator selects paid, pending payment, not paid, needs review, or all
- **THEN** the protected query retrieves recent orders for that selection
- **AND** order age, payment status, available correlation reference, and notification-attention state are visible without opening each detail.

#### Scenario: Operator filters notification attention

- **WHEN** the operator filters pending or needs-review notifications
- **THEN** filtering applies to the retrieved recent subset
- **AND** the coverage label remains visible
- **AND** zero matches do not imply that all historical orders are clear.

#### Scenario: An older session is known

- **WHEN** the operator submits a Checkout Session identifier or opens its protected detail link
- **THEN** the workspace uses the existing exact session lookup independently of the recent list
- **AND** a missing order is shown as not found without implying the payment never occurred.

#### Scenario: An order has no session identifier

- **WHEN** such an order appears in the recent list
- **THEN** its returned facts remain inspectable
- **AND** the workspace does not fabricate a reference or session detail URL.

### Requirement: Order facts and notification facts remain distinct

The workspace MUST distinguish payment state, fulfillment-data completeness, and secondary notification status, using persisted facts and explicit unknown states.

#### Scenario: Complete paid fulfillment is available

- **WHEN** an order has current complete paid fulfillment
- **THEN** detail shows immutable item options, quantities, monetary facts, recipient/contact and Greek shipping information supplied by the protected read
- **AND** null historical monetary fields are labeled unknown rather than zero
- **AND** complete paid data does not imply the parcel is unshipped or already dispatched.

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
