## MODIFIED Requirements

### Requirement: Paid delivery kinds and states are closed

The system SHALL represent secondary paid-order work only as shopper_confirmation, ops_fulfillment, newsletter_registration, or shopper_shipping, with status only pending, delivered, or needs_review.

#### Scenario: Paid order has no newsletter consent

- **WHEN** first paid reconciliation commits without complete consent
- **THEN** one shopper-confirmation row and one ops-fulfillment row exist
- **AND** no newsletter-registration or shipping-notification row exists.

#### Scenario: Paid order has newsletter consent

- **WHEN** first paid reconciliation commits complete consent
- **THEN** exactly one newsletter-registration row also exists
- **AND** payment alone creates no shipping notification.

#### Scenario: Delivery is actively processed

- **WHEN** a Worker claims a due pending delivery
- **THEN** the row remains pending with an active lease and incremented attempt count
- **AND** no separate processing or failed status is created.

## ADDED Requirements

### Requirement: A successful dispatch queues one customer shipping email

The system MUST durably queue at most one automatic shipping email per order with a successful protected change from Not shipped to Shipped. The dispatch mark and notification intent SHALL commit together before a provider call. Reads, payment reconciliation, failed or conflicting writes, and deployment SHALL NOT queue this email.

#### Scenario: Staff mark a complete paid order shipped

- **WHEN** an authenticated operator successfully marks a complete paid order shipped
- **THEN** its saved shopper contact receives the shipping notification through the existing transactional email routing
- **AND** the notification intent exists durably before delivery is attempted.

#### Scenario: A request is repeated or two operators act together

- **WHEN** a dispatch request is repeated, its response is lost, or concurrent operators submit the same earlier state
- **THEN** the existing conflict protection remains and at most one shipping notification is queued
- **AND** any provider retry uses that notification's same idempotency identity.

#### Scenario: A provider attempt fails

- **WHEN** the provider rejects or cannot complete a shipping email attempt
- **THEN** the successful dispatch mark remains Shipped
- **AND** its separate notification follows the existing leased, bounded retry and needs-review rules.

#### Scenario: A mistaken mark is undone

- **WHEN** staff undo a shipped mark
- **THEN** the existing dispatch correction succeeds without a correction email
- **AND** an already accepted message cannot be recalled
- **AND** a shipping notification selected for a later attempt while the order is Not shipped goes to needs review without a provider call.

#### Scenario: A corrected order is marked shipped again

- **WHEN** an order with an existing shipping notification is marked shipped again
- **THEN** no second notification is created and no delivered or needs-review notification is automatically resent
- **AND** an existing pending notification retains its original retry identity and bounds.

#### Scenario: The change is deployed with historical shipped orders

- **WHEN** the new code is deployed, historical orders are read, or a payment webhook is replayed
- **THEN** no shipping emails are created for existing shipped marks.

### Requirement: Shipping email follows the approved shopper draft

Shipping HTML and plain text SHALL use the approved shopper frame, wordmark, typography, order reference, short dispatch copy and existing reply address. The subject SHALL identify shipment and the order reference. The email SHALL NOT assert tracking, locker readiness, arrival timing or a new payment obligation.

#### Scenario: Shipping update is rendered

- **WHEN** an eligible shipping notification is rendered
- **THEN** it presents Shipping update, Your order has been shipped, the saved order reference, the approved short BOX NOW copy and Reply to BlackBox Records
- **AND** HTML and plain text agree, dynamic values are escaped, and the configured sender and reply address are retained
- **AND** browser preview and provider/email-client acceptance remain separate checks.

#### Scenario: Order contains pre-orders or non-record items

- **WHEN** an already dispatched order originally included a pre-order or merchandise
- **THEN** the email describes the order as shipped without old waiting estimates or an invented format
- **AND** it adds no price table, marketing, tracking button or promised delivery date.
