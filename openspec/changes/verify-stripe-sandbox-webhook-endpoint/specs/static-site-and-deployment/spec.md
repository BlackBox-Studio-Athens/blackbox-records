## ADDED Requirements

### Requirement: Sandbox Worker webhook deployment evidence

The system SHALL include persistent Stripe webhook endpoint evidence in sandbox Worker deployment readiness.

#### Scenario: Sandbox Worker webhook readiness is checked

- **GIVEN** the sandbox Worker is deployed at `https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev`
- **WHEN** deployment readiness or UAT readiness is verified
- **THEN** evidence includes a persistent Stripe account webhook endpoint targeting `/api/stripe/webhooks`
- **AND** evidence includes sandbox Worker `STRIPE_WEBHOOK_SECRET` presence without exposing the secret value.

#### Scenario: Scheduled catalog verification remains enabled

- **GIVEN** the sandbox Worker is configured for catalog synchronization
- **WHEN** deployment readiness is verified
- **THEN** the sandbox Worker keeps its scheduled catalog verification cron enabled
- **AND** the schedule is treated as a backstop for missed webhook setup, missed delivery, or Dashboard drift, not as a replacement for the persistent webhook endpoint.

#### Scenario: Secret rotation or endpoint recreation occurs

- **GIVEN** the sandbox Stripe webhook endpoint signing secret is rotated or the endpoint is recreated
- **WHEN** the new endpoint secret is available to the operator or setup script
- **THEN** the sandbox Worker `STRIPE_WEBHOOK_SECRET` is updated before persistent webhook readiness is accepted
- **AND** the signing secret is not committed, logged, or exposed through Astro public environment variables.
