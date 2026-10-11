## ADDED Requirements

### Requirement: Software release terms distinguish review from launch

The system SHALL use Software Release for deployed application code, Release Candidate for a revision reviewed in UAT, and Software Release promotion for explicit deployment of that candidate to PRD. These SHALL remain distinct from editorial Release content, catalog preparation, and shopper launch.

#### Scenario: A maintainer describes a small UI update

- **WHEN** the update is deployed to UAT for review
- **THEN** it is a Release Candidate, not a published label Release or approved shopper launch.

#### Scenario: Evidence describes deployment

- **WHEN** a candidate is promoted
- **THEN** its source SHA, target artifact, and acceptance identify the Software Release
- **AND** existing Promotion Evidence remains redacted and environment-scoped.
