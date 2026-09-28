## MODIFIED Requirements

### Requirement: Content and media survive application replacement

Editorial records and media SHALL live outside application bundles and Git commits. Complete private backup and restore evidence SHALL exist before the old writable CMS is retired. Dependency upgrades SHALL preserve retained editorial state and scheduling instants through migration and repeated startup.

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

#### Scenario: Existing CMS state is upgraded

- **WHEN** a dependency upgrade migrates an existing CMS and starts it twice
- **THEN** private drafts, revision content, calendar dates, relations, media and the accepted publication remain intact
- **AND** valid one-shot timestamps retain their original instant after normalization
- **AND** configured sites are not seeded again and deleted seed content remains deleted
- **AND** commerce prices, stock and orders remain unchanged.
