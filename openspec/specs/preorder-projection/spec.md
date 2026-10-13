# preorder-projection Specification

## Purpose

Lets public pages render open pre-orders in their first HTML response, by having commerce publish the current set of buyable pre-orders to the public renderer whenever that set changes.

## Requirements

### Requirement: Commerce derives one open pre-order projection

The commerce Worker SHALL derive an open pre-order projection from the same rules as the public listing read. It lists every Store Item whose offer is ready, stocked and on an open shopper pre-order, with its display price and shopper ship estimate, ordered by slug. The projection MUST contain no stock counts, provider identifiers, order data or private fields.

#### Scenario: A buyable pre-order exists

- **WHEN** a Store Item is ready, stocked and on an open pre-order
- **THEN** the projection lists its slug, display price and shopper ship estimate, or a withheld estimate once its month has passed
- **AND** the listing read and the projection agree on that item's pre-order state

#### Scenario: A pre-order is not buyable

- **WHEN** a pre-order item has run out of copies, is paused or unavailable, or its exact date has arrived
- **THEN** the projection omits it

### Requirement: Projection changes reach the renderer promptly

Commerce SHALL push the projection to the public renderer after each successful write that can change it: a staff pre-order or stock change, and paid checkout finalization. It SHALL also push on every run of the existing scheduled job as a backstop and for date-based closing. A failed push MUST NOT fail or roll back the commerce write.

#### Scenario: Staff open a pre-order

- **WHEN** staff put a stocked, ready variant on pre-order
- **THEN** the renderer holds a projection that lists it before the next scheduled run

#### Scenario: The last pre-order copy is sold

- **WHEN** paid finalization takes the last copy of a pre-order item
- **THEN** the renderer receives a projection without that item

#### Scenario: A push fails

- **WHEN** the renderer cannot be reached after a commerce write
- **THEN** the write still succeeds
- **AND** the next scheduled run pushes the current projection

#### Scenario: An exact pre-order date arrives

- **WHEN** an exact-date pre-order reaches its date in Europe/Athens
- **THEN** a scheduled run within five minutes pushes a projection without it

### Requirement: The renderer applies only changed projections

The public renderer SHALL accept projections only on its private service entrypoint and SHALL validate them. It stores the latest projection durably for the public and publication renderer objects. A projection with an unchanged identity SHALL cause no cache retirement, purge or storage write.

#### Scenario: An unchanged projection arrives

- **WHEN** the scheduled job pushes a projection identical to the stored one
- **THEN** the renderer stores nothing, retires nothing and purges nothing

#### Scenario: A changed projection arrives

- **WHEN** a projection with a new identity is accepted
- **THEN** subsequent renders use it
- **AND** published HTML from the previous projection is retired and purged at the edge

#### Scenario: A public request targets the projection path

- **WHEN** a request arrives through the Pages gateway for the projection path
- **THEN** it is rejected without changing the stored projection

### Requirement: Rendering without a projection makes no pre-order claims

When the renderer holds no valid projection, pages SHALL render as if no pre-order is open. They show no Pre-orders section, no Pre-order labels and no shipping estimates. They MUST NOT block or fail the page render.

#### Scenario: The renderer starts with empty storage

- **WHEN** the renderer has never received a projection
- **THEN** Home renders without a Pre-orders section and Releases renders neutral edition links
- **AND** the next scheduled push establishes the projection
