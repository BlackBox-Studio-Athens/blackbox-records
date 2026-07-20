## ADDED Requirements

### Requirement: Store activation timing profile is repeatable

The validation workflow SHALL extend the existing frontend runtime-performance runner with one repeatable same-document Store activation scenario.

#### Scenario: Store activation profile runs

- **WHEN** a maintainer runs the Store activation scenario
- **THEN** the existing runner opens Home in a fresh context or equivalent cache-cleared state and activates Store through the persistent shell
- **AND** it records click → Store content, click → veil closed, click → prices settled, request starts and responses, card and settled-price counts, request errors, browser visibility, and browser version
- **AND** it supports the declared five-run desktop and three-run mobile-stress profiles without a new measurement dependency.

#### Scenario: Store activation evidence is stored

- **WHEN** a baseline or post-change Store activation set completes
- **THEN** raw individual runs and a median/p75 summary are stored under `.codex-artifacts/runtime-performance/<commit-or-run>/` or a documented equivalent
- **AND** the report identifies commit, URL, Product Environment, Store card count, profile, cache state, measurement method, run order, and any excluded invalid run.

#### Scenario: Browser timing is invalidated by background throttling

- **GIVEN** the runner observes hidden-page state, delayed activation request start, or another classified timing-tool failure
- **WHEN** a run cannot represent foreground shopper navigation
- **THEN** the run is rejected and its reason is recorded
- **AND** Browser Use remains the authority for rendered correctness while Chrome tracing supplies only unavailable timing evidence.

## MODIFIED Requirements

### Requirement: Store performance validation is bounded and authority-safe

The validation workflow MUST verify Store request behavior without weakening or mutating commerce authority.

#### Scenario: Disabled Product Environment is profiled

- **WHEN** a Store collection activates against a Worker capability response with native checkout disabled
- **THEN** evidence shows at most one deduplicated capability read, exactly one listing-price projection read, zero per-card Store Offer reads, and zero Store-related 5xx responses before a later explicit shopper action
- **AND** no checkout, stock, order, webhook, provider, or D1 mutation occurs.

#### Scenario: Enabled Product Environment is profiled

- **WHEN** a Store collection activates against an enabled Local or UAT Worker
- **THEN** evidence shows exactly one listing-price projection read for the activation and zero per-card Store Offer reads solely for collection prices
- **AND** every displayed price remains Worker-confirmed or fail-closed
- **AND** checkout performs its independent current availability, stock, product-projection, and catalog-price validation.

#### Scenario: Concurrent Store activation is profiled

- **GIVEN** the shell prepares listing prices while Store HTML is fetched or a cached snapshot is applied
- **WHEN** request timing is captured
- **THEN** the projection starts before Store content is applied
- **AND** the presentation consumer reuses that request instead of creating a second projection read
- **AND** a superseded activation's result is not reused by a later Store activation.

#### Scenario: Hosted Store diagnostic runs

- **WHEN** the deployed Store listing projection or failure path is checked
- **THEN** the diagnostic uses a small declared URL and read-only request set
- **AND** it reports status and browser-safe response category without printing secrets or internal payloads
- **AND** it does not load-test, warm caches deliberately, create checkout, or mutate provider or D1 state.

### Requirement: Performance slices have focused regression coverage

The validation workflow SHALL keep the smallest automated checks that fail when an accepted performance behavior regresses.

#### Scenario: Hero slice is complete

- **WHEN** hero runtime effects change
- **THEN** focused checks prove that infinite hero effect animation, runtime image filtering, animated grain/blend work, and off-home hero scroll synchronization are absent
- **AND** the existing coarse threshold and reduced-motion behaviors remain covered.

#### Scenario: Store slice is complete

- **WHEN** Store listing presentation scheduling changes
- **THEN** focused checks prove one projection request per direct, uncached, cached, prefetched, or history-restored collection activation; prepared-promise reuse; same-route deduplication; cancellation isolation; explicit unavailable copy; and zero per-card Store Offer reads for listing prices
- **AND** detail and checkout price authority tests remain passing.

#### Scenario: Asset and shell slices are complete

- **WHEN** font, image, brand asset, or app-shell imports change
- **THEN** build-output checks record the selected hero and logo budgets, critical font size/coverage, fingerprinted URLs, and initial app-shell Brotli closure
- **AND** existing image markup, cache policy, navigation, overlay, player, and loading-feedback checks remain passing.

#### Scenario: Catalog rendering slice is complete

- **WHEN** Store All or Store Distro containment and activation changes
- **THEN** focused checks cover route/breakpoint selectors, removal of harmful per-card strict containment, retained activation lifetime when present, and full server HTML/source order
- **AND** Store checks prove rendering activation retains one collection projection read and does not add per-card Store Offer reads
- **AND** accessibility, image-loading, and shell-scroll behavior remain covered at the smallest useful level.

#### Scenario: Store request behavior is complete

- **WHEN** a Store collection listing's rendering or presentation scheduling changes
- **THEN** focused checks prove capability-read deduplication where applicable, exactly one listing projection per activation, no same-cycle automatic retry, stable loading/unavailable copy, no result reuse across activations, and zero per-card Store Offer reads for collection prices
- **AND** detail and checkout price authority tests remain passing.

#### Scenario: Font and image slices are complete

- **WHEN** font or secondary-route image delivery changes
- **THEN** build-output checks prove Veneer byte/hash parity, optional display, fingerprinted main-site URL, immutable cache coverage, stable Holding Page closure, selected image width/byte budgets, and first-viewport priority cardinality
- **AND** Browser Use covers fallback and cached typography, English and Greek fixtures, mobile/desktop layout, image crop, and layout stability.

#### Scenario: Shell JavaScript and animation slices are complete

- **WHEN** portal imports, StoreCart parsing/event boundaries, Store activation preparation, delayed Store status, or animation selectors change
- **THEN** tests prove active-route portal loading, first-intent success, malformed StoreCart recovery, navigation/focus/scroll behavior, player and overlay continuity, activation-owned timer cleanup, and animation stopped in hidden/closed states
- **AND** build-output checks report scoped shell closure, complete first-party eager graphs by representative route, route-specific chunks, and third-party analytics separately.
