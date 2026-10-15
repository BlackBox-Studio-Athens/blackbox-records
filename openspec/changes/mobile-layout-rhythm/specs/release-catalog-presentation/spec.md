## MODIFIED Requirements

### Requirement: Each release tier keeps role-appropriate emphasis

Release cards SHALL keep independent purchase, listening and detail targets while placing the purchase/Listen pair directly after the cover on phones and after artist identity on desktop. Phone copy SHALL then show date/catalog, title, artist, formats/price, status and optional summary. Non-buyable editions SHALL retain truthful editorial paths; artwork SHALL remain steady.

#### Scenario: Featured release renders

- **WHEN** a confirmed buyable physical edition occupies a featured row
- **THEN** on phones its row shows linked square artwork, the paired actions, semantic date/catalog line, ink Veneer title, artist, formats/price, status and optional summary; on desktop the pair follows artist identity
- **AND** Pre-order vinyl names an open vinyl preorder and Buy vinyl, Buy CD or Buy cassette names a confirmed buyable regular edition; price sits with formats on phones and beside the actions on desktop
- **AND** a passed exact preorder date alone does not produce a claim that physical copies arrived
- **AND** the action reaches the existing canonical edition purchase path and authoritative offer check
- **AND** controls remain square, visibly focused, at least 44px tall and able to wrap

#### Scenario: Selected upcoming release renders

- **WHEN** an announced edition has no confirmed buyable offer
- **THEN** its artwork, title, artist, digital context, optional summary and formats remain visible
- **AND** it gains no asserted stock, price, fabricated preorder date or checkout action

#### Scenario: Remaining catalog renders

- **WHEN** remaining records render
- **THEN** each tile preserves contained artwork, the phone purchase/Listen pair, date/catalog, ink Veneer title, artist, formats/price, status and its canonical physical path
- **AND** Listen sits beside the purchase action, 12px below the cover on phones, without a scrim or an artwork overlay
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

#### Scenario: Phone actions are near the artwork

- **WHEN** a buyable featured or catalog card renders below 40rem
- **THEN** its purchase and Listen controls sit 12px below the cover, each 44px high and half the row with a 16px gap
- **AND** the filled Flint Buy or Sea Pre-order pairs with the Slate outline; missing listening data adds no placeholder control.

### Requirement: Stacked twin rows reflow without content loss

The featured rows and the remaining catalog SHALL use intrinsic sizing for titles, physical facts, digital context, summaries, prices and actions. Rows MUST stack cover then copy when their wide layout no longer fits. They MUST remain usable at 320 and 390 CSS pixels, with enlarged text or zoom, and under reduced motion.

#### Scenario: Narrow viewport preserves the full catalog

- **WHEN** the page is viewed at 320 or 390 CSS pixels
- **THEN** featured rows and the remaining catalog retain their source order
- **AND** metadata, formats, prices and actions remain visible, and complete featured summaries remain reachable through their disclosure, without horizontal page scrolling

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

### Requirement: Highlighted Release summaries use restrained editorial typography

Featured Release summaries SHALL retain body typography at 1rem/1.65, sentence casing and about 36em readable measure. Below 40rem, long summaries SHALL initially show at most three lines with an accessible Read more disclosure; desktop SHALL show the full summary. Remaining catalog tiles SHALL show no summary, and detail prose SHALL retain its body typography.

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
- **THEN** their excerpt or expanded text wraps without overlap or horizontal page scrolling
- **AND** titles, metadata, physical facts and actions retain their hierarchy

#### Scenario: Phone visitor expands a summary

- **WHEN** a featured summary exceeds three lines on a phone
- **THEN** Read more expands the full accepted text, exposes expanded state and changes to Show less without losing focus
- **AND** the disclosure and available Pre-order & delivery information link share a 44px row that can wrap
- **AND** no disclosure is added for an absent or short summary; without enhancement the full text is available.

### Requirement: Releases status labels use compact editorial hierarchy

Release digital and pre-order status SHALL use compact plain Inter information lines without badge frames. Digital status SHALL remain distinct from physical state; Pre-order SHALL retain Sea #4ca999 and the supplied shipping estimate. Other availability states SHALL retain their shared semantics and edges. Dates, titles and status messages MUST fit or wrap without collision or clipping.

#### Scenario: Digital release and preorder are visible together

- **WHEN** a digitally released record has a confirmed October 2026 month-estimate preorder
- **THEN** Digital out now and Pre-order · ships around October 2026 remain visibly distinct and readable
- **AND** the shipping message wraps as necessary without looking like an interactive filter
- **AND** an ordinary stocked record can display Vinyl available and Buy vinyl in the same composition

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
- **THEN** both featured records show a complete full-width square cover, the purchase/Listen pair 12px below it, then date/catalog, title, artist, formats/price, status and the summary disclosure
- **AND** the remaining catalog uses one column at the same width

#### Scenario: Visual placement does not reorder content

- **WHEN** the page is read or navigated by keyboard
- **THEN** the featured order precedes the remaining catalog
- **AND** CSS placement and offer updates do not reorder it

#### Scenario: Missing tiers do not leave scaffolding

- **WHEN** only one featured record or no remaining catalog exists
- **THEN** the empty row, heading and wrapper are absent from the visible page
- **AND** present entries keep their normal geometry

#### Scenario: Approved typography is retained

- **WHEN** cards render at the 390px and 1440px reference widths
- **THEN** featured titles are ink Veneer at 37.6px and 66.4px respectively, and catalog titles retain 24.8px and 32.8px respectively
- **AND** the phone featured formats row places its Bebas 28px price at the right, wrapping if required
- **AND** long content and zoom grow the cards rather than enforcing the preview's estimated 720px featured or 583px catalog heights.

### Requirement: Releases shows the current price beside physical actions

Releases SHALL show a native edition's ready current Store display price using the existing listing read: beside its purchase action on desktop and beside formats after identity on phones. A featured open pre-order SHALL retain the existing delivery-information link. Placement SHALL neither duplicate a price/action nor create additional price reads.

#### Scenario: Offers resolve with prices

- **WHEN** the listing read returns ready records for a featured pre-order and a stocked catalog edition
- **THEN** each shows one display price in Bebas Neue beside formats on phones and beside its Pre-order or format-specific Buy action on desktop
- **AND** the featured pre-order shows a Pre-order & delivery information link

#### Scenario: Edition is not buyable

- **WHEN** a ready record reads Coming Soon, Repressing, Sold Out, paused or an unrecognised state
- **THEN** its price remains in the same responsive price position, and its neutral edition path follows the existing availability rules
- **AND** no pre-order information link appears

#### Scenario: Offer read is pending or fails

- **WHEN** offers are pending, the read fails, no ready record matches, or the release has no native edition
- **THEN** no price and no pre-order information link are shown
- **AND** the page makes no additional request for prices
