## ADDED Requirements

### Requirement: Release date research terms are canonical

The system SHALL use consistent terminology for release-date research across specs, tools, tests, reports, docs, and handoff notes.

#### Scenario: Actual Release Date is named

- **WHEN** an artifact describes the date a release or catalog item publicly became released
- **THEN** it uses `Actual Release Date`
- **AND** it does not use that term for upload, preorder, announcement, store availability, repress, or reissue dates unless the evidence basis confirms that date is the intended release event

#### Scenario: Platform Upload Date is named

- **WHEN** an artifact describes a date from a DSP, auto-generated video page, importer timestamp, or platform-specific availability record
- **THEN** it uses `Platform Upload Date`
- **AND** it does not treat that date as an Actual Release Date without independent release evidence

#### Scenario: Release Date Evidence is named

- **WHEN** an artifact describes source URLs, matched metadata, source tier, basis, precision, confidence, and notes used to support a date
- **THEN** it uses `Release Date Evidence`
- **AND** it keeps that evidence separate from public release summary copy and checkout/catalog authority

#### Scenario: Release Date Confidence is named

- **WHEN** an artifact describes whether a date may be applied automatically or needs review
- **THEN** it uses `Release Date Confidence`
- **AND** it distinguishes high-confidence exact dates from weak, partial, upload-only, or conflicting date candidates
