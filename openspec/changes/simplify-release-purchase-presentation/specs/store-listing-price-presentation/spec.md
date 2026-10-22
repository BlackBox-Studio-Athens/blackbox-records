## MODIFIED Requirements

### Requirement: Stocked Store cards offer Buy

A Store collection card whose Store Item has a sellable variant SHALL offer Buy beside its listing price when the listing projection reports a ready price and stocked availability, and otherwise SHALL show its price and status without Buy. Listing BUY SHALL reuse the accepted release control geometry: intrinsic width without flex growth, minimum112x44 CSS px,16px inline padding,16px default Bebas label,18px static Lucide Disc3 and8px icon/text gap. Every format, including vinyl, CD, tape and merch, SHALL use the same icon and generic Buy label. Keep the existing price arrangement and Grid/Crate composition. Buy SHALL sit beside the card's item link without navigating. Buy SHALL read the Worker Store Offer before adding one unit to StoreCart; the listing projection SHALL NOT be cart, checkout, stock or payment authority. Item Add to cart and checkout commands retain their existing treatment.

#### Scenario: Stocked card shows Buy

- **GIVEN** the listing projection reports a ready price and stocked availability for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** generic Buy uses the filled Flint face with the static Disc3 for every format
- **AND** the card keeps its height because the price row reserves Buy's height
- **AND** desktop/mobile Grid and the Store Crate's item in hand use the same compact geometry and existing price placement
- **AND** below 40rem Buy keeps its icon, label and height but takes its own full-width line under the price, which the price row reserves

#### Scenario: Pre-order card keeps its action

- **GIVEN** the listing projection reports a ready, stocked pre-order for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** its truthful Pre-order action retains the filled Sea face and the same compact geometry/static Disc3

#### Scenario: Phone Crate offers Buy for the item in hand

- **GIVEN** a viewport narrower than40rem with the Store Crate open
- **WHEN** the stocked item in hand shows its purchase row below the bin
- **THEN** it shows the price, status and Buy
- **AND** Buy stays reachable without scrolling past the bin

#### Scenario: Shopper looks for the item page

- **WHEN** a Store card renders
- **THEN** its title carries a faint text-link underline that turns full when the card's Store Item link is hovered or focused
- **AND** on hover-capable devices the card's border and surface lift with it
- **AND** hovering Buy or Listen leaves the card at rest

#### Scenario: Card cannot be bought

- **GIVEN** the projection read is pending or failed, omits the card, has no price or reports depleted or unavailable stock
- **WHEN** the card renders
- **THEN** no Buy is shown and existing price/status rules remain truthful

#### Scenario: Shopper buys from a card

- **WHEN** the shopper presses Buy
- **THEN** Buy reads Adding, keeps its width and is marked busy while the Worker Store Offer is read
- **AND** a buyable offer adds one unit to StoreCart and opens the cart drawer
- **AND** Buy reads Added for the confirmation period, then resets to Buy or Pre-order as appropriate
- **AND** Adding and Added keep the static Disc3 and current filled face without layered or animated marks
- **AND** closing the drawer returns focus to Buy

#### Scenario: Item stopped being buyable

- **GIVEN** the Worker Store Offer is no longer buyable or cannot be read
- **WHEN** the shopper presses Buy
- **THEN** nothing is added to StoreCart
- **AND** Buy is removed, the card shows the offer's status text and focus moves to the card's Store Item link

#### Scenario: Store collection snapshot is restored

- **WHEN** shell navigation restores or reuses a Store collection snapshot
- **THEN** Buy is hidden and idle until that activation's projection read shows it again
