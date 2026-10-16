## MODIFIED Requirements

### Requirement: Public controls share one compact family

Public buttons, chips, icon controls, navigation targets and text-action rows SHALL use one square, flat family with a visible 44px control height. Browse the Store in the Home hero SHALL be the sole 52px height exception. Action labels SHALL be white except for dark labels on neutral ink faces. Labels SHALL keep their type size on touch devices; invisible halos SHALL NOT substitute for the visible target.

#### Scenario: Controls align in a row

- **WHEN** controls share a row with an input or Listen
- **THEN** each control is 44px high with square corners and a 1px edge
- **AND** button labels use Bebas Neue 16px capitals, 0.06em tracking, a 1px top nudge, 16px horizontal padding and an 8px gap to any 18px icon
- **AND** labelled controls start from 112px minimum width except the narrow Store purchase action.

#### Scenario: Shopper taps on a phone

- **WHEN** a phone presents a button, chip or icon action
- **THEN** its visible and tappable height is 44px, with icon-only controls 44×44
- **AND** controls have at least 8px separation, or 16px within a paired action row
- **AND** the two-up Store purchase action may reduce width to fit, without reducing its 44px height or clipping its label.

#### Scenario: Neutral and coloured controls render

- **WHEN** a control renders at rest, selected or as In player
- **THEN** its label is #f5f5f5
- **AND** a neutral #e8e8e8 face instead uses #090909 text, returning to white when the hero face becomes Flint
- **AND** static metadata, placeholders, counts and marks retain their assigned non-label colours.

### Requirement: Focus and hover are visible and finite

Every public control SHALL show a 2px #f5f5f5 keyboard focus ring at 2px offset. Hover SHALL apply only on hover-capable devices, change colour or border within 250ms and never move the control. Disabled controls SHALL stop activation and use 45% opacity; In player SHALL remain full-opacity disabled session information. Reduced motion SHALL remove transition timing.

#### Scenario: Keyboard user tabs through the header

- **WHEN** focus reaches menu, cart, Listen or another public action
- **THEN** the same ink ring remains visible against its ground
- **AND** a field's amber #e3b56c focus edge supplements rather than replaces that ring.

#### Scenario: Touch device after a tap

- **WHEN** a control is tapped on a device without hover
- **THEN** pressed feedback ends with the press and no hover face remains.

#### Scenario: Hero animates inside a stationary control

- **WHEN** Browse the Store receives pointer hover or keyboard focus
- **THEN** the 52px control stays fixed while its Flint fill rises and its arrow moves 6px inside the box over 240ms
- **AND** reduced motion shows the final state immediately.

## REMOVED Requirements

### Requirement: Section tone is inherited

**Reason**: Route-specific Store and Services accents conflict with the approved semantic colour roles.
**Migration**: Replace section-tone inheritance with the fixed roles below; preserve native actions and scope Staff styling separately.

#### Scenario: A section previously supplied a tone

- **WHEN** public controls render in Store, checkout, Services or any other section
- **THEN** their action role determines their treatment rather than a route accent.

## ADDED Requirements

### Requirement: Accent roles are fixed

Public controls SHALL use Sea Green for pre-order purchases, Flint for ordinary Buy and Add to cart, Flint outlines for browse actions, and neutral ink faces for hero and submission actions. Listen SHALL use the owner's chosen amber tokens defined in accent-colour-roles for edges, bars, In player text and focus/hover/session surfaces. Generic icon controls SHALL remain neutral. No section SHALL override these roles.

#### Scenario: Purchase and browse controls render

- **WHEN** Buy, Pre-order, Listen, Read News and View Full Roster render
- **THEN** their respective treatments are Flint fill, Sea fill, amber outline, Flint inverse outline and Flint inverse outline
- **AND** Buy retains its white format mark, Store cards say Buy and Releases say Buy vinyl, Buy CD or Buy cassette.

#### Scenario: Neutral submission controls render

- **WHEN** Pay, Subscribe, Show N items or Send inquiry renders
- **THEN** it uses the neutral ink face with dark text when enabled
- **AND** disabled, pending and busy states remain truthful and accessible.

### Requirement: Adjacent actions form a filled and outlined pair

Two adjacent action controls SHALL form one filled primary and one outlined secondary of the same 44px height. On phones they SHALL share the row equally with a 16px gap; on desktop they SHALL fit their labels from 112px. Price and noninteractive status SHALL NOT count as a second action. Long content SHALL reflow without clipped labels or reduced targets.

#### Scenario: Home pre-order actions render

- **WHEN** a Home chapter offers Pre-order and Listen
- **THEN** Sea-filled Pre-order and amber-outlined Listen share the paired row.

#### Scenario: Release purchase actions render

- **WHEN** a Release offers Buy vinyl, Buy CD, Buy cassette or Pre-order vinyl beside Listen
- **THEN** one Flint or Sea purchase fill pairs with one amber outline
- **AND** neither action is duplicated elsewhere in the card.

#### Scenario: Price is beside one purchase control

- **WHEN** a Store card shows price and Buy or Pre-order, or the hero shows only Browse the Store
- **THEN** no second control is invented to satisfy the pair rule.
