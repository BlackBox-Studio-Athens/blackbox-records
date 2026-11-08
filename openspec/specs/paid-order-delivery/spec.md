# paid-order-delivery Specification

## Purpose

Defines the minimal durable paid-order facts and bounded secondary deliveries needed for receipts, newsletter consent, and manual Greek fulfillment.

## Requirements

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

### Requirement: Paid facts and delivery rows commit before providers run

The system MUST commit paid order, stock, fulfillment, and applicable delivery rows atomically before any secondary provider call.

#### Scenario: Authoritative transaction fails

- **WHEN** any paid-order, stock, fulfillment, or delivery-row statement fails
- **THEN** the complete transaction rolls back
- **AND** reconciliation remains retryable.

#### Scenario: Secondary provider fails

- **WHEN** a provider call fails after the authoritative transaction committed
- **THEN** paid order and stock state remain committed
- **AND** only the corresponding delivery row remains pending or becomes needs review.

### Requirement: Delivery retries are leased, bounded, and idempotent

The system SHALL use one compare-and-set lease path for immediate and scheduled delivery attempts and SHALL stop automatic attempts after five tries or 24 hours.

#### Scenario: Concurrent processors select one row

- **WHEN** two Worker invocations attempt to claim the same due delivery
- **THEN** only one active lease is created
- **AND** only its owner calls the provider.

#### Scenario: Transient failure is safe to retry

- **WHEN** a provider failure is classified transient inside the attempt and time bounds
- **THEN** the row remains pending with a future next-attempt time and no active lease
- **AND** the next email attempt reuses the same provider idempotency key.

#### Scenario: Automatic retry is no longer safe

- **WHEN** the maximum attempt count, 24-hour window, permanent error, or unsafe acceptance uncertainty is reached
- **THEN** the row becomes needs review
- **AND** scheduled processing skips it.

#### Scenario: Scheduled drain runs

- **WHEN** the 15-minute Worker Cron fires
- **THEN** it processes at most five due rows sequentially across `PaidOrderDelivery` work and pre-order estimate notices, paid-order deliveries first
- **AND** exits without provider work when none are due
- **AND** processes only those two kinds of work without invoking catalog verification or a generic job registry.

#### Scenario: Estimate notice is retried

- **WHEN** a pre-order estimate notice fails transiently
- **THEN** it follows the same lease, attempt and 24-hour bounds as a paid-order delivery
- **AND** a notice replaced by a newer estimate uses a new provider idempotency key so the newer email is not suppressed.

### Requirement: Shopper order emails retain truthful reference presentation

Payment confirmation and estimate-change HTML and plain text SHALL match the approved email references through the existing mail owners while preserving paid/cycle eligibility, immutable money/lines, escaping and reply address. Presentation changes SHALL NOT alter transport or introduce unsupported shipping cause, direction or guarantees.

The HTML SHALL use the approved 476px dark frame, Sea Green top rule, existing wordmark, Inter/Veneer hierarchy, bordered table facts and outlined reply control, with mail-safe inline essentials and meaningful font fallbacks. Ordinary browser rendering SHALL be verified separately from email-client and provider delivery acceptance.

#### Scenario: Confirmation is rendered

- **WHEN** an eligible paid ordinary, mixed or pre-order-only order is rendered
- **THEN** its actual immutable money, record/format facts and known estimates are shown with the approved email hierarchy
- **AND** missing estimates remain unknown, ordinary waiting copy appears only when appropriate, and HTML/text remain consistent.

#### Scenario: Historical money breakdown is incomplete

- **WHEN** a paid snapshot lacks an Items or Delivery amount
- **THEN** that row states Not recorded while retaining the actual saved Total Paid value or its existing unknown-total fallback
- **AND** no amount is reconstructed from current prices, quantity, VAT or the paid total.

#### Scenario: Estimate-change comparison is rendered

- **WHEN** an eligible current-cycle estimate notice is rendered
- **THEN** Was (at order) uses the estimate recorded at order and Now expected uses the notice's actual saved value
- **AND** no unsupported reason or direction is asserted, shopper input is escaped, and the existing reply address is preserved.
- **AND** exactly two paragraphs retain the one-parcel promise and no-action/reply wording without a separate comparison-explanation paragraph.

#### Scenario: Estimate is withheld or reintroduced

- **WHEN** a notice has an unknown saved or new estimate, or an exact/month/part estimate is restored
- **THEN** unknown values remain To be confirmed and known values retain the existing formatter's exact/date/month-part wording
- **AND** earlier/later direction, vinyl format and a pressing-plant cause are not inferred from the notice.

#### Scenario: Preview subject is displayed

- **WHEN** a local email preview shows its Subject
- **THEN** that Subject remains outside the emitted email body and the preview sends no email.

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

### Requirement: Shipping email opt-out is durable

The system SHALL allow an operator to record dispatch without queuing a shipping email. An explicit opt-out SHALL persist with the dispatch record and survive undo/re-mark. Existing email deliveries SHALL retain their original state and retry history. Omitting the choice SHALL retain the existing send-by-default behavior.

#### Scenario: Operator skips the first shipping email

- **WHEN** an authorized operator marks a complete paid order shipped with the shipping email disabled
- **THEN** the dispatch mark and durable opt-out commit together without a shipping-email delivery or provider call
- **AND** immediate and scheduled processing never send a shipping email for that opt-out.

#### Scenario: Operator undoes and re-marks a skipped order

- **WHEN** an operator undoes a silent dispatch mark and later marks it shipped again, even requesting an email
- **THEN** the original opt-out stays and no shipping-email delivery is created.

#### Scenario: Shipping notification already exists

- **WHEN** a dispatch change requests no email after a shipping-email delivery already exists
- **THEN** that delivery and its retry history remain unchanged
- **AND** it is not labelled skipped or treated as cancellable.

#### Scenario: Default dispatch and concurrent writes

- **WHEN** a complete paid order is first marked shipped with the email enabled or the choice omitted
- **THEN** the existing atomic, duplicate-safe shipping-email queue and retry behavior apply
- **AND** a stale competing mark cannot change the winning choice or create a second delivery.

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
