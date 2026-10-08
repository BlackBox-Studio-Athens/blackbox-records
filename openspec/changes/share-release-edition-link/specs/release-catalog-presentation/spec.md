## MODIFIED Requirements

### Requirement: Releases exposes explicit interaction targets

Releases SHALL expose native release artwork/title and artist links, the existing canonical physical edition action, visible title detail access and independent shell listening controls. When a release has a native Store edition, its artwork SHALL link to that edition, the same destination as its edition action, and both SHALL derive from one value; otherwise the artwork links to the release detail. The artwork link SHALL serve pointer navigation without adding a duplicate keyboard stop; the title SHALL expose keyboard detail access. The principal action row MUST NOT repeat that detail link as another CTA. Summaries, dates, formats, status labels and unused container space MUST remain selectable inert content. Listening targets MUST NOT activate artwork or card hover feedback.

#### Scenario: Visitor reads or selects metadata

- **WHEN** a visitor clicks or selects a summary, date, format, status label or unused card area
- **THEN** the page remains in place without navigation or player intent
- **AND** there is no stretched link covering that content

#### Scenario: Visitor uses an explicit action

- **WHEN** a visitor activates artwork or the title, the artist credit, an edition action or Listen
- **THEN** the intended release, artist, canonical edition or shell-player behavior runs independently
- **AND** links expose their destinations, keyboard focus and usable targets without nested anchors

#### Scenario: Artwork and edition action act as one target

- **WHEN** a release has a native Store edition and a visitor points at its artwork, or points at or keyboard-focuses its edition action
- **THEN** both lead to the same canonical edition and show the same feedback: the action's own hover look
- **AND** a vinyl edition's record slides partly out of the sleeve on hover-capable layouts from 64rem, below the lead cover and beside the others, unless reduced motion is requested
- **AND** the record photo is requested only once the card is first hovered or focused
- **AND** pointing at Listen leaves the artwork, the record and the edition action at rest

#### Scenario: Non-buyable edition action renders

- **WHEN** a native edition has no buyable offer
- **THEN** its action reads "Vinyl edition", "CD edition" or "Cassette edition" in uppercase mono between muted brackets that close in and brighten while engaged
- **AND** the brackets are not part of its accessible name, and the artwork link is named after the release and its edition

### Requirement: Ordinary buying actions share restrained purchase feedback

Enabled ordinary Buy actions on Releases and Store SHALL give subtle hover, visible keyboard focus and pressed feedback without layout movement or JavaScript animation. Releases Buy vinyl SHALL keep the shared restrained primary feedback. The Store card Buy SHALL take the Listen chrome (dark face, hairline edge, the Listen hover highlight with a Store Blood hover edge) with the same stationary footprint, busy, disabled and reduced-motion behaviour. Disabled or loading controls MUST NOT receive active hover feedback. Existing preorder and Listen treatments MUST retain their independent meanings and reduced-motion support.

#### Scenario: Visitor hovers Buy

- **WHEN** a hover-capable pointer enters an enabled ordinary buying action
- **THEN** its face and edge provide subtle local feedback
- **AND** a Store card Buy's edge turns Store Blood with the Listen highlight, while Releases Buy vinyl keeps its restrained tonal feedback
- **AND** its footprint and surrounding artwork remain unchanged, apart from the vinyl record that slides out behind a Releases card's artwork linking to the same edition

#### Scenario: Buying is disabled or loading

- **WHEN** a buying control is disabled or loading
- **THEN** its action remains unavailable and does not acquire enabled hover feedback
- **AND** a Store card Buy keeps its resting Listen chrome
- **AND** reduced-motion preference removes nonessential transition timing
