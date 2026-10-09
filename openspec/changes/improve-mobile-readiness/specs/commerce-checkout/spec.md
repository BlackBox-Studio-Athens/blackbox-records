## MODIFIED Requirements

### Requirement: A Store Item view makes one bounded Store Offer read

The storefront SHALL share one authoritative Store Offer read among the components of a Store Item view, and the Worker SHALL bound the provider latency of public Store Offer reads without mutating catalog state. The browser SHALL bound its Store Item offer read at 10 seconds where the browser supports a timeout signal, and an unreadable offer SHALL show a visible unavailable state with Try Again instead of silently removing the purchase action.

#### Scenario: A Store Item page loads

- **WHEN** the price display and the purchase control of one Store Item view both need its Store Offer
- **THEN** the browser makes exactly one `/api/store/items/:storeItemSlug` request for that view
- **AND** the shared in-flight read is released when it settles, so a later view or explicit refresh reads fresh with `no-store`
- **AND** checkout start still revalidates independently.

#### Scenario: The Worker serves a public Store Offer read

- **WHEN** the Worker resolves a public Store Offer
- **THEN** catalog reconciliation runs in read-only mode and writes no Stripe, D1, mapping, or snapshot state
- **AND** the provider request uses a short bounded timeout, and a timeout follows the existing unavailable-offer semantics instead of holding the request for the SDK default.

#### Scenario: The Store Item offer read fails

- **WHEN** the offer read fails, times out or the shopper is offline
- **THEN** the purchase area shows `Could not check availability.` with Try Again
- **AND** Try Again or the browser coming back online reads the offer again
- **AND** listing cards keep their existing unavailable-offer presentation.

### Requirement: Checkout return pending state is visible

The checkout return page SHALL show a visible pending state while it confirms checkout session state with the Worker. Until the Worker first answers, read failures SHALL keep the pending state and retry after 2, 5 and 10 seconds, and again when the browser comes online or the page becomes visible. If the retries are exhausted, the page SHALL show a failure view with Refresh status and a way to contact the label, never Retry Checkout. Worker answers SHALL keep their own views.

#### Scenario: Checkout return status is loading

- **GIVEN** the shopper returns from hosted Checkout with a session identifier
- **WHEN** the browser is waiting for the Worker checkout-state read
- **THEN** the page renders a visible payment-status confirmation state
- **AND** the pending region exposes `aria-busy` or `role="status"` with polite live announcement
- **AND** the page does not look empty while payment state is unknown.

#### Scenario: The return page loses its connection

- **GIVEN** the return page's status reads fail before the Worker has answered
- **WHEN** the retries are exhausted
- **THEN** the page shows `Could Not Check Payment` with Refresh status and Contact the label
- **AND** it offers no Retry Checkout action.

### Requirement: Cart dismissal remains reachable while content scrolls

The storefront SHALL keep the Cart heading and a visible Close control with a minimum 44px target above independently scrolling cart content, with Checkout and Continue Shopping pinned below it. On viewports up to 30rem tall, the drawer header SHALL compact, its note SHALL become an accessible description only, and Checkout and Continue Shopping SHALL share one row, so cart lines keep a usable scrolling window.

#### Scenario: Compact overflowing cart

- **WHEN** a shopper scrolls a multi-item cart at 320×568, 390×667 or 390×844
- **THEN** the heading, Close, Checkout and Continue Shopping remain visible and operable
- **AND** long titles and delivery loading, available and error states remain within the scrolling content
- **AND** the background page stays stationary and the player session remains intact.

#### Scenario: Empty cart

- **WHEN** the cart becomes empty
- **THEN** Close and Continue Shopping remain reachable
- **AND** Checkout is absent.

#### Scenario: Landscape phone opens a multi-item cart

- **WHEN** a shopper opens a multi-item cart at 844×390
- **THEN** Close, Checkout and Continue Shopping are visible
- **AND** the cart lines scroll within a window of at least 150 CSS pixels.

## ADDED Requirements

### Requirement: Checkout recovers after a back-forward cache restore

When the checkout page is restored from the back-forward cache, it SHALL re-enable Pay, and a second press SHALL reuse the stored checkout attempt instead of creating another hosted Checkout Session.

#### Scenario: Shopper returns from Stripe with Back

- **GIVEN** a shopper pressed Pay and the browser left for hosted Checkout
- **WHEN** they press Back and the browser restores the checkout page from the back-forward cache
- **THEN** Pay is enabled
- **AND** pressing it resumes the same checkout attempt.

### Requirement: Connection failures use one plain message

Network, abort and timeout failures of the public offer, checkout start, delivery quote and return status reads SHALL show `Connection problem. Check your network and try again.` instead of the browser's error text.

#### Scenario: Checkout start loses the network

- **WHEN** the checkout start request fails at the network level
- **THEN** the page shows the connection-problem message
- **AND** no raw browser error text is shown.

### Requirement: The checkout quantity editor has a visible name

The checkout order summary's quantity editor control SHALL read `Edit quantities` as visible text that is also its accessible name, with a 44 px target on coarse pointers.

#### Scenario: Shopper reviews a multi-item order on a phone

- **WHEN** the checkout order summary is shown
- **THEN** a visible `Edit quantities` control opens the quantity editor
- **AND** its accessible name matches its visible text.
