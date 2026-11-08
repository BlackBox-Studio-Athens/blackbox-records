## ADDED Requirements

### Requirement: Checkout shows a BOX NOW locker panel before Review and pay

Checkout SHALL show a BOX NOW locker panel above Review and pay, with a Greece only badge, a Find a locker action and, when this device used one before, a Use this locker shortcut. A chosen locker SHALL show its name, address and ID with Change locker, and the order summary SHALL add a Delivery to row. The map SHALL open inside the panel with Cancel, not in a modal.

#### Scenario: Returning shopper reuses a locker

- **WHEN** a device has a previously chosen locker and the shopper taps Use this locker
- **THEN** that locker becomes the chosen locker without opening the map
- **AND** Continue to payment becomes available.

#### Scenario: Shopper changes or cancels

- **WHEN** the shopper taps Change locker, or Cancel while the map is open
- **THEN** the map opens again, or closes keeping any earlier choice
- **AND** focus stays in the panel and the page does not jump.

#### Scenario: Keyboard and narrow screens

- **WHEN** the panel is used with a keyboard or at phone width
- **THEN** every action has a visible label and focus, targets are reachable, and nothing overflows horizontally
- **AND** the disabled Continue to payment explains that a locker is needed.

### Requirement: Cart and return page describe the chosen locker

The cart SHALL say that BOX NOW locker delivery is within Greece and that the shopper chooses the locker at checkout. A confirmed paid return page SHALL show the chosen locker and next steps for the parcel number, tracking link, pickup code and full-locker redirection, without promising a reserved compartment.

#### Scenario: Paid order with a chosen locker returns from Stripe

- **WHEN** the return page shows a confirmed paid order that has a locker
- **THEN** it shows the locker name, postcode and ID
- **AND** its Delivery step says the shipping email will carry the BOX NOW parcel number and tracking link, BOX NOW texts the pickup code, and a full locker is replaced by the nearest one.

#### Scenario: Paid fallback order returns from Stripe

- **WHEN** the confirmed paid order has no locker
- **THEN** the page says BlackBox will contact the shopper to arrange the locker
- **AND** it shows no locker facts.
