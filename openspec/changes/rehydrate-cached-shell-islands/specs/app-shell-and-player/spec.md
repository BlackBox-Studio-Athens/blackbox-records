## ADDED Requirements

### Requirement: Cached shell pages rehydrate their islands

The system SHALL restore a cached shell page's framework islands with their server markup and hydration marker, so they hydrate again instead of returning inert or with markup from an earlier visit.

#### Scenario: Shopper returns to a cached page with an island

- **GIVEN** a shell section page holds a hydrated island, such as the newsletter form on Home or Who we are
- **AND** the shopper typed into it and then navigated to another section
- **WHEN** the shopper returns to the page from the shell cache
- **THEN** the island shows its server-rendered state and hydrates again
- **AND** submitting it runs the island's handler without a document navigation.
