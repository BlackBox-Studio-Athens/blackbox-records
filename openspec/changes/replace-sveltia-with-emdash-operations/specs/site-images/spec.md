## MODIFIED Requirements

### Requirement: Repo Content Owns Content Images

The system SHALL treat CMS-owned media references and their immutable stored originals as the source of truth for editorial Content Images; Public Brand Assets remain code-owned.

#### Scenario: Product image is needed downstream

- **GIVEN** a release or distro item has a CMS-owned image
- **WHEN** store, cart, checkout, metadata, or provider projection needs product image data
- **THEN** the downstream image data is derived from the CMS-owned content image
- **AND** duplicate editable provider-specific product image fields are not introduced by this change.

### Requirement: Provider Image URLs Are Projected

The system SHALL derive Provider Product Image URLs from CMS-owned approved content snapshots and the target Product Environment.

#### Scenario: Provider product image URL is emitted

- **GIVEN** catalog promotion or provider reconciliation emits product image data
- **WHEN** the target Product Environment is UAT or PRD
- **THEN** the image URL is an absolute public URL for that same Product Environment
- **AND** browser-submitted image URLs are not accepted as product-media authority.

## ADDED Requirements

### Requirement: CMS media preserves static image delivery and privacy

Published editorial media SHALL retain responsive rendering, alt text, stable dimensions, and approved framing without requiring paid runtime transformations. Draft media and backups SHALL remain private.

#### Scenario: A migrated page builds

- **WHEN** the approved content snapshot includes media
- **THEN** the build validates its identity and bytes and produces the existing Astro image treatment
- **AND** known public catalog URLs remain available or receive an explicitly tested compatible mapping.

#### Scenario: Uploaded media is invalid

- **WHEN** an upload has an unsafe type, excessive size, invalid image bytes, or unsafe filename
- **THEN** it is rejected or safely normalized before it can be rendered or projected to Stripe
- **AND** remote fetches cannot target arbitrary private-network or unapproved origins.

#### Scenario: Historical image is still referenced

- **WHEN** a media replacement or cleanup occurs
- **THEN** assets referenced by live snapshots, order history, provider Products, or retained backups are not automatically deleted.
