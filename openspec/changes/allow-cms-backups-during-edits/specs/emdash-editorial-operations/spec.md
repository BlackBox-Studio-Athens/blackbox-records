# Spec Delta

## MODIFIED Requirements

### Requirement: Content and media survive application replacement

Editorial records and media SHALL live outside application bundles and Git commits. A CMS backup SHALL preserve one consistent D1 snapshot and every media object referenced by that snapshot, even when staff make concurrent content edits or upload media. Complete private backup and restore evidence SHALL exist before the old writable CMS is retired.

#### Scenario: Worker is redeployed

- **WHEN** a Software Release deploys unchanged or updated code
- **THEN** existing CMS records, users, revisions, media, prices, stock, and orders are preserved
- **AND** seed fixtures do not overwrite populated databases.

#### Scenario: Editorial recovery is rehearsed

- **WHEN** a backup is restored into isolated recovery resources
- **THEN** users, content, relations, required revisions, and referenced media are recoverable and reconciled
- **AND** restoring editorial data cannot roll back paid orders, stock, or Stripe bindings.

#### Scenario: Backup overlaps active editing

- **WHEN** staff save content, upload media, or remove media while a private backup captures CMS data
- **THEN** the backup records one consistent D1 state and contains every media object referenced by that state
- **AND** ordinary edits and media additions do not invalidate the capture
- **AND** a missing or changed referenced media object prevents publication of the recovery point.

#### Scenario: Public media storage is inspected

- **WHEN** an anonymous visitor requests media or a guessed backup path
- **THEN** only intentionally public assets are accessible
- **AND** database exports, unpublished media, credentials, and private backups are inaccessible.
