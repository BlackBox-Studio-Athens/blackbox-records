## ADDED Requirements

### Requirement: Delivery information offers a browse-only locker finder

The Delivery & returns page SHALL offer a Find a locker near you panel with a Show the locker map action that opens BOX NOW's public map inside the panel. The finder SHALL only browse: it SHALL NOT save a choice, change the cart or affect checkout, and it SHALL load nothing from BOX NOW until the shopper taps.

#### Scenario: Shopper browses lockers before buying

- **WHEN** a shopper taps Show the locker map
- **THEN** BOX NOW's map opens inside the panel and can be closed again
- **AND** selecting a locker there does not prefill checkout or the Use this locker shortcut.

#### Scenario: The map cannot load

- **WHEN** the finder's map fails to load
- **THEN** the panel says the map is unavailable and that the locker is chosen at checkout
- **AND** the rest of the page keeps working.
