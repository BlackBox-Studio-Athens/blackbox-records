# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
