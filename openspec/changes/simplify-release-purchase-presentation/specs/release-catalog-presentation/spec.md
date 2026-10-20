## MODIFIED Requirements

### Requirement: Release badges reuse the Store availability vocabulary

Editorial Releases cards and detail purchase blocks SHALL use the quiet physical vocabulary: a ready stocked offer is Buy vinyl/CD/cassette, or Pre-order vinyl/CD/cassette for an open preorder. Announced and coming-soon editions show static Coming soon; repressing shows static Repressing; sold-out shows static Sold out. Pending, unknown and paused offers SHALL show no public state or buying action. Routine In stock, Digital out now, duplicate badges and generic View details SHALL be absent. Existing ready-price rules SHALL remain, including depleted and paused records. Supplied shipping SHALL remain independent of digital timing.

#### Scenario: Ready stocked offer

- **WHEN** a matching ready offer is stocked
- **THEN** its format-aware action uses Flint Buy, or Sea Pre-order with existing terms for an open preorder
- **AND** the action navigates to the canonical edition without adding to cart
- **AND** supplied estimates remain visible after the digital date; withheld estimates add no promise

#### Scenario: Static depleted or announced edition

- **WHEN** an edition is announced, coming soon, repressing or sold out
- **THEN** one static status occupies the physical slot with no tab stop, hover action or control cursor
- **AND** Coming soon/Repressing use a dashed Flint edge; Sold out uses a solid1px #bc4945 edge, pale text and transparent/near-black interior on editorial release surfaces only
- **AND** supplied applicable expected-month text remains separate from status

#### Scenario: Unknown, paused or editorial-only

- **WHEN** a native offer is pending, unknown, paused or unready
- **THEN** no public state or Buy appears, while only matching ready records show price under the existing rule
- **AND** releases without physical editions gain no invented status; external commerce preserves target and rel

#### Scenario: Future digital date

- **WHEN** a release has a future digital date
- **THEN** its stable metadata identifies Digital release and the semantic date without a digital badge
- **AND** the edition's physical state and supplied shipping remain independent

#### Scenario: Native edition is depleted

- **WHEN** a native edition is depleted
- **THEN** it shows its static Coming soon, Repressing or Sold out status with the approved edge and no Buy
- **AND** a matching ready record retains price and any supplied applicable shipping estimate

#### Scenario: Edition details are not buyable

- **WHEN** the physical edition cannot be bought
- **THEN** its verified format link retains native keyboard access to the existing destination without generic View details
- **AND** the static status adds no tab stop or action affordance

#### Scenario: Offer has not been read yet

- **WHEN** a native offer is pending without a rendered projection
- **THEN** no public state, price or Buy is asserted
- **AND** stable digital metadata and verified format access remain available

## ADDED Requirements

### Requirement: Release cards share the approved actions-first reading order

Featured and catalog release cards SHALL use the same DOM and visual order at every width: title/band, actions with existing price after optional Listen, formats, shipping/terms, digital date/catalog, then editorial summary. Preserve outer layout, source order and square artwork. Catalog type SHALL use32/36 title,16/24 artist,13/20 format/helper,24/28 price and12/18 metadata with the approved4/12/16/4/8/12px rhythm.

#### Scenario: Responsive card hierarchy

- **WHEN** cards render at320,390,768 or1440px
- **THEN** title precedes band, actions follow identity by12px with16px gaps between controls and following price, formats follow by4px, shipping by8px and metadata follows the final group by12px
- **AND** two featured rows, catalog columns, artwork sizes and source order remain; larger featured headings remain
- **AND** summaries and Read more never intervene between identity and actions
- **AND** controls are square Bebas with44px targets and usable wrapping under enlarged text/text spacing

### Requirement: Quiet release controls retain useful native format access

Release purchase/status and optional amber Listen/In player SHALL share one action group. Physical format text SHALL be a quiet underlined native link with minimum44px width and height only when its existing destination is verified; unmapped formats stay plain. Announced editions may link to release detail. Preserve artwork/title routes, native modified clicks and external attributes. Vinyl actions SHALL use static18px Disc3, retaining CD/cassette icons.

#### Scenario: Canonical format route

- **WHEN** a physical format has a verified existing edition destination
- **THEN** keyboard and modified clicks reach that edition even when Buy is absent
- **AND** no CD or other path is fabricated from metadata
- **AND** missing Listen creates no placeholder and static status adds no focus stop
- **AND** short Vinyl/CD labels retain a44x44px target on cards, direct detail and overlay

#### Scenario: Detail and overlay retain their composition

- **WHEN** release detail renders directly or in an overlay
- **THEN** the quiet family stays in the existing purchase block with controls adjacent and formats/shipping/terms beneath
- **AND** existing page copy/date positions and larger headings remain, without a new price

### Requirement: Digital metadata stays independent of live offers

Cards and details SHALL render stable Digital release metadata with semantic time only when a date exists, retaining catalog metadata independently. Detail SHALL use its existing date position without duplication in purchase controls. Offer correction SHALL update only action/status/price/shipping/terms. Absent preorder terms SHALL reserve no blank line. Preserve SSR, failed reads, disposal and snapshot reset.

#### Scenario: Release detail has no digital date

- **WHEN** the shared detail template renders a release without release_date, directly or in an overlay
- **THEN** server-rendered metadata retains the catalog number without Digital release, date separators, time or a date placeholder
- **AND** dated releases retain semantic time and the Digital release label

#### Scenario: Offers correct rendered HTML

- **WHEN** a delayed successful read corrects a projection, including depletion
- **THEN** only offer-owned fields update and digital metadata remains unchanged
- **WHEN** the read fails or resolves after disposal
- **THEN** the projection remains or the late response is ignored respectively
- **WHEN** the shell restores a cached page
- **THEN** the original projected or neutral presentation is restored before enrichment, with no stale Buy or duplicated labels

### Requirement: Release controls use intrinsic shared proportions

Editorial release controls SHALL use intrinsic content width without growth: minimum112x44px,16px horizontal padding,16px Bebas labels,18px icons and8px icon/text gaps. Groups SHALL use16px gaps. The one existing card price SHALL follow purchase/status and optional Listen in DOM/visual order, centered without auto margin. Formats follow that wrapping row. Detail SHALL add no price. These are project choices;44px targets correspond to WCAG AAA guidance.

#### Scenario: Wide featured row and detail controls

- **WHEN** a release renders at1440px on a card, direct detail or overlay
- **THEN** controls follow label-plus-padding width without full-column growth or catalog-only sizing overrides
- **AND** the existing card price follows Listen on the same compact row with16px gap, never between Buy and Listen or pushed to the far edge

#### Scenario: Narrow and enlarged content

- **WHEN** width is320,390 or768px or text is enlarged/spaced
- **THEN** controls and existing card price wrap in DOM order without clipping labels, reducing targets or overflowing
- **AND** preorder/CD/cassette/static/missing-offer and missing-Listen cases retain truthful behavior without blank slots

### Requirement: Late offer correction preserves intentional keyboard focus

A successful late offer correction that withdraws the currently focused Buy SHALL move focus to the release's existing mapped format/edition link, or existing title destination when available. Cards and direct/overlay details SHALL never steal focus from another element, focus a status, add a visible link or restore focus after disposal/navigation.

#### Scenario: Focused pre-order is withdrawn

- **WHEN** a delayed successful read changes a projected pre-order to sold out or unknown while its Buy still has focus
- **THEN** the existing format/edition link receives focus before Buy disappears
- **AND** an existing title destination is the fallback when no mapped format link exists

#### Scenario: Focus has moved or the read fails or is disposed

- **WHEN** focus has moved to Listen before correction
- **THEN** Listen retains focus
- **WHEN** the read fails
- **THEN** projected Buy and its current focus remain
- **WHEN** the component is disposed or navigation removes it
- **THEN** a late response cannot move focus or rewrite the current page
