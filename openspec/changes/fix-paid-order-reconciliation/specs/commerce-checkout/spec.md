## MODIFIED Requirements

### Requirement: Paid checkout return avoids duplicate visual status surfaces

The system MUST show one final order confirmation only when verified payment and Worker-owned paid order state agree, with an accessible pending marker while the initial status read resolves.

#### Scenario: Checkout return state is still resolving

- **GIVEN** a shopper has returned from Stripe Checkout
- **WHEN** the browser has not yet loaded the Worker-owned checkout state
- **THEN** the page exposes an accessible pending marker only
- **AND** it does not show retry, cart, item, or continue-shopping recovery actions.

#### Scenario: Paid checkout state is confirmed

- **GIVEN** the Worker returns payment success and `orderStatus` is `paid`
- **WHEN** the checkout return page renders the result
- **THEN** the page shows one final success surface with next steps
- **AND** it does not show the non-final recovery/status card behind or before that success surface
- **AND** StoreCart clearing is permitted only after this confirmed result.

#### Scenario: Payment precedes order reconciliation

- **GIVEN** the Worker reports payment success but order status is null or pending payment
- **WHEN** the checkout return renders
- **THEN** it explains that payment was received and order confirmation is pending
- **AND** it does not claim the order is recorded, clear StoreCart, or suggest paying again
- **AND** it performs bounded non-overlapping status refreshes before offering manual refresh and support.

#### Scenario: Paid checkout requires review

- **GIVEN** payment succeeded but the order requires review or has a conflicting terminal status
- **WHEN** the checkout return renders
- **THEN** it shows a support action without claiming completed order fulfillment
- **AND** it stops automatic refresh, preserves StoreCart, and does not offer a duplicate-payment action.

#### Scenario: Refresh ends or fails

- **WHEN** the finite refresh budget ends, a status request fails, or the component unmounts
- **THEN** automatic polling stops without overlapping or orphaned requests
- **AND** a mounted unresolved page retains a truthful status and manual refresh/support actions
- **AND** previously verified payment success is not replaced by a generic error offering another payment
- **AND** status reads never mutate orders or stock.

#### Scenario: Payment has not completed

- **WHEN** the Session is processing payment, open, cancelled, or expired
- **THEN** only processing results receive bounded automatic refresh
- **AND** existing open/cancelled/expired recovery remains available unless review or conflicting terminal order facts require support instead.
