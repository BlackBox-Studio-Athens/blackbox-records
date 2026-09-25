## ADDED Requirements

### Requirement: Standard public builds enforce the eager JavaScript budget

The standard public web build SHALL run the existing route-specific eager JavaScript checker against its freshly built output and retain the current budgets.

#### Scenario: Home remains within its eager budget

- **WHEN** `build:web` completes the Astro build and route-isolation check
- **THEN** it runs the default `performance:bundles` check against that build
- **AND** Home's first-party eager JavaScript graph is no more than 97,280 Brotli bytes.

#### Scenario: A route exceeds its eager budget

- **WHEN** the fresh public output exceeds an existing route budget
- **THEN** the standard `build:web` command exits nonzero with the route-specific checker diagnostic
- **AND** the budget is not raised to turn the result into a pass.

### Requirement: Public prose preserves safe links and rich formatting without eager schema initialization

The public browser renderer SHALL preserve supported prose formatting and SHALL create anchors only for values accepted by the same safe-link policy used by content-model validation. CMS and content trust boundaries SHALL continue to validate prose with the existing Zod schemas. The eager Home graph SHALL not load those schemas solely to render public prose.

#### Scenario: Valid and invalid prose links render

- **WHEN** public rich prose contains a safe link, an unsafe URL, or a non-string link value
- **THEN** a safe URL renders as a link with the existing target and rel behavior
- **AND** unsafe or non-string values render their text without an anchor
- **AND** the CMS/content validation schema continues to reject invalid values.

#### Scenario: Public prose uses supported formatting

- **WHEN** public rich prose contains emphasis, lists, aligned blocks, or grouped quotations
- **THEN** the renderer preserves that formatting and its legacy plain-text fallback
- **AND** absent native prose and an explicitly empty rich-text value retain their existing precedence.
