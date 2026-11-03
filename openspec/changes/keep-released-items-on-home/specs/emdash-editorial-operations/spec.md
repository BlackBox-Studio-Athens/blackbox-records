## ADDED Requirements

### Requirement: Staff choose which released items stay on Home

The staff release editor SHALL offer a Show on Home switch beside the Pre-order switch. It is off by default and saved with the release as ordinary content, private in the draft and live only through Content Publication. It SHALL be accessible by keyboard and on mobile like the Pre-order switch.

#### Scenario: Staff keep a closed pre-order on Home

- **WHEN** staff turn on Show on Home for a release whose pre-order has closed and publish the content
- **THEN** the published release carries the setting and Home keeps its chapter after the next render

#### Scenario: Staff remove a release from Home

- **WHEN** staff turn the switch off and publish
- **THEN** the chapter leaves Home when no pre-order is open for it
- **AND** the release stays in the Store and on the Releases page

#### Scenario: A pre-order is open

- **WHEN** the release's Store Item is on an open pre-order
- **THEN** the switch shows on and cannot be changed, and Home shows the chapter automatically
- **AND** its text explains that open pre-orders appear on Home automatically and the switch takes over when the pre-order closes

#### Scenario: The switch is operated

- **WHEN** staff use the switch with a keyboard or on a phone
- **THEN** it has a 44px target and a programmatic name and description, like the Pre-order switch

#### Scenario: A draft changes the setting

- **WHEN** staff change the switch and have not published
- **THEN** the public Home does not change
- **AND** the draft, review and discard flows treat the setting like any other release field
