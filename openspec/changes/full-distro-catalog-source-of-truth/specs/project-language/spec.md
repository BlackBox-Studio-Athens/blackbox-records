## ADDED Requirements

### Requirement: Distro inventory source terms

The system SHALL use canonical language for the full distro catalog source-of-truth workflow.

#### Scenario: Distro Inventory Source is named

- **WHEN** specs, docs, tasks, implementation, validation output, or handoff notes describe the full operator-maintained distro table
- **THEN** they use `Distro Inventory Source`
- **AND** they treat it as the primary source for distro membership, source price values, item type, and supplied release dates.

#### Scenario: Current-site extras are named

- **WHEN** specs, docs, tasks, implementation, validation output, or handoff notes describe current distro items retained even though they are absent from the Distro Inventory Source
- **THEN** they use `Current-Site Extras`
- **AND** the approved Current-Site Extras for this catalog slice are `S/T - Spinners` and `Three Way Plane - Wreckquiem`.

#### Scenario: ΕΣ price marker is named

- **WHEN** specs, docs, tasks, implementation, validation output, or handoff notes describe an `ΕΣ` source price
- **THEN** they treat `ΕΣ` as the canonical marker for a pay-what-you-want price
- **AND** they do not translate it into a fixed amount.

#### Scenario: Pay-what-you-want price is named

- **WHEN** specs, docs, tasks, implementation, validation output, or handoff notes describe a shopper-entered amount collected by hosted Stripe Checkout
- **THEN** they use `pay-what-you-want price`
- **AND** they distinguish it from a fixed price with a known `amountMinor`.

### Requirement: Distro source aliases are recorded

The system SHALL preserve explicit source-table spelling differences without creating duplicate Store Items.

#### Scenario: Existing content has corrected spelling

- **GIVEN** a Distro Inventory Source row clearly matches an existing site item with corrected casing, spelling, punctuation, or artist naming
- **WHEN** later implementation reconciles the row
- **THEN** the implementation records the source-table spelling as an alias or source note
- **AND** it does not create a duplicate Store Item only because the source spelling differs.
