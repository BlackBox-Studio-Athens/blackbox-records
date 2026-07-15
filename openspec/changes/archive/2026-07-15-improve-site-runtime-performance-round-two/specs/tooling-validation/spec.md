## MODIFIED Requirements

### Requirement: Frontend runtime performance profiles are repeatable

The validation workflow SHALL provide documented, repeatable load plus first- and repeat-traversal profiles for primary and affected secondary routes.

#### Scenario: Cold-load profile runs

- **WHEN** a maintainer measures a representative route
- **THEN** the run uses the production frontend build and records commit, URL, Product Environment, viewport, device-pixel ratio, CPU and network settings, cache state, browser version, and method
- **AND** it clears the relevant browser cache between at least five cold runs
- **AND** it reports median and p75 TTFB, FCP, LCP, CLS, transfer bytes, resource count, long tasks, and route-specific request errors.

#### Scenario: Settled-scroll profile runs

- **WHEN** Home, Store, or Distro scroll performance is measured
- **THEN** the route is allowed to settle under the declared profile before the same scroll segment is captured at least three times
- **AND** evidence reports median, p95, and maximum main-thread and paint work plus application-attributable tasks of at least 50 milliseconds
- **AND** Store evidence reports price-island hydration, capability reads, Store Offer reads, response statuses, and the time at which the request wave settles.

#### Scenario: Desktop cold-load profile runs

- **WHEN** a maintainer measures Home, Store, Distro, Artists, Services, About, Releases, or News
- **THEN** the run uses the production frontend build and records commit, URL, Product Environment, viewport, device-pixel ratio, CPU and network settings, cache state, browser version, and method
- **AND** it clears the relevant browser cache between at least five 1440×900 DPR-1 runs
- **AND** it reports median and p75 TTFB, FCP, LCP, CLS, transfer bytes, resource count, long tasks, and route-specific request errors.

#### Scenario: Mobile stress profile runs

- **WHEN** Home, Store, Distro, Artists, Services, or About is measured at 390×844 DPR 2 with 4× CPU, 150 ms round-trip latency, and 1.6 Mbps download
- **THEN** the cache is cleared between at least three runs
- **AND** evidence reports median and individual LCP, CLS, long tasks, transferred font/image/JavaScript bytes, and the LCP element
- **AND** a slow valid run is retained rather than treated as warm-up noise.

#### Scenario: First and repeat traversal profiles run

- **WHEN** Home, Store, or Distro scroll performance is measured
- **THEN** wide 1440×900 DPR-1 and affected mobile 390×844 DPR-2 routes use the documented fixed segment, cadence, 4× CPU setting, and warm network state
- **AND** first traversal and repeat traversal are each captured at least three times and reported separately
- **AND** evidence reports frame interval median, p95, and maximum; main-thread plus style/layout/paint median, p95, and maximum; tasks and long animation frames of at least 50 milliseconds; and route-specific rendering activation
- **AND** Store evidence reports price-island hydration, capability reads, Store Offer reads, response statuses, and the time at which its request wave settles.

#### Scenario: Legacy narrow regression profile runs

- **WHEN** Store or Distro is measured against round-one history
- **THEN** the 390×844 DPR-1, 4× CPU, 48 CSS px per animation frame for 240 frames profile remains available
- **AND** p95, maximum, and long-task count are all reported so a low p95 cannot hide tail latency
- **AND** its results are not substituted for realistic wide and mobile first-traversal acceptance.

#### Scenario: Evidence is stored

- **WHEN** a performance slice is accepted or rejected
- **THEN** its raw evidence and a concise before/after report are stored under `.codex-artifacts/runtime-performance/<commit-or-run>/` or a documented equivalent
- **AND** the report names any excluded browser startup, extension, tooling, or unrelated network noise
- **AND** comparisons across unlike routes, environments, devices, cache states, or input profiles are labeled directional or incomparable.

### Requirement: Rendered performance validation uses Browser Use

The validation workflow SHALL use Browser Use as the authority for rendered performance behavior, accessibility, and visual correctness.

#### Scenario: Performance-affecting frontend slice is validated

- **WHEN** catalog rendering, Store hydration, font/image delivery, shell code splitting, or animation lifetime changes
- **THEN** Browser Use checks representative mobile and desktop routes, first and repeat traversal, focus and keyboard behavior, shell navigation, console cleanliness, and visible layout stability
- **AND** font fallback/cached states plus About, Services, and Artists first-viewport media are visually checked when those assets change
- **AND** player, overlay, mobile navigation, and cart continuity are checked when app-shell imports change.

#### Scenario: First traversal is accepted

- **WHEN** Store or Distro rendering behavior changes
- **THEN** Browser Use performs wheel or touch-like traversal before any warm-up pass
- **AND** the page shows no blank corridor, late card pop, scrollbar jump, overlap, overflow, focus-order defect, or visible input stall
- **AND** a repeat traversal remains visually stable.

#### Scenario: Browser Use cannot expose trace metrics

- **WHEN** CPU throttling, frame intervals, paint slices, raster work, or browser-trace categories required by the acceptance gate are unavailable through Browser Use
- **THEN** validation records that specific capability limitation or classified tool failure
- **AND** Chrome performance tracing may supply only the unavailable trace evidence
- **AND** Browser Use still supplies rendered behavior acceptance.

### Requirement: Performance slices have focused regression coverage

The validation workflow SHALL keep the smallest automated checks that fail when an accepted performance behavior regresses.

#### Scenario: Hero slice is complete

- **WHEN** hero runtime effects change
- **THEN** focused checks prove that infinite hero effect animation, runtime image filtering, animated grain/blend work, and off-home hero scroll synchronization are absent
- **AND** the existing coarse threshold and reduced-motion behaviors remain covered.

#### Scenario: Store slice is complete

- **WHEN** Store listing hydration changes
- **THEN** focused checks prove capability-read deduplication, disabled-state short-circuiting, no same-cycle automatic retry, stable loading/unavailable copy, and visible-demand Store Offer reads
- **AND** detail and checkout price authority tests remain passing.

#### Scenario: Asset and shell slices are complete

- **WHEN** font, image, brand asset, or app-shell imports change
- **THEN** build-output checks record the selected hero and logo budgets, critical font size/coverage, fingerprinted URLs, and initial app-shell Brotli closure
- **AND** existing image markup, cache policy, navigation, overlay, player, and loading-feedback checks remain passing.

#### Scenario: Catalog rendering slice is complete

- **WHEN** Store or Distro containment and activation changes
- **THEN** focused checks cover route/breakpoint selectors, removal of harmful per-card strict containment, retained activation lifetime when present, and full server HTML/source order
- **AND** Store checks prove that rendering activation does not hydrate price islands outside their visibility margin
- **AND** accessibility, image-loading, and shell-scroll behavior remain covered at the smallest useful level.

#### Scenario: Store request behavior is complete

- **WHEN** Store listing rendering or hydration changes
- **THEN** focused checks prove capability-read deduplication, disabled-state short-circuiting, zero disabled-environment Store Offer reads, no same-cycle automatic retry, stable loading/unavailable copy, and visible-demand Store Offer reads
- **AND** detail and checkout price authority tests remain passing.

#### Scenario: Font and image slices are complete

- **WHEN** font or secondary-route image delivery changes
- **THEN** build-output checks prove Veneer byte/hash parity, optional display, fingerprinted main-site URL, immutable cache coverage, stable Holding Page closure, selected image width/byte budgets, and first-viewport priority cardinality
- **AND** Browser Use covers fallback and cached typography, English and Greek fixtures, mobile/desktop layout, image crop, and layout stability.

#### Scenario: Shell JavaScript and animation slices are complete

- **WHEN** portal imports, StoreCart parsing/event boundaries, or animation selectors change
- **THEN** tests prove active-route portal loading, first-intent success, malformed StoreCart recovery, navigation/focus/scroll behavior, player and overlay continuity, and animation stopped in hidden/closed states
- **AND** build-output checks report scoped shell closure, complete first-party eager graphs by representative route, route-specific chunks, and third-party analytics separately.

### Requirement: Standard gates close every performance slice

The validation workflow SHALL apply repository, rendered, performance, program-report, and OpenSpec gates to the exact final tree.

#### Scenario: Behavior-changing performance work is complete

- **WHEN** any implementation slice is ready to claim completion
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass
- **AND** `pnpm assets:check` passes when source assets or asset policy changed
- **AND** Browser Use acceptance and the slice-specific performance gate pass before the next slice starts.

#### Scenario: Whole performance change is complete

- **WHEN** all accepted slices and decision gates are closed
- **THEN** OpenSpec strict validation passes for this change and the full spec set
- **AND** the final report lists before/after values, field-data confidence, skipped conditional fallbacks, and any separately proposed follow-up.

#### Scenario: Behavior-changing performance slice is complete

- **WHEN** any implementation slice is ready to claim completion
- **THEN** focused tests, `pnpm test:unit`, `pnpm check`, and `pnpm build` pass
- **AND** `pnpm assets:check` and cache-policy checks pass when source assets, asset paths, or cache identity changed
- **AND** Browser Use acceptance plus the slice's fixed before/after performance gate pass before the next slice starts.

#### Scenario: Whole round-two change is complete

- **WHEN** all accepted slices and documented residual-decision gates are closed
- **THEN** OpenSpec strict validation passes for this change and the full baseline spec set
- **AND** an independent review checks correctness, accessibility, architecture preservation, and evidence-gated scope
- **AND** `PERF-003` lists like-for-like before/after values, first and repeat traversal, field-data confidence, skipped conditional fallbacks, unresolved misses, and any separately proposed follow-up
- **AND** an exhausted Store-rendering residual names its rejected rungs, unchanged implementation and commerce boundary, post-consolidation remeasurement dependency, and non-passing status without being reported as accepted
- **AND** the Site Performance Program ledger and round-two status are updated before this child is archived.
