# Spec Delta

## MODIFIED Requirements

### Requirement: Services inquiry form stays short and service-aware

The system SHALL require only the core contact and inquiry fields while offering one concise optional prompt tailored to the selected service. The General service SHALL offer no optional details prompt.

#### Scenario: Form renders core fields

- **WHEN** the Services inquiry form is available
- **THEN** Name, Email, Service, and Message are required
- **AND** Band / Project is optional
- **AND** Name accepts at most 100 characters, Email 254, Band / Project 160, and Message 2,000.

#### Scenario: General is selected

- **WHEN** the selected service is `General`
- **THEN** no optional details control is shown
- **AND** the submitted inquiry carries no service details, even if details were typed while another service was selected.

#### Scenario: Tour Booking is selected

- **WHEN** the selected service is `Tour Booking`
- **THEN** the optional details control is labelled `Date / City / Venue`
- **AND** it remains optional.

#### Scenario: Merch Printing is selected

- **WHEN** the selected service is `Merch Printing`
- **THEN** the optional details control is labelled `Item / Quantity / Deadline`
- **AND** it remains optional.

#### Scenario: Vinyl Pressing is selected

- **WHEN** the selected service is `Vinyl Pressing`
- **THEN** the optional details control is labelled `Format / Quantity / Target Date`
- **AND** it remains optional.

## ADDED Requirements

### Requirement: Send Inquiry is the form's primary action

The Services inquiry submit control SHALL use the neutral ink face shared by Subscribe and Pay, keeping its label, 44px height, loading label and focus ring.

#### Scenario: Visitor reaches the end of the form

- **WHEN** the Services inquiry form renders
- **THEN** Send Inquiry shows the ink face with the dark label
- **AND** while submitting it keeps its width and reads Sending inquiry….
