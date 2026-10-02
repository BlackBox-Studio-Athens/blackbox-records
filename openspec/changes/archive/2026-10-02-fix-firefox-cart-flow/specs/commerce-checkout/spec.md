## ADDED Requirements

### Requirement: Cart dismissal remains reachable while content scrolls

The storefront SHALL keep the Cart heading and a visible Close control with a minimum 44px target above independently scrolling cart content, with Checkout and Continue Shopping pinned below it.

#### Scenario: Compact overflowing cart

- **WHEN** a shopper scrolls a multi-item cart at 320×568, 390×667 or 390×844
- **THEN** the heading, Close, Checkout and Continue Shopping remain visible and operable
- **AND** long titles and delivery loading, available and error states remain within the scrolling content
- **AND** the background page stays stationary and the player session remains intact.

#### Scenario: Empty cart

- **WHEN** the cart becomes empty
- **THEN** Close and Continue Shopping remain reachable
- **AND** Checkout is absent.

### Requirement: Cart dismissal permits continued shopping

The storefront SHALL restore Store interaction, scrolling and opener focus after Close, Continue Shopping, Escape or backdrop dismissal, without discarding cart state or the active player session.

#### Scenario: BUY after a three-item cart closes

- **WHEN** a shopper dismisses a three-item cart through any supported path and presses BUY
- **THEN** a new product is added or an existing fixed-price product quantity increases
- **AND** the cart reopens with the updated state
- **AND** reload preserves the cart.
