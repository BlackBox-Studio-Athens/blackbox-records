## ADDED Requirements

### Requirement: Stripe sandbox webhook endpoint verifier

The system SHALL provide a repository-owned verification command for the persistent sandbox Stripe webhook endpoint.

#### Scenario: Persistent sandbox endpoint is configured

- **GIVEN** sandbox Stripe credentials are available to the operator or CI environment
- **WHEN** `pnpm stripe:webhooks:verify --env sandbox` runs
- **THEN** it verifies that Stripe has an enabled account webhook endpoint for `https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev/api/stripe/webhooks`
- **AND** it verifies that the endpoint is in Stripe test mode for the sandbox account
- **AND** it reports only redacted endpoint identifiers.

#### Scenario: Required catalog events are missing

- **GIVEN** the matching sandbox webhook endpoint exists
- **WHEN** the endpoint does not include `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, or `price.deleted`
- **THEN** `pnpm stripe:webhooks:verify --env sandbox` fails
- **AND** it lists the missing event type names without printing Stripe secrets.

#### Scenario: Dashboard state is ambiguous

- **GIVEN** Stripe returns no matching endpoint, a disabled matching endpoint, or multiple enabled endpoints with the sandbox Worker webhook URL
- **WHEN** `pnpm stripe:webhooks:verify --env sandbox` runs
- **THEN** it fails with a remediation summary that points the operator to the exact endpoint URL and required catalog events.

#### Scenario: Worker secret presence is checked

- **GIVEN** the sandbox Stripe endpoint configuration is valid
- **WHEN** `pnpm stripe:webhooks:verify --env sandbox` checks the deployed Worker configuration
- **THEN** it verifies that `STRIPE_WEBHOOK_SECRET` is present for the sandbox Worker when that information is available from Wrangler or Cloudflare
- **AND** it distinguishes secret presence from signing-secret match proof.

### Requirement: Stripe CLI listener is not persistent endpoint evidence

The system MUST keep temporary Stripe CLI listener output separate from persistent webhook endpoint verification.

#### Scenario: Smoke listener is running

- **GIVEN** `stripe listen` is forwarding events for a smoke run or local diagnostic
- **WHEN** webhook readiness evidence is evaluated
- **THEN** listener output, forwarded event delivery, and listener signing secrets are not accepted as proof that the persistent sandbox Stripe endpoint is configured.

#### Scenario: Listener secret would overwrite persistent secret

- **GIVEN** the deployed sandbox Worker uses `STRIPE_WEBHOOK_SECRET` for the persistent Stripe endpoint
- **WHEN** smoke tooling starts a transient Stripe CLI listener
- **THEN** the tooling MUST NOT silently replace the deployed sandbox Worker's primary `STRIPE_WEBHOOK_SECRET` with the listener signing secret.

### Requirement: Sandbox webhook proof joins operator validation

The system SHALL make persistent sandbox webhook configuration visible in operator proof before accepting catalog sync readiness.

#### Scenario: Sandbox catalog readiness is proved

- **GIVEN** sandbox catalog readiness is being verified before UAT, smoke evidence, or launch-readiness review
- **WHEN** operator validation runs
- **THEN** it includes `pnpm stripe:webhooks:verify --env sandbox`
- **AND** it keeps `pnpm stripe:catalog:verify --env uat` as separate proof that current Store Offer and Stripe catalog state are aligned.
