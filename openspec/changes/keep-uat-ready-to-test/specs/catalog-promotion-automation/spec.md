## ADDED Requirements

### Requirement: UAT releases stage missing publish-required details

The UAT software release SHALL stage, as private drafts through the CMS content repository, the details a release or distro item needs before it can be published, where they are missing. It SHALL NOT replace an existing value, publish, change an accepted snapshot, or run against PRD.

#### Scenario: A UAT item lacks a publish-required detail

- **WHEN** a release has no catalog number and its slug has a known legacy assignment, or a physical release or distro item has no New or Used condition
- **THEN** the deploy stages that value as a private draft, the catalog number from the legacy assignment and the condition as New
- **AND** staff can publish the item without first entering those details

#### Scenario: A value already exists

- **WHEN** an item already has a catalog number or a New or Used condition
- **THEN** the deploy leaves it unchanged and stages nothing for it

#### Scenario: The step runs again

- **WHEN** the deploy runs after every missing detail has been staged
- **THEN** it stages nothing

#### Scenario: A release cannot be completed automatically

- **WHEN** a release without a number has an unknown slug, or an existing number is invalid
- **THEN** the deploy skips it and reports it
- **AND** the deploy does not fail

#### Scenario: The target is not UAT

- **WHEN** the mode is requested for PRD or without an explicit apply
- **THEN** it is refused for PRD and only plans without an apply
