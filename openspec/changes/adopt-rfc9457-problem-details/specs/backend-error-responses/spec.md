## MODIFIED Requirements

### Requirement: Worker API errors use a shared JSON contract

The system MUST return RFC 9457 problem details with `application/problem+json` for BlackBox-owned JSON API error responses, preserving existing safe code and legacy message fields.

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

### Requirement: Error schemas are shared across route contracts

The system SHALL define its problem-details schema once, reuse it across migrated app-owned route families, and preserve compatibility with independently deployed browser clients.

#### Scenario: Route documents an error response

- **WHEN** a migrated backend route declares an OpenAPI error response
- **THEN** it references the shared problem schema under the media type actually returned
- **AND** it does not define an independent error envelope for that family.

#### Scenario: Generated clients consume errors

- **WHEN** the error contract changes
- **THEN** public/internal API descriptions and generated clients are regenerated and verified separately
- **AND** legacy readers can still use `error`, while new readers prefer `detail` with legacy fallback.

#### Scenario: A response is outside the known schema

- **WHEN** a consumer receives an unknown problem type, extension, or non-JSON edge/auth error
- **THEN** it preserves HTTP-status handling and safe fallback text
- **AND** it does not require parsing message text or arbitrary remote problem documentation to decide the next action.

## ADDED Requirements

### Requirement: Problem types are stable and safe to identify

The system SHALL maintain documented stable problem type URI references and titles, with occurrence-specific safe details and no sensitive identifiers embedded in type or instance references.

#### Scenario: The same failure type recurs

- **WHEN** two requests fail for the same documented problem type
- **THEN** their `type` and `title` remain stable while safe details and correlation IDs may differ
- **AND** any optional `instance` is an occurrence reference rather than a leaked request query or provider identifier.
