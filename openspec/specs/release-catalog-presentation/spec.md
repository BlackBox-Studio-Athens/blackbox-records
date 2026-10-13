# release-catalog-presentation Specification

## Purpose

Present the label's Releases catalog once per record, prioritizing confirmed physical buying opportunities while keeping digital availability, editorial emphasis, detail navigation and listening distinct.

## Requirements

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
- **AND** its messages distinguish Digital out now from Vinyl Coming Soon, followed by the offer's expected month when one is shown
- **AND** it retains View release and available Listen without asserting an open preorder
- **AND** artwork uses the existing responsive image handling and authored alt text or title fallback

#### Scenario: Upcoming artwork loads beside the feature

- **WHEN** campaign and supporting artwork render
- **THEN** only the lead campaign image receives first-viewport priority
- **AND** all other artwork uses responsive non-priority delivery

### Requirement: Each release tier keeps role-appropriate emphasis

The system SHALL emphasize the physical purchase path for buyable featured and remaining records while preserving independent listening and release-detail navigation. Featured rows SHALL present the date, title, artist, Listen, optional summary, formats, status, shipping, then the price with the edition action. Remaining catalog tiles SHALL present the same order without a summary. Announced or unavailable editions MUST use truthful text and editorial paths instead of asserted buying actions. Artwork on `/releases/` MUST stay steady while its links and controls keep accessible feedback.

#### Scenario: Featured release renders

- **WHEN** a confirmed buyable physical edition occupies a featured row
- **THEN** its row retains linked artwork, semantic date, title, artist, Listen when a source exists, optional summary, formats, status badges and available actions in that order
- **AND** its price and edition action share the last row, with Pre-order vinyl naming an open vinyl preorder and Buy vinyl a confirmed buyable regular offer
- **AND** a passed exact preorder date alone does not produce a claim that physical copies arrived
- **AND** the action reaches the existing canonical edition purchase path and authoritative offer check
- **AND** controls remain square, visibly focused, at least 44px tall and able to wrap

#### Scenario: Selected upcoming release renders

- **WHEN** an announced edition has no confirmed buyable offer
- **THEN** its artwork, title, artist, digital context, optional summary and formats remain visible
- **AND** it gains no asserted stock, price, fabricated preorder date or checkout action

#### Scenario: Remaining catalog renders

- **WHEN** remaining records render
- **THEN** each tile preserves its contained artwork, date, title, artist, Listen, formats, status and current physical purchase path
- **AND** Listen sits below the artist instead of over the artwork, without a scrim
- **AND** it does not add search, filters, pagination, year grouping, a carousel or placeholder releases

#### Scenario: Release artwork exposes one interaction language

- **WHEN** a pointer or keyboard user interacts with linked artwork in any tier
- **THEN** every tier uses the same contained square frame
- **AND** the artwork keeps its resting size without hover or focus zoom or transition, and stays within its frame
- **AND** pointer hover outlines the frame while keyboard focus stays visible

#### Scenario: Desktop catalog card remains steady

- **WHEN** a visitor points at a remaining catalog tile on a desktop device with hover and a fine pointer
- **THEN** the artwork frame and copy stay at rest
- **AND** pointing at the tile does not change Listen's appearance or start its equalizer animation
- **AND** keyboard focus remains visible on links and controls

#### Scenario: Desktop listening feedback belongs to the control

- **WHEN** a visitor hovers, focuses or activates Listen on the desktop Releases page
- **THEN** the button retains its existing feedback and player-trigger behavior
- **AND** the active source retains its disabled In player status
- **AND** release detail overlays preserve the existing shell-owned player session

#### Scenario: Tier labels and dividers support the hierarchy

- **WHEN** featured rows and the remaining catalog render
- **THEN** physical state labels remain subordinate to release titles
- **AND** no visible Featured records, Latest, Upcoming or Our Releases label is added
- **AND** hairline rules separate the featured rows and the remaining catalog without disconnected repeated boxes

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

### Requirement: Releases page presents one compact catalog identity

The Releases page SHALL introduce the catalog with one compact `Catalog` eyebrow and one `Releases` level-one heading, without a second outlined `Releases` label. The route-local heading MUST preserve the existing internal-page title transition identity, and direct loads and app-shell navigation MUST expose equivalent heading semantics.

#### Scenario: Catalog identity appears once

- **WHEN** a visitor opens `/releases/` directly or through the persistent app shell
- **THEN** the page presents `Catalog` once as supporting text and `Releases` once as the level-one heading
- **AND** it does not render the previous outlined `Releases` badge

#### Scenario: Shell-managed navigation preserves title continuity

- **WHEN** the app shell swaps the Releases page into the current document
- **THEN** the route-local `Releases` heading retains the existing internal-page title transition identity
- **AND** the heading remains the page's only level-one heading

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

### Requirement: Stacked twin rows reflow without content loss

The featured rows and the remaining catalog SHALL use intrinsic sizing for titles, physical facts, digital context, summaries, prices and actions. Rows MUST stack cover then copy when their wide layout no longer fits. They MUST remain usable at 320 and 390 CSS pixels, with enlarged text or zoom, and under reduced motion.

#### Scenario: Narrow viewport preserves the full catalog

- **WHEN** the page is viewed at 320 or 390 CSS pixels
- **THEN** featured rows and the remaining catalog retain their source order
- **AND** metadata, summaries, formats, prices and actions remain visible and operable without horizontal page scrolling

#### Scenario: Enlarged text grows the composition

- **WHEN** enlarged text or zoom wraps content
- **THEN** rows and tiles grow intrinsically without overlap or clipping

#### Scenario: Preserved actions remain operable

- **WHEN** a release exposes a physical action, Listen or its title detail link
- **THEN** their canonical purchase, player and detail behavior remains intact
- **AND** their visible focus and 44px targets persist when the group wraps

#### Scenario: Image and motion contracts remain intact

- **WHEN** artwork renders or reduced motion is requested
- **THEN** only the first featured image has priority
- **AND** other artwork keeps responsive non-priority loading
- **AND** artwork stays at rest without transforms or transitions

### Requirement: Release details expose source-backed editorial data

The site SHALL present useful verified release context and complete structured credits for _Disintegration_ and _Anarchotribal_ through the existing Release summary, formats, credits, date, and album-player presentation.

#### Scenario: Disintegration Release detail is enriched

- **WHEN** a visitor opens the _Disintegration_ Release detail directly or in the app-shell overlay
- **THEN** it identifies the June 9, 2026 six-track debut as instrumental post-rock/post-metal from Athens
- **AND** its formats distinguish provider-confirmed Digital from label-owned Black Vinyl LP and CD
- **AND** its credits identify Afterwise as writer/performer; George Stamatiou, Stavros Apostolou, Ilias Daramouskas, Markos Kousounadis Knousen, and Giannis Avraam with their instruments; Jim Spanos' recording/mixing work at BlackBox Studio; Nikos Dimitrakakos and Jim Spanos' mastering at Unreal Studio; Joshua Takak's artwork; and BlackBox Records' label role

#### Scenario: Anarchotribal Release detail is enriched

- **WHEN** a visitor opens the _Anarchotribal_ Release detail directly or in the app-shell overlay
- **THEN** it identifies the June 6, 2026 ten-track album by the Athens psychedelic/punk-influenced rock trio
- **AND** its formats distinguish provider-confirmed Digital from label-owned Vinyl
- **AND** its credits identify music by Ouranopithecus; lyrics by Zon Pletsis; Mario, Jack, and Zon Pletsis with their instruments; the Atavo and Buduzi Studios recording locations; Kostas Ragiadakos' drum-engineering/mastering roles; Marios Adamopoulos' engineering/recording/mixing/production roles; Ouranopithecus' production role; Nina Politimou and Marianna Tzaneti on `Bad`; Voltas and Ouranopithecus' artwork; Edward S. Curtis' original cover photography; and BlackBox Records' label role

#### Scenario: Existing Release presentation carries the enrichment

- **WHEN** both enriched Release entries are built
- **THEN** their existing `summary`, `formats`, and `credits` fields render without a new schema field or detail component
- **AND** the direct and overlay routes present the same summary, formats, and credits
- **AND** the album player continues using the exact Bandcamp and Tidal values introduced by `7193409a`
- **AND** no native track-list UI is added because the verified album player already exposes the tracks

### Requirement: Highlighted Release summaries use restrained editorial typography

The Releases page SHALL present featured summaries on the body font family at 1rem with a 1.65 line height, sentence casing, a readable measure of about 36em and pretty wrapping. Remaining catalog tiles SHALL show no summary, and detail prose MUST remain on the body font.

#### Scenario: Latest Release summary renders

- **WHEN** the first featured record supplies a summary
- **THEN** its summary uses the body family without uppercase transformation or label-style tracking

#### Scenario: Upcoming Release summary renders

- **WHEN** the second featured record supplies a summary
- **THEN** its summary uses the same body treatment and scale as the first

#### Scenario: Highlighted summary is absent

- **WHEN** a featured record supplies no summary
- **THEN** no empty summary surface or placeholder is rendered

#### Scenario: Catalog cards and details render summaries

- **WHEN** remaining catalog tiles or release details render
- **THEN** tiles show no summary and detail prose retains the body family

#### Scenario: Highlighted summaries reflow

- **WHEN** featured summaries render at 320 or 390 CSS pixels
- **THEN** they wrap without overlap, clipping or horizontal page scrolling
- **AND** titles, metadata, physical facts and actions retain their hierarchy

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

The system SHALL describe digital availability independently from physical offer state. Physical buying copy, prices, expected months and shipping estimates MUST come from existing commerce authority. Release stage SHALL describe the music only and SHALL NOT decide physical copy. Unknown offers MUST use neutral editorial or edition-detail paths without invented stock, price, preorder or shipment claims.

#### Scenario: Digital album is out while vinyl is on preorder

- **WHEN** an album's digital date has passed and its confirmed vinyl offer is a preorder
- **THEN** the page can show Digital out now alongside Vinyl preorder and Pre-order vinyl
- **AND** its expected shipping comes from the preorder offer and remains an estimate

#### Scenario: Digital album is out while vinyl ordering has not opened

- **WHEN** a digital album is available and its vinyl either has no Store Item yet or its offer reads Coming Soon
- **THEN** the page shows Digital out now and Vinyl Coming Soon with editorial access
- **AND** it does not infer preorder eligibility from the album date, the format list or Release stage

#### Scenario: Release stage is Upcoming but the offer is stocked

- **WHEN** a release's stage is Upcoming and its native vinyl offer is stocked or on pre-order
- **THEN** the physical badge and action follow the offer, Vinyl available with Buy vinyl or the pre-order badges
- **AND** Release stage affects only the digital message

#### Scenario: Offer read fails

- **WHEN** the current physical offer cannot be read or classified
- **THEN** the page exposes useful neutral detail access with no physical badge
- **AND** it does not present a fabricated price or claim that the edition is stocked, coming soon or on preorder

### Requirement: Release presentation transitions derive automatically from existing facts

The system SHALL derive each record's visible physical state and purchase action from accepted editorial timing and the current authoritative public commerce presentation. Opening, closing, selling out and restocking SHALL update badges and actions on the normal offer read without a separate editorial edit. Accepted editorial priority and native edition identity SHALL establish stable principal placement and remaining catalog order independently of offer readiness. The system SHALL reuse current preorder rules without a duplicated persisted commerce lifecycle, scheduler or state-machine framework.

#### Scenario: Vinyl ordering opens

- **WHEN** an announced physical edition gains a confirmed buyable preorder offer
- **THEN** its action becomes Pre-order vinyl with the current supplied estimate
- **AND** the release remains in its existing editorial position

#### Scenario: Estimated month passes

- **WHEN** the existing commerce owner keeps a month-estimate preorder open after that month passes
- **THEN** Releases retains Pre-order vinyl and withholds the stale estimate
- **AND** it does not infer physical receipt or end preorder itself

#### Scenario: Exact preorder date is reached

- **WHEN** the existing commerce owner ends an exact-date preorder on its confirmed date
- **THEN** a still-buyable offer automatically uses Buy vinyl and Vinyl available
- **AND** the page does not claim verified receipt solely from the calendar date

#### Scenario: Staff records actual arrival

- **WHEN** Staff uses the existing Copies arrived action and records actual stock facts
- **THEN** Releases reflects the resulting offer automatically without another page or editorial-state edit

#### Scenario: Principal offer sells out

- **WHEN** a principal record's current offer is sold out or paused
- **THEN** its buying action is removed and its physical badge reflects that offer
- **AND** its principal position stays fixed while release detail and listening remain accessible once

#### Scenario: Unavailable record becomes buyable again

- **WHEN** stock is replenished or buying reopens and the current offer confirms eligibility
- **THEN** the physical action is recomputed while the retained editorial position stays fixed

#### Scenario: Confirmed digital release date is reached

- **WHEN** accepted editorial timing establishes that a confirmed scheduled digital release is now available
- **THEN** its supporting digital message advances independently of physical availability
- **AND** accepted label preference remains stable
- **AND** no private draft is published automatically

### Requirement: Releases exposes explicit interaction targets

Releases SHALL expose native release artwork/title and artist links, the existing canonical physical edition action, visible title detail access and independent shell listening controls. When a release has a native Store edition, its artwork SHALL link to that edition, the same destination as its edition action, and both SHALL derive from one value; otherwise the artwork links to the release detail. The artwork link SHALL serve pointer navigation without adding a duplicate keyboard stop; the title SHALL expose keyboard detail access. The edition action and Listen SHALL begin their accessible names with their visible labels and add the release. The action row MUST NOT repeat the detail link as another CTA. Summaries, dates, formats, prices, status labels and unused container space MUST remain selectable inert content. Listening targets MUST NOT activate artwork or card hover feedback.

#### Scenario: Visitor reads or selects metadata

- **WHEN** a visitor clicks or selects a summary, date, format, price, status label or unused card area
- **THEN** the page remains in place without navigation or player intent
- **AND** there is no stretched link covering that content

#### Scenario: Visitor uses an explicit action

- **WHEN** a visitor activates artwork or the title, the artist credit, an edition action or Listen
- **THEN** the intended release, artist, canonical edition or shell-player behavior runs independently
- **AND** links expose their destinations, keyboard focus and usable targets without nested anchors
- **AND** the edition action reads, for example, "Pre-order vinyl, LOTUS" and Listen "Listen, LOTUS by Sidus" to assistive technology, with In player replacing Listen while that source is active

#### Scenario: Artwork and edition action act as one target

- **WHEN** a release has a native Store edition and a visitor points at its artwork, or points at or keyboard-focuses its edition action
- **THEN** both lead to the same canonical edition and show the same feedback: the action's own hover look
- **AND** no decorative record is rendered behind the artwork
- **AND** pointing at Listen leaves the artwork and the edition action at rest

#### Scenario: Non-buyable edition action renders

- **WHEN** a native edition has no buyable offer
- **THEN** its action reads "Vinyl edition", "CD edition" or "Cassette edition" in uppercase mono between muted brackets that close in and brighten while engaged
- **AND** the brackets are not part of its accessible name, and the artwork link is named after the release and its edition

### Requirement: Releases status labels use compact editorial hierarchy

Releases SHALL present inert status labels in compact uppercase editorial typography with deliberate padding, spacing and subdued neutral surfaces. Digital status SHALL remain distinct from physical status. Preorder SHALL retain the existing sea-green meaning and readable supplied shipping estimate. Dates MUST NOT collide with the status strip, and long titles and status messages MUST fit or wrap without clipping.

#### Scenario: Digital release and preorder are visible together

- **WHEN** a digitally released record has a confirmed October 2026 month-estimate preorder
- **THEN** Digital out now and Pre-order · ships around October 2026 remain visibly distinct and readable
- **AND** the shipping message wraps as necessary without looking like an interactive filter
- **AND** an ordinary stocked record can display Vinyl available and Buy vinyl in the same composition

### Requirement: Ordinary buying actions share restrained purchase feedback

Enabled ordinary Buy actions on Releases and Store SHALL give subtle hover, visible keyboard focus and pressed feedback without layout movement or JavaScript animation. A featured Releases Buy vinyl SHALL keep the shared restrained primary feedback. The Store card Buy and the remaining-catalog Releases Buy vinyl SHALL take the Listen chrome (dark face, hairline edge, the Listen hover highlight with a Store Blood hover edge) with the record mark, the same stationary footprint, and busy, disabled and reduced-motion behaviour. Disabled or loading controls MUST NOT receive active hover feedback. Existing preorder and Listen treatments MUST retain their independent meanings and reduced-motion support.

#### Scenario: Visitor hovers Buy

- **WHEN** a hover-capable pointer enters an enabled ordinary buying action
- **THEN** its face and edge provide subtle local feedback
- **AND** a Store card Buy or remaining-catalog Releases Buy edge turns Store Blood with the Listen highlight, while a featured Releases Buy vinyl keeps its restrained tonal feedback
- **AND** its footprint and surrounding artwork remain unchanged

#### Scenario: Buying is disabled or loading

- **WHEN** a buying control is disabled or loading
- **THEN** its action remains unavailable and does not acquire enabled hover feedback
- **AND** a Store card Buy keeps its resting Listen chrome
- **AND** reduced-motion preference removes nonessential transition timing

### Requirement: Release details display saved descriptions and tracks

Release detail views SHALL display populated full descriptions and tracklists for both upcoming and released entries, independently of commerce availability. Full pages, overlays and private previews MUST render equivalent editorial content.

#### Scenario: A release has populated editorial details

- **GIVEN** an upcoming or released entry has a full description and tracklist
- **WHEN** its full detail page, overlay or private preview renders
- **THEN** the description preserves formatting and links, including retained Markdown content
- **AND** tracks retain their authored order, side or disc headings, positions and optional durations
- **AND** sections appear in hero, description, tracklist, singles/clips, credits and navigation order where populated

#### Scenario: A release has no full description or tracks

- **WHEN** a Release detail view renders without a populated full description or tracklist
- **THEN** it omits the corresponding heading and section wrapper
- **AND** an explicitly empty editorial description does not reveal retained Markdown content

#### Scenario: Tracklist format differs from the Store offer

- **GIVEN** a release has an authored tracklist and no matching purchasable format
- **WHEN** its detail view renders
- **THEN** the saved tracklist remains visible using its authored format

#### Scenario: Details render on a narrow viewport

- **WHEN** a release detail view renders at 390 CSS pixels wide
- **THEN** description links and track titles wrap within the viewport
- **AND** headings, ordering and optional durations remain readable without horizontal page scrolling

#### Scenario: An unpublished description or tracklist is previewed

- **WHEN** staff previews draft release details
- **THEN** the private preview shows the selected description and tracks
- **AND** public release details continue to show only accepted content until publication

### Requirement: Featured Releases artwork keeps its intrinsic square geometry

Featured artwork wrappers SHALL remain square and fit complete covers independently of adjacent copy height. They MUST NOT stretch into empty tall frames or crop away artwork at rest. Mobile SHALL retain native stacking and accessible controls.

#### Scenario: Supporting copy is taller than the lead cover

- **WHEN** a wide Releases row contains long copy or tall supporting content
- **THEN** the lead artwork wrapper remains square with no empty lower frame
- **AND** the whole cover remains visible

#### Scenario: A shopper uses a narrow screen

- **WHEN** Releases renders at 320px, 390px or 430px
- **THEN** featured covers remain complete and square
- **AND** copy and controls stack without horizontal overflow

### Requirement: Announced physical editions retain a separate lifecycle

The Releases catalog SHALL preserve an announced physical edition that cannot yet be ordered independently of the album's digital availability. An unavailable or missing offer SHALL NOT convert that announcement into a Sold out claim. Current confirmed buyable offers SHALL remain authoritative for purchasing.

#### Scenario: Digital album is released before vinyl ordering opens

- **GIVEN** Anarchotribal is Upcoming in the accepted release content, its digital date has passed and physical preorder is not enabled
- **WHEN** Releases renders with a non-buyable or missing physical offer
- **THEN** the record appears once with Digital out now and Vinyl coming later
- **AND** it retains release details and available Listen without a Sold out badge or asserted preorder action.

#### Scenario: Digital album is still unreleased before vinyl ordering opens

- **GIVEN** an announced physical edition has no confirmed buyable offer and its digital album is unreleased
- **WHEN** Releases renders
- **THEN** the record appears once with Vinyl coming later and truthful scheduled or unknown digital context
- **AND** it makes no Digital out now, Sold out or Pre-order claim from the physical announcement alone.

#### Scenario: Several records occupy different lifecycle combinations

- **GIVEN** records include announced vinyl, open preorders, regular buyable offers and genuinely unavailable editions
- **WHEN** the catalog is grouped and ordered
- **THEN** every record occupies one existing presentation role, with digital and physical facts kept distinct
- **AND** empty tiers are omitted and repeated records or per-combination storefront sections are not introduced.

### Requirement: Releases retains accessible identity without a visible introduction

The Releases page SHALL retain one accessible level-one heading named Releases without displaying a Catalog / Releases introduction or reserving space for that introduction. The populated remaining catalog SHALL follow the featured records after a hairline rule, with a visually hidden level-two heading named More releases and no visible catalog heading.

#### Scenario: Releases opens directly or through the shell

- **WHEN** Releases opens directly or through persistent shell navigation at desktop or mobile width
- **THEN** no visible Catalog / Releases introduction or blank header space appears
- **AND** assistive technology can identify the Releases level-one heading
- **AND** shell navigation retains its focus reset

#### Scenario: Remaining catalog is populated

- **WHEN** releases remain after the featured records
- **THEN** a hairline rule separates them from the featured records and no visible Our Releases heading appears
- **AND** assistive technology can identify the remaining catalog by its More releases heading
- **AND** record order, purchase actions and listening behavior remain intact

### Requirement: Vinyl release visuals remain static

The public site SHALL NOT render decorative sliding or rotating vinyl records. Release artwork SHALL remain complete without a record behind its sleeve. Vinyl Buy icons SHALL keep the same single label flick as CD and cassette Buy icons. CD and cassette effects and Grid/Crate browsing SHALL retain their existing behavior.

#### Scenario: Visitor engages vinyl artwork or an edition action

- **WHEN** a visitor hovers or keyboard-focuses a vinyl release artwork link or edition action at any viewport or motion preference
- **THEN** no decorative vinyl record is rendered or animated and no record-photo asset is requested
- **AND** the edition action retains its existing wording, bracket styling and hover/focus feedback
- **AND** native edition artwork and action keep their shared destination while Listen remains independent

#### Scenario: Visitor engages a vinyl Buy icon

- **WHEN** a visitor hovers, focuses or presses Buy for a vinyl item or another item using the vinyl mark
- **THEN** the vinyl label turns once while the light, record and plus stay still, unless reduced motion is requested
- **AND** buying and cart behavior remain unchanged

### Requirement: Releases orders featured records and the remaining catalog editorially

The system SHALL select up to two native physical editions for the featured rows in accepted editorial priority order, retaining catalog source order for ties. Remaining records SHALL share one remaining catalog in source order. Featured placement and record order MUST be identical in initial SSR, hydration, shell navigation and fresh offer resolution. Offer state SHALL determine truthful physical badges, prices and actions independently of these editorial roles.

#### Scenario: All three roles are available

- **GIVEN** Sidus and Afterwise have the first two accepted editorial priorities, Chronoboros has stocked vinyl, and Ouranopithecus has only a future physical edition
- **WHEN** Releases renders
- **THEN** the featured rows present Sidus then Afterwise
- **AND** Chronoboros remains in the remaining catalog with its confirmed buying path
- **AND** Ouranopithecus retains its catalog source position with separate digital and future-vinyl messages

#### Scenario: Visitor reads the page in source order

- **WHEN** a visitor reads or tabs through Releases
- **THEN** accepted editorial priority precedes the remaining catalog in source order
- **AND** headings and truthful physical states expose that sequence without visible section labels

#### Scenario: Wide viewport stacks the featured records

- **WHEN** two native physical editions occupy the featured rows at a wide viewport
- **THEN** they render as two identical stacked rows with equal covers and complete identity and actions
- **AND** the first editorial priority comes first and alone receives first-viewport image priority
- **AND** the remaining catalog begins after both rows without duplicate releases

#### Scenario: Visitor waits for current offers

- **GIVEN** the rendered open pre-order projection lists a featured edition
- **WHEN** Releases first paints
- **THEN** that edition already shows its Pre-order badge, Pre-order action, price, shipping estimate and terms link from the HTML
- **AND** editions the projection does not list show their neutral edition links until the live offer read confirms another state
- **AND** featured roles and the remaining catalog order stay fixed while the live read is pending, ready or failed
- **AND** every release appears once

#### Scenario: An offer changes availability

- **WHEN** a featured edition opens or closes ordering, sells out, or gains stock
- **THEN** its current physical badge, price and action reflect the authoritative offer
- **AND** its artwork, heading role and placement remain stable
- **AND** digital availability remains independently derived from accepted timing

#### Scenario: The live offer read fails

- **WHEN** the browser's offer read fails after a projected pre-order rendered
- **THEN** the rendered pre-order presentation remains
- **AND** buying still reaches the Store Item page and its authoritative offer check

### Requirement: Releases presents featured records as stacked twin rows

The Releases page SHALL present its featured records as identical stacked rows, each pairing complete contained square artwork with its copy, followed by the remaining catalog as square tiles in the same cover frame. Both featured covers MUST have the same size at every width. Reading and keyboard order MUST follow the featured order and then the remaining catalog, without a Featured records heading or added storefront navigation.

#### Scenario: Wide viewport renders twin rows

- **WHEN** two featured records render at 1024 CSS pixels or wider
- **THEN** each row places a 29rem square cover beside its top-aligned copy
- **AND** the second row starts below the first after a hairline rule
- **AND** both covers have the same size

#### Scenario: Tablet splits each row in equal halves

- **WHEN** Releases renders from 40rem up to 64rem
- **THEN** each featured row splits into equal cover and copy halves with a 1.5rem gap
- **AND** the remaining catalog uses two columns with the same gap, so its tiles match the featured covers

#### Scenario: Phone stacks cover then copy

- **WHEN** Releases renders below 40rem
- **THEN** both featured records show a full-width cover followed by their copy
- **AND** the remaining catalog uses one column at the same width

#### Scenario: Visual placement does not reorder content

- **WHEN** the page is read or navigated by keyboard
- **THEN** the featured order precedes the remaining catalog
- **AND** CSS placement and offer updates do not reorder it

#### Scenario: Missing tiers do not leave scaffolding

- **WHEN** only one featured record or no remaining catalog exists
- **THEN** the empty row, heading and wrapper are absent from the visible page
- **AND** present entries keep their normal geometry

### Requirement: Releases shows the current price beside physical actions

Releases SHALL show the current Store price of a release's native physical edition beside its edition action, using the listing read the page already makes and the Store card rule: the matching record's display price whenever that record's presentation is ready. A featured record with an open pre-order SHALL also link to the existing pre-order and delivery information page.

#### Scenario: Offers resolve with prices

- **WHEN** the listing read returns ready records for a featured pre-order and a stocked catalog edition
- **THEN** each shows its display price in the UI display face beside its Pre-order vinyl or Buy vinyl action
- **AND** the featured pre-order shows a Pre-order & delivery information link

#### Scenario: Edition is not buyable

- **WHEN** a ready record reads Coming Soon, Repressing, Sold Out, paused or an unrecognised state
- **THEN** its price stands beside the neutral edition action under the existing badge rules
- **AND** no pre-order information link appears

#### Scenario: Offer read is pending or fails

- **WHEN** offers are pending, the read fails, no ready record matches, or the release has no native edition
- **THEN** no price and no pre-order information link are shown
- **AND** the page makes no additional request for prices

### Requirement: Release badges reuse the Store availability vocabulary

Release cards and detail pages SHALL show one digital badge and at most one physical badge per edition. The digital badge SHALL be Digital out now once the digital date has passed, Out followed by the date when it is in the future, and absent without a date. The physical badge SHALL be the format name followed by the Store label for the offer's state: available, Coming Soon, Repressing or Sold Out. An unavailable offer SHALL show no physical badge. Pre-order SHALL keep its pre-order badges.

#### Scenario: Future digital date

- **WHEN** a release's digital date is 14 November 2026 and today is earlier
- **THEN** its digital badge reads Out 14 November 2026
- **AND** Album upcoming is not shown.

#### Scenario: Native edition is depleted

- **WHEN** a release's native vinyl offer reads Repressing with expected month 2027-01
- **THEN** the physical badge reads Vinyl Repressing followed by Expected January 2027
- **AND** the strings Out of Stock, Currently Unavailable, Unavailable, coming later and Physical availability unconfirmed never appear.

#### Scenario: Edition details are not buyable

- **WHEN** a release's physical edition reads Coming Soon, Repressing or Sold Out
- **THEN** its edition action is an underlined text link "View vinyl details" (or "View edition") with a trailing arrow, not an outlined box
- **AND** Buy vinyl and Pre-order vinyl keep their button treatment.

#### Scenario: Offer has not been read yet

- **WHEN** a release card renders before its offer read completes
- **THEN** it shows the digital badge and no physical badge, then adds the physical badge when the offer arrives without changing card geometry.
