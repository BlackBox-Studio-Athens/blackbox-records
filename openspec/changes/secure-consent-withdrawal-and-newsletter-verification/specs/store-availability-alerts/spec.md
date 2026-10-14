## MODIFIED Requirements

### Requirement: Shoppers request a one-off availability alert

The Store Item page SHALL offer Notify me only while the variant's Store Offer reads Coming Soon or Repressing, as a quiet text action "Email me when it lands" with a small mail icon that opens the form in place. The form SHALL ask for an email address and an unticked one-off consent, with no account, and SHALL submit only the email, consent state and Store Item identity to the alert route. Consent copy SHALL read "Email me once when this item can be bought or pre-ordered."

#### Scenario: Shopper asks to be notified

- **GIVEN** a Store Item page whose offer reads Coming Soon or Repressing
- **WHEN** a shopper enters a valid email, ticks the consent and submits
- **THEN** the Worker records one pending alert for that variant and email and requests a mailbox management link
- **AND** the form confirms inline in an accessible status region that names the submitted address, without leaving the page.

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
- **THEN** the Worker keeps one alert and returns the same outcome as for a new request
- **AND** below capacity both receive success; at capacity both receive the same busy error
- **AND** the response never reveals whether the address was already waiting.

### Requirement: Availability alerts are private and bounded

Alert email addresses SHALL be stored only in Worker-owned alert and withdrawal-capability records, SHALL NOT be added to any Resend Contact, Segment or Topic by the alert route, and SHALL NOT appear in any public response, log or staff screen. Each variant SHALL hold a bounded number of pending alerts. A pending alert SHALL expire 12 months after its request.

#### Scenario: Alert data stays private

- **WHEN** public, staff or log output is inspected
- **THEN** no alert email address, consent timestamp or alert identifier is exposed
- **AND** staff stock detail shows only the number of shoppers waiting for the variant.

#### Scenario: Per-variant limit is reached

- **WHEN** a variant already holds the maximum number of pending alerts
- **THEN** every address receives the same provider-safe retryable busy response
- **AND** no new alert is stored and existing alerts remain intact.

#### Scenario: Alert expires

- **WHEN** a pending alert reaches 12 months without becoming due
- **THEN** it is deleted without sending email.

## ADDED Requirements

### Requirement: Mailbox holders can withdraw pending availability alerts

The system SHALL offer mailbox-authorized self-service withdrawal of all pending availability alerts for an address, without an account or support conversation. Requests and recovery-link requests SHALL have membership-independent public outcomes. Withdrawal SHALL require a single-use expiring capability and no provider credentials.

#### Scenario: An alert is requested

- **WHEN** an eligible shopper request is accepted
- **THEN** the mailbox receives a link to withdraw pending alerts, subject to the bounded recipient cooldown and sending budget
- **AND** existing delivered links remain valid for up to the alert retention period
- **AND** alert-only requests never write newsletter Contacts, Segments or Topics.

#### Scenario: Existing request has no link

- **WHEN** the visitor requests a withdrawal link using an email address
- **THEN** the mailbox receives the same kind of capability regardless of whether alerts exist
- **AND** the public response does not disclose that address's alert state.

#### Scenario: Withdrawal is authorized

- **WHEN** a valid capability is submitted explicitly by POST
- **THEN** pending and leased alerts for that mailbox are deleted atomically with invalidation of all existing withdrawal capabilities for that mailbox
- **AND** stale delivery attempts cannot recreate deleted work
- **AND** an email already being processed may still arrive, including when withdrawal commits after the final lease read but before or during provider submission.

#### Scenario: Cancellation arrives during preparation

- **WHEN** an alert is withdrawn after its delivery lease was claimed and before the final lease read
- **THEN** no alert email is submitted.

#### Scenario: An older capability overlaps a withdrawn registration

- **GIVEN** valid old and new withdrawal capabilities for one mailbox
- **WHEN** registration pauses after delivering the newer link and that link is used to withdraw
- **THEN** withdrawal invalidates both capabilities and deletes queued work atomically
- **AND** the paused registration cannot insert an alert when it resumes
- **AND** only a fresh later request with a new capability can create new work.

#### Scenario: Attacker guesses or replays a capability

- **WHEN** an unknown, wrong-purpose, expired or consumed capability is submitted
- **THEN** it cannot cancel another person's alerts or later requests
- **AND** the public withdrawal response discloses no mailbox or queue state.

### Requirement: Consent-link records remain private and bounded

The system SHALL store capability hashes without raw tokens, bound confirmation sends, prune expired records, and retain availability withdrawal records only while alerts remain or during the one-hour request cooldown. New newsletter pending evidence SHALL expire within 24 hours; this operational policy SHALL NOT be represented as an externally mandated legal period.

#### Scenario: Request and delivery data are inspected

- **WHEN** public responses, logs and persisted consent records are inspected
- **THEN** raw capability tokens and provider credentials are absent
- **AND** token-bearing links use fragments and no tracking parameters.

#### Scenario: No alert remains

- **WHEN** the scheduled maintenance pass runs after delivery, withdrawal or expiry
- **THEN** availability capability records older than the cooldown with no remaining alerts are deleted.
