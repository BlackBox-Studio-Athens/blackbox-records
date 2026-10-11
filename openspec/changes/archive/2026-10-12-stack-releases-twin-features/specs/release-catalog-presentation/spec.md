# Spec Delta

## ADDED Requirements

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

- **GIVEN** accepted editorial priorities select two native physical editions
- **WHEN** Releases first renders and live offers are pending, ready or failed
- **THEN** their featured roles and the remaining catalog order stay fixed
- **AND** neutral edition links remain available until confirmed offers establish buying eligibility
- **AND** every release appears once

#### Scenario: An offer changes availability

- **WHEN** a featured edition opens or closes ordering, sells out, or gains stock
- **THEN** its current physical badge, price and action reflect the authoritative offer
- **AND** its artwork, heading role and placement remain stable
- **AND** digital availability remains independently derived from accepted timing

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Releases page presents distinct editorial tiers

**Reason**: Its wide-viewport scenario fixes the asymmetric lead and supporting composition, which the stacked twin rows replace.

**Migration**: Follow "Releases orders featured records and the remaining catalog editorially", which keeps the selection, source order and offer-stability rules.

### Requirement: Releases page composes its tiers as one Evolved Split Showcase

**Reason**: The dominant split with a compact supporting column is replaced by stacked twin rows with equal covers.

**Migration**: Follow "Releases presents featured records as stacked twin rows".

## RENAMED Requirements

- FROM: `### Requirement: Evolved Split Showcase reflows without content loss`
- TO: `### Requirement: Stacked twin rows reflow without content loss`
