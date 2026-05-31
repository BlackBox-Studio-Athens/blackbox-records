## ADDED Requirements

### Requirement: Checkout API responses are not cache-authoritative
The system MUST keep checkout and Store Offer authority in the Worker, D1, and Stripe seams rather than in browser, CDN, or service-worker caches.

#### Scenario: Checkout session is created
- **GIVEN** the browser submits checkout intent
- **WHEN** the Worker returns a checkout session response
- **THEN** the response includes `Cache-Control: no-store`
- **AND** no shared cache can replay a prior checkout URL for a later request.

#### Scenario: Checkout state is read
- **GIVEN** the browser reads a checkout session state
- **WHEN** the Worker returns payment/order status
- **THEN** the response includes `Cache-Control: no-store`
- **AND** the browser must not rely on cached payment, order, or cart-clearing decisions.

#### Scenario: Store capabilities are read
- **GIVEN** the browser reads checkout capability status
- **WHEN** the Worker returns capability state
- **THEN** the response includes an explicit cache policy
- **AND** the policy does not permit stale provider capability, feature-gate, or PRD disabled-state data to become checkout authority.

### Requirement: Store Offer freshness is explicit
The system SHALL keep Store Offer read freshness explicit before any nonzero cache TTL is introduced.

#### Scenario: Store Offer response includes checkout-facing data
- **WHEN** a Store Offer response includes availability, stock, Stripe Price mapping, checkout eligibility, or feature-gate-derived state
- **THEN** the response defaults to `Cache-Control: no-store`
- **AND** the Worker revalidates the request again before creating a hosted Checkout Session.

#### Scenario: Presentation-only catalog caching is proposed
- **GIVEN** a future implementation wants to cache store presentation data
- **WHEN** that data is separable from availability, stock, payment, provider mapping, and checkout eligibility
- **THEN** the implementation may propose a split presentation endpoint or static projection cache
- **AND** checkout start still validates against Worker/D1/Stripe authority.

### Requirement: Browser API fetches express fresh-read intent
The system SHALL make browser fetch behavior consistent with Worker cache headers for checkout-related API reads.

#### Scenario: Checkout frontend reads Worker API
- **WHEN** browser checkout code calls public Worker checkout or Store Offer APIs
- **THEN** the request path uses explicit fresh-read intent where the fetch abstraction supports it
- **AND** the UI loading state does not imply that cached browser state is authoritative.
