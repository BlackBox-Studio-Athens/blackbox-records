# Spec Delta

## MODIFIED Requirements

### Requirement: Hosting cost and supported integration are acceptance gates

The integrated CMS SHALL use supported extension and authentication interfaces and SHALL be accepted against the actual account's free-tier limits. Paid capacity or an upstream fork SHALL NOT be an implicit fallback.

#### Scenario: CMS execution exceeds the entry Worker CPU allowance

- **WHEN** supported CMS operations exceed the Workers Free per-request CPU limit
- **THEN** the same backend deployment MAY host the supported handler in a SQLite-backed Durable Object available on Workers Free, with one object for the editorial site
- **AND** Access verification precedes private CMS operations inside the object; private static files and prepared display thumbnails are served directly by the entry Worker after equivalent hostname, identity, and permission checks
- **AND** commerce remains on its existing path and D1/R2 retain their ownership
- **AND** acceptance measures entry Worker CPU and object CPU, requests, and duration separately without relying on burst tolerance or enabling a paid plan
- **AND** revision conflicts remain enforced in D1 rather than relying on object serialization.

#### Scenario: A bounded dependency correction is required

- **WHEN** the authorized version-pinned patch corrects the reproduced stale-revision race
- **THEN** a clean install applies the reviewed patch and concurrent HTTP saves prove that the losing request cannot overwrite the winner
- **AND** every permitted staff mutation retains server-side validation and conflict protection, including rejection of unsupported write shapes before partial updates
- **AND** the patch is removed when an upstream version passes the same checks, without maintaining a separate CMS fork or lock service.

#### Scenario: Integration or resource proof fails

- **WHEN** the selected package versions cannot support required authentication, headless editing, Worker composition, or representative free-tier operation
- **THEN** implementation stops before migration cutover with evidence and a decision request
- **AND** the existing working system remains available.

## ADDED Requirements

### Requirement: Static staff delivery retains authorization and cache boundaries

Every private staff HTML, script, style, and font response SHALL require the same target-specific verified identity as the staff workspace. Static delivery SHALL remain independent of CMS database initialization and editorial object execution. Existing mandatory revalidation and no-store categories SHALL remain in force.

#### Scenario: Authorized member requests a build asset

- **WHEN** an authorized member requests staff HTML or a build asset using GET or HEAD
- **THEN** the file is served without invoking the editorial object or querying a database
- **AND** eligible fingerprinted assets retain private mandatory revalidation while HTML and ineligible responses remain private and no-store
- **AND** the request creates no session cookie or storage write.

#### Scenario: An invalid identity supplies a matching validator

- **WHEN** a missing, expired, wrong-issuer, wrong-audience, or alternate-host identity requests a private asset with a matching conditional validator
- **THEN** the response denies access before returning private bytes or a not-modified response
- **AND** the denial is private and no-store.

#### Scenario: A non-static route reaches the same deployment

- **WHEN** a public API, internal commerce API, CMS operation, publication workflow, or supported token export reaches the deployment
- **THEN** it retains its existing route, method restrictions, and credential checks
- **AND** a static-file shortcut does not admit unsupported CMS routes or writes.

### Requirement: Compact staff media has private bounded derivatives

Compact staff images SHALL use prepared, private display derivatives of at most 96 pixels on either axis and 40 KiB per image. Derivatives SHALL be regenerable from retained originals, SHALL NOT change editorial references or publication authority, and SHALL NOT require a paid image service.

#### Scenario: A normal staff image upload succeeds

- **WHEN** the native media upload succeeds with a valid display thumbnail
- **THEN** a derivative is stored against the native returned storage identity
- **AND** the original, CMS identity, and normal upload result retain their existing meaning
- **AND** a derivative-storage failure does not report the successful original upload as failed or silently publish media.

#### Scenario: A member reads a prepared derivative

- **WHEN** an authorized member requests an existing derivative using GET or HEAD
- **THEN** the response contains only the prepared image or its metadata and remains private and no-store
- **AND** reading it does not generate an image, write storage, query a database, or invoke the editorial object
- **AND** anonymous and invalid-identity requests cannot read it.

#### Scenario: A derivative is missing or invalid

- **WHEN** no valid derivative exists, its key is malformed, or its stored size exceeds the permitted bound
- **THEN** no original-image fallback or runtime transformation is served through the derivative route
- **AND** compact views show a stable placeholder without disrupting the surrounding task.

#### Scenario: Existing media needs preparation

- **WHEN** an operator prepares derivatives for existing media
- **THEN** the operation defaults to a bounded read-only dry run, supports explicit resumable batches, and skips existing valid derivatives
- **AND** apply changes only derivative objects in the selected environment without altering originals, CMS records, snapshots, stock, or orders
- **AND** hosted reads and writes require the existing account-wide Free-tier budget review and a bounded pilot before further batches.
