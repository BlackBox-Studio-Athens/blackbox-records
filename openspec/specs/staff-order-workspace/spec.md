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

- **WHEN** a shopper-confirmation, fulfillment-email, newsletter-registration, or shipping-email delivery summary is displayed
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

Orders SHALL be the dispatch record. Staff SHALL mark a paid order with complete fulfillment as shipped, and MAY undo the mark after confirming. Each change SHALL record the operator and time, and the system MUST refuse a change based on a stale mark so an order cannot be marked shipped twice. A successful shipment mark SHALL durably queue at most one customer shipping email per order. Only the locker used and BOX NOW parcel numbers are stored as carrier data.

#### Scenario: Operator marks an order shipped

- **WHEN** an operator chooses Mark shipped on a paid order with complete fulfillment
- **THEN** the order shows Shipped with the operator and time
- **AND** it leaves the Not shipped list
- **AND** the control explains that this action emails the customer
- **AND** the shipping email appears in Notifications with its actual delivery status, independently of Shipped.

#### Scenario: Two operators mark the same order

- **WHEN** a second operator submits a mark based on the order's earlier state
- **THEN** the write is refused with a conflict, the order is reloaded and the first mark stays
- **AND** no duplicate shipping email is queued.

#### Scenario: Operator undoes a mistaken mark

- **WHEN** an operator chooses Mark not shipped and confirms
- **THEN** the order shows Not shipped with that operator and time and returns to the Not shipped list
- **AND** the existing confirmation explains that an already sent shipping email cannot be recalled
- **AND** undo sends no correction email and re-marking does not create a second shipping notification.

#### Scenario: Order is not ready to ship

- **WHEN** an order is not paid or its fulfillment is incomplete or unavailable
- **THEN** no dispatch control is offered and the protected write refuses a change
- **AND** no shipping email is queued.

#### Scenario: Write lacks same-origin proof

- **WHEN** a dispatch write lacks verified operator Access, a same-origin Origin or `X-Blackbox-Request: 1`
- **THEN** it is refused without reading or changing the order
- **AND** no shipping email is queued.

#### Scenario: Operator filters unshipped orders

- **WHEN** the operator turns on Not shipped
- **THEN** the protected query returns only paid orders without a current shipped mark before pagination
- **AND** search, the other filters, Next and Previous keep working, and the filter is kept in the address.

#### Scenario: Shipping email delivery fails

- **WHEN** a shipping notification is pending or needs review
- **THEN** Staff shows that state under Shipping email without undoing the successful dispatch mark
- **AND** refreshes, searches and notification filters remain reads and never trigger another message.

### Requirement: Staff can skip the shipping email when recording dispatch

Eligible order detail SHALL show a default-checked Send shipping email checkbox immediately before Mark shipped when no shipping-email delivery or saved opt-out exists. The workspace SHALL preserve the choice during refresh and failure, reset it between orders, disable it while saving, and show a saved opt-out as neutral Shipping email skipped information.

#### Scenario: Staff records an already-shipped order

- **WHEN** staff unchecks Send shipping email and chooses Mark shipped
- **THEN** the protected dispatch request explicitly disables the email
- **AND** successful feedback confirms the shipment was recorded without queuing an email
- **AND** Notifications shows Shipping email skipped after reopening the order.

#### Scenario: Staff revisits a previous decision

- **WHEN** an unshipped order has a saved opt-out or an existing shipping-email delivery
- **THEN** its saved outcome appears instead of a new checkbox
- **AND** undo/re-mark neither removes an opt-out nor cancels or duplicates existing email work.

#### Scenario: Refresh, submission failure and order switching

- **WHEN** an eligible order refreshes or its dispatch submission fails
- **THEN** the entered checkbox selection remains
- **AND** selecting another eligible order starts with Send shipping email checked.

#### Scenario: Keyboard and narrow-screen use

- **WHEN** staff records dispatch using a keyboard or a phone-width viewport
- **THEN** the checkbox has a visible associated label and helper text, visible focus and a reachable target
- **AND** controls wrap without horizontal overflow and become disabled during submission.

### Requirement: Order detail prepares BOX NOW Send parcel

Order detail for a paid order SHALL show a For BOX NOW Send parcel section showing the delivery tier's suggested parcel size with BOX NOW's current price, then recipient, phone, email, locker name and locker ID, each copyable, plus Copy all for those values and an Open Send parcel link. The size is not copied, because BOX NOW's form chooses it with a picker. It SHALL show no parcel value.

#### Scenario: Operator copies details

- **WHEN** the operator taps Copy beside a field, or Copy all
- **THEN** the exact saved value, or all values in the listed order, is copied
- **AND** a visible status confirms the copy without moving focus.

#### Scenario: Order has no chosen locker

- **WHEN** a paid order used the map-unavailable fallback
- **THEN** the section says the customer chose no locker and the locker must be agreed with them
- **AND** the locker fields are absent rather than blank.

#### Scenario: Narrow screen

- **WHEN** the section is used at phone width
- **THEN** each label sits above its value with the Copy action reachable and no horizontal overflow.

### Requirement: Dispatch records the locker used and BOX NOW parcel numbers

Dispatch SHALL show Locker used, prefilled with the customer's locker and changeable, and one BOX NOW parcel number field with Add parcel for more. Each entered number SHALL be exactly 10 digits. Numbers and the locker used SHALL save with the Mark shipped change and be read back with the order. A Check the number on BOX NOW link SHALL open the tracking page for the first number.

#### Scenario: Operator ships one parcel

- **WHEN** the operator enters one 10-digit number and marks the order shipped
- **THEN** the number and locker used are saved with the shipped mark
- **AND** the queued shipping email uses them.

#### Scenario: Operator ships several parcels

- **WHEN** the operator adds a second number and marks the order shipped
- **THEN** both numbers are saved in entry order.

#### Scenario: Operator changes the locker used

- **WHEN** Send parcel would not take the customer's locker and the operator chooses Change and enters another locker
- **THEN** the new locker is saved as the locker used and the customer's original choice stays on the order.

#### Scenario: Number is invalid or missing

- **WHEN** a number is not exactly 10 digits
- **THEN** Mark shipped is refused with an inline error and nothing is saved
- **AND** leaving every number empty is allowed and sends the shipping email without tracking.
