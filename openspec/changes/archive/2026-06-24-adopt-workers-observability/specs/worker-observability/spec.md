## ADDED Requirements

### Requirement: Workers observability is explicitly configured

The system MUST configure Cloudflare Workers Logs and Workers Traces explicitly in Worker configuration for each Worker runtime target that this repo owns.

#### Scenario: Worker configuration is reviewed

- **WHEN** `apps/backend/wrangler.jsonc` is reviewed
- **THEN** each Local, UAT, and PRD Worker runtime target declares observability settings in source-controlled configuration
- **AND** the configuration does not depend on Cloudflare dashboard defaults for logs or traces.

#### Scenario: Log sampling is configured

- **WHEN** Worker observability settings are evaluated
- **THEN** Workers Logs have an explicit `head_sampling_rate` or equivalent environment-specific log sampling setting
- **AND** the selected sampling rate is documented as a volume and cost control.

#### Scenario: Trace sampling is configured

- **WHEN** Worker tracing is enabled
- **THEN** Workers Traces have an explicit environment-appropriate sampling rate
- **AND** traces remain diagnostic telemetry rather than business logic input.

### Requirement: Runtime logs are structured and queryable

The system MUST emit backend Worker runtime logs as structured records through severity-appropriate `console.info`, `console.warn`, and `console.error` calls.

#### Scenario: Application log is emitted

- **WHEN** backend Worker runtime code records an application event
- **THEN** the log includes a stable `event` field
- **AND** it includes enough safe context to filter in Workers Logs Query Builder
- **AND** it avoids unstructured string-only messages for Worker runtime events.

#### Scenario: Log severity is selected

- **WHEN** an event represents normal completion or state observation
- **THEN** the Worker logs it with informational severity
- **AND** warning severity is reserved for degraded, skipped, retryable, or operator-actionable outcomes
- **AND** error severity is reserved for failed requests, failed scheduled jobs, invalid provider callbacks, unexpected exceptions, or failed side effects.

#### Scenario: Logger wrapper is used

- **WHEN** new Worker runtime logging is added
- **THEN** it uses the repo-owned logging helper or an approved local wrapper around it
- **AND** it does not introduce a heavyweight logging SDK unless a later approved OpenSpec change adds an external observability sink.

### Requirement: Request lifecycle is observable

The system SHALL emit safe request lifecycle logs for public and internal Worker API requests.

#### Scenario: API request completes

- **GIVEN** a request targets a Worker API route
- **WHEN** the Worker returns a response
- **THEN** one request completion log is emitted with request ID, method, normalized path, status, duration, runtime target, and outcome
- **AND** the log excludes raw cookies, authorization headers, Access tokens, request bodies, and unapproved query parameters.

#### Scenario: API request fails unexpectedly

- **GIVEN** a request throws an unexpected error
- **WHEN** the Hono error handler returns the safe error response
- **THEN** the Worker emits a structured error log with request ID, method, normalized path, status, safe error classification, and runtime target
- **AND** the public response does not expose internal stack traces or provider payloads.

#### Scenario: Request ID is correlated

- **WHEN** an API request is handled
- **THEN** logs emitted during that request share a request-scoped identifier
- **AND** the identifier is safe to expose to maintainers for debugging.

### Requirement: Commerce and provider outcomes are observable

The system SHALL emit structured outcome logs for commerce-critical Worker flows without changing their business behavior.

#### Scenario: Checkout start is evaluated

- **WHEN** checkout capability or checkout start is evaluated
- **THEN** logs distinguish allowed, disabled, validation-failed, catalog-drift, stock-unavailable, and provider-failed outcomes
- **AND** logs include only app-owned identifiers and provider-safe reasons.

#### Scenario: Stripe webhook is processed

- **WHEN** a Stripe webhook request is received
- **THEN** logs distinguish verification failure, unsupported event type, duplicate event, paid reconciliation, non-paid reconciliation, catalog reconciliation, and unexpected failure outcomes
- **AND** logs do not include raw Stripe payloads, signatures, card details, or full provider response bodies.

#### Scenario: Stock operation is processed

- **WHEN** the Worker processes an internal stock read or mutation
- **THEN** logs identify the operation kind, variant ID, outcome, and safe reason when applicable
- **AND** logs do not expose Cloudflare Access tokens or raw authenticated-user headers.

#### Scenario: Email side effect is processed

- **WHEN** paid-order email or newsletter registration side effects run
- **THEN** logs identify purpose, status, retryability, order reference when available, idempotency key when safe, and provider-safe reason when applicable
- **AND** logs do not include raw Resend payloads, shopper email addresses, postal addresses, phone numbers, or message HTML.

#### Scenario: Scheduled catalog verification runs

- **WHEN** scheduled catalog verification runs
- **THEN** logs record start, success, issue summary, and failure outcomes
- **AND** issue logs include drift category counts without dumping full provider or D1 records.

### Requirement: Logs and spans protect sensitive data

The system MUST keep secrets, high-risk identifiers, and PII-heavy data out of persisted Workers telemetry.

#### Scenario: Sensitive value could be logged

- **WHEN** runtime code handles Stripe secrets, Resend API keys, Cloudflare tokens, Access tokens, cookies, authorization headers, webhook signatures, D1 binding details, raw provider payloads, shopper emails, phone numbers, or postal addresses
- **THEN** telemetry omits the value or replaces it with an approved safe surrogate
- **AND** tests or validation cover representative redaction behavior.

#### Scenario: Provider identifier is useful for diagnosis

- **WHEN** a provider identifier is needed to correlate an operational issue
- **THEN** the log uses an app-owned identifier, a documented provider-safe identifier, or a stable hash
- **AND** the selected field does not expose secrets, payment credentials, or shopper PII.

#### Scenario: Error is recorded

- **WHEN** an error is converted for telemetry
- **THEN** logs include a safe classification and safe reason
- **AND** raw stack traces are omitted from persistent Workers Logs unless a later approved diagnostic policy allows them.

### Requirement: Custom tracing is limited to high-value flows

The system SHALL use Workers custom spans only where named application spans improve diagnosis beyond automatic platform instrumentation.

#### Scenario: High-value flow runs

- **WHEN** checkout start, Stripe webhook reconciliation, stock mutation, paid-order email notification, checkout newsletter opt-in, or scheduled catalog verification runs
- **THEN** the Worker MAY create a custom span with a stable low-cardinality name
- **AND** span attributes remain safe, bounded, and useful for diagnosis.

#### Scenario: Low-value code path is changed

- **WHEN** routine mapping, validation, formatting, or simple repository code is edited
- **THEN** the implementation does not add custom spans unless the path is part of a documented high-value flow.

### Requirement: Observability can be validated and operated

The system SHALL provide maintainers with a documented way to verify and use Worker observability.

#### Scenario: Repository validation runs

- **WHEN** observability implementation is complete
- **THEN** automated checks verify the intended Wrangler observability configuration and logger safety behavior
- **AND** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass before completion is claimed.

#### Scenario: Deployed Worker logs are inspected

- **WHEN** a maintainer has Cloudflare credentials for a deployed Worker target
- **THEN** documentation explains how to inspect Workers Logs in the Cloudflare dashboard or with `wrangler tail`
- **AND** the instructions map Worker runtime targets back to Local, UAT, and PRD terminology.

#### Scenario: Frontend browser telemetry is requested

- **WHEN** browser-side errors, Core Web Vitals, or static frontend user-session telemetry are requested
- **THEN** the system treats that as a separate client observability scope
- **AND** it does not attempt to route browser telemetry through Workers Logs without a later approved change.
