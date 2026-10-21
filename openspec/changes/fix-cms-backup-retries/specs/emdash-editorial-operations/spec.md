# Spec Delta

## ADDED Requirements

### Requirement: Backup storage retries are bounded and preserve integrity

CMS backup capture SHALL retry recognized transient storage failures within fixed operation and run limits. A retry SHALL obtain a fresh response after a body-read failure and preserve completed capture work. Integrity failures and exhausted limits SHALL remain fatal. Recovery points SHALL retain the existing consistency, checksum, media-reference, privacy and retention guarantees.

#### Scenario: One media body read loses its connection

- **WHEN** a media response body fails with a recognized transient connection error
- **THEN** capture downloads that object again from a fresh response within the retry limits
- **AND** completed media are not downloaded again within that invocation
- **AND** the successful object counts once toward captured objects and bytes
- **AND** the finished point contains the exact database and media bytes with their metadata.

#### Scenario: A storage request or write acknowledgement fails

- **WHEN** a backup list, read, existence check, immutable write or retention delete fails transiently
- **THEN** the failed operation is retried with backoff within the same limits
- **AND** repeated writes use the same key and bytes
- **AND** pagination advances only after a successful page.

#### Scenario: Transient errors persist or recur across many objects

- **WHEN** the per-operation attempt limit or the shared run retry limit is reached
- **THEN** the backup fails with the storage error and stops retrying
- **AND** retry diagnostics contain safe operation names and attempt counts
- **AND** a capture that has not passed its completeness checks does not publish a new point.

#### Scenario: A retry encounters changed or missing media or a budget failure

- **WHEN** a retried object no longer matches its captured inventory, a required object is absent, or a capture guard fails
- **THEN** the existing reference and budget checks still reject an invalid point
- **AND** authentication, quota, malformed data and integrity failures do not trigger automatic retries
- **AND** D1 snapshot execution and restore imports are not automatically replayed.
