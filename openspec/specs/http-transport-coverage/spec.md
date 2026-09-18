# HTTP transport coverage Specification

## Purpose

Define evidence-based HTTP/3 coverage across supported BlackBox network boundaries while retaining compatible fallback and explicit platform limitations.

## Requirements

### Requirement: HTTP transport coverage follows the completed hosting topology

The system SHALL establish HTTP/3 coverage against the current accepted hosting topology, using the completed EmDash cutover/handoff and subsequent runtime-publication evidence while reconciling affected source/spec differences.

#### Scenario: Accepted prerequisites are reviewed

- **WHEN** transport implementation is considered after the recorded EmDash cutover
- **THEN** the existing acceptance is reused without requiring dormant cleanup or archive completion
- **AND** missing current deployment identity or measurement headroom blocks only the affected hosted work, not unrelated local preparation.

#### Scenario: Coverage is reviewed

- **WHEN** the final Local, UAT, and PRD topology is inventoried
- **THEN** coverage includes public documents/assets/media, the Pages GET/HEAD gateway and PUBLIC_SITE renderer/object/R2 bindings, public API, protected staff/CMS/API, storage, external providers, and inbound webhooks
- **AND** each leg identifies ownership, protocol visibility/control, and observed or documented limitations.

### Requirement: Eligible hosted endpoints support verified HTTP/3

The system SHALL use actual HTTP/3 on eligible owned hosted client-to-edge connections where the platform and client network support it, without requiring a paid plan or replacing native bindings.

#### Scenario: Protocol advertisement is present

- **WHEN** a response advertises HTTP/3 but the measured request negotiates HTTP/2
- **THEN** evidence records HTTP/2 for that request and HTTP/3 as advertised but unverified
- **AND** it does not claim successful HTTP/3 negotiation.

#### Scenario: A network leg cannot use HTTP/3

- **WHEN** an internal binding has no exposed protocol control or a provider/runtime does not support HTTP/3
- **THEN** the coverage report states the supported mechanism and documented limitation
- **AND** it does not claim end-to-end HTTP/3 or add a proxy solely to manufacture that claim.

#### Scenario: Renderer transport is inventoried

- **WHEN** coverage reaches the service-only public renderer
- **THEN** its native bindings remain platform-managed without exposing a diagnostic hostname
- **AND** the public gateway retains GET/HEAD-only forwarding with no staff credentials or commerce/D1 authority.

### Requirement: HTTP fallback preserves application behavior

The system MUST preserve supported HTTP/2 and HTTP/1.1 fallback, authentication, cache policy, and commerce behavior when HTTP/3 is unavailable.

#### Scenario: QUIC is unavailable

- **WHEN** a supported client cannot establish QUIC
- **THEN** it can use the existing HTTPS endpoint through supported TCP-based HTTP
- **AND** no shopper or operator operation requires HTTP/3 to succeed.

### Requirement: Transport acceptance uses bounded attributable measurements

Transport evidence SHALL identify the target, code and accepted snapshot identity where applicable, time, protocol-capable client, negotiated protocol, cache/connection state, response status, timing samples, and applicable request/resource budget including renderer/object/R2 work.

#### Scenario: Results are compared

- **WHEN** HTTP versions are compared
- **THEN** observations use comparable resources and profiles with individual samples, median and range
- **AND** small samples are not presented as production latency percentiles or proof of application/database speedup.

#### Scenario: Verification is constrained

- **WHEN** the client cannot observe HTTP/3, an authenticated target is unavailable, or quota headroom is unknown
- **THEN** the limitation is recorded and affected repeated hosted work is deferred
- **AND** no paid upgrade, unbounded probing, or new provider mutation occurs.
