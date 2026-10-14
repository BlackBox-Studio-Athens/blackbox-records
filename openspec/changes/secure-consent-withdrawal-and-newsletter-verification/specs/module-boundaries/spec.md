## ADDED Requirements

### Requirement: Email consent capabilities use declared application and persistence seams

The email application SHALL own mailbox-capability rules and its repository contract. Commerce persistence SHALL provide the D1 implementation, including atomic alert cancellation. The Resend runtime SHALL compose those public interfaces without granting browser code provider or database authority.

#### Scenario: Email consent is processed

- **WHEN** the Resend runtime requests or confirms newsletter consent
- **THEN** it consumes the email application's provided entrypoint and the declared commerce-persistence consent repository export
- **AND** commerce persistence depends explicitly on the email application repository contract
- **AND** public consent HTTP adapters use existing allowed module interfaces.
