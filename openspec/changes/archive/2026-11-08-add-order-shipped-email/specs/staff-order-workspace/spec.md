## MODIFIED Requirements

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

### Requirement: Staff record dispatch in Orders

Orders SHALL be the dispatch record. Staff SHALL mark a paid order with complete fulfillment as shipped, and MAY undo the mark after confirming. Each change SHALL record the operator and time, and the system MUST refuse a change based on a stale mark so an order cannot be marked shipped twice. A successful shipment mark SHALL durably queue at most one customer shipping email per order. No carrier, tracking or voucher data is stored.

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
