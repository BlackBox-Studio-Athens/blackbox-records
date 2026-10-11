## ADDED Requirements

### Requirement: Shell page entry keeps fixed layers viewport-fixed

The shell page-enter transition SHALL NOT apply a transform, translate, scale, filter, perspective or other containing-block-creating property to the shell main element, during or after the transition.

#### Scenario: Shopper navigates to Home through the shell

- **GIVEN** a shopper is on another shell section
- **WHEN** the shopper activates a link to Home and the page-enter transition runs
- **THEN** the main element only fades its opacity
- **AND** the fixed Home hero media layer stays sized to the viewport during and after the transition, as on a direct load.
