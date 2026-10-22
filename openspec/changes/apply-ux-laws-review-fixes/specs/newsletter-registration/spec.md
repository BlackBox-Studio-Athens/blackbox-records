# Spec Delta

## ADDED Requirements

### Requirement: Newsletter consent precedes the submit action

The public newsletter form SHALL present its controls in the order email, consent checkbox, Subscribe at every width. A missing-consent error SHALL appear directly under the consent checkbox and SHALL be announced, and no request SHALL be sent until consent is given.

#### Scenario: Visitor fills the form on a phone or desktop

- **WHEN** the newsletter form renders at 390px or 1280px
- **THEN** the email field comes first, the consent checkbox second and Subscribe last in both visual and focus order.

#### Scenario: Visitor presses Subscribe without consent

- **GIVEN** a valid email and an unticked consent checkbox
- **WHEN** the visitor presses Subscribe
- **THEN** an error reading the existing missing-consent message appears directly below the checkbox with its visible Error label
- **AND** the checkbox is marked invalid and described by that error
- **AND** no registration request is sent.
