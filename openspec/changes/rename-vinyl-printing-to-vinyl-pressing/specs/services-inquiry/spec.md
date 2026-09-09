## MODIFIED Requirements

### Requirement: Services inquiry form stays short and service-aware

The system SHALL require only the core contact and inquiry fields while offering one concise optional prompt tailored to the selected service.

#### Scenario: Form renders core fields

- **WHEN** the Services inquiry form is available
- **THEN** Name, Email, Service, and Message are required
- **AND** Band / Project is optional
- **AND** Name accepts at most 100 characters, Email 254, Band / Project 160, and Message 2,000.

#### Scenario: General is selected

- **WHEN** the selected service is `General`
- **THEN** the optional details control is labelled `Useful context`
- **AND** it accepts at most 300 characters.

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

### Requirement: Services inquiry recipient routing is Worker-owned

The system MUST map each supported service to a fixed BlackBox alias in trusted backend code and MUST NOT accept a recipient address from the browser.

#### Scenario: General inquiry is routed

- **WHEN** the service is `General`
- **THEN** the intended recipient is `info@blackboxrecordsathens.com`.

#### Scenario: Tour Booking inquiry is routed

- **WHEN** the service is `Tour Booking`
- **THEN** the intended recipient is `booking@blackboxrecordsathens.com`.

#### Scenario: Merch Printing inquiry is routed

- **WHEN** the service is `Merch Printing`
- **THEN** the intended recipient is `merch@blackboxrecordsathens.com`.

#### Scenario: Vinyl Pressing inquiry is routed

- **WHEN** the canonical service is `Vinyl Pressing`
- **THEN** the intended recipient is `vinyl@blackboxrecordsathens.com`.

#### Scenario: Prior vinyl value reaches a newer Worker

- **WHEN** the Worker receives the exact prior service value `Vinyl Printing`
- **THEN** it normalizes the value to `Vinyl Pressing` before canonical validation and recipient lookup
- **AND** email content, logs, and provider tags use the canonical value.

#### Scenario: Browser attempts recipient override

- **WHEN** a request includes a recipient address or another unsupported service value
- **THEN** the Worker rejects the request
- **AND** it does not send email.
