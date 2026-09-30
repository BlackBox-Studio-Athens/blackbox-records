## ADDED Requirements

### Requirement: Local end-to-end harness is deterministic and opt-in

The repository SHALL provide `pnpm test:e2e`, which runs Playwright specs against the canonical Local site URL. These specs SHALL be the required check for shell navigation, overlay, player, mobile-navigation and cart continuity. The harness SHALL reuse a site already serving the canonical port and otherwise SHALL start the foreground static-site launcher for the run and stop it afterwards. It SHALL NOT start the Local stack, run inside `pnpm validate`, or depend on external network or Worker responses. Specs SHALL fail on console or page errors, and evidence SHALL be written under `.codex-artifacts/e2e/`.

#### Scenario: A site already serves the canonical port

- **GIVEN** background Astro or the full Local stack serves `http://127.0.0.1:4321/blackbox-records/`
- **WHEN** an agent runs `pnpm test:e2e`
- **THEN** the harness reuses that server and leaves it running afterwards.

#### Scenario: Nothing serves the canonical port

- **WHEN** an agent runs `pnpm test:e2e` with port 4321 free
- **THEN** the harness starts `pnpm site:dev` for the run
- **AND** the port is free again after the run.

#### Scenario: An agent verifies the feature under work

- **WHEN** an agent runs `pnpm test:e2e` with a spec path or title filter
- **THEN** only the selected specs run.

#### Scenario: A page logs an error

- **WHEN** a page under test logs a console error or throws an uncaught error
- **THEN** that test fails and names the message
- **AND** a trace, screenshot and error context are retained under `.codex-artifacts/e2e/test-results/`.

## MODIFIED Requirements

### Requirement: Rendered performance validation uses Browser Use

The validation workflow SHALL use Browser Use as the authority for rendered performance behavior, accessibility, and visual correctness.

#### Scenario: Performance-affecting frontend slice is validated

- **WHEN** catalog rendering, Store hydration, font/image delivery, shell code splitting, or animation lifetime changes
- **THEN** Browser Use checks representative mobile and desktop routes, first and repeat traversal, focus and keyboard behavior, shell navigation, console cleanliness, and visible layout stability
- **AND** font fallback/cached states plus About, Services, and Artists first-viewport media are visually checked when those assets change
- **AND** `pnpm test:e2e` passes, including the mobile project, when app-shell imports change.

#### Scenario: First traversal is accepted

- **WHEN** Store All or Store Distro rendering behavior changes
- **THEN** Browser Use performs wheel or touch-like traversal before any warm-up pass
- **AND** the page shows no blank corridor, late card pop, scrollbar jump, overlap, overflow, focus-order defect, or visible input stall
- **AND** a repeat traversal remains visually stable.

#### Scenario: Browser Use cannot expose trace metrics

- **WHEN** CPU throttling, frame intervals, paint slices, raster work, or browser-trace categories required by the acceptance gate are unavailable through Browser Use
- **THEN** validation records that specific capability limitation or classified tool failure
- **AND** Chrome performance tracing may supply only the unavailable trace evidence
- **AND** Browser Use still supplies rendered behavior acceptance.
