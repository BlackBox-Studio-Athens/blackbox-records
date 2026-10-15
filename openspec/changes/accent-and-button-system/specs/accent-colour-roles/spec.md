## Purpose

Define stable semantic colour roles for public BlackBox surfaces so purchase, pre-order, listening and editorial information remain recognizable across routes.

## ADDED Requirements

### Requirement: Public accents use the approved token values

The public palette SHALL retain monochrome grounds and use only the approved Sea Green, Violet and Slate accent families. Store Blood, Services Rose, Listen amber and their tinted literals SHALL be removed from public presentation. Staff's separate palette SHALL remain outside this contract.

#### Scenario: Accent tokens are resolved

- **WHEN** the public theme resolves its accent tokens
- **THEN** Sea face/text/hover/light/surface are #2d766a, #4ca999, #256258, #7cc7b9 and rgba(45,118,106,.16)
- **AND** Violet face/text/hover/light/surface are #7d58a0, #b08fd0, #664584, #cab2e4 and rgba(125,88,160,.16)
- **AND** Slate edge/text/light/surface are #366e99, #66a2d2, #91c4ee and rgba(54,110,153,.16)
- **AND** page ground is #0d0d0d, charcoal is #141414, ink is #f5f5f5, muted information is #b3b3b3, and neutral action face/text are #e8e8e8/#090909.

### Requirement: Sea Green identifies only pre-orders

Sea Green SHALL identify only purchases and information for open pre-orders. Pre-order actions SHALL be filled at rest; ordinary buying, listening, general navigation and titles SHALL NOT use Sea Green.

#### Scenario: A pre-order is available

- **WHEN** truthful current data permits Pre-order or Pre-order vinyl
- **THEN** its control uses Sea #2d766a with a white label, #256258 hover/pressed and #4ca999 hover edge
- **AND** pre-order status, Vinyl ships, Pre-orders selection and its count use Sea text/edge/surface as appropriate.

#### Scenario: The item is an ordinary stocked purchase

- **WHEN** Buy or Add to cart is available without an open pre-order
- **THEN** the control uses Violet and no Sea styling suggests waiting for copies.

### Requirement: Violet identifies buying and editorial labels

Violet SHALL identify ordinary purchase faces, readable editorial labels, current navigation and selected filters. Static labels SHALL remain distinguishable from interactive controls by structure, typography and semantics.

#### Scenario: Shopper scans editorial and purchase surfaces

- **WHEN** Buy, a news tag, kicker, artist link, current nav/tab, selected non-preorder chip, Sold Out or Only N left status renders
- **THEN** Buy uses #7d58a0 fill and white label/format mark, tags use #7d58a0 edge/#b08fd0 text, and kickers/artist underline/current underline/selected chip edge use #b08fd0
- **AND** Sold Out and Only N left use a #7d58a0 edge and rgba(125,88,160,.16) surface, and Read News, View Full Roster and Continue shopping use #141414 faces with #7d58a0 inverse edges
- **AND** static tags and status are not focusable actions and selection remains indicated beyond colour
- **AND** Coming Soon and Repressing keep their dashed neutral boxes, while digital and pre-order lifecycle lines remain plain.

### Requirement: Slate identifies listening and small marks

Slate SHALL identify Listen edges/bars and small informational marks. Slate SHALL NOT become a solid purchase face or a title colour. Listen hover and session state MAY use the translucent Slate surface while keeping their action label white.

#### Scenario: Listening and metadata render

- **WHEN** Listen or In player renders
- **THEN** the resting face is #141414 with #366e99 edge, #66a2d2 bars and #f5f5f5 label
- **AND** hover/session state uses rgba(54,110,153,.16) over charcoal and a #66a2d2 edge without claiming verified playback.

#### Scenario: Small marks render

- **WHEN** a date/catalog line, current swipe dot, link hover underline, input focus edge or Est. 2026 renders
- **THEN** it uses #66a2d2, with #91c4ee reserved for hover text on Slate information
- **AND** catalog number pronunciation, unit wrapping and date semantics are preserved
- **AND** Store format lines remain plain Inter 13px semibold capitals in ink with no leading Slate mark; Buy retains its existing white format icon.

### Requirement: Titles remain ink Veneer

Public content titles SHALL retain production Veneer and ink #f5f5f5. Colour SHALL be carried by the assigned labels, underlines and small marks rather than title glyphs.

#### Scenario: A long release title renders

- **WHEN** LOTUS, Disintegration or another release, artist, news or Store title renders
- **THEN** its title remains ink Veneer, preserves source casing and wraps without an accent-coloured title variant.

### Requirement: Form errors are labelled and connected

Public form errors SHALL use Violet 300 #cab2e4 with a visible Error label and a textual explanation associated with the relevant control. Colour SHALL NOT be the only error signal, and validation or consent meaning SHALL NOT change.

#### Scenario: A public field is invalid

- **WHEN** newsletter, inquiry, availability, cart or checkout validation reports an error
- **THEN** the user sees Error and the explanation in Violet 300
- **AND** invalid state and the accessible error association remain available, with entered values preserved.
