## MODIFIED Requirements

### Requirement: Current paid orders contain complete app-owned fulfillment facts

The system SHALL persist approved paid-order and line-item facts without storing raw provider payloads.

#### Scenario: First paid reconciliation commits

- **WHEN** a current CheckoutOrder completes first verified paid reconciliation
- **THEN** it contains paid amount, EUR currency, shopper contact, recipient, Greek address, the chosen BOX NOW locker when one was chosen, and applicable newsletter-consent fields
- **AND** each CheckoutOrderLine retains immutable display name, option label, quantity, unit amount, and line amount.

#### Scenario: Required paid facts are incomplete

- **WHEN** a row marked paid lacks a required current fulfillment or line-item fact
- **THEN** the repository does not expose it as ready paid fulfillment
- **AND** no email, newsletter, or normal manual-fulfillment action starts from it
- **AND** a missing locker alone does not make fulfillment incomplete, because the map-unavailable fallback leaves it empty.

#### Scenario: Provider data is mapped

- **WHEN** Stripe-collected payment and delivery data is persisted
- **THEN** only approved app-owned fields are stored
- **AND** raw Stripe objects, raw BOX NOW data, credentials, voucher data, and tracking automation state are omitted; the locker ID, name, address, postcode and country are app-owned fields.

### Requirement: Shipping email follows the approved shopper draft

Shipping HTML and plain text SHALL use the approved shopper frame, wordmark, typography, order reference, short dispatch copy and existing reply address. The subject SHALL identify shipment and the order reference. When recorded, the email SHALL show the locker used and each BOX NOW parcel number with a tracking link, and SHALL explain the pickup code and full-locker redirection. It SHALL NOT promise arrival timing, a reserved compartment or a new payment obligation.

#### Scenario: Shipping update is rendered

- **WHEN** an eligible shipping notification is rendered
- **THEN** it presents Shipping update, Your order has been shipped, the saved order reference, the approved short BOX NOW copy and Reply to BlackBox Records
- **AND** HTML and plain text agree, dynamic values are escaped, and the configured sender and reply address are retained
- **AND** browser preview and provider/email-client acceptance remain separate checks.

#### Scenario: Order contains pre-orders or non-record items

- **WHEN** an already dispatched order originally included a pre-order or merchandise
- **THEN** the email describes the order as shipped without old waiting estimates or an invented format
- **AND** it adds no price table, marketing or promised delivery date.

#### Scenario: One parcel number is recorded

- **WHEN** the dispatch record has one parcel number
- **THEN** the email shows Locker and Parcel number rows and a Track your parcel action to `https://boxnow.gr/en?track=` followed by the number
- **AND** it says the parcel waits at least 24 hours and BOX NOW's tracking page can add 24 more.

#### Scenario: Several parcel numbers are recorded

- **WHEN** the dispatch record has two or more parcel numbers
- **THEN** the email shows one numbered Parcel row and one Track parcel action per number
- **AND** it says each parcel gets its own pickup code.

#### Scenario: No parcel number is recorded

- **WHEN** the dispatch record has no parcel number
- **THEN** the email shows the locker used, when known, without a tracking action; when it is the shopper's locker, the row keeps its postcode, and when Staff cleared it, the email has no Locker row
- **AND** it still explains the pickup code and full-locker redirection.

## ADDED Requirements

### Requirement: Payment confirmation shows the chosen locker

The payment confirmation email SHALL add a Locker row with the chosen locker's name, postcode and ID when the order has one. When the order used the map-unavailable fallback, it SHALL say BlackBox will contact the shopper to arrange the locker. HTML and plain text SHALL agree.

#### Scenario: Confirmation for an order with a locker

- **WHEN** a payment confirmation is rendered for an order with a chosen locker
- **THEN** a Locker row follows the items and precedes the money rows
- **AND** the plain-text version carries the same locker line.

#### Scenario: Confirmation for a fallback order

- **WHEN** a payment confirmation is rendered for an order without a locker
- **THEN** no Locker row appears
- **AND** the fulfillment paragraph says BlackBox will contact the shopper to arrange the BOX NOW locker.
