## MODIFIED Requirements

### Requirement: Shell navigation loading remains apparent

The app shell SHALL keep same-document route transitions visibly apparent while preserving focus and scroll behavior. For an uncached Store activation that remains in flight for 750 milliseconds, it SHALL add one shared accessible `Loading Store` status until the route transition closes, without adding per-card spinners.

#### Scenario: Shell section navigation is in flight

- **GIVEN** a shopper follows a shell-managed header, footer, or mobile-nav section link
- **WHEN** the shell is fetching and applying the next page snapshot
- **THEN** the route loading indicator and section transition communicate that navigation is in progress
- **AND** the final state still resets scroll, moves focus to `main[data-app-shell-main]`, and does not leave a stale busy indicator open.

#### Scenario: Uncached Store activation exceeds the feedback delay

- **GIVEN** an uncached Store collection activation has not completed its route transition within 750 milliseconds
- **WHEN** the shared feedback delay expires
- **THEN** the route transition shows one visible `Loading Store` status with polite live semantics
- **AND** its spinner respects reduced-motion behavior
- **AND** the status remains shared rather than rendering motion on each Store card.

#### Scenario: Store activation finishes before the feedback delay

- **GIVEN** a desktop, cached, or otherwise fast Store activation closes its route transition before 750 milliseconds
- **WHEN** the delayed feedback timer would have expired
- **THEN** no `Loading Store` status flashes after completion
- **AND** listing prices may still use the existing per-card `Checking price` state until the one projection settles.

#### Scenario: Store activation is canceled or fails

- **GIVEN** a delayed Store loading timer or status belongs to the current route activation
- **WHEN** navigation is superseded, fails, or the shell unmounts
- **THEN** that activation clears its timer and shared status
- **AND** a later route does not inherit stale Store loading feedback.
