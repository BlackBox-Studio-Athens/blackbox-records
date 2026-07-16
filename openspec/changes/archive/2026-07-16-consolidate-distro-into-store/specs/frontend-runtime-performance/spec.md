## MODIFIED Requirements

### Requirement: Frontend performance evidence is comparable

The system SHALL evaluate frontend runtime performance with route-specific, environment-specific, and reproducible evidence.

#### Scenario: Baseline is captured

- **WHEN** a maintainer records a performance baseline for Home, Store All, or Store Distro
- **THEN** the evidence identifies the commit, URL, Product Environment, build mode, viewport, device-pixel ratio, CPU and network settings, cache state, browser version, run count, and measurement method
- **AND** cold-load evidence reports at least five cache-cleared runs using median and p75
- **AND** settled-scroll evidence reports at least three equivalent traces using median, p95, maximum, and long-task count.

#### Scenario: Before and after evidence is compared

- **WHEN** a performance slice is evaluated
- **THEN** its before and after measurements use the same declared profile
- **AND** evidence from different routes, Store Categories, cache states, devices, or Product Environments is not combined into one improvement claim.

### Requirement: Representative routes meet load and scroll budgets

The system MUST keep primary and secondary public route classes within declared load, first-traversal, and repeat-traversal budgets after standalone Distro moves to the Store Distro category.

#### Scenario: Fixed-profile route loads are measured

- **WHEN** the declared cold-load profile runs
- **THEN** Home LCP is no more than 2.0 seconds
- **AND** Store All and Store Distro LCP are each no more than 2.5 seconds
- **AND** CLS is no more than 0.1 on every representative route.

#### Scenario: Narrow CPU-stressed scrolling is measured

- **GIVEN** the representative route is settled at the declared narrow viewport with 4x CPU throttling
- **WHEN** the same scroll segment is traced at least three times
- **THEN** application-attributable main-thread plus paint work has a p95 no greater than 8 milliseconds per frame
- **AND** no repeatable application-attributable main-thread or paint slice exceeds 16.7 milliseconds
- **AND** no repeatable application-attributable long task reaches 50 milliseconds.

#### Scenario: Fixed desktop route loads are measured

- **WHEN** the declared 1440×900 DPR-1 cache-cleared production profile runs at least five times
- **THEN** Home LCP is no more than 2.0 seconds
- **AND** Store All, Store Distro, Artists, Services, About, Releases, and News LCP are each no more than 2.5 seconds
- **AND** CLS is no more than 0.1 on every measured route
- **AND** median and p75 values are reported without discarding a valid slow run.

#### Scenario: Mobile stress route loads are measured

- **GIVEN** the declared 390×844 DPR-2 profile uses 4× CPU, 150 ms round-trip latency, 1.6 Mbps download, and a cleared cache
- **WHEN** Home, Store All, Store Distro, Artists, Services, and About run at least three times
- **THEN** each route's LCP is no more than 2.5 seconds
- **AND** CLS is no more than 0.1
- **AND** font, image, JavaScript, request, and long-task outliers remain represented in the report.

#### Scenario: First and repeat CPU-stressed scrolling are measured

- **GIVEN** the declared wide or mobile route profile is settled before user traversal and uses 4× CPU throttling
- **WHEN** the same fixed segment and input cadence are captured at least three times for first traversal and at least three times for repeat traversal
- **THEN** first traversal is reported separately and is never discarded as warm-up
- **AND** application-attributable main-thread plus style, layout, and paint work has a p95 no greater than 8 milliseconds per frame
- **AND** frame interval p95 is no greater than 16.7 milliseconds unless a same-profile low-work control proves a higher runner cadence floor, in which case it is no greater than that control plus 0.5 milliseconds
- **AND** no application-attributable main-thread or rendering slice exceeds 16.7 milliseconds
- **AND** no application-attributable task or long animation frame reaches 50 milliseconds.

#### Scenario: The runner cadence is slower than the declared frame budget

- **GIVEN** a same-profile low-work control has sub-8-millisecond application-work p95, no application-attributable task or long animation frame of 50 milliseconds or more, and a frame-interval p95 above 16.7 milliseconds
- **WHEN** a Store All or Store Distro route is evaluated with the same browser, viewport, CPU setting, network state, cadence, and trace aggregation
- **THEN** the route may use the control p95 plus 0.5 milliseconds as its frame-interval ceiling
- **AND** that calibration does not relax the application-work, rendering-slice, long-task, load, CLS, or rendered-UX gates
- **AND** the report retains both the control and route values rather than describing the route as an unconditional 60 Hz pass.

#### Scenario: A budget is missed

- **WHEN** a representative route misses a load or scroll budget
- **THEN** the evidence identifies the responsible main-thread, style, layout, paint, raster, network, font, animation, or hydration work before another optimization is selected
- **AND** an unrelated visual or architectural rewrite is not accepted as the diagnosis.

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
