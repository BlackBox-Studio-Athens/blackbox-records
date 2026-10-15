## MODIFIED Requirements

### Requirement: Stocked Store cards offer Buy

A Store collection card whose Store Item has a sellable variant SHALL offer a 44px Buy action with a leading record mark beside its listing price when the listing projection reports a ready price and stocked availability, and otherwise SHALL show its price and status without Buy. Buy SHALL sit beside the card's item link without navigating. Buy SHALL read the Worker Store Offer before adding one unit to StoreCart; the listing projection SHALL NOT be cart, checkout, stock or payment authority.

#### Scenario: Stocked card shows Buy

- **GIVEN** the listing projection reports a ready price and stocked availability for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** Buy appears beside the price with a Violet #7d58a0 filled face, white label and existing white format mark, while the noninteractive status remains distinct
- **AND** the card keeps its height, because the price row reserves Buy's height
- **AND** the Store Crate's item in hand shows Buy in its visible purchase row at every width.

#### Scenario: Pre-order card keeps its action

- **GIVEN** the listing projection reports a ready, stocked pre-order for a card's Store Item
- **WHEN** the card's price row is presented
- **THEN** its Pre-order action uses a Sea #2d766a filled face at rest with a white label
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
- **AND** Adding and Added keep the format mark and the Violet purchase treatment
- **AND** closing the drawer returns focus to Buy.

#### Scenario: Item stopped being buyable

- **GIVEN** the Worker Store Offer is no longer buyable or cannot be read
- **WHEN** the shopper presses Buy
- **THEN** nothing is added to StoreCart
- **AND** Buy is removed, the card shows the offer's status text and focus moves to the card's Store Item link.

#### Scenario: Store collection snapshot is restored

- **WHEN** shell navigation restores or reuses a Store collection snapshot
- **THEN** Buy is hidden and idle until that activation's projection read shows it again.

### Requirement: Store cards use the shared availability vocabulary

Store collection cards SHALL show Coming Soon, Repressing or Sold Out in the slot beside the retained price for the matching availabilityState, with a shown expected month inside the same chip as "Coming Soon · Nov 2026". Sold Out SHALL use the Violet #7d58a0 edge and rgba(125,88,160,.16) surface; the existing Only N left notice SHALL use that same treatment. Coming Soon and Repressing SHALL retain dashed neutral boxes. An unavailable record, or a state the browser does not recognise, SHALL show the price with no status and no Buy.

#### Scenario: First pressing has not arrived

- **WHEN** a card's record is coming_soon with expectedMonth 2026-11
- **THEN** the card shows one chip reading Coming Soon · Nov 2026 beside the price
- **AND** Buy is hidden and the whole-card link still opens the item page.

#### Scenario: Labels stay consistent

- **WHEN** a record is repressing or sold_out
- **THEN** the card shows Repressing or Sold Out respectively
- **AND** the strings Out of Stock, Currently Unavailable and Unavailable never appear.

#### Scenario: Selling is paused or the state is unknown

- **WHEN** a record is unavailable or carries an availabilityState absent from the browser's vocabulary
- **THEN** the card shows its price with no status chip and no Buy, rather than a label or stale status.

### Requirement: Availability states keep one tone on every surface

Each shopper availability state SHALL use the same tone wherever it appears: Store cards, the Store item page, Releases badges, the cart and checkout. Sold Out and Only N left SHALL use a solid Violet #7d58a0 edge and rgba(125,88,160,.16) surface; Coming Soon and Repressing SHALL keep dashed neutral boxes; Pre-order keeps Preorder Sea Green. Size and shape SHALL follow the surface, a compact chip or the item page's purchase control. Notify me SHALL be a quiet text action, never an outlined or red control.

#### Scenario: Sold Out appears on several surfaces

- **WHEN** one variant reads Sold Out on its Store card, item page, Releases card and a cart line
- **THEN** each shows the Violet #7d58a0 edge and Violet surface, and none shows that treatment for Coming Soon or Repressing.

#### Scenario: Notify me sits under a Coming Soon status

- **WHEN** Notify me renders on a Store item page
- **THEN** it reads as a quiet text action with a mail icon, so it is not mistaken for the status above it.

#### Scenario: Existing copies-left notice renders

- **WHEN** current authoritative data enables Only N left on a stocked item
- **THEN** the existing notice uses the same Violet edge and surface as Sold Out
- **AND** the count, opt-in threshold and purchase eligibility remain unchanged.
