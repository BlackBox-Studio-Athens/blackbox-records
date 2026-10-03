## ADDED Requirements

### Requirement: A Store Item view makes one bounded Store Offer read

The storefront SHALL share one authoritative Store Offer read among the components of a Store Item view, and the Worker SHALL bound the provider latency of public Store Offer reads without mutating catalog state.

#### Scenario: A Store Item page loads

- **WHEN** the price display and the purchase control of one Store Item view both need its Store Offer
- **THEN** the browser makes exactly one `/api/store/items/:storeItemSlug` request for that view
- **AND** the shared in-flight read is released when it settles, so a later view or explicit refresh reads fresh with `no-store`
- **AND** checkout start still revalidates independently.

#### Scenario: The Worker serves a public Store Offer read

- **WHEN** the Worker resolves a public Store Offer
- **THEN** catalog reconciliation runs in read-only mode and writes no Stripe, D1, mapping, or snapshot state
- **AND** the provider request uses a short bounded timeout, and a timeout follows the existing unavailable-offer semantics instead of holding the request for the SDK default.

### Requirement: Delivery quotes follow settled cart changes

The storefront SHALL request a delivery quote for a settled StoreCart change, not for every intermediate quantity step.

#### Scenario: Shopper changes quantities quickly

- **WHEN** the shopper presses quantity controls several times in quick succession
- **THEN** the client waits for about 250 milliseconds without further changes before requesting a quote
- **AND** a newer request aborts any older in-flight quote, so only the latest result is shown
- **AND** the pay control shows the existing pending state until the latest quote settles.

#### Scenario: Shopper starts checkout after a quote

- **WHEN** the shopper starts checkout
- **THEN** the Worker revalidates lines, stock, delivery, and price authority as before
- **AND** a debounced or aborted client quote is never accepted as checkout authority.

### Requirement: Public API preflights do not reach the store object

The Worker SHALL answer CORS preflight requests for the public commerce API in its entry handler with the same headers the store object would return.

#### Scenario: A browser sends a preflight

- **WHEN** a browser sends `OPTIONS` to a public commerce API route
- **THEN** the entry Worker answers it with the existing allowed origin, methods, and headers
- **AND** the store Durable Object is not invoked for the preflight.
