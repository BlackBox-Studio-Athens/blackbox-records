## MODIFIED Requirements

### Requirement: Long catalog pages skip offscreen rendering

The system SHALL balance initial rendering and first traversal on Store All and Store Distro without requiring one containment strategy for every category route or breakpoint.

#### Scenario: Shopper scrolls through contained content

- **WHEN** a skipped Store All or Store Distro group approaches the viewport
- **THEN** its content renders without a visible scrollbar jump, overlapping content, broken responsive image loading, or horizontal overflow
- **AND** keyboard order, find-in-page, accessibility-tree access, and shell scroll reset remain correct.

#### Scenario: Native containment meets the route budget

- **WHEN** Store All and Store Distro pass the declared scroll gate with native containment
- **THEN** list virtualization, pagination, and infinite scrolling are not added for performance reasons.

#### Scenario: Long catalog initially renders

- **WHEN** `/store/` or `/store/distro/` contains content beyond the viewport
- **THEN** the complete selected server-rendered Store collection remains present in source order
- **AND** any offscreen-rendering boundary uses measured semantic groups or bounded chunks rather than mandatory strict containment on every card
- **AND** intrinsic-size estimates, when used, are measured for the owning route and breakpoint
- **AND** client-side virtualization is not introduced by default.

#### Scenario: Distro initial layout boundary is bounded

- **GIVEN** Store Distro renders multiple six-card chunks across one or more groups
- **WHEN** the initial document is laid out
- **THEN** the first chunk of the first group remains eagerly rendered
- **AND** every non-first chunk and the first chunk of every later group uses native offscreen containment
- **AND** group headers, format navigation, search structure, and individual cards remain outside per-card containment
- **AND** every card remains server-rendered in canonical source order.

#### Scenario: Shopper begins the first traversal

- **WHEN** previously skipped content approaches the declared first-scroll corridor
- **THEN** it is rendered or activated early enough to pass the first-traversal budget
- **AND** an activated group remains rendered until route exit
- **AND** the shopper sees no blank corridor, late card pop, scrollbar jump, overlapping content, broken image loading, horizontal overflow, or input stall
- **AND** keyboard order, find-in-page, accessibility-tree access, and shell scroll reset remain correct.

#### Scenario: Grouped or retained activation misses the route budget

- **WHEN** measured grouped containment or retained ahead-of-viewport activation still misses first or repeat traversal
- **THEN** `content-visibility` is disabled for the failing Store route and breakpoint when the declared load and interaction budgets remain passing
- **AND** first-scroll quality is not sacrificed solely to preserve an initial-layout optimization.

#### Scenario: Native and eager strategies both miss

- **WHEN** neither measured containment nor eager rendering can satisfy both load and traversal budgets
- **THEN** implementation stops and records the residual trace
- **AND** pagination, virtualization, infinite scrolling, or node recycling requires an amended OpenSpec design with accessibility and shell-navigation acceptance before implementation.

#### Scenario: Approved Store rendering rungs are exhausted

- **GIVEN** grouped containment, retained activation, and eager rendering have been measured against the same Store All or Store Distro route
- **WHEN** no rung passes both load and application-attributable traversal gates
- **THEN** the existing Store renderer remains authoritative and the residual is recorded as non-passing
- **AND** the report names the rejected evidence, the unchanged commerce/request boundary, and this post-consolidation Store route remeasurement before any future bounded remedy
- **AND** the residual does not authorize pagination, virtualization, infinite scrolling, node recycling, batch Store Offer reads, static price authority, or a passing performance claim.
