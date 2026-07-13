## ADDED Requirements

### Requirement: Distro format navigation mirrors populated browse groups

The Distro route SHALL render one server-derived format navigation whose links, order, counts, and targets come from the same populated browse groups as the catalog sections.

#### Scenario: Populated groups are available

- **WHEN** the Distro route renders its catalog
- **THEN** one navigation landmark named by the visible `Browse formats` label appears after the intro and search control and before the catalog groups
- **AND** it contains exactly one link for each populated derived browse group in the same order
- **AND** every link displays and exposes its group name and current record count
- **AND** empty groups produce neither a link nor a section

#### Scenario: Navigation link targets a group

- **WHEN** a visitor activates a format link
- **THEN** its fragment and app-shell target identify the same unique heading used by that group's labelled section
- **AND** no category route, tab state, filter state, or separate taxonomy is created

#### Scenario: Catalog membership changes

- **WHEN** accepted records enter, leave, or move between populated browse groups
- **THEN** navigation counts and links follow the resulting server-derived group list without authored navigation data

### Requirement: Distro format navigation remains progressive and search-safe

The Distro format navigation MUST remain usable without client JavaScript and MUST NOT expose stale navigation while client-side Distro search is active.

#### Scenario: Client JavaScript is unavailable

- **WHEN** the Distro route loads without the app shell or search control
- **THEN** every format link remains a native fragment link to its rendered group heading
- **AND** the complete server-rendered catalog remains available

#### Scenario: Distro search query is active

- **WHEN** the normalized Distro search query is non-empty
- **THEN** the whole format navigation is hidden from presentation and keyboard focus
- **AND** no filtered count or per-link visibility model is maintained

#### Scenario: Distro search clears or disconnects

- **WHEN** the query is cleared or the Distro search control cleans up on route exit
- **THEN** the server-rendered format navigation is restored without recreating or reordering it

#### Scenario: Visitor uses the keyboard

- **WHEN** a visitor tabs to and activates a visible format link
- **THEN** the link uses ordinary anchor semantics and reaches its matching group target
- **AND** no carousel, scroll button, or custom keyboard interaction is required
