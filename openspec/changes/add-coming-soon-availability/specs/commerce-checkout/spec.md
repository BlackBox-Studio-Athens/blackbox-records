# Spec Delta

## MODIFIED Requirements

### Requirement: Sold Out copy reflects confirmed online depletion

When effective OnlineStock is exhausted without an independent selling pause, the Store Offer SHALL report the variant's staff-chosen zero-stock state: Coming Soon, Repressing or Sold Out, defaulting to Sold Out. Coming Soon and Repressing MAY carry an unexpired expected month. A missing stock record SHALL count as zero stock with the default. A missing availability record or an independent selling pause SHALL report the technical state unavailable, which shoppers never see as a label. The non-buyable offer SHALL carry the state as a typed field beside its label. The rule SHALL apply equally to BlackBox Releases and Distro items.

#### Scenario: Depletion is confirmed

- **GIVEN** a valid Store Item has availability, no independent pause, and existing stock confirming no effective OnlineStock
- **WHEN** the Worker returns a non-buyable offer
- **THEN** its state and label are coming_soon/Coming Soon, repressing/Repressing or sold_out/Sold Out as staff chose
- **AND** a Coming Soon or Repressing offer carries expectedMonth only while that month has not passed in Europe/Athens
- **AND** checkout eligibility is false and price is null.

#### Scenario: Restock intent only affects depleted stock

- **GIVEN** effective OnlineStock is positive
- **WHEN** the Worker returns the offer, whatever zero-stock state or expected month is saved
- **THEN** the choice does not change the availability label, pre-order or checkout eligibility.

#### Scenario: BlackBox Releases and Distro share the rule

- **GIVEN** a BlackBox Release and a Distro item have the same effective stock and zero-stock choice
- **WHEN** their offers are read
- **THEN** both receive the same state and label and remain non-buyable.

#### Scenario: Depletion is not established

- **WHEN** the availability record is missing, selling is independently paused, or non-buyable availability has positive effective stock
- **THEN** the offer state is unavailable and the storefront shows no status label and no purchase action for it
- **AND** a missing stock record instead reads as depleted stock with the zero-stock default, Sold Out
- **AND** catalog-drift and checkout-capability messages retain their existing meanings.

### Requirement: Purchase status is clear without duplicate messaging

The storefront SHALL display the resolved non-buyable label in the approved compact, left-aligned, hard-edged disabled purchase control while retaining artwork, information, listening, and existing navigation. Enabled, pending, and disabled purchase states SHALL share the same responsive action geometry. Presentation tone SHALL follow the offer's typed state, not its label text, without changing eligibility. A shown expected month SHALL appear directly below the control as "Expected Month YYYY".

#### Scenario: Non-buyable offer resolves

- **WHEN** detail or compatibility-route purchase actions receive a non-ready offer
- **THEN** they display its label without using the text to decide eligibility or tone
- **AND** an adjacent successfully resolved price region does not repeat a status headline or invent a price, while standalone price/summary regions retain useful feedback
- **AND** detail and compatibility-route instructions to add the item are absent.

#### Scenario: Pending or failed request

- **WHEN** the purchase offer is loading or its read fails
- **THEN** the action stays disabled with pending feedback or neutral unavailable copy
- **AND** an older snapshot does not restore an enabled action.

#### Scenario: Stock is restored

- **WHEN** a subsequent fresh offer is ready
- **THEN** Add To Cart, its supporting hint, and current price return, and any expected month and Notify me form disappear
- **AND** checkout start still validates current authority.

#### Scenario: Accessible status

- **WHEN** status renders on a narrow screen or with increased text size
- **THEN** its text has at least 4.5:1 contrast, the control has a minimum 44px height, and there is no clipping or horizontal overflow
- **AND** the status is at most 14rem wide and approximately 54px high, with a transparent near-black face
- **AND** pending busy feedback clears and the resolved purchase label is announced politely.

#### Scenario: Purchase states share geometry

- **WHEN** the action changes between Checking availability, Add To Cart, Coming Soon, Repressing, Sold Out or Checkout Paused
- **THEN** the control remains 224px wide and 54px high on desktop and fills the available action width on mobile
- **AND** the enabled Add To Cart state retains its primary filled treatment while disabled states remain outlined.

#### Scenario: Inventory states have a subtle visual distinction

- **WHEN** effective online stock is exhausted
- **THEN** Sold Out uses a solid subtle Store Blood outline
- **AND** Coming Soon and Repressing use a dashed neutral outline, the convention for "not here yet", with a small leading icon (a disc for Coming Soon, a circular arrow for Repressing) and a short line below: "First pressing on its way" or "More copies being pressed", followed by any shown expected month
- **AND** Checkout Paused uses the neutral gray outline, and an unavailable offer renders no status control
- **AND** styling does not determine purchase eligibility.

## ADDED Requirements

### Requirement: Cart and checkout reuse the availability vocabulary

Cart lines and checkout review SHALL name a line that is no longer buyable with the same state label the item page would show: Coming Soon, Repressing or Sold Out. An unavailable line SHALL show no state label and SHALL still be blocked from checkout. Catalog drift SHALL keep its Checkout Paused meaning.

#### Scenario: A cart line's item stops being buyable

- **WHEN** a stored cart line's fresh offer reads Coming Soon
- **THEN** the cart chip reads Coming Soon and the line cannot proceed to checkout
- **AND** Out of Stock, Currently Unavailable and Unavailable are never shown.
