## MODIFIED Requirements

### Requirement: PRD promotion selects verified artifacts

Software Release promotion SHALL require an explicit operator request identifying one successful UAT code revision and verified PRD-targeted code/content artifacts. Deployment SHALL NOT silently substitute latest main, unavailable artifacts, stale PRD content, or an unrelated successful run.

#### Scenario: Reviewer accepts a candidate

- **WHEN** the authorized reviewer promotes its exact code SHA and successful candidate evidence
- **THEN** PRD receives the verified PRD-targeted artifact from that source SHA and current approved PRD content revision
- **AND** evidence records reviewer, code/content revisions, artifact digest, configuration identity, migration status, and deployment result.

#### Scenario: Candidate evidence is stale or missing

- **WHEN** artifacts are unavailable, code is superseded, configuration changed, or deployed UAT code no longer matches the review
- **THEN** promotion stops before mutation and requires fresh candidate validation.

#### Scenario: Target builds differ

- **WHEN** UAT and PRD use different origins, status cues, or environment-owned content
- **THEN** both builds use the same reviewed source code with explicit target content/configuration identities
- **AND** evidence does not claim byte-identical artifacts or promote UAT data into PRD.

#### Scenario: PRD content advances after candidate preparation

- **WHEN** the PRD artifact contains an older content revision than the current approved publication
- **THEN** that artifact is rejected before deployment
- **AND** a refresh rebuilds the same reviewed code SHA against current PRD content, reruns content/build/compatibility checks, and records a new target artifact linked to the original code-candidate evidence
- **AND** the refreshed artifact requires explicit promotion without claiming that its target content was the content viewed in UAT.
