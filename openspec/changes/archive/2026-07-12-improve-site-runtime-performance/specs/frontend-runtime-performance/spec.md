## ADDED Requirements

### Requirement: Frontend performance evidence is comparable

The system SHALL evaluate frontend runtime performance with route-specific, environment-specific, and reproducible evidence.

#### Scenario: Baseline is captured

- **WHEN** a maintainer records a performance baseline for Home, Store, or Distro
- **THEN** the evidence identifies the commit, URL, Product Environment, build mode, viewport, device-pixel ratio, CPU and network settings, cache state, browser version, run count, and measurement method
- **AND** cold-load evidence reports at least five cache-cleared runs using median and p75
- **AND** settled-scroll evidence reports at least three equivalent traces using median, p95, maximum, and long-task count.

#### Scenario: Before and after evidence is compared

- **WHEN** a performance slice is evaluated
- **THEN** its before and after measurements use the same declared profile
- **AND** evidence from different routes, cache states, devices, or Product Environments is not combined into one improvement claim.

### Requirement: Field Core Web Vitals use good thresholds

The system SHALL use the standard good Core Web Vitals thresholds when representative field data exists.

#### Scenario: Representative field data is available

- **GIVEN** a privacy-approved provider has a sufficient rolling field sample for the deployed origin
- **WHEN** frontend performance is reviewed
- **THEN** p75 LCP is no more than 2.5 seconds
- **AND** p75 INP is no more than 200 milliseconds
- **AND** p75 CLS is no more than 0.1
- **AND** mobile and desktop plus route classes are reported separately where the provider supports those dimensions.

#### Scenario: Field data is unavailable or undersampled

- **WHEN** the deployed origin lacks a representative field sample
- **THEN** the report labels field status as unavailable or low-confidence
- **AND** it does not infer a field pass from lab data
- **AND** the fixed lab and browser gates remain required.

### Requirement: Representative routes meet load and scroll budgets

The system MUST keep Home, Store, and Distro within declared load and settled-scroll budgets.

#### Scenario: Fixed-profile route loads are measured

- **WHEN** the declared cold-load profile runs
- **THEN** Home LCP is no more than 2.0 seconds
- **AND** Store and Distro LCP are each no more than 2.5 seconds
- **AND** CLS is no more than 0.1 on every representative route.

#### Scenario: Narrow CPU-stressed scrolling is measured

- **GIVEN** the representative route is settled at the declared narrow viewport with 4x CPU throttling
- **WHEN** the same scroll segment is traced at least three times
- **THEN** application-attributable main-thread plus paint work has a p95 no greater than 8 milliseconds per frame
- **AND** no repeatable application-attributable main-thread or paint slice exceeds 16.7 milliseconds
- **AND** no repeatable application-attributable long task reaches 50 milliseconds.

#### Scenario: A budget is missed

- **WHEN** a representative route misses a load or scroll budget
- **THEN** the evidence identifies the responsible main-thread, style, layout, paint, raster, network, or hydration work before another optimization is selected
- **AND** an unrelated visual or architectural rewrite is not accepted as the diagnosis.

### Requirement: Long catalog pages skip offscreen rendering

The system SHALL use native browser containment to avoid rendering offscreen Store and Distro content while retaining the complete document.

#### Scenario: Long catalog initially renders

- **WHEN** Store or Distro contains content beyond the viewport
- **THEN** bounded groups or chunks use `content-visibility: auto` or an equivalent native offscreen-rendering mechanism
- **AND** tested intrinsic-size estimates reserve space for skipped content
- **AND** the full catalog remains present in the document without client-side list virtualization.

#### Scenario: Shopper scrolls through contained content

- **WHEN** a skipped Store or Distro group approaches the viewport
- **THEN** its content renders without a visible scrollbar jump, overlapping content, broken responsive image loading, or horizontal overflow
- **AND** keyboard order, find-in-page, accessibility-tree access, and shell scroll reset remain correct.

#### Scenario: Native containment meets the route budget

- **WHEN** Store and Distro pass the declared scroll gate with native containment
- **THEN** list virtualization, pagination, and infinite scrolling are not added for performance reasons.

### Requirement: Critical font delivery is bounded and glyph-safe

The system SHALL reduce critical brand-font cost without losing licensed glyph coverage or causing a font-driven long task.

#### Scenario: Brand font can be legally subset

- **GIVEN** the font license permits modification and subsetting
- **WHEN** the critical WOFF2 is produced
- **THEN** it covers the declared fixed UI and repository-content corpus plus required Greek and Latin Extended fixtures
- **AND** automated coverage verification fails when a required glyph is absent
- **AND** the transferred critical brand-font file is no more than 160 KiB.

#### Scenario: Brand font cannot be legally or safely subset

- **WHEN** license or glyph inspection cannot prove that a subset is permitted and complete
- **THEN** the original font file is not modified
- **AND** implementation narrows font usage or preload scope instead of shipping an unverified derivative
- **AND** the unresolved byte budget is reported with the blocking evidence.

#### Scenario: Font loading is profiled

- **WHEN** the final critical font path is traced with the declared 4x-CPU profile
- **THEN** it produces no repeatable font-triggered task of 50 milliseconds or longer
- **AND** font preload remains only when a before/after comparison shows that it improves LCP without delaying the primary image.

### Requirement: Performance escalation is evidence-gated

The system SHALL stop at the smallest change that meets the applicable performance gate.

#### Scenario: A performance slice passes

- **WHEN** the current slice meets its behavior and performance acceptance criteria
- **THEN** its conditional fallback is recorded as not needed
- **AND** implementation proceeds to the next independent slice without adding speculative infrastructure.

#### Scenario: A simple slice remains insufficient

- **WHEN** visibility deferral, native containment, direct dynamic imports, or static asset optimization misses its declared gate
- **THEN** the trace identifies the remaining bottleneck
- **AND** any batch API, virtualization, partial-document routing, custom telemetry backend, media service, or broad blur removal requires updated OpenSpec design and requirements before implementation.
