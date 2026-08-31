## ADDED Requirements

### Requirement: Distro source and projections are validated together

The system SHALL fail deterministic checks when the manifest, content projection, pricing, artwork, or generated catalog disagree.

#### Scenario: Manifest validation runs

- **WHEN** catalog artifacts are checked
- **THEN** emitted IDs and normalized identities are unique, aliases are unambiguous, rejected duplicates reference emitted rows, exactly the approved extras carry provenance, and every item type/price policy is valid.

#### Scenario: Content projection validation runs

- **WHEN** distro content is checked
- **THEN** every current emitted content item maps to one manifest row
- **AND** unapproved content, missing canonical content, or an emitted rejected row fails.

#### Scenario: Artwork validation runs

- **WHEN** an item lacks matched repository artwork
- **THEN** artwork-fetcher evidence or explicit known-missing fallback evidence is required.

### Requirement: Distro catalog acceptance includes UAT provider proof

The system SHALL verify both fixed and pay-what-you-want paths before treating the manifest rollout as complete.

#### Scenario: UAT proof runs

- **WHEN** generated artifacts are applied to UAT
- **THEN** catalog post-verification, static deployment, fixed-price paid smoke, and pay-what-you-want paid smoke pass
- **AND** evidence excludes secrets, raw provider payloads, and full provider IDs.
