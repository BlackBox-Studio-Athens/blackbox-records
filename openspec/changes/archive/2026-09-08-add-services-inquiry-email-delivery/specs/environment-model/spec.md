## ADDED Requirements

### Requirement: Services inquiry effects are scoped by Product Environment

The system MUST route Services inquiry email effects through the existing Product Environment email delivery policy without introducing a new environment, provider mode, or recipient policy.

#### Scenario: Local inquiry is submitted

- **GIVEN** the Product Environment is Local
- **WHEN** a Services inquiry is submitted
- **THEN** the existing local mock email gateway accepts the operation
- **AND** no Resend message, Cloudflare alias delivery, Gmail delivery, UAT effect, or PRD effect occurs.

#### Scenario: UAT inquiry is submitted

- **GIVEN** the Product Environment is UAT
- **WHEN** a Services inquiry is submitted
- **THEN** the intended service alias is routed to `uat-sink@ambkime.resend.app`
- **AND** the message does not reach the Cloudflare service alias, Gmail inbox, or PRD recipient path.

#### Scenario: PRD inquiry is submitted

- **GIVEN** the Product Environment is PRD
- **WHEN** a Services inquiry is submitted
- **THEN** the Worker sends to the intended service alias
- **AND** it ignores the UAT recipient override
- **AND** Cloudflare Email Routing may forward that alias to the existing Gmail inbox without enabling Resend Receiving.

#### Scenario: Inquiry runtime configuration is evaluated

- **WHEN** Services inquiry delivery starts in any Product Environment
- **THEN** it reuses the existing Resend API key, sender, brand, reply-routing, mock, and UAT sink configuration
- **AND** it does not add service-specific secrets or Product Environment names.
