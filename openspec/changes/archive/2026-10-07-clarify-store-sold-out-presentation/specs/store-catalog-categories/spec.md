## ADDED Requirements

### Requirement: Store cards expose whole-item navigation and unobstructed availability

All Store categories SHALL use one native link covering each card except its independent Listen button. Cards SHALL retain price and show resolved unavailability beside it, wrapping on narrow layouts without covering artwork. Active Coverflow cards SHALL expose the same purchase information.

#### Scenario: Shopper opens a card

- **WHEN** artwork, title, artist, format, price, status, or empty card space is activated
- **THEN** the existing Store Item destination opens using native link semantics, including modified clicks
- **AND** Listen remains independently operable without navigation, with one destination-link focus stop and visible focus.

#### Scenario: A depleted item appears

- **WHEN** fresh listing data reports sold_out or out_of_stock
- **THEN** Sold Out or Out of Stock appears beside the retained price with readable text and the corresponding subtle Store Blood or neutral outline
- **AND** artwork, listening, image previews and card navigation remain usable on mobile, desktop, zoomed layouts and active Coverflow cards.
