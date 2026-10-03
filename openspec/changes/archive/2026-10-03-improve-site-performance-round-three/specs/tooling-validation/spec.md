## ADDED Requirements

### Requirement: Runtime profiles measure idle cost and real scroll input

The runtime performance tooling SHALL provide repeatable idle, wheel, and touch profiles beside the existing load and scripted scroll profiles.

#### Scenario: Idle profile runs

- **WHEN** a maintainer measures Home, About, or Store Distro at rest
- **THEN** the profile traces five settled seconds at 4× CPU in desktop and touch emulation, at least three times
- **AND** it reports main-thread time, recurring animation-frame callbacks, and long tasks for the window.

#### Scenario: Wheel and touch scroll profiles run

- **WHEN** Store All or Store Distro scrolling is measured
- **THEN** the wheel profile dispatches real wheel input on a fine pointer, and the touch profile performs touch drags under coarse-pointer emulation
- **AND** each reports frame intervals, style-recalc element counts, layout, and long tasks for first and repeat traversal, at least three times each
- **AND** results are labelled by input type and never combined with the scripted scroll profiles.

#### Scenario: A smooth-scroll runtime decision is made

- **WHEN** a change keeps, narrows, or removes the shell smooth-scroll runtime
- **THEN** the decision cites idle and wheel or touch results with and without the runtime from the same session and profile.
