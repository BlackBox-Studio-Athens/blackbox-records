## Purpose

Specify shared Worker API error response contracts, schemas, and browser-safe error body behavior.

## Requirements

### Requirement: Worker API errors use a shared JSON contract

The system MUST return RFC 9457 problem details with `application/problem+json` for migrated BlackBox-owned JSON API error responses, preserving existing safe codes and each route family's legacy error representation.

#### Scenario: Public API returns an expected error

- **GIVEN** a request targets a public Worker API route
- **WHEN** the route returns invalid input, unavailable checkout, catalog drift, newsletter unavailability, or another expected error
- **THEN** the body includes a stable problem `type` URI reference, non-empty `title` and `detail`, and numeric `status` equal to the actual HTTP status
- **AND** it includes a stable lower-snake-case `code`, legacy `error` equal to `detail`, and request-scoped `requestId` when one exists
- **AND** the HTTP status remains authoritative and the response is `no-store`.

#### Scenario: Internal API returns an expected error

- **GIVEN** a request targets a protected internal Worker API route
- **WHEN** the route returns missing identity, invalid stock input, variant not found, order not found, or another expected error
- **THEN** it uses the same problem-details contract
- **AND** no Access token, raw authenticated-user header, or binding detail is exposed.

#### Scenario: Fallback handler returns an unexpected error

- **WHEN** a Worker API request throws an unexpected error
- **THEN** the response uses the shared problem contract with `code` equal to `internal_server_error`
- **AND** both `detail` and legacy `error` are generic safe text
- **AND** stack traces, provider payloads, secrets, bindings, and raw validation issues are omitted.

#### Scenario: Unknown route returns not found

- **WHEN** the app-owned JSON API not-found boundary handles an unknown route
- **THEN** it returns the shared problem contract with status `404` and `code` equal to `not_found`.

#### Scenario: Response belongs to an upstream protocol

- **WHEN** Cloudflare Access/edge, supported upstream EmDash, or a provider produces its own response
- **THEN** the upstream contract is preserved and documented as outside app-owned problem generation
- **AND** consumers safely handle that response without exposing its raw body as an application error message.

#### Scenario: App-owned CMS uses a legacy error variant

- **WHEN** a migrated app-owned CMS route previously returned a safe string error code or a nested error object
- **THEN** standard problem members are added alongside the unchanged legacy error representation and required discriminators
- **AND** Hono's `error === detail` convention is not imposed on that CMS representation
- **AND** private/no-store, authentication and runtime-publication recovery semantics remain intact.

#### Scenario: Public renderer returns a document failure

- **WHEN** the public gateway or renderer returns an HTML or plain-text error rather than an app-owned JSON API response
- **THEN** that representation remains outside problem-details generation
- **AND** no commerce API envelope is imposed on public documents or media.

### Requirement: Error schemas are shared across route contracts

The system SHALL define its problem-details base schema once, extend it only with explicit typed legacy representations for migrated route families, and preserve compatibility with independently deployed browser clients.

#### Scenario: Route documents an error response

- **WHEN** a migrated backend route declares an OpenAPI error response
- **THEN** it references the shared problem schema under the media type actually returned
- **AND** it does not define an independent error envelope for that family.

#### Scenario: Generated clients consume errors

- **WHEN** the error contract changes
- **THEN** public/internal API descriptions and generated clients are regenerated and verified separately
- **AND** legacy readers retain their existing `error` representation while new readers prefer safe `detail` with family-specific legacy fallback.

#### Scenario: Native CMS is outside the generated Hono descriptions

- **WHEN** a native app-owned CMS route changes its error representation
- **THEN** existing CMS client fixtures verify its media type and legacy compatibility separately
- **AND** generating the public/internal Hono documents is not presented as CMS schema coverage.

#### Scenario: A response is outside the known schema

- **WHEN** a consumer receives an unknown problem type, extension, or non-JSON edge/auth error
- **THEN** it preserves HTTP-status handling and safe fallback text
- **AND** it does not require parsing message text or arbitrary remote problem documentation to decide the next action.

### Requirement: Problem types are stable and safe to identify

The system SHALL maintain documented stable problem type URI references and titles, with occurrence-specific safe details and no sensitive identifiers embedded in type or instance references.

#### Scenario: The same failure type recurs

- **WHEN** two requests fail for the same documented problem type
- **THEN** their `type` and `title` remain stable while safe details and correlation IDs may differ
- **AND** any optional `instance` is an occurrence reference rather than a leaked request query or provider identifier.

### Requirement: Hono exceptions use the shared error contract

The system SHALL convert Hono boundary exceptions to the shared backend error contract.

#### Scenario: Hono HTTPException is handled

- **GIVEN** route code or middleware throws a Hono `HTTPException`
- **WHEN** the global error handler handles it
- **THEN** the response is converted to the shared error contract
- **AND** the handler applies repository response headers itself instead of returning `HTTPException.getResponse()` unchanged.

### Requirement: Error responses stay browser-safe

The system MUST keep browser-visible error bodies safe for public shoppers and protected operators.

#### Scenario: Validation fails

- **WHEN** request validation fails at the HTTP boundary
- **THEN** the response uses a stable safe error code such as `invalid_request`
- **AND** the message is understandable to the caller
- **AND** raw validator issue dumps are omitted unless a later approved requirement defines safe field-level validation details.

#### Scenario: Provider operation fails

- **WHEN** Stripe, email, D1, or another backend dependency fails
- **THEN** the response uses a safe public code and message
- **AND** raw provider errors, credentials, payment identifiers, shopper PII, webhook signatures, and internal exception text are omitted.

#### Scenario: Error is logged

- **WHEN** an error response is returned
- **THEN** logs may include safe diagnostic classification and safe reason fields
- **AND** the response code remains a client-facing contract distinct from richer internal telemetry.
