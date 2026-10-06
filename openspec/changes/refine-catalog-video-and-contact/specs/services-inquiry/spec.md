## ADDED Requirements

### Requirement: Visitors can share a demo through Services

Services SHALL offer Share your demo through the existing inquiry flow, with a concise prompt for a music link. The Worker SHALL validate this supported choice and route it to the existing server-owned info inbox without accepting client recipient routing or introducing file uploads.

#### Scenario: Demo choice is selected

- **WHEN** a visitor chooses Share your demo
- **THEN** the form presents a concise optional music-link prompt and retains the core required contact/message fields.

#### Scenario: Demo inquiry is submitted

- **WHEN** the Worker receives a valid demo inquiry
- **THEN** the existing provider gateway submits it to the existing info recipient
- **AND** the browser's current success, error and retry behavior remains intact.

#### Scenario: Inquiry is invalid

- **WHEN** a submitted inquiry is invalid or names an unsupported service
- **THEN** existing safe validation rejects it without calling the provider or exposing recipient/provider credentials.
