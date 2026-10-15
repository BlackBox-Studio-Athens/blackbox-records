## MODIFIED Requirements

### Requirement: The Store offers a Pre-orders filter only while pre-orders exist

The Store browse controls SHALL offer a Pre-orders filter in the phone Filter sheet or desktop toolbar, with its existing short explanation retained only when fresh listing data reports at least one pre-order on the current collection. Store Category tabs and routes SHALL NOT change.

#### Scenario: Pre-orders exist

- **WHEN** at least one card on the collection is a pre-order
- **THEN** a Pre-orders toggle shows the count, and turning it on shows only matching cards, together with the existing explanation of payment, waiting and delivery
- **AND** it retains the existing composition with search, artists and applicable Distro format selection, preserves catalogue order and updates the existing result count
- **AND** its existing fresh-listing count is unchanged and its Sea styling remains exclusive to pre-orders.

#### Scenario: No pre-orders exist

- **WHEN** no card is a pre-order
- **THEN** no Pre-orders control is rendered and an active Pre-orders filter turns off.

#### Scenario: Linked from elsewhere

- **WHEN** the Store is opened through a link that asks for pre-orders
- **THEN** the filter starts on once listing data confirms pre-orders exist.

### Requirement: Store cards match the approved pre-order lifecycle references

Store listing cards SHALL use the approved 15 October hierarchy: complete square artwork with optional corner Listen, a plain ink Inter 13px semibold uppercase format line without a leading mark, ink Veneer title, prominent Inter artist credit, plain lifecycle status and stable bottom price/action. Authoritative lifecycle and scarcity behavior SHALL remain unchanged; reference annotations SHALL NOT become shopper copy.

#### Scenario: Lifecycle state changes

- **WHEN** music is unreleased, released with physical copies on pre-order, or its pre-order has ended
- **THEN** the appropriate plain release/ship status lines and Pre-order or ordinary Buy action follow authoritative lifecycle data without altering card geometry.

#### Scenario: Active pre-order copies become unavailable

- **WHEN** an active pre-order has no buyable copies
- **THEN** the card reads like any zero-stock card: its Coming Soon, Repressing or Sold Out chip beside the price, with no pre-order badge and no Pre-order control
- **AND** this replaces the earlier approved reference with a disabled gray Pre-order control.

#### Scenario: Card metadata is long or the viewport is narrow

- **WHEN** cards display long identities or month/exact/unknown ship estimates at 320px, 390px, 430px or desktop widths
- **THEN** artwork remains intact and titles, badges, prices and actions remain readable without document overflow
- **AND** filters, navigation, cart operations and persistent listening retain their existing behavior.

### Requirement: Store cards show pre-order status by release date

Store cards SHALL show a pre-order's status from fresh listing data, worded by the item's release date as evaluated in the browser. The card action SHALL read Pre-order.

#### Scenario: The release date is in the future

- **WHEN** a stocked pre-order has a release date after today
- **THEN** the card shows one plain status line naming the release date and a Pre-order action.

#### Scenario: The release date has arrived

- **WHEN** a stocked pre-order has a release date of today or earlier
- **THEN** the card shows Digital out now and a plain pre-order status line naming the Ship Estimate, or Pre-order alone when the estimate is withheld.

#### Scenario: A pre-order is also scarce

- **WHEN** a stocked pre-order's record or offer carries lowStockQuantity
- **THEN** the card and the Store Item page still show Only N left exactly as the copies-left requirement defines
- **AND** the Pre-order action stays available.

#### Scenario: Listing data is pending, failed or cached

- **WHEN** the projection is loading, fails, omits the item, or a cached page is restored
- **THEN** no pre-order status, label or marker from an earlier read remains
- **AND** an ordinary Buy action is never shown for an item the fresh read reports as unavailable.
