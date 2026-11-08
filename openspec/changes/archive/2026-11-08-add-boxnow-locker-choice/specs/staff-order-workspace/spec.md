## MODIFIED Requirements

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

## ADDED Requirements

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
