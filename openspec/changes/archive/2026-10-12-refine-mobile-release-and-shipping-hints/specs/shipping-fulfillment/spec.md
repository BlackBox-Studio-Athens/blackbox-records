## MODIFIED Requirements

### Requirement: Shoppers outside Greece get an email ordering route

The public site SHALL use Cloudflare network country only as an initial delivery hint. When that hint is foreign and no explicit delivery choice exists, it SHALL explain Greece-only online checkout and offer an email link for ordering from abroad. A shopper SHALL be able to correct the hint to delivery in Greece across all shared placements and change that choice back. Presentation choices MUST NOT change checkout or fulfillment eligibility.

#### Scenario: Shopper abroad browses a Store collection

- **GIVEN** the visitor country resolves to a valid code other than `GR` without an explicit delivery choice, or the shopper has chosen delivery outside Greece
- **WHEN** a Store collection page renders
- **THEN** a shipping strip states that the label ships within Greece only, for now
- **AND** it offers an "Email us to order" link to `orders@blackboxrecordsathens.com` with the subject "Order from outside Greece"
- **AND** a "Deliver to Greece" action can correct the network hint.

#### Scenario: Shopper abroad views a Store Item

- **GIVEN** the network hint or explicit delivery choice indicates delivery outside Greece
- **WHEN** the Store Item purchase actions render
- **THEN** a line after them states Greece-only shipping and offers the email link
- **AND** the link's body template lists that item's title, then empty Country and City fields
- **AND** the existing truck and `Ships within Greece only.` use the Store active accent, while `Outside Greece?` remains muted and the underlined email link remains foreground, without a trailing arrow
- **AND** the line preserves its inline wrapping, typography, 44px targets and visible keyboard focus without adding a box, border or padding
- **AND** the same delivery correction is available.

#### Scenario: Shopper abroad reviews the cart or checkout

- **GIVEN** the network hint or explicit delivery choice indicates delivery outside Greece
- **AND** the cart has items
- **WHEN** the shopper opens the cart drawer or checkout
- **THEN** a card explains that online checkout ships within Greece only and offers the email link
- **AND** the link's body template lists the current cart item titles
- **AND** the same delivery correction is available.

#### Scenario: Greek destination behind foreign network routing

- **GIVEN** a foreign network hint displays an international notice
- **WHEN** the shopper chooses "Deliver to Greece"
- **THEN** every shared placement replaces international-only copy with a quiet "Delivery: Greece" confirmation and a "Change" action
- **AND** the explicit choice wins over a late automatic hint
- **AND** changing the destination back restores international email assistance
- **AND** checkout still validates the actual shipping address.

#### Scenario: Shopper in Greece

- **GIVEN** the network hint resolves to `GR` without an explicit international delivery choice
- **WHEN** any Store collection, Store Item, cart drawer or checkout view renders
- **THEN** no international notice is rendered, including before the hint resolves.

#### Scenario: Country is unknown

- **GIVEN** no explicit delivery choice exists
- **AND** the lookup fails, times out, or returns an unknown, `XX` or `T1` value
- **WHEN** any placement renders
- **THEN** the notice stays hidden
- **AND** browsing and checkout remain usable.

#### Scenario: Notice stays quiet

- **GIVEN** the notice is shown in any placement
- **WHEN** the shopper browses or checks out
- **THEN** it remains static, without a modal, popup or live region
- **AND** country is looked up at most once per document and a full reload refreshes the automatic hint
- **AND** legacy persisted automatic hints are ignored
- **AND** only an explicit delivery choice persists within the tab when storage is available, with an in-memory fallback when it is unavailable
- **AND** neither the hint nor presentation choice is sent to the Worker
- **AND** checkout requests, country validation and Greek checkout behavior remain unchanged.
