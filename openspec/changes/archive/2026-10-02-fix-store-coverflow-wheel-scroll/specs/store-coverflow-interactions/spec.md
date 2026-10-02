## ADDED Requirements

### Requirement: Store Coverflow isolates consumed wheel input from page scrolling

An enhanced Store Coverflow in `preview` mode SHALL keep consumed wheel input within its hovered stage so that neither native scrolling nor ancestor smooth-scroll handling moves the page. This ownership SHALL apply even when the event does not immediately advance an item.

#### Scenario: Visitor wheels over a cover or stage gap

- **WHEN** non-zero wheel input without Ctrl occurs over a cover or empty space within a preview stage
- **THEN** the existing discrete traversal rules apply
- **AND** the page remains at its original scroll position throughout the resulting animation and wheel gesture.

#### Scenario: Wheel input waits for movement eligibility

- **WHEN** preview-stage wheel input is below the movement threshold or arrives during the repeat throttle
- **THEN** the input remains consumed without moving the page
- **AND** existing accumulation, cadence, direction, and wrapping rules remain unchanged.

#### Scenario: Browser owns the wheel input

- **WHEN** wheel input occurs outside the stage, in Grid or search-results mode, with Ctrl for browser zoom, or with zero delta on both axes
- **THEN** Coverflow does not intercept that input or advance an item
- **AND** ordinary page scrolling and browser zoom remain available.
