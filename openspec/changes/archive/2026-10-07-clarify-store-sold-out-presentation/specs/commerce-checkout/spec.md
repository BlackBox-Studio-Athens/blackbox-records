# Spec Delta

## ADDED Requirements

### Requirement: Sold Out copy reflects confirmed online depletion

When effective OnlineStock is exhausted without an independent selling pause, the system SHALL use Out of Stock when the item's Restock planned flag is true and Sold Out when it is false. Other non-buyable conditions SHALL retain neutral labels through the existing Store Offer contract. The rule SHALL apply equally to BlackBox Releases and Distro items.

#### Scenario: Depletion is confirmed

- **GIVEN** a valid Store Item has availability, no independent pause, and existing stock confirming no effective OnlineStock
- **WHEN** the Worker returns a non-buyable offer
- **THEN** its label is Sold Out when Restock planned is false or Out of Stock when it is true
- **AND** status fields remain unchanged, checkout eligibility is false, and price is null.

#### Scenario: Restock intent only affects depleted stock

- **GIVEN** effective OnlineStock is positive
- **WHEN** the Worker returns the offer, regardless of the Restock planned flag
- **THEN** the flag does not change the existing availability label or checkout eligibility.

#### Scenario: BlackBox Releases and Distro share the rule

- **GIVEN** a BlackBox Release and a Distro item have the same effective stock and Restock planned state
- **WHEN** their offers are read
- **THEN** both receive the same zero-stock label and remain non-buyable.

#### Scenario: Depletion is not established

- **WHEN** availability or stock is missing, selling is independently paused, or non-buyable availability has positive effective stock
- **THEN** the offer label is Currently Unavailable
- **AND** catalog-drift and checkout-capability messages retain their existing meanings.

### Requirement: Purchase status is clear without duplicate messaging

The storefront SHALL display the resolved non-buyable label in the approved compact, left-aligned, hard-edged disabled purchase control while retaining artwork, information, listening, and existing navigation. Enabled, pending, and disabled purchase states SHALL share the same responsive action geometry. Presentation tone SHALL distinguish Sold Out from Out of Stock without changing eligibility or the Store Offer response shape.

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
- **AND** the status button is at most 14rem wide and approximately 54px high, with a subtle red outline and transparent near-black face
- **AND** pending busy feedback clears and the resolved purchase label is announced politely.

#### Scenario: Purchase states share geometry

- **WHEN** the action changes between Checking availability, Add To Cart, Sold Out, Out of Stock, Checkout Paused, or generic unavailable
- **THEN** the control remains 224px wide and 54px high on desktop and fills the available action width on mobile
- **AND** the enabled Add To Cart state retains its primary filled treatment while disabled states remain outlined.

#### Scenario: Inventory states have a subtle visual distinction

- **WHEN** effective online stock is exhausted
- **THEN** Sold Out uses the subtle Store Blood outline and Out of Stock uses a neutral gray outline
- **AND** Checkout Paused and generic unavailable states use the neutral gray outline
- **AND** styling does not determine purchase eligibility.
