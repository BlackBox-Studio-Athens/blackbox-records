## MODIFIED Requirements

### Requirement: Store listing offer work follows visible demand

The system SHALL defer Store listing price hydration and Store Offer reads until the corresponding Store Item approaches the viewport, independently from any earlier rendering or containment activation.

#### Scenario: Store listing first renders

- **WHEN** Store contains cards below the configured price-island visibility margin
- **THEN** those cards preserve a stable pending price frame in server-rendered HTML
- **AND** their price islands do not hydrate
- **AND** their Store Offer reads do not begin.

#### Scenario: Store rendering corridor is primed

- **GIVEN** first-scroll performance activates, pre-renders, or removes containment from Store cards ahead of the shopper
- **WHEN** a primed card remains outside the tested price-island visibility margin
- **THEN** visual rendering work does not count as Store Offer intent
- **AND** its price island remains unhydrated
- **AND** it starts no capability or Store Offer request by itself.

#### Scenario: Store Item card approaches the viewport

- **WHEN** a card enters the tested price-island visibility margin
- **THEN** its price island hydrates and resolves the browser-safe capability state
- **AND** an enabled Product Environment reads the fresh Worker Store Offer for that Store Item
- **AND** the label resolves to Worker-confirmed price or the existing fail-closed unavailable state.

#### Scenario: Native checkout remains disabled

- **GIVEN** rendering activation changes the Store first-scroll path
- **WHEN** the Worker capability response reports native checkout disabled
- **THEN** the listing still issues exactly one deduplicated capability read
- **AND** it issues zero Store Offer reads and zero Store-related 5xx responses before later explicit shopper intent changes
- **AND** card rendering never introduces a static fallback amount.

#### Scenario: Store Item detail or checkout route loads

- **WHEN** a route has one first-viewport Store Offer price surface
- **THEN** that single surface may hydrate eagerly
- **AND** it continues to treat the Worker Store Offer as price and readiness authority.
