## MODIFIED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

The Distro route SHALL render one server-derived format navigation whose format links, order, counts, and targets come from the same populated browse groups as the catalog sections, plus one utility link back to the Distro page top.

#### Scenario: Populated groups are available

- **WHEN** the Distro route renders its catalog
- **THEN** one navigation landmark named by the visible `Browse formats` label appears after the intro and search control and before the catalog groups
- **AND** it contains exactly one format link for each populated derived browse group in the same order
- **AND** every format link displays and exposes its group name and current record count
- **AND** one separately identified `Top` link targets the Distro intro
- **AND** empty groups produce neither a format link nor a section

#### Scenario: Navigation link targets a group

- **WHEN** a visitor activates a format link
- **THEN** its fragment and app-shell target identify the same unique heading used by that group's labelled section
- **AND** the target heading remains visible below the fixed site header and sticky format navigation
- **AND** no category route, tab state, filter state, or separate taxonomy is created

#### Scenario: Visitor browses a deep group

- **WHEN** the visitor reaches a group far below the Distro intro
- **THEN** the format navigation remains sticky directly below the fixed site header
- **AND** its format links remain horizontally reachable at narrow widths without causing page-level horizontal overflow
- **AND** the `Top` link remains available without an active-section observer, scroll listener, or duplicate navigation

#### Scenario: Visitor returns to the page top

- **WHEN** the visitor activates `Top`
- **THEN** its fragment and app-shell target identify the Distro intro
- **AND** ordinary anchor behavior remains the no-JavaScript fallback

#### Scenario: Catalog membership changes

- **WHEN** accepted records enter, leave, or move between populated browse groups
- **THEN** navigation counts and format links follow the resulting server-derived group list without authored navigation data
