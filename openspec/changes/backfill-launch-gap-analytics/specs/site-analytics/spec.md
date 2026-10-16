# Spec Delta

## ADDED Requirements

### Requirement: Launch-gap traffic is a preserved edge-derived estimate

Stats SHALL include the captured 16 October 2026 launch-gap estimate only for the matching production analytics site and ranges containing that date after the gap has ended. The estimate SHALL use aggregate edge requests, preserve existing data and the response contract, and exclude the first RUM minute and later traffic.

#### Scenario: Staff reads either range containing launch day

- **WHEN** a successful configured 7-day or 30-day read contains 16 October 2026 after 12:19 UTC
- **THEN** its launch-day totals include the same 50 estimated visits and 50 conservative page views exactly once
- **AND** supported page, country and device keys merge before the existing ranking and limits
- **AND** unavailable launch-gap referrer data does not invent direct or unknown referrer figures.

#### Scenario: Existing data and boundaries remain intact

- **WHEN** a range excludes launch day, ends before the gap is complete, or uses a different analytics site
- **THEN** no launch-gap aggregate is added
- **AND** normal upstream and cached analytics remain unmodified at their source.

#### Scenario: Estimate is independently auditable

- **WHEN** an operator reviews the backfill evidence
- **THEN** preserved queries, UTC capture times, raw aggregate results, source hash, exclusion counts and derivation reconcile to the committed estimate
- **AND** the estimate excludes automation, same-site navigation and unconfirmed prefetched page views without storing client IPs or request correlation identifiers.
