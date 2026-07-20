## ADDED Requirements

### Requirement: Store first-activation evidence is comparable

The system SHALL measure first Store shell activation with fixed, route-specific evidence that separates content, transition, and listing-price settlement.

#### Scenario: Desktop Store activation baseline is captured

- **GIVEN** the current Store All collection contains 104 cards
- **WHEN** the declared 1440×900 DPR-1 desktop profile opens Home and activates Store with browser cache cleared at least five times
- **THEN** every run records click → Store content, click → transition veil closed, and click → prices settled as separate milestones
- **AND** individual, median, and p75 values are retained
- **AND** Store HTML, projection, and per-card Store Offer request timing, count, and status are reported.

#### Scenario: Mobile-stress Store activation baseline is captured

- **GIVEN** the current Store All collection contains 104 cards
- **WHEN** the declared 390×844 DPR-2, 4× CPU, 150 ms round-trip latency, 1.6 Mbps download profile opens Home and activates Store with browser cache cleared at least three times
- **THEN** every run records the same three Store milestones and request breakdown as desktop
- **AND** individual, median, and p75 values are retained without discarding a valid slow run.

#### Scenario: Before and after Store activation evidence is compared

- **WHEN** the concurrent projection slice is evaluated
- **THEN** baseline and post-change runs use the same commit-specific route, Store card count, browser profile, cache state, milestone definitions, and measurement method
- **AND** run order, browser visibility, excluded tooling failures, and unrelated network outliers are disclosed
- **AND** unlike profiles are not combined into one improvement claim.

### Requirement: Store projection concurrency has bounded acceptance

The system SHALL overlap the one listing-price projection read with Store HTML work without weakening request cardinality, Store content timing, transition timing, or commerce authority.

#### Scenario: Uncached Store activation is scheduled concurrently

- **GIVEN** the shell starts an uncached Store collection activation
- **WHEN** it begins the Store HTML request
- **THEN** it also starts the activation's one listing-price projection request before Store content is applied
- **AND** the existing listing presentation consumes that same result after placeholders mount.

#### Scenario: The configured backend origin is prepared without preloading data

- **GIVEN** the static frontend is built with a public backend base URL
- **WHEN** a shopper document is parsed before Store activation
- **THEN** the document head includes DNS-prefetch and anonymous preconnect hints for that backend origin
- **AND** the hints do not fetch the listing endpoint, create a projection result, change `no-store`, or add an API request.

#### Scenario: Concurrent scheduling is accepted

- **WHEN** five desktop and three mobile-stress post-change runs are compared with their fixed-profile baselines and same-commit host plus Worker network p75 remains within 2× across repeated evidence sets
- **THEN** click → prices settled p75 improves by at least 25 percent in each profile
- **AND** click → Store content p75 and click → veil closed p75 do not regress by more than 10 percent in either profile
- **AND** every activation still records exactly one listing-price projection request, zero per-card Store Offer reads for listing prices, and no Store-related request error.

#### Scenario: Hosted variance prevents cross-deployment attribution

- **GIVEN** a repeated five desktop plus three mobile-stress set against the same deployed commit shows Store HTML or listing-projection network p75 changing by more than 2×
- **WHEN** frontend scheduling acceptance is decided
- **THEN** the report retains and discloses the hosted absolute results as shopper-experience evidence
- **AND** the paired serial/concurrent control captured under the same runtime conditions supplies the 25 percent price-settlement and 10 percent content plus veil bounds
- **AND** production structure proves the projection starts before Store content and the current presentation consumes that same request.

#### Scenario: A meaningful mobile residual remains after concurrency

- **GIVEN** post-concurrency mobile-stress click → Store content p75 remains greater than 750 milliseconds
- **WHEN** the Store activation implementation is completed
- **THEN** the shell includes one shared loading status delayed until 750 milliseconds
- **AND** desktop or cached activations that finish sooner do not flash that status.

#### Scenario: The 104-card DOM remains a material residual

- **WHEN** post-change evidence attributes a remaining Store activation cost to decoding, parsing, or applying the complete 104-card document
- **THEN** the report records Store HTML network time separately from response → Store content time
- **AND** this change retains the complete server-rendered Store collection
- **AND** pagination, virtualization, infinite scrolling, or node recycling requires an explicit amended OpenSpec design before implementation.

#### Scenario: Projection concurrency misses its acceptance gate

- **WHEN** comparable absolute evidence or the allowed paired control does not improve price settlement by the declared amount, content or veil timing regresses beyond the declared bound, request cardinality changes, or checkout authority coverage fails
- **THEN** the change is not accepted
- **AND** evidence identifies request scheduling, network contention, DOM application, transition timing, or measurement invalidity before another remedy is proposed.
