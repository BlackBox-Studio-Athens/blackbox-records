## MODIFIED Requirements

### Requirement: Releases require combined CMS artifacts

Software promotion SHALL verify and deploy the retained combined CMS artifact, reject incompatible old candidate contracts, and exclude standalone staff Pages and commerce-only Worker fallback deployment.

#### Scenario: Incompatible candidate is selected

- **WHEN** the candidate lacks the current combined artifact contract
- **THEN** promotion stops before mutation and requires a fresh accepted candidate.

#### Scenario: Current candidate is selected

- **WHEN** promotion passes exact source, artifact digest, ordering and content freshness checks
- **THEN** it promotes the combined Worker without changing staff DNS or Access, and preserves the target content and checkout gates.
