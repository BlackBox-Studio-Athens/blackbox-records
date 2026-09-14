## Purpose

Provide self-hosted editorial content management within the BlackBox staff workspace while preserving existing public content, access controls, and recoverable media.

## ADDED Requirements

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
- **AND** Access verification precedes all private responses inside the object, while commerce remains on its existing path and D1/R2 retain their ownership
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
