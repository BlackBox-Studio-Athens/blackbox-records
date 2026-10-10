## MODIFIED Requirements

### Requirement: Inquiry submission confirms in context

The system SHALL keep the visitor on the Services page and communicate idle, submitting, error, and success states accessibly. Only the fields that fail validation SHALL be marked invalid.

#### Scenario: Inquiry is submitting

- **WHEN** a submission request is pending
- **THEN** the submit action is disabled against repeat activation
- **AND** a pre-existing polite status region announces progress
- **AND** the surrounding form layout remains stable on mobile and desktop.

#### Scenario: Inquiry submission succeeds

- **WHEN** the Worker returns inquiry submission success
- **THEN** the form is replaced by an inline success panel
- **AND** the panel confirms that the inquiry was submitted without claiming inbox delivery
- **AND** it offers a `Send another inquiry` action
- **AND** it does not navigate, reload, or open another tab.

#### Scenario: Inquiry submission fails

- **WHEN** validation or provider submission fails
- **THEN** the visitor remains on the Services page with entered values preserved
- **AND** field errors are programmatically associated with invalid controls
- **AND** blocking errors use an accessible alert region
- **AND** retry and fallback actions remain available.

#### Scenario: One field is invalid

- **WHEN** the visitor submits with a valid name and message but an invalid email
- **THEN** only the email control is marked invalid
- **AND** the valid fields are not announced as invalid.
