# Spec Delta

## Purpose

Shared behaviour of the public site's buttons, chips, icon controls and text actions, so every control reads as one family and stays usable by pointer, touch, keyboard and assistive technology.

## ADDED Requirements

### Requirement: Public controls share one compact family

Public-site buttons, chips and icon controls SHALL use one square, flat family with three sizes: compact (32px) for filters, sort and view toggles; default (36px) for actions and icon controls; large (44px) for commerce decisions, controls beside 44px inputs and controls beside the Listen action. Labels SHALL be set in the UI display face in capitals and SHALL NOT change size with the control's touch handling. On coarse pointers every control SHALL accept taps within a 44px area without changing its visible size.

#### Scenario: Controls align in a row

- **WHEN** an action sits beside a 44px input or beside a Listen control
- **THEN** it uses the large size so the row shares one height.

#### Scenario: Shopper taps on a phone

- **WHEN** a coarse pointer taps within 4px outside a 36px control's visible edge
- **THEN** the control activates
- **AND** its visible size, label and spacing are unchanged from a pointer device.

### Requirement: Focus and hover are visible and finite

Every public control SHALL show a visible keyboard focus ring; Listen SHALL keep its amber ring. Hover treatments SHALL apply only on hover-capable devices, change colour or border over at most 250 milliseconds and never move the control. Disabled controls SHALL reduce opacity and stop receiving pointer events.

#### Scenario: Keyboard user tabs through the header

- **WHEN** focus reaches the menu toggle, the cart control or any header action
- **THEN** a ring is visible against the header ground.

#### Scenario: Touch device after a tap

- **WHEN** a control is tapped on a device without hover
- **THEN** no hover face remains after the tap.

### Requirement: Labels name the action and loading keeps its place

Button labels SHALL be a verb and its object of at most three words. A control that is working SHALL keep its width, expose a busy state to assistive technology and change its label to describe the work; it SHALL NOT show a spinner as the only signal. A form's submit control SHALL remain enabled until submission; validation problems SHALL be explained in text. Icon-only controls SHALL have an accessible name.

#### Scenario: Newsletter form submits

- **WHEN** the shopper submits and the request is in flight
- **THEN** the control reads Subscribing, keeps its width and is marked busy
- **AND** it returns to its label when the request ends.

### Requirement: Status is information, not a control

Non-buyable purchase status (Sold Out, Out of Stock, unavailable) SHALL render as a non-interactive status element, never as a disabled button. Selected filter chips SHALL show selection by shape and text (a check mark and a stronger border), not colour alone, and MAY show how many results the filter yields; a filter with zero results SHALL remain enabled and read 0.

#### Scenario: Item is sold out

- **WHEN** a Store Item's offer is not buyable
- **THEN** the purchase slot shows the status text in the same geometry as the purchase action
- **AND** the element is not focusable and is exposed as status.

### Requirement: Section tone is inherited

Store and checkout surfaces SHALL declare the store tone once; services surfaces SHALL declare the services tone once. Outlined controls inside a toned surface SHALL take that section's accent border and hover surface; filled primary controls and icon controls SHALL stay neutral. No public control SHALL carry a section accent outside its section.

#### Scenario: Continue shopping in the cart drawer

- **WHEN** the cart drawer renders its secondary action
- **THEN** its border uses the store accent
- **AND** the Checkout action stays ink on near-black.

### Requirement: Actions that leave the site are marked

A text control that opens another site in a new tab SHALL carry a small ↗ mark hidden from assistive technology; the accessible name SHALL still convey the destination. Shell-owned navigation and player controls SHALL NOT carry the mark.

#### Scenario: Release detail offers Bandcamp

- **WHEN** a release links to its Bandcamp page
- **THEN** the control shows the ↗ mark
- **AND** activating it opens a new tab and leaves the player running.

### Requirement: Motion respects reduced motion

Control transitions, loading hairlines and in-place feedback timers SHALL disable their animation under a reduced-motion preference while keeping their text and states.

#### Scenario: Reduced motion is on

- **WHEN** the browser requests reduced motion
- **THEN** Added, Undo and Stop? states still appear and time out
- **AND** no hairline or colour animation runs.
