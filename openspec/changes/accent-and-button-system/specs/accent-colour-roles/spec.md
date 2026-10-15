## Purpose

Define stable semantic colour roles for public BlackBox surfaces so purchase, pre-order, listening and editorial information remain recognizable across routes.

## ADDED Requirements

### Requirement: Public accents use the approved token values

The public palette SHALL retain monochrome grounds and use only the approved Sea Green, Flint and Slate role families, with a separate error red family reserved for international restriction notices. Store Blood, Services Rose, Listen amber and superseded purchase-accent tokens and tinted literals SHALL be removed from public presentation. Staff's separate palette SHALL remain outside this contract.

#### Scenario: Accent tokens are resolved

- **WHEN** the public theme resolves its accent tokens
- **THEN** Sea face/text/hover/light/surface are #2d766a, #4ca999, #256258, #7cc7b9 and rgba(45,118,106,.16)
- **AND** Flint 800/700/500/300/surface are #4d595c, #626e72, #889396, #c1cbce and rgba(98,110,114,.16)
- **AND** Slate edge/text/light/surface are #366e99, #66a2d2, #91c4ee and rgba(54,110,153,.16)
- **AND** error red 700/500/surface are #bc4945, #e4706a and rgba(188,73,69,.16), reserved for the international restriction notice contract below
- **AND** page ground is #0d0d0d, charcoal is #141414, ink is #f5f5f5, muted information is #b3b3b3, and neutral action face/text are #e8e8e8/#090909.

### Requirement: Sea Green identifies only pre-orders

Sea Green SHALL identify only purchases and information for open pre-orders. Pre-order actions SHALL be filled at rest; ordinary buying, listening, general navigation and titles SHALL NOT use Sea Green.

#### Scenario: A pre-order is available

- **WHEN** truthful current data permits Pre-order or Pre-order vinyl
- **THEN** its control uses Sea #2d766a with a white label, #256258 hover/pressed and #4ca999 hover edge
- **AND** pre-order status, Vinyl ships, Pre-orders selection and its count use Sea text/edge/surface as appropriate.

#### Scenario: The item is an ordinary stocked purchase

- **WHEN** Buy or Add to cart is available without an open pre-order
- **THEN** the control uses Flint and no Sea styling suggests waiting for copies.

### Requirement: Flint identifies buying and editorial labels

Flint SHALL identify ordinary purchase faces, readable editorial labels, current navigation and selected filters using a cool gray family at OKLCH hue 215 and chroma 0.012 to 0.016. Static labels SHALL remain distinguishable from interactive controls by structure, typography and semantics.

#### Scenario: Shopper scans editorial and purchase surfaces

- **WHEN** Buy, a news tag, kicker, artist link, current nav/tab, selected non-preorder chip, Sold Out or Only N left status renders
- **THEN** Buy, Buy vinyl and Add to cart use #626e72 fill with a white #f5f5f5 label/format mark at 4.82:1 contrast, #4d595c hover/pressed face and #889396 hover edge
- **AND** tags use #626e72 edges/#889396 text, and kickers/artist underline/current nav and tab underline/selected chip edge use #889396, whose text contrast is 5.84:1 on #141414 and whose lightness is lower than muted #b3b3b3
- **AND** hover text on Flint information uses #c1cbce while control labels stay white
- **AND** Sold Out and Only N left use a #626e72 edge and rgba(98,110,114,.16) surface, and Read News, View Full Roster and Continue shopping use #141414 faces with #626e72 inverse edges
- **AND** static tags and status are not focusable actions and selection remains indicated beyond colour
- **AND** Coming Soon and Repressing keep their dashed neutral boxes, while digital and pre-order lifecycle lines remain plain.

### Requirement: Error red marks international restriction notices only

Error red SHALL mark only the international restriction notices in the non-Greek buyer flow: the item page notice, Store strip, cart drawer and checkout card. Notice edges SHALL use error 700 #bc4945, and notice icons and restriction text SHALL use error 500 #e4706a. The error surface token SHALL be rgba(188,73,69,.16), defined but unapplied while the notices retain their Charcoal #141414 faces. Error red SHALL NOT be used as a control face or for form validation errors.

#### Scenario: A non-Greek buyer encounters an international restriction notice

- **WHEN** the existing international restriction notice renders on the item page, Store strip, cart drawer or checkout card for a non-Greek buyer
- **THEN** its icon and restriction text use #e4706a and any notice edge uses #bc4945
- **AND** the notice retains its existing copy, restriction meaning and Charcoal face, without a red control fill
- **AND** form validation errors remain Flint 300 #c1cbce beside a visible Error label.

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

Public form errors SHALL use Flint 300 #c1cbce with a visible Error label and a textual explanation associated with the relevant control. Colour SHALL NOT be the only error signal, and validation or consent meaning SHALL NOT change.

#### Scenario: A public field is invalid

- **WHEN** newsletter, inquiry, availability, cart or checkout validation reports an error
- **THEN** the user sees a visible Error label beside the explanation in Flint 300 #c1cbce
- **AND** invalid state and the accessible error association remain available, with entered values preserved.
