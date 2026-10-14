## MODIFIED Requirements

### Requirement: Motion respects reduced motion

Control transitions, loading hairlines and in-place feedback timers SHALL disable their animation under a reduced-motion preference while keeping their text and states. Stop SHALL end the player session on its first activation regardless of motion preference.

#### Scenario: Reduced motion is on

- **WHEN** the browser requests reduced motion
- **THEN** Added and Undo states still appear and time out
- **AND** Stop ends the player session on its first activation
- **AND** no hairline or colour animation runs.
