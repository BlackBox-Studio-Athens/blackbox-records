# Spec Delta

## Purpose

Lets a shopper ask, with an email address and explicit one-off consent, to be told once when a Coming Soon or Repressing Store Item variant can be bought or pre-ordered.

## ADDED Requirements

### Requirement: Shoppers request a one-off availability alert

The Store Item page SHALL offer Notify me only while the variant's Store Offer reads Coming Soon or Repressing, as a quiet text action "Email me when it lands" with a small mail icon that opens the form in place. The form SHALL ask for an email address and an unticked one-off consent, with no account, and SHALL submit only the email, consent state and Store Item identity to the Worker. Consent copy SHALL read "Email me once when this can be bought or pre-ordered." The address SHALL NOT be added to the newsletter.

#### Scenario: Shopper asks to be notified

- **GIVEN** a Store Item page whose offer reads Coming Soon or Repressing
- **WHEN** a shopper enters a valid email, ticks the consent and submits
- **THEN** the Worker records one pending alert for that variant and email
- **AND** the form confirms inline in an accessible status region without leaving the page.

#### Scenario: Offer is not eligible

- **WHEN** the offer reads Buy, Pre-order or Sold Out, is unavailable, or cannot be read
- **THEN** no Notify me form is shown
- **AND** the Worker rejects an alert request for that variant with a provider-safe error and stores nothing.

#### Scenario: Consent or email is invalid

- **WHEN** the consent is not ticked or the email is invalid
- **THEN** the browser shows an accessible error associated with the control and sends no request
- **AND** the Worker independently rejects such a payload with `400` and stores nothing.

#### Scenario: Same address asks again

- **WHEN** an address already has a pending alert for the variant
- **THEN** the Worker keeps one alert and returns the same success response as for a new request
- **AND** the response never reveals whether the address was already waiting.

### Requirement: Availability alerts are private and bounded

Alert email addresses SHALL be stored only in the Worker's alert records, SHALL NOT be added to any Resend Contact, Segment or Topic, and SHALL NOT appear in any public response, log or staff screen. Each variant SHALL hold a bounded number of pending alerts. A pending alert SHALL expire 12 months after its request.

#### Scenario: Alert data stays private

- **WHEN** public, staff or log output is inspected
- **THEN** no alert email address, consent timestamp or alert identifier is exposed
- **AND** staff stock detail shows only the number of shoppers waiting for the variant.

#### Scenario: Per-variant limit is reached

- **WHEN** a variant already holds the maximum number of pending alerts
- **THEN** a new request is refused with a provider-safe retryable error and stores nothing.

#### Scenario: Alert expires

- **WHEN** a pending alert reaches 12 months without becoming due
- **THEN** it is deleted without sending email.

### Requirement: Alerts are sent once when the variant becomes orderable

The scheduled Worker job SHALL send each pending alert once when its variant classifies as stocked, whether as an ordinary item or an open pre-order. It SHALL send through the existing transactional email path with environment recipient routing and an idempotency key per alert. It SHALL delete the alert after delivery or after bounded failed attempts.

#### Scenario: Copies arrive

- **GIVEN** pending alerts for a Coming Soon variant
- **WHEN** staff record copies and the variant reads as stocked on a later scheduled run
- **THEN** each waiting shopper receives one email naming the item and linking its Store page
- **AND** the email states that it can now be bought, without promising price or remaining copies
- **AND** each delivered alert is deleted.

#### Scenario: A pre-order opens

- **WHEN** the variant becomes a stocked open pre-order
- **THEN** the email states that the item can be pre-ordered, and includes the Ship Estimate when one is shown to shoppers.

#### Scenario: Variant is still not orderable

- **WHEN** a scheduled run finds the variant Coming Soon, Repressing, Sold Out or unavailable
- **THEN** no email is sent and the alert stays pending until it becomes orderable or expires.

#### Scenario: Provider fails

- **WHEN** sending fails
- **THEN** the alert is retried on later runs with a lease and backoff, at most five attempts
- **AND** after the last failure it is deleted and a provider-safe outcome is logged without the address.

### Requirement: Alert email stays within the shared sending budget

Alert email SHALL share the environment's provider quota with order email without delaying it. Each scheduled run SHALL send due order email before alerts, and alert sending SHALL stop at a fixed daily budget per Europe/Athens day. Remaining due alerts SHALL wait for later runs in request order.

#### Scenario: Many shoppers wait for one release

- **WHEN** more alerts are due than the daily alert budget allows
- **THEN** that day's runs send up to the budget, oldest requests first
- **AND** the rest are sent on following days without being dropped.

#### Scenario: Order email is due in the same run

- **WHEN** paid-order or Ship Estimate notices are due
- **THEN** they are processed before any alert in that run.
