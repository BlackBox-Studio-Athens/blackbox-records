## ADDED Requirements

### Requirement: Purchase disclosures follow the current decision

The storefront SHALL show concise purchase information relevant to the current item or order, retain complete accepted policy documents, and preserve contextual privacy and statutory disclosures. Repeated generic explanations SHALL NOT obscure the purchase action or cost summary.

#### Scenario: Shopper considers an ordinary item

- **WHEN** a stocked non-pre-order item is displayed
- **THEN** its current price and purchase action precede one compact shipping note and a Delivery & returns link
- **AND** generic pre-order explanations and the five-link policy cluster are absent from the item purchase block.

#### Scenario: Shopper considers a pre-order

- **WHEN** an authoritative offer is an active pre-order
- **THEN** its existing shipping estimate and full-payment condition remain visible before the purchase action
- **AND** explanatory text below the action does not repeat those facts or describe unrelated cart contents.

#### Scenario: Shopper reviews an order

- **WHEN** a cart or checkout summary is displayed
- **THEN** its cost breakdown precedes the delivery arrangements and conditional pre-order notice
- **AND** the notice identifies any in-stock items held for pre-orders without repeating its estimated date
- **AND** the street-address clarification appears in checkout delivery information rather than every item and cart.

#### Scenario: Shopper needs policy or statutory information

- **WHEN** purchase information is simplified
- **THEN** accepted full terms and privacy documents retain their content and publication gates
- **AND** privacy remains available beside data-collecting forms, withdrawal remains directly accessible, and existing legal-guarantee and product-safety disclosures remain available in their established contexts
- **AND** newsletter consent remains optional, separate and initially unticked.
