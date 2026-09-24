# Spec Delta

## ADDED Requirements

### Requirement: Sold Out copy reflects confirmed online depletion

The system SHALL use Sold Out only when the Worker confirms exhausted effective OnlineStock without an independent selling pause. Other non-buyable conditions SHALL retain neutral labels through the existing Store Offer contract.

#### Scenario: Depletion is confirmed

- **GIVEN** a valid Store Item has availability, no independent pause, and existing stock confirming no effective OnlineStock
- **WHEN** the Worker returns a non-buyable offer
- **THEN** its label is Sold Out, with unchanged status fields, false checkout eligibility, and null price.

#### Scenario: Depletion is not established

- **WHEN** availability or stock is missing, selling is independently paused, or non-buyable availability has positive effective stock
- **THEN** the offer label is Currently Unavailable
- **AND** catalog-drift and checkout-capability messages retain their existing meanings.

### Requirement: Purchase status is clear without duplicate messaging

The storefront SHALL display the resolved non-buyable label in a readable, compact, hard-edged disabled purchase control while retaining artwork, information, listening, and existing navigation.

#### Scenario: Non-buyable offer resolves

- **WHEN** detail or compatibility-route purchase actions receive a non-ready offer
- **THEN** they display its label without using the text to decide eligibility
- **AND** an adjacent successfully resolved price region does not repeat a status headline or invent a price, while standalone price/summary regions retain useful feedback
- **AND** detail and compatibility-route instructions to add the item are absent.

#### Scenario: Pending or failed request

- **WHEN** the purchase offer is loading or its read fails
- **THEN** the action stays disabled with pending feedback or neutral unavailable copy
- **AND** an older snapshot does not restore an enabled action.

#### Scenario: Stock is restored

- **WHEN** a subsequent fresh offer is ready
- **THEN** Add To Cart, its supporting hint, and current price return
- **AND** checkout start still validates current authority.

#### Scenario: Accessible status

- **WHEN** status renders on a narrow screen or with increased text size
- **THEN** its text has at least 4.5:1 contrast, the control has a minimum 44px height, and there is no clipping or horizontal overflow
- **AND** pending busy feedback clears and the resolved purchase label is announced politely.
