## ADDED Requirements

### Requirement: Harmonised legal-guarantee notice before purchase

The storefront SHALL prominently provide the official harmonised legal-guarantee notice before a consumer commits to buying physical goods. The complete unmodified RGB notice SHALL be legible and accessible, with its QR code preserved and a direct link to the corresponding Your Europe information.

#### Scenario: Shopper opens the guarantee reminder

- **WHEN** a shopper activates the clearly named legal-guarantee reminder by pointer, keyboard or touch
- **THEN** the complete official notice appears on the first activation
- **AND** it remains readable at normal display size without cropped text or a hover-only dependency
- **AND** an accessible text equivalent supplies the notice's information and links without relying on reading pixels or scanning a QR code.

#### Scenario: Shopper is ready to pay

- **WHEN** checkout review offers its payment action
- **THEN** a prominent legal-guarantee reminder is available before leaving for payment
- **AND** opening or closing it does not create a checkout, change the cart, newsletter choice, quote or checkout eligibility, or require a new consent checkbox.

#### Scenario: JavaScript or artwork is unavailable

- **WHEN** scripting is disabled or the notice image cannot be loaded
- **THEN** the notice remains reachable through an accessible document or native disclosure with the information in text and a working official information link
- **AND** missing artwork is not represented as completed presentation acceptance.

#### Scenario: Commercial guarantee is not established

- **WHEN** no verified producer information establishes a free whole-good commercial durability guarantee longer than two years
- **THEN** the interface does not display a GARAN commercial guarantee label or invent a duration or provider
- **AND** the harmonised legal-guarantee notice remains available independently.

#### Scenario: Published terms coexist with the notice

- **WHEN** the legal-guarantee notice is introduced
- **THEN** existing accepted guarantee, remedies, seller-cost and seller/controller wording is preserved
- **AND** source fixtures and unpublished drafts do not overwrite the accepted CMS snapshot.
