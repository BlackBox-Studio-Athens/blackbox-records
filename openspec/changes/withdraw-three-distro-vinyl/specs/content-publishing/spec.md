## ADDED Requirements

### Requirement: Reviewed Distro withdrawal

The system SHALL accept an optional publish/withdraw action on existing review and publication contracts, default to publish, and limit withdrawal to Distro. Withdrawal SHALL durably retain exact revisions and the reviewed baseline, pause linked checkout before native unpublish, and remove the selected records and Store Item identities from one validated accepted snapshot. Drafts, media, provider bindings, stock, reservations and orders SHALL be preserved.

#### Scenario: Withdraw a reviewed selection

- **WHEN** an authorized operator withdraws exact Distro entries against the current baseline
- **THEN** their listing/search entries disappear and product/checkout routes return 404 after snapshot acceptance
- **AND** their checkout options remain disabled and operational history remains unchanged

#### Scenario: Concurrent changes

- **WHEN** a selected revision or accepted baseline changes
- **THEN** withdrawal stops and requires a fresh review without publishing unrelated drafts

#### Scenario: Interrupted withdrawal

- **WHEN** native unpublish, renderer verification or public confirmation is interrupted
- **THEN** the same request recovers its exact retained transition without enabling checkout or unpublishing newer edits
- **AND** the previous accepted website remains active until successful candidate activation

#### Scenario: Existing publishing callers

- **WHEN** a publication request omits action
- **THEN** existing publish behavior and retained request compatibility remain unchanged
