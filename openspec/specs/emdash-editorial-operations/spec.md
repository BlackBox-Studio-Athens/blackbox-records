# emdash-editorial-operations Specification

## Purpose

Provide self-hosted editorial content management within the BlackBox staff workspace while preserving existing public content, access controls, and recoverable media.

## Requirements

### Requirement: One staff workspace uses one verified identity

Label members SHALL manage content, Store Items, stock, and orders from one BlackBox-owned workspace using their existing allowlisted sign-in. CMS and commerce authorization SHALL enforce the same verified person and target environment.

#### Scenario: Member moves between tasks

- **WHEN** a permitted member moves from a News draft to an item, stock, or order
- **THEN** the workspace retains navigation and identity without another GitHub, Stripe, or CMS login
- **AND** server-side permissions remain required for every read and write.

#### Scenario: Request bypasses the protected hostname

- **WHEN** an internal or CMS request arrives without a valid target-specific identity through an alternate hostname, forged email header, expired token, wrong audience, or wrong issuer
- **THEN** it is rejected before reading private content or performing route work.

#### Scenario: Browser attempts a forged write

- **WHEN** a cross-origin request, stale revision, unauthorized role, or tampered payload attempts a mutation
- **THEN** the server rejects it without partial field updates or privilege escalation
- **AND** the member can reload current data and retry an authorized action.

### Requirement: Editorial fields retain their supported meaning

CMS editing SHALL cover every existing public content collection and fixed page structure while preserving references, stable slugs, rich-text meaning, validation, media descriptions, and deletion restrictions.

#### Scenario: Existing content migrates

- **WHEN** Artists, Releases, Distro, News, page copy, purchase information, navigation, social links, newsletter copy, and settings are imported
- **THEN** record counts, source identities, links, dates, ordering, media, and rendered semantics reconcile against the source inventory
- **AND** migration neither drops optional fields nor invents missing content or prices.

#### Scenario: Member edits a referenced record

- **WHEN** an Artist title changes or a Release selects an Artist
- **THEN** the persisted stable identity and public slug survive title changes
- **AND** relations use existing records rather than duplicate manually maintained choices.

#### Scenario: Member attempts destructive content work

- **WHEN** a member edits an Artist, Release, Store Item, fixed page, or fixed navigation entry
- **THEN** ordinary editing does not offer hard deletion
- **AND** News and social-link deletion retains confirmation and reference safety
- **AND** stop-selling and archive actions preserve order and stock history.

#### Scenario: Invalid content is submitted directly

- **WHEN** a request bypasses form constraints for a URL, slug, reference, date, image, bounded list, or required field
- **THEN** server validation rejects it with actionable field errors
- **AND** arbitrary scripts, executable markup, unsafe embeds, and unsupported fields cannot enter rendered content.

### Requirement: Staff editing remains accessible and task-first

The workspace SHALL provide content lists, forms, media selection, draft preview, publication status, and actionable errors using current BlackBox terminology and branding.

#### Scenario: Member uses a narrow screen or keyboard

- **WHEN** routine editing runs at 320 CSS pixels or with keyboard navigation
- **THEN** required controls remain visible without page-level horizontal overflow
- **AND** controls have accessible names, visible focus, error association, adequate contrast, and at least 44 by 44 CSS-pixel primary touch targets.

#### Scenario: Member previews a draft

- **WHEN** a member previews Home, About, Services, Artist, Release, Store Item, or News content
- **THEN** the preview shows the pending content and media clearly marked as a draft
- **AND** preview does not publish it or expose draft content through public routes.

### Requirement: Content and media survive application replacement

Editorial records and media SHALL live outside application bundles and Git commits. Complete private backup and restore evidence SHALL exist before the old writable CMS is retired.

#### Scenario: Worker is redeployed

- **WHEN** a Software Release deploys unchanged or updated code
- **THEN** existing CMS records, users, revisions, media, prices, stock, and orders are preserved
- **AND** seed fixtures do not overwrite populated databases.

#### Scenario: Editorial recovery is rehearsed

- **WHEN** a backup is restored into isolated recovery resources
- **THEN** users, content, relations, required revisions, and referenced media are recoverable and reconciled
- **AND** restoring editorial data cannot roll back paid orders, stock, or Stripe bindings.

#### Scenario: Public media storage is inspected

- **WHEN** an anonymous visitor requests media or a guessed backup path
- **THEN** only intentionally public assets are accessible
- **AND** database exports, unpublished media, credentials, and private backups are inaccessible.

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
