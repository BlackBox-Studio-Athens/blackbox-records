## ADDED Requirements

### Requirement: The projection carries Home offers for released items

The projection SHALL also list a Home offer for every ready release-sourced Store Item that is not on an open pre-order and is stocked or sold out. A Home offer carries the slug, the availability and the Store listing's display price text, or none. Home offers MUST contain no stock counts, provider identifiers, order data or private fields. The open pre-order list keeps its meaning.

#### Scenario: A released item is in stock

- **WHEN** a release-sourced Store Item is ready, stocked and not on an open pre-order
- **THEN** the projection lists a Home offer for it with availability stocked and its display price
- **AND** the open pre-order list does not include it

#### Scenario: A released item has sold out

- **WHEN** staff have chosen Sold Out as the zero-stock lifecycle of a ready release-sourced Store Item
- **THEN** the projection lists a Home offer with availability sold out

#### Scenario: A released item has no purchasable or sold-out state

- **WHEN** a release-sourced Store Item is paused, unavailable, not ready, Coming Soon or Repressing
- **THEN** the projection lists no Home offer for it

#### Scenario: A pre-order closes

- **WHEN** a pre-order ends and the item stays stocked
- **THEN** the next projection moves the item from the open pre-order list to the Home offers
- **AND** the projection identity changes once

#### Scenario: Stock counts change without an availability change

- **WHEN** copies of a stocked item sell and some remain, or staff correct the count
- **THEN** the projection identity does not change and nothing is stored, retired or purged

#### Scenario: Home offers reach the renderer promptly

- **WHEN** a staff pre-order or stock change, or paid checkout finalization, changes a Home offer
- **THEN** commerce pushes the projection under the existing push rules, and a failed push does not fail the write
- **AND** the existing scheduled run pushes it as a backstop

## MODIFIED Requirements

### Requirement: Rendering without a projection makes no pre-order claims

When the renderer holds no valid projection, pages SHALL render as if no pre-order is open and no released item is featured. They show no Pre-orders section, no featured release chapters, no Pre-order labels and no shipping estimates. They MUST NOT block or fail the page render. A stored projection without Home offers (from before this capability) renders exactly as an empty Home offer list.

#### Scenario: The renderer starts with empty storage

- **WHEN** the renderer has never received a projection
- **THEN** Home renders without a Pre-orders section or featured chapters and Releases renders neutral edition links
- **AND** the next scheduled push establishes the projection

#### Scenario: The stored projection has no Home offers

- **WHEN** the renderer holds a valid projection that lists no Home offers
- **THEN** Home renders its open pre-order chapters as before and no featured chapter appears
