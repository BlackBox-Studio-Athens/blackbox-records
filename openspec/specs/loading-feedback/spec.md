## Purpose

Specify shared loading feedback behavior for visible asynchronous UI states across shopper, admin, and protected operator frontend surfaces.

## Requirements

### Requirement: Visible async states are explicit

The system SHALL give every visible async UI state an explicit loading, pending, opening, refreshing, saving, or checking affordance that is visible to sighted users and available to assistive technology.

#### Scenario: Action waits on async work

- **WHEN** a user-triggered action is waiting on an async read, mutation, redirect handoff, or embedded surface
- **THEN** the action shows a visible pending affordance such as an inline spinner and intent-specific label
- **AND** the busy state is exposed through `disabled`, `aria-busy`, `role="status"`, `aria-live="polite"`, or an equivalent accessible state on the relevant control or region.

#### Scenario: Panel waits on async data

- **WHEN** a page region has no trustworthy data yet because an async read is in progress
- **THEN** the region displays a stable loading state block or status message instead of appearing empty.

### Requirement: Loading feedback preserves layout stability

The system SHALL preserve the geometry and placement of controls and panels during loading transitions unless the destination content genuinely requires a different layout.

#### Scenario: Button resolves from pending to ready

- **WHEN** a button changes from pending to ready, unavailable, or error state
- **THEN** its height, primary placement, and minimum width remain stable enough to avoid a distracting layout shift
- **AND** the transition does not reclassify the user's expected action without visible explanation.

#### Scenario: Full panel resolves from pending to content

- **WHEN** a route, overlay, checkout return, stock panel, or embed loading state resolves
- **THEN** the loading region reserves enough space that adjacent content does not collapse and jump.

### Requirement: Loading copy names the user-visible operation

The system SHALL use loading copy that describes the user-visible operation instead of implementation internals.

#### Scenario: Shopper loading copy is rendered

- **WHEN** shopper-facing UI waits for checkout, Store Offer, cart, route, overlay, or payment-return state
- **THEN** the copy uses terms such as `Checking availability`, `Confirming payment status`, or `Opening Stripe Checkout`
- **AND** it does not expose feature flag keys, D1 bindings, Stripe IDs, secrets, internal provider errors, or backend implementation names.

#### Scenario: Operator loading copy is rendered

- **WHEN** protected operator UI waits for stock reads or mutations
- **THEN** the copy names the operator task, such as `Loading stock workspace`, `Refreshing stock`, `Saving StockChange`, or `Saving StockCount`.

### Requirement: Loading primitives stay within the existing UI system

The system SHALL implement loading feedback through the existing Astro, React, Tailwind, shadcn-ui, lucide, and local component conventions.

#### Scenario: A loading primitive is added

- **WHEN** a reusable loading primitive is introduced
- **THEN** it composes the existing local `Button`, `Spinner`, card/panel styles, and Tailwind utilities
- **AND** it does not add a new UI framework, state-management library, animation library, or decorative visual system.

#### Scenario: Skeletons are considered

- **WHEN** a loading state is for a known action or known status
- **THEN** the system uses an inline spinner, status block, or progress indicator instead of a skeleton
- **AND** skeletons are reserved for truly unknown content structure.
