## ADDED Requirements

### Requirement: Frontend runtime performance profiles are repeatable

The validation workflow SHALL provide a documented, repeatable profile for Home, Store, and Distro load and scroll behavior.

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

#### Scenario: Evidence is stored

- **WHEN** a performance slice is accepted or rejected
- **THEN** its raw evidence and a concise before/after report are stored under `.codex-artifacts/runtime-performance/<commit-or-run>/` or a documented equivalent
- **AND** the report names any excluded browser startup, extension, tooling, or unrelated network noise.

### Requirement: Rendered performance validation uses Browser Use

The validation workflow SHALL use Browser Use as the authority for rendered performance behavior and visual correctness.

#### Scenario: Performance-affecting frontend slice is validated

- **WHEN** hero effects, Store hydration, catalog containment, font/image delivery, or shell code splitting changes
- **THEN** Browser Use checks representative mobile and desktop routes, first and scrolled viewports, focus and keyboard behavior, shell navigation, console cleanliness, and visible layout stability
- **AND** player and overlay continuity are checked when app-shell imports or layered effects change.

#### Scenario: Browser Use cannot expose trace metrics

- **WHEN** CPU throttling, paint slices, raster work, or browser-trace categories required by the acceptance gate are unavailable through Browser Use
- **THEN** validation records that specific capability limitation
- **AND** Chrome DevTools profiling may supply only the unavailable trace evidence
- **AND** Browser Use still supplies rendered behavior acceptance.

### Requirement: Store performance validation is bounded and authority-safe

The validation workflow MUST verify Store request behavior without weakening or mutating commerce authority.

#### Scenario: Disabled Product Environment is profiled

- **WHEN** Store loads against a Worker capability response with native checkout disabled
- **THEN** evidence shows one deduplicated capability read, zero Store Offer reads, and zero Store-related 5xx responses before a later explicit shopper action
- **AND** no checkout, stock, order, webhook, provider, or D1 mutation occurs.

#### Scenario: Enabled Product Environment is profiled

- **WHEN** Store loads against an enabled Local or UAT Worker
- **THEN** initial Store Offer reads are limited to cards inside the declared visibility margin
- **AND** scrolling starts reads only as later cards approach
- **AND** every price remains Worker-confirmed or fail-closed.

#### Scenario: Hosted Store diagnostic runs

- **WHEN** the deployed Store Offer failure path is checked
- **THEN** the diagnostic uses a small declared URL and Store Item set
- **AND** it reports status and browser-safe response category without printing secrets or internal payloads
- **AND** it does not load-test, warm caches, create checkout, or mutate provider or D1 state.

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

### Requirement: Standard gates close every performance slice

The validation workflow SHALL apply repository and OpenSpec gates to the exact final tree.

#### Scenario: Behavior-changing performance work is complete

- **WHEN** any implementation slice is ready to claim completion
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass
- **AND** `pnpm assets:check` passes when source assets or asset policy changed
- **AND** Browser Use acceptance and the slice-specific performance gate pass before the next slice starts.

#### Scenario: Whole performance change is complete

- **WHEN** all accepted slices and decision gates are closed
- **THEN** OpenSpec strict validation passes for this change and the full spec set
- **AND** the final report lists before/after values, field-data confidence, skipped conditional fallbacks, and any separately proposed follow-up.
