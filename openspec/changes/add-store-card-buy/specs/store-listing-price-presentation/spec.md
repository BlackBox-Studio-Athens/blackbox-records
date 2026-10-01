## ADDED Requirements

### Requirement: Store cards offer Buy for stocked items

A Store collection card whose Store Item has a sellable variant SHALL offer a 44px outlined Buy action beside its listing price when the activation's listing projection reports a ready price and stocked availability. In every other state the card SHALL show its price and status text without a Buy action. Buy SHALL be a sibling of the card's single Store Item link and SHALL NOT navigate. Pressing Buy SHALL read the Worker Store Offer before adding one unit to StoreCart; the listing projection SHALL NOT be cart, checkout, stock or payment authority.

#### Scenario: Stocked card shows Buy

- **GIVEN** the listing projection reports a ready price and stocked availability for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** Buy appears beside the price in the store tone
- **AND** the card keeps its height, because the price row reserves Buy's height
- **AND** the active Coverflow card shows Buy in its visible purchase row.

#### Scenario: Card cannot be bought

- **GIVEN** the projection read is pending or failed, omits the card, has no price, or reports Sold Out, Out of Stock or unavailable
- **WHEN** the card renders
- **THEN** no Buy action is shown
- **AND** the price region and status text explain the state.

#### Scenario: Shopper buys from a card

- **WHEN** the shopper presses Buy
- **THEN** Buy reads Adding, keeps its width and is marked busy while the Worker Store Offer is read
- **AND** a buyable offer adds one unit to StoreCart and opens the cart drawer
- **AND** Buy reads Added for the confirmation period, then Buy
- **AND** closing the drawer returns focus to Buy.

#### Scenario: Item stopped being buyable

- **GIVEN** the Worker Store Offer is no longer buyable or cannot be read
- **WHEN** the shopper presses Buy
- **THEN** nothing is added to StoreCart
- **AND** Buy is removed, the card shows the offer's status text and focus moves to the card's Store Item link.

#### Scenario: Store collection snapshot is restored

- **WHEN** shell navigation restores or reuses a Store collection snapshot
- **THEN** Buy is hidden and idle until that activation's projection read shows it again.
