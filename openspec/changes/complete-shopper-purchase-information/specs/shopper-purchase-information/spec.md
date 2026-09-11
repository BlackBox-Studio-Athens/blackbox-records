## Purpose

Give shoppers approved seller, delivery, returns, support, and privacy information before purchase while preserving existing monetary authority.

## ADDED Requirements

### Requirement: Purchase information reflects approved business commitments

The system MUST publish only approved public seller/support details, dispatch expectations, locker arrangements, returns/refunds, damaged-item and uncollected-parcel handling, and privacy wording from a coherent reviewed content source.

#### Scenario: Required wording is approved

- **WHEN** purchase information is published
- **THEN** each required section has an approved public value and revision context
- **AND** summaries agree with the full wording
- **AND** no private account evidence or credentials appear in the public artifact.

#### Scenario: Required wording is missing

- **WHEN** a required business commitment or privacy section lacks approval
- **THEN** publication acceptance remains incomplete and the missing input is recorded
- **AND** the site does not publish placeholders, invented deadlines, or unsupported policy assurances as final information.

### Requirement: Full information is reachable through stable static routes

The system SHALL retain `/terms/` for purchase/delivery information and SHALL provide `/privacy/`, with accessible descriptive links and correct deployment-aware metadata.

#### Scenario: Shopper reads full terms

- **WHEN** the shopper opens `/terms/`
- **THEN** seller/support, delivery timing and locker arrangements, returns/refunds, damaged items, and uncollected-parcel information are discoverable under descriptive headings
- **AND** section links can target the relevant information directly.

#### Scenario: Shopper reads privacy information

- **WHEN** the shopper opens `/privacy/` or follows privacy links near a data-collecting form
- **THEN** approved text describes the site's actual relevant data uses and contact path
- **AND** existing explicit newsletter consent remains distinct from purchase or service inquiry.

#### Scenario: Static pages are opened directly

- **WHEN** either route is loaded without JavaScript or under the UAT base path or PRD root
- **THEN** approved document text and navigation links remain usable
- **AND** title, canonical metadata, footer links, and sitemap entries resolve to the correct environment paths.

### Requirement: Decision points expose concise relevant answers

The storefront SHALL expose short delivery/support information and relevant full-policy links near Store Item purchase actions, cart review, and checkout review without obscuring the primary action.

#### Scenario: Shopper considers a Store Item

- **WHEN** the purchase area is viewed
- **THEN** the actual sellable item option is clear and distinct from other formats mentioned editorially
- **AND** approved dispatch expectations, Greece-only locker delivery, and the support/terms links are available before checkout.

#### Scenario: Shopper locates the buying decision

- **WHEN** a Store Item renders on desktop or mobile
- **THEN** title, artist, actual sellable option, current price, and Add to Cart form one coherent group in that order, with concise policy information adjacent
- **AND** the full editorial description follows the group and the release title is not repeated inside a nested price panel
- **AND** Back to Store is a visually secondary text link with visible focus and a usable target
- **AND** release-wide formats do not imply that other editions are selected or included.

#### Scenario: Mobile shopper opens an item

- **WHEN** the item is viewed at 390x844 CSS pixels
- **THEN** the purchase group precedes the large artwork/gallery and full description in visual and document order
- **AND** artwork, verified editorial links, and any supported secondary Listen action remain available without a duplicate purchase group
- **AND** long titles and enlarged text reflow without clipping, fixed-height compression, or overlap.

#### Scenario: Offer readiness changes

- **WHEN** the current offer is loading, unavailable, or rejected
- **THEN** the purchase group retains the existing truthful price/availability and disabled-action behavior
- **AND** static editorial availability never overrides runtime purchase readiness.

#### Scenario: Shopper reviews cart or checkout

- **WHEN** merchandise and delivery summaries are displayed
- **THEN** delivery, returns, and help links are accessible beside the review area
- **AND** locker delivery is not described as home delivery merely because payment collects a street address
- **AND** no new mandatory blanket consent is inferred from displaying policy links.

#### Scenario: Shopper uses keyboard or a narrow screen

- **WHEN** purchase information is navigated
- **THEN** links have descriptive names, focus remains visible, and text remains readable without horizontal clipping
- **AND** long policy text is available without requiring a modal.

### Requirement: Purchase copy does not become monetary authority

The system MUST reuse current approved VAT and delivery policy presentation and MUST NOT compute or author a second source of prices, delivery charges, tax, or accepted order totals through editorial content.

#### Scenario: Current pricing is available

- **WHEN** VAT/delivery information appears with purchase copy
- **THEN** rates and totals agree with the existing policy-owned presentation
- **AND** order confirmation, payment receipt, and Fiscal Document delivery are not presented as interchangeable guarantees.

#### Scenario: A monetary read is unavailable

- **WHEN** current rates or totals cannot be established
- **THEN** the existing unavailable state remains explicit
- **AND** purchase copy does not substitute zero, free delivery, or an invented total.

#### Scenario: Launch readiness is reviewed

- **WHEN** this capability's publication evidence is accepted
- **THEN** it supplies the selling-information portion of the existing launch plan
- **AND** it does not approve checkout launch, fiscal-provider acceptance, tax configuration, or a broader shipping country scope.
