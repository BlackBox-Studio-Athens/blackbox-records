# Spec Delta

## MODIFIED Requirements

### Requirement: Releases page assigns exclusive presentation roles

The system SHALL assign each Release on `/releases/` to at most one top-level role: selected physical campaign, buyable physical remainder, announced physical edition, or other editorial catalog entry. A digital release date MUST NOT select a physical campaign.

#### Scenario: Featured and upcoming releases are selected

- **GIVEN** the label selects Sidus and Afterwise as its ordered campaigns and both have confirmed buyable vinyl offers
- **WHEN** Releases renders
- **THEN** Sidus leads and Afterwise shares the campaign tier
- **AND** neither appears again in lower sections
- **AND** all other accepted releases remain accessible once

#### Scenario: No upcoming release exists

- **WHEN** every remaining physical edition is already buyable or no physical edition is announced
- **THEN** the page omits the empty coming-on-vinyl role
- **AND** it excludes only selected campaigns from the remaining catalog

#### Scenario: No out-now release exists

- **WHEN** no physical offer can be confirmed as buyable
- **THEN** the catalog keeps useful detail and listening access
- **AND** it does not manufacture a physical campaign from a future or past digital date

#### Scenario: No releases remain after selection

- **WHEN** every accepted release occupies a campaign role
- **THEN** the page omits empty lower sections and placeholder entries

### Requirement: Selected upcoming release has self-contained artwork and information

The system SHALL present announced physical editions with complete identifying editorial content and separate digital and physical messages, without requiring a duplicate card elsewhere.

#### Scenario: Upcoming release is rendered

- **WHEN** Ouranopithecus is digitally released but its vinyl cannot yet be ordered
- **THEN** its presentation includes linked artwork and title, artist, semantic digital date, optional summary and formats
- **AND** its messages distinguish Digital out now from Vinyl coming later
- **AND** it retains View release and available Listen without asserting an open preorder
- **AND** artwork uses the existing responsive image handling and authored alt text or title fallback

#### Scenario: Upcoming artwork loads beside the feature

- **WHEN** campaign and supporting artwork render
- **THEN** only the lead campaign image receives first-viewport priority
- **AND** all other artwork uses responsive non-priority delivery

### Requirement: Releases page presents distinct editorial tiers

The system SHALL retain the current principal split and present eligible physical records there in label-preferred order, filling unavailable positions automatically from the next eligible records. Remaining open preorders SHALL precede available regular offers, then announced physical editions that cannot be ordered and other editorial entries. These internal ordering roles SHALL share the existing Our releases catalog rather than requiring separate small storefront sections.

#### Scenario: All three roles are available

- **GIVEN** Sidus and Afterwise are the selected buyable vinyl campaigns, Chronoboros has stocked vinyl, and Ouranopithecus has only a future physical edition
- **WHEN** Releases renders
- **THEN** the campaign tier presents Sidus then Afterwise
- **AND** Chronoboros remains visible under Our releases with its buying path
- **AND** Ouranopithecus follows in that same lower catalog with separate digital and future-vinyl messages

#### Scenario: Visitor reads the page in source order

- **WHEN** a visitor reads or tabs through Releases
- **THEN** campaign content precedes other open preorders, stocked records, announced editions and the remaining catalog
- **AND** record headings and visible physical states expose that order to assistive technology without unnecessary section labels

#### Scenario: Wide viewport uses the selected asymmetric composition

- **WHEN** two selected campaigns are available at a wide viewport
- **THEN** both have complete identity and action information in the principal campaign area
- **AND** the label-selected first entry owns the lead emphasis
- **AND** lower tiers begin after that area without duplicate releases

### Requirement: Each release tier keeps role-appropriate emphasis

The system SHALL emphasize the physical purchase path for buyable campaigns and stocked records while preserving independent listening and release-detail navigation. Announced or unavailable editions MUST use truthful text and editorial paths instead of asserted buying actions.

#### Scenario: Featured release renders

- **WHEN** a confirmed buyable physical campaign is available
- **THEN** its presentation retains linked artwork, title, artist, semantic digital context, format, optional summary and available actions
- **AND** its physical edition action leads the action group, followed by independent Listen and release-detail access
- **AND** Pre-order vinyl names an open vinyl preorder and Buy vinyl names a confirmed buyable regular offer
- **AND** a passed exact preorder date alone does not produce a claim that physical copies arrived
- **AND** the action reaches the existing canonical edition purchase path and authoritative offer check
- **AND** controls remain square, visibly focused, usable and able to wrap
- **AND** Listen retains its existing indicator and shell-player behavior

#### Scenario: Selected upcoming release renders

- **WHEN** an announced edition has no confirmed buyable offer
- **THEN** its artwork, title, artist, digital context, optional summary and formats remain visible
- **AND** it gains no asserted stock, fabricated preorder date or checkout action

#### Scenario: Remaining catalog renders

- **WHEN** older stocked physical records remain
- **THEN** the lower tier preserves their artwork, date, title, artist, listening and detail behavior
- **AND** it adds a visible canonical physical purchase path based on current offer state
- **AND** it does not add search, filters, pagination, year grouping, a carousel or placeholder releases

#### Scenario: Release artwork exposes one interaction language

- **WHEN** linked artwork in any tier is used with a pointer or keyboard
- **THEN** its existing restrained scale and timing remain consistent and clipped to its frame
- **AND** reduced-motion preference removes nonessential artwork transforms and transitions

#### Scenario: Tier labels and dividers support the hierarchy

- **WHEN** multiple tiers render
- **THEN** physical state labels remain subordinate to release titles
- **AND** the existing Releases and Our releases identity fits the four-record catalog without Featured records or extra single-record section headings
- **AND** continuous separators support the composition without disconnected repeated boxes

### Requirement: Release tiers omit empty structure and reflow cleanly

The system SHALL omit empty release tiers and SHALL keep the complete hierarchy usable without two-dimensional page scrolling at widths down to 320 CSS pixels.

#### Scenario: Selected upcoming role is empty

- **WHEN** there is no announced physical edition without an open offer
- **THEN** no separate announced-edition heading or wrapper is created
- **AND** present principal and Our releases entries retain their normal order

#### Scenario: Remaining catalog role is empty

- **WHEN** every accepted release occupies a higher role
- **THEN** the remaining catalog heading and wrapper are omitted
- **AND** no filler or placeholder artwork is added

#### Scenario: Hierarchy renders at a narrow viewport

- **WHEN** Releases renders at 320 CSS pixels
- **THEN** its present roles stack in source order
- **AND** titles, artwork, facts, summaries and actions wrap without horizontal page scrolling
- **AND** visible focus, text-based states, semantic dates and usable targets remain available
- **AND** only the lead campaign image is prioritized

### Requirement: Releases page composes its tiers as one Evolved Split Showcase

The Releases page SHALL closely retain its current continuous, rule-bounded BlackBox composition: dominant artwork-and-copy split, compact supporting column and normal square cards under Our releases. Document, reading and keyboard order MUST follow the principal order and then the offer-derived remaining catalog. A four-record catalog MUST NOT gain a Featured records heading or inflated storefront navigation.

#### Scenario: Wide catalog uses the asymmetric showcase

- **WHEN** two selected physical campaigns and lower tiers are available
- **THEN** both campaigns occupy the principal region with complete identity, artwork and purchase facts
- **AND** the first chosen campaign receives lead emphasis
- **AND** lower tiers start after both campaigns and use the available showcase width
- **AND** the second campaign is not relabeled Upcoming solely because of a digital date

#### Scenario: Visual placement does not reorder content

- **WHEN** a visitor reads or tabs through the wide showcase
- **THEN** campaign order precedes the physical remainder and other catalog entries
- **AND** CSS placement does not change that sequence

#### Scenario: Missing tiers do not leave showcase scaffolding

- **WHEN** a principal position or the remaining catalog has no eligible accepted entries
- **THEN** its empty column, row, heading, separator and placeholder are omitted
- **AND** existing content uses the available width without adding separate small state sections

### Requirement: Remaining releases keep normal catalog proportions

Remaining releases SHALL keep square artwork and normal catalog proportions. A sparse collection MUST stay left aligned at its normal width without stretching, centering, duplicate entries or filler. Buyable records MUST retain a clear physical purchase path.

#### Scenario: Sparse remaining catalog stays left aligned

- **WHEN** only one lower-tier stocked record remains
- **THEN** it uses the first normal catalog position
- **AND** unused space remains empty
- **AND** its physical buying path remains visible

#### Scenario: Larger remaining catalog retains its grid

- **WHEN** multiple lower-tier releases remain
- **THEN** they follow normal responsive catalog proportions and their resolved role order
- **AND** each accepted release appears once

### Requirement: Evolved Split Showcase reflows without content loss

The showcase SHALL use intrinsic sizing for titles, physical facts, digital context, summaries and actions. Present tiers MUST stack in source order when their wide layout no longer fits. It MUST remain usable at 320 and 390 CSS pixels, with enlarged text or zoom, and under reduced motion.

#### Scenario: Narrow viewport preserves the full catalog

- **WHEN** the page is viewed at 320 or 390 CSS pixels
- **THEN** its present tiers retain their source order
- **AND** metadata, summaries, formats and actions remain visible and operable without horizontal page scrolling

#### Scenario: Enlarged text grows the composition

- **WHEN** enlarged text or zoom wraps content
- **THEN** regions grow intrinsically without overlap or clipping

#### Scenario: Preserved actions remain operable

- **WHEN** a release exposes a physical action, Listen or View release
- **THEN** their canonical purchase, player and detail behavior remains intact
- **AND** their visible focus and usable targets persist when the group wraps

#### Scenario: Image and motion contracts remain intact

- **WHEN** artwork renders or reduced motion is requested
- **THEN** only the lead campaign image has priority
- **AND** other artwork keeps responsive non-priority loading
- **AND** nonessential artwork motion is suppressed under reduced motion

### Requirement: Highlighted Release summaries use restrained editorial typography

The Releases page SHALL keep highlighted campaign summaries on the existing mono font family with restrained role-appropriate scale, sentence casing, readable line height and wrapping. Other catalog and detail prose MUST remain on the body font.

#### Scenario: Latest Release summary renders

- **WHEN** the selected lead campaign supplies a summary
- **THEN** its summary uses the existing mono family without uppercase transformation or label-style tracking

#### Scenario: Upcoming Release summary renders

- **WHEN** the second selected campaign supplies a summary
- **THEN** its summary uses the same restrained mono treatment at its appropriate supporting scale

#### Scenario: Highlighted summary is absent

- **WHEN** a selected campaign supplies no summary
- **THEN** no empty summary surface or placeholder is rendered

#### Scenario: Catalog cards and details render summaries

- **WHEN** other catalog or detail prose renders
- **THEN** it retains the body family

#### Scenario: Highlighted summaries reflow

- **WHEN** highlighted summaries render at 320 or 390 CSS pixels
- **THEN** they wrap without overlap, clipping or horizontal page scrolling
- **AND** titles, metadata, physical facts and actions retain their hierarchy

## ADDED Requirements

### Requirement: Label choice controls physical campaign priority

The system SHALL accept an explicit label-owned order for physical campaigns through the normal private editorial and publication flow. Only confirmed buyable physical editions SHALL receive buyable campaign treatment. Digital chronology, artist activity and a passed shipping estimate MUST NOT override the label's choice.

#### Scenario: Digital chronology differs from campaign intent

- **GIVEN** Afterwise has a later digital release date but the label chooses Sidus first
- **WHEN** the accepted campaign order renders
- **THEN** Sidus leads and Afterwise remains in the same campaign tier

#### Scenario: Copies arrive during an active campaign

- **WHEN** the existing commerce preorder ends and its confirmed offer remains buyable while its campaign priority remains accepted
- **THEN** the action automatically becomes Buy vinyl and its physical state becomes Vinyl available
- **AND** the record retains its campaign position until the label changes that editorial choice

#### Scenario: Older record receives a new push

- **WHEN** the label chooses a stocked older record as its lead
- **THEN** that record can lead without rewriting its digital date or artist activity

#### Scenario: Offer becomes unavailable

- **WHEN** an edition is sold out, paused or cannot be confirmed
- **THEN** it receives no asserted buying action or buyable campaign state
- **AND** its release information and available listening remain accessible

### Requirement: Digital and physical availability remain separate

The system SHALL describe digital availability independently from physical offer state. Physical buying copy, prices and shipping estimates MUST come from existing commerce authority. Unknown offers MUST use neutral editorial or edition-detail paths without invented stock, price, preorder or shipment claims.

#### Scenario: Digital album is out while vinyl is on preorder

- **WHEN** an album's digital date has passed and its confirmed vinyl offer is a preorder
- **THEN** the page can show Digital out now alongside Vinyl preorder and Pre-order vinyl
- **AND** its expected shipping comes from the preorder offer and remains an estimate

#### Scenario: Digital album is out while vinyl ordering has not opened

- **WHEN** a digital album is available but its announced vinyl has no open offer
- **THEN** the page shows Digital out now and Vinyl coming later with editorial access
- **AND** it does not infer preorder eligibility from the album date or format list

#### Scenario: Offer read fails

- **WHEN** the current physical offer cannot be read or classified
- **THEN** the page exposes useful neutral detail access
- **AND** it does not present a fabricated price or claim that the edition is stocked or on preorder

### Requirement: Release presentation transitions derive automatically from existing facts

The system SHALL derive each record's visible physical state, purchase action and eligible placement from existing accepted editorial timing and the current authoritative public commerce presentation. Opening, closing, selling out and restocking SHALL update presentation on the normal offer read or refresh without a separate Releases-page edit. It SHALL reuse current preorder rules and SHALL NOT introduce a state-machine framework, scheduler or duplicated persisted commerce lifecycle. Label emphasis remains an optional editorial decision.

#### Scenario: Vinyl ordering opens

- **WHEN** an announced physical edition gains a confirmed buyable preorder offer
- **THEN** its action automatically becomes Pre-order vinyl with the current supplied estimate
- **AND** its principal eligibility and remaining-card order are recomputed without manually changing its presentation state

#### Scenario: Estimated month passes

- **WHEN** the existing commerce owner keeps a month-estimate preorder open after that month passes
- **THEN** Releases retains Pre-order vinyl and withholds the stale estimate
- **AND** it does not infer physical receipt or end preorder itself

#### Scenario: Exact preorder date is reached

- **WHEN** the existing commerce owner ends an exact-date preorder on its confirmed date
- **THEN** a still-buyable offer automatically uses Buy vinyl and Vinyl available
- **AND** the page does not claim verified receipt solely from the calendar date

#### Scenario: Staff records actual arrival

- **WHEN** Staff uses the existing Copies arrived action and records the actual stock facts
- **THEN** Releases reflects the resulting offer automatically without another page or editorial-state edit

#### Scenario: Principal offer sells out

- **WHEN** a principal record's current offer is sold out or paused
- **THEN** its buying action is removed and the next eligible record fills its principal position automatically
- **AND** all release identities remain accessible once

#### Scenario: Unavailable record becomes buyable again

- **WHEN** stock is replenished or buying is reopened and the current offer confirms eligibility
- **THEN** the physical action and placement are recomputed using the retained editorial preference

#### Scenario: Confirmed digital release date is reached

- **WHEN** accepted editorial timing establishes that a confirmed scheduled digital release is now available
- **THEN** its supporting digital message advances automatically
- **AND** physical availability and label preference remain independently derived
- **AND** no private draft is published automatically

### Requirement: Releases exposes explicit interaction targets

Releases SHALL expose native release artwork/title and artist links, the existing canonical physical edition action, visible title detail access and independent shell listening controls. The artwork link SHALL serve pointer navigation without adding a duplicate keyboard stop; the title SHALL expose keyboard detail access. The principal action row MUST NOT repeat that detail link as another CTA. Summaries, dates, formats, status labels and unused container space MUST remain selectable inert content. Independent purchase and listening targets MUST NOT activate artwork or card hover feedback.

#### Scenario: Visitor reads or selects metadata

- **WHEN** a visitor clicks or selects a summary, date, format, status label or unused card area
- **THEN** the page remains in place without navigation or player intent
- **AND** there is no stretched link covering that content

#### Scenario: Visitor uses an explicit action

- **WHEN** a visitor activates artwork or the title, the artist credit, an edition action or Listen
- **THEN** the intended release, artist, canonical edition or shell-player behavior runs independently
- **AND** links expose their destinations, keyboard focus and usable targets without nested anchors

### Requirement: Releases status labels use compact editorial hierarchy

Releases SHALL present inert status labels in compact uppercase editorial typography with deliberate padding, spacing and subdued neutral surfaces. Digital status SHALL remain distinct from physical status. Preorder SHALL retain the existing sea-green meaning and readable supplied shipping estimate. Dates MUST NOT collide with the status strip, and long titles and status messages MUST fit or wrap without clipping.

#### Scenario: Digital release and preorder are visible together

- **WHEN** a digitally released record has a confirmed October 2026 month-estimate preorder
- **THEN** Digital out now and Pre-order · ships around October 2026 remain visibly distinct and readable
- **AND** the shipping message wraps as necessary without looking like an interactive filter
- **AND** an ordinary stocked record can display Vinyl available and Buy vinyl in the same composition

### Requirement: Ordinary buying actions share restrained purchase feedback

Enabled ordinary Buy actions on Releases and Store SHALL share subtle tonal hover, visible keyboard focus and pressed feedback without layout movement or JavaScript animation. Disabled or loading controls MUST NOT receive active hover feedback. Existing preorder and Listen treatments MUST retain their independent meanings and reduced-motion support.

#### Scenario: Visitor hovers Buy

- **WHEN** a hover-capable pointer enters an enabled ordinary buying action
- **THEN** its face and edge provide subtle local feedback
- **AND** its footprint and surrounding artwork remain unchanged

#### Scenario: Buying is disabled or loading

- **WHEN** a buying control is disabled or loading
- **THEN** its action remains unavailable and does not acquire enabled hover feedback
- **AND** reduced-motion preference removes nonessential transition timing
