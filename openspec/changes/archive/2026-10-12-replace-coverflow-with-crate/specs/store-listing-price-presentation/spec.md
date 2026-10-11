## ADDED Requirements

### Requirement: Stocked Store cards offer Buy

A Store collection card whose Store Item has a sellable variant SHALL offer a 44px Buy action with a leading record mark beside its listing price when the listing projection reports a ready price and stocked availability, and otherwise SHALL show its price and status without Buy. Buy SHALL sit beside the card's item link without navigating. Buy SHALL read the Worker Store Offer before adding one unit to StoreCart; the listing projection SHALL NOT be cart, checkout, stock or payment authority.

#### Scenario: Stocked card shows Buy

- **GIVEN** the listing projection reports a ready price and stocked availability for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** Buy appears beside the price in the Listen chrome (dark face, hairline edge, Store Blood hover edge) with a leading record mark, unlike the outlined status text
- **AND** the card keeps its height, because the price row reserves Buy's height
- **AND** the Store Crate's item in hand shows Buy in its visible purchase row at every width.

#### Scenario: Pre-order card keeps its action

- **GIVEN** the listing projection reports a ready, stocked pre-order for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** its Pre-order action keeps the filled primary face and Sea green base line
- **AND** it shows no record mark.

#### Scenario: Phone Crate offers Buy for the item in hand

- **GIVEN** a viewport narrower than 40rem with the Store Crate open
- **WHEN** the stocked item in hand shows its purchase row below the bin
- **THEN** it shows the price, status and Buy
- **AND** Buy stays reachable without scrolling past the bin.

#### Scenario: Shopper looks for the item page

- **WHEN** a Store card renders
- **THEN** its title carries a faint text-link underline that turns full when the card's Store Item link is hovered or focused
- **AND** on hover-capable devices the card's border and surface lift with it
- **AND** hovering Buy or Listen leaves the card at rest.

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
- **AND** Adding and Added keep the record mark and the Listen chrome
- **AND** closing the drawer returns focus to Buy.

#### Scenario: Item stopped being buyable

- **GIVEN** the Worker Store Offer is no longer buyable or cannot be read
- **WHEN** the shopper presses Buy
- **THEN** nothing is added to StoreCart
- **AND** Buy is removed, the card shows the offer's status text and focus moves to the card's Store Item link.

#### Scenario: Store collection snapshot is restored

- **WHEN** shell navigation restores or reuses a Store collection snapshot
- **THEN** Buy is hidden and idle until that activation's projection read shows it again.

## REMOVED Requirements

### Requirement: Store cards offer Buy for stocked items

**Reason**: Renamed so the Coverflow scenario can be replaced by its Store Crate scenario; every other scenario is unchanged.

**Migration**: Use "Stocked Store cards offer Buy".
