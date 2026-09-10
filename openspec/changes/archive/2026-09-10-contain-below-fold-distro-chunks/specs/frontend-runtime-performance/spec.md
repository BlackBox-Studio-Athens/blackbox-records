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
- **AND** below-fold chunks use a measured rendering strategy for their actual preview, expanded catalog, or fallback state
- **AND** containment is not required on wrappers that generate no layout box
- **AND** group headers, format navigation, and search structure remain outside card containment; cards may use layout and inline-size containment without block-size or paint containment
- **AND** every card remains server-rendered in canonical source order.

#### Scenario: Store rendering modes are measured

- **WHEN** a Store rendering change is evaluated
- **THEN** Store All and Store Distro settled preview and expanded catalog first and repeat traversal are measured separately at the declared wide and mobile profiles
- **AND** evidence identifies the implementation tree, browser version, group modes, card counts, and scroll extent
- **AND** a failed enhancement setup is not silently counted as preview acceptance
- **AND** raw traces for failing traversals remain available to attribute individual rendering slices and tasks
- **AND** windowed work summaries do not replace individual-slice, long-task, or long-animation-frame gates
- **AND** native animation-frame timestamps and callback-dispatch intervals are recorded separately, with a rendering interval for the final scroll input
- **AND** search, later-group selection, reduced motion, and enhancement-disabled fallback preserve complete content and accessible navigation.

#### Scenario: Store preserves prepared catalog layout

- **WHEN** an enhanced Store collection shows a Coverflow preview
- **THEN** non-preview cards may remain invisibly laid out in their canonical grids at catalog width
- **AND** only positioned preview cards are visible and keyboard-accessible in that preview
- **AND** catalog, search, reduced-motion, and enhancement-disabled views retain complete content without estimated-height corridors
- **AND** Store listing and Distro card titles may use the existing UI display font while page/group headings retain the brand font and original font assets remain unchanged
- **AND** optional Google font display prevents an unbounded late font replacement.

#### Scenario: Distro disclosure separates rendering phases

- **WHEN** View all changes the group to catalog mode
- **THEN** catalog state and expanded accessibility state apply synchronously
- **AND** the existing controller may resolve styles before allowing a complete rendering frame ahead of focus
- **AND** search, format selection, cleanup, or navigation cancels obsolete deferred focus
- **AND** the existing disclosure visual-completion and long-task budgets still apply.

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

#### Scenario: September 2026 catalog residual is explicitly accepted

- **GIVEN** the final `contain-below-fold-distro-chunks` implementation has passing functional, load, and request checks
- **WHEN** its explicitly approved acceptance is recorded
- **THEN** the 51 ms mobile disclosure task, instrumented 51–77 ms tasks, and inconclusive attribution of occasional wide traversal spans remain documented as change-specific exceptions
- **AND** closure does not relabel those measurements as numerical passes or relax the default budgets for subsequent changes.
