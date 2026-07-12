## ADDED Requirements

### Requirement: Store listing offer work follows visible demand

The system SHALL defer Store listing price hydration and Store Offer reads until the corresponding Store Item approaches the viewport.

#### Scenario: Store listing first renders

- **WHEN** Store contains cards below the configured visibility margin
- **THEN** those cards preserve a stable pending price frame in server-rendered HTML
- **AND** their price islands do not hydrate
- **AND** their Store Offer reads do not begin.

#### Scenario: Store Item card approaches the viewport

- **WHEN** a card enters the tested visibility margin
- **THEN** its price island hydrates and resolves the browser-safe capability state
- **AND** an enabled Product Environment reads the fresh Worker Store Offer for that Store Item
- **AND** the label resolves to Worker-confirmed price or the existing fail-closed unavailable state.

#### Scenario: Store Item detail or checkout route loads

- **WHEN** a route has one first-viewport Store Offer price surface
- **THEN** that single surface may hydrate eagerly
- **AND** it continues to treat the Worker Store Offer as price and readiness authority.

### Requirement: Disabled Store capability prevents per-card offer fan-out

The system MUST resolve browser-safe native checkout capability once per Store listing session before starting per-item Store Offer work.

#### Scenario: Native checkout is disabled

- **GIVEN** the Worker capability response reports that native checkout is disabled for the Product Environment
- **WHEN** Store listing price surfaces resolve
- **THEN** the browser reuses one deduplicated capability result
- **AND** no Store Offer read starts for listing cards
- **AND** each price surface shows the existing browser-safe checkout-unavailable state without a static fallback amount.

#### Scenario: Native checkout is enabled

- **GIVEN** the Worker capability response reports that native checkout is enabled
- **WHEN** visible Store Item cards resolve prices
- **THEN** the deduplicated capability result permits fresh Store Offer reads only for those visible cards
- **AND** checkout start still revalidates Store Offer, stock, feature gate, Stripe Price mapping, and Product Environment policy.

#### Scenario: Store listing session ends or capability read fails

- **WHEN** the last Store listing price island unmounts on route exit or the shared capability read rejects
- **THEN** the listing-lifetime capability promise and result are cleared
- **AND** the next Store listing visit or explicit refresh performs a new capability read
- **AND** checkout start never reuses the listing presentation result as authority.

### Requirement: Store listing failures are bounded

The system SHALL prevent one Store Offer failure from becoming a full-list request or retry storm.

#### Scenario: Expected disabled or unready state is handled

- **WHEN** the Worker encounters an expected browser-safe disabled, unavailable, or catalog-readiness state
- **THEN** it returns the established fail-closed capability or Store Offer contract rather than an unhandled 5xx response
- **AND** internal provider, D1, flag, and configuration details remain undisclosed.

#### Scenario: Visible Store Offer read fails

- **WHEN** one visible card receives a network failure or handled non-buyable response
- **THEN** that card shows checkout-unavailable copy
- **AND** the browser does not automatically retry the read during the same mount and visibility cycle
- **AND** below-margin cards remain unfetched.

### Requirement: Store Offer batching is evidence-gated

The system SHALL retain per-visible-item Store Offer reads unless post-deferral evidence proves that they miss the Store performance gate.

#### Scenario: Visibility deferral meets the Store gate

- **WHEN** the enabled Store listing satisfies its request, error, hydration, and scroll budgets after visibility deferral
- **THEN** no batch Store Offer endpoint or collection controller is added.

#### Scenario: Visibility deferral misses the Store gate

- **WHEN** repeatable profiling attributes the remaining miss to per-item Store Offer scheduling or island overhead
- **THEN** the design and commerce requirements are updated before batching is implemented
- **AND** any batch contract remains `no-store`, fail-closed, bounded in item count, browser-safe per item, and subject to checkout-start revalidation.
