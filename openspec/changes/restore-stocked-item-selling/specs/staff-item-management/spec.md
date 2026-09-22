# Spec Delta

The main specification's EmDash editing, replacement-price, stock-ledger and authorization requirements remain unchanged.

## ADDED Requirements

### Requirement: Existing catalog items support explicit initial pricing

An authorized member SHALL set the first price on an eligible existing withheld variant using its verified EmDash source and reviewed saved revision. Initial pricing SHALL preserve item/source/variant identity, public slug, stock and ledger, reservations, orders, intentional pauses and publication state. It SHALL retain accepted input and recoverable progress before external writes, without invoking new-item creation or opening-stock initialization.

#### Scenario: A stocked imported item receives its first price

- **GIVEN** a retained withheld variant has stock 1 physical / 1 online, a ledger entry and safely absent price authority
- **WHEN** the member confirms valid initial pricing for its saved source and supported physical type
- **THEN** price authority is established on that same variant with inventory/history unchanged
- **AND** it remains withheld until the separate existing activation operation.

#### Scenario: Format or stock has not been recorded

- **WHEN** an otherwise eligible retained item lacks runtime format or a stock record
- **THEN** Distro/Merch uses its validated native group and an unset Release type offers the existing supported physical choices
- **AND** a valid existing type is preserved
- **AND** zero/missing stock does not prevent pricing or cause invented stock.

#### Scenario: Preflight rejects a correctable request

- **WHEN** a new request has invalid money, stale reviewed revisions, incomplete source details or missing required live confirmation
- **THEN** it fails before provider writes or an unresolved operation is created
- **AND** the member can correct and review the input.

#### Scenario: A member resumes interrupted initial pricing

- **WHEN** the initiating authorized member reopens Selling and explicitly resumes its retained operation
- **THEN** the accepted input is available without relying on browser storage
- **AND** recovery reuses the operation's verified Product/Price work, including after provider idempotency retention expires
- **AND** it uses the accepted source revision/presentation even if a newer private draft exists
- **AND** it neither publishes that draft nor creates duplicate provider objects.

#### Scenario: A completed request is repeated

- **WHEN** the same accepted request is repeated after completion, including after later revisions or publication
- **THEN** it returns its completed receipt without repeating provider writes
- **AND** a different actor or payload cannot reuse that operation identity.

#### Scenario: Another request or stock movement overlaps

- **WHEN** initial-price requests compete or stock changes while pricing runs
- **THEN** only one unresolved catalog operation can perform setup
- **AND** the competing request receives a conflict or existing safe status
- **AND** the stock movement is preserved.

### Requirement: Selling explains current readiness and recovery

Selling SHALL show the applicable Set price, Change price or blocked-state action for the selected item. Missing details, unfinished operations and unsafe bindings SHALL have useful guidance. Reading Selling SHALL NOT mutate catalog, provider, inventory or publication state.

#### Scenario: Content has no linked shop item

- **WHEN** a fresh selected-record read confirms the content is unlinked
- **THEN** Selling offers the existing guided setup
- **AND** the existing server guard prevents duplicate setup.

#### Scenario: A retained item is eligible for its first price

- **WHEN** Selling finishes loading
- **THEN** it displays No price set, a blank amount and Set price
- **AND** missing setup is not represented only by a generic administrator error.

#### Scenario: A configured item has an incomplete private draft

- **WHEN** current price authority is valid but unrelated private editorial work is incomplete
- **THEN** Change price remains usable
- **AND** the draft does not replace current provider presentation.

#### Scenario: Details or provider evidence block setup

- **WHEN** required details are missing or a bound provider identity is missing, invalid, foreign or ambiguous
- **THEN** Selling offers the applicable Details or administrator-review guidance
- **AND** it does not infer safe setup from an empty/failed price read or automatically repair legacy bindings.

#### Scenario: Another kind of catalog operation is pending

- **WHEN** new-item setup, replacement pricing or publication is unfinished
- **THEN** Selling retains that operation's existing recovery behavior
- **AND** it does not send it through initial pricing or claim server-restored input that the older operation does not retain.

#### Scenario: Access or provider service fails

- **WHEN** authorization, configuration or provider availability prevents loading
- **THEN** Selling shows the existing safe sign-in, retry or administrator guidance
- **AND** it does not authorize price creation.

### Requirement: The stock-to-selling journey preserves current state and member input

The selected stock record SHALL provide a direct same-item Selling handoff. Selling SHALL load on entry or explicit refresh and refresh the affected summary/publication prerequisites after confirmed completion. While editing, it SHALL preserve entered money and the reviewed baseline until submission or deliberate reset. Existing editorial unsaved-change behavior SHALL be preserved. Submitted operations SHALL remain recoverable; this change does not require unsent price drafts to persist across navigation or reloads.

#### Scenario: Member continues from recorded stock

- **WHEN** a confirmed stock operation is followed by the Selling action
- **THEN** the correct existing item opens without a new search or new-item form
- **AND** returning to Stock shows current quantities.

#### Scenario: Initial pricing completes

- **WHEN** the server confirms completion
- **THEN** Selling shows the confirmed price and refreshes the affected summary/publication prerequisites
- **AND** it does not publish or activate the item
- **AND** incomplete setup shows a prerequisite instead of an unrelated publication failure.

#### Scenario: A price conflict or explicit refresh occurs while editing

- **WHEN** submission finds a changed revision
- **THEN** the entered amount remains visible with conflict guidance and an explicit Refresh/review action
- **AND** the form does not silently adopt a newer revision
- **AND** a refresh that discards unsaved values requires confirmation.

#### Scenario: A late read or failed refresh follows navigation or success

- **WHEN** a read completes for a previously selected item or fails after a confirmed mutation
- **THEN** it cannot overwrite the current item or imply the mutation failed
- **AND** a failed post-success read offers Refresh rather than another save.

#### Scenario: Member uses a narrow screen or keyboard

- **WHEN** Selling is used at 320 CSS pixels or entirely with a keyboard
- **THEN** inputs and actions remain usable with labels, error associations, visible focus and announced feedback
- **AND** existing 44-pixel primary touch targets are preserved.
