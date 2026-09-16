## Purpose

Enable public and authorized operator clients to discover valid API navigation and action contracts while preserving OpenAPI compatibility and existing authority boundaries.

## ADDED Requirements

### Requirement: Discovery remains scoped and compatible with OpenAPI

The system SHALL expose separate public and protected API discovery resources whose links and actions resolve to documented operations within the caller's allowed scope.

#### Scenario: Public client discovers the API

- **WHEN** a client reads public discovery
- **THEN** it receives public navigation and a public API-description reference
- **AND** no internal, private CMS, stock-operator, or private order relationship is exposed.

#### Scenario: Operator discovers the API

- **WHEN** an authenticated authorized operator reads protected discovery
- **THEN** the response provides only permitted workflow relationships and protected API-description references
- **AND** unauthenticated callers cannot obtain protected discovery or descriptions.

### Requirement: Runtime actions complement the existing input contract

The system SHALL describe supported current actions with a relation, concrete target, method, and resolvable OpenAPI operation reference, binding only permitted app-level parameters.

#### Scenario: Client follows an available action

- **WHEN** a client inspects an action descriptor
- **THEN** it can resolve request headers, parameters, body schema, and response contracts from the referenced operation
- **AND** it does not have to guess a route or infer mutation semantics from prose.

#### Scenario: Native CMS lacks a generated operation

- **WHEN** a permitted native CMS workflow is not described in the current Hono OpenAPI documents
- **THEN** discovery may link to its existing authorized read resource or workspace handoff
- **AND** it does not advertise an executable action with an invented or unresolved operation reference, expose service-only controls, or create a second schema source solely for discovery.

#### Scenario: State does not permit an action

- **WHEN** a workflow state or current permission rules out an action
- **THEN** that response does not advertise the action as currently available
- **AND** discoverability does not substitute for authorization checks at execution.

### Requirement: Existing consumers retain their response contracts

The system MUST add hypermedia without requiring existing callers to adopt a generic success envelope or changing bare collection arrays.

#### Scenario: Existing client reads an enriched object

- **WHEN** an unchanged generated client or UI reads a response with optional hypermedia metadata
- **THEN** its existing fields and behavior remain compatible and independently usable.

#### Scenario: Collection relationships are supplied

- **WHEN** relationships accompany an existing bare-array response
- **THEN** the body remains an array and the relationships use documented response headers
- **AND** browser-readable headers are exposed only through the existing allowed-origin policy.

### Requirement: Discovered actions preserve commerce and security authority

The system MUST validate authentication, environment, permissions, current state, concurrency and checkout gates when an action is invoked, independently of prior discovery.

#### Scenario: State changes after discovery

- **WHEN** a client invokes an action with a stale revision or now-disabled checkout state
- **THEN** execution fails through the documented safe error contract without an unauthorized or duplicate effect
- **AND** refreshed discovery does not itself authorize resubmission.

#### Scenario: An existing journaled action is discovered

- **WHEN** discovery describes an item, price or publication operation already protected by a durable request identity
- **THEN** its existing identity, revision, actor, same-origin and live-confirmation requirements remain authoritative
- **AND** discovery does not impose a new checkout/stock identity format on that operation or mint fresh identities on GET.

#### Scenario: Client receives a malicious link or description

- **WHEN** a destination or proposed instruction falls outside the client's trusted origins, supported relations, or authorized task
- **THEN** the client does not execute it or forward credentials
- **AND** read navigation never invokes checkout creation, stock/content mutation, or publication commands merely by following a link.

#### Scenario: An existing read endpoint repairs its projection

- **WHEN** a followed read performs bounded repair already permitted by its existing contract
- **THEN** that behavior remains owned by the underlying endpoint and is included in the operation budget
- **AND** hypermedia generation adds no provider or business mutation solely to create navigation metadata.

### Requirement: Hypermedia utility and cost are demonstrated

Acceptance SHALL compare equivalent OpenAPI-only and hypermedia-assisted traversal tasks, including permission and stale-state cases, while recording compatibility and resource cost.

#### Scenario: Traversal evidence is reviewed

- **WHEN** a proposed agent flow is evaluated
- **THEN** evidence reports task outcome, guessed or invalid actions, request count, payload cost, and additional backend reads
- **AND** simulated traversal is distinguished from an actual agent evaluation and no improvement claim is made without matching evidence.
