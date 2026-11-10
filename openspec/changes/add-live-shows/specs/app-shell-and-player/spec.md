## ADDED Requirements

### Requirement: The show strip belongs to the persistent header

The show strip SHALL be part of the persistent header, so shell navigation SHALL neither re-render nor duplicate it, and it SHALL stay visible while overlays and the player are open. The header's height token SHALL include the strip whenever it renders, so `<main>` offsets, sticky elements and the Home hero composition stay aligned. The strip link SHALL open the external ticket seller as a normal link, outside shell interception, without ending the player session.

#### Scenario: A shopper navigates while listening

- **WHEN** a player session is active and the shopper moves from Home to Releases and opens a release overlay
- **THEN** the same strip remains above the header
- **AND** the player iframe stays connected.

#### Scenario: Main content starts below the strip

- **WHEN** a page renders with the strip at 390px and at 1440px
- **THEN** the first heading of `<main>` is not covered by the strip or the header.

#### Scenario: No upcoming show

- **WHEN** no strip renders
- **THEN** the header height and `<main>` offset equal today's values.
