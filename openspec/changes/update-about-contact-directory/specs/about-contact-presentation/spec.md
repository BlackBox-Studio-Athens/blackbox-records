## MODIFIED Requirements

### Requirement: About contact content has a clear authored hierarchy

The system SHALL render the About `contact` section from its existing title, intro, and ordered contact items, presenting the first authored item as primary and every later item as secondary without duplicating or omitting content.

#### Scenario: Current contact content renders

- **GIVEN** General is the first authored contact item followed by Demo Submissions and Tour Booking
- **WHEN** a visitor opens the About page
- **THEN** General receives the dominant full-width presentation
- **AND** Demo Submissions and Tour Booking receive the secondary presentation in authored order
- **AND** the existing `Contact` title, `Don't be strangers.` intro, labels, and addresses remain visible.

### Requirement: About email rows are native email actions

The system SHALL expose each current About contact item as one keyboard-usable anchor that fills its visible row apart from the row's copy control and whose visible address and `mailto:` destination use the authored email value.

#### Scenario: Visitor activates a contact row

- **WHEN** a visitor activates General, Demo Submissions, or Tour Booking
- **THEN** the corresponding anchor uses `mailto:info@blackboxrecordsathens.com`, `mailto:demos@blackboxrecordsathens.com`, or `mailto:touring@blackboxrecordsathens.com`
- **AND** the anchor, rather than a smaller child control, fills the visible contact row except the copy control
- **AND** it does not require JavaScript or open an intermediate page
- **AND** it does not force a new browser tab.

#### Scenario: Contact row semantics are inspected

- **WHEN** assistive technology exposes a contact link
- **THEN** its accessible name includes the authored role and visible email address
- **AND** its mail icon is excluded from the accessibility tree
- **AND** the mail icon renders at 18 CSS pixels and remains visually subordinate to the role and address
- **AND** the icon is not the only indication of the action.

### Requirement: About contact links remain usable across input modes

The system MUST give each contact link and copy control a visible keyboard focus treatment, WCAG 2.2 AA text and focus-indicator contrast, and a pointer target at least 44 CSS pixels high.

#### Scenario: Keyboard visitor navigates the contact directory

- **WHEN** a visitor tabs through the About contact directory
- **THEN** focus reaches each row's link and then its copy control, following General, Demo Submissions, and Tour Booking in authored order
- **AND** the focused control has a visible treatment that does not depend on motion
- **AND** no pointer-only interaction is required.

### Requirement: About contact hierarchy reflows without overflow

The system SHALL preserve the selected Primary Inbox hierarchy without two-dimensional page scrolling at supported widths down to 320 CSS pixels.

#### Scenario: Wide layout renders

- **WHEN** the About contact directory renders at a supported wide viewport
- **THEN** General spans the contact presentation width
- **AND** Demo Submissions and Tour Booking render as two balanced secondary columns beneath it
- **AND** all three rows remain part of one flat editorial surface rather than separate nested cards.

#### Scenario: Narrow layout renders

- **WHEN** the About contact directory renders at 320 CSS pixels wide
- **THEN** General, Demo Submissions, and Tour Booking stack in authored order
- **AND** labels, email addresses, mail icons, and copy controls remain visible
- **AND** long addresses wrap within the viewport without clipping or horizontal page scrolling.

### Requirement: About contact presentation remains inside the BlackBox visual system

The system SHALL reuse the existing About surface, brand typography, color tokens, hard edges, restrained separators, and public control family without creating a separate visual system.

#### Scenario: Redesigned contact block is reviewed

- **WHEN** the contact block renders inside the About page
- **THEN** it remains visually subordinate to the About page title and consistent with the surrounding rich-text surface
- **AND** it uses no nested contact cards, gradients, glass effects, icon tiles, extra explanatory copy, or decorative animation.

## ADDED Requirements

### Requirement: About email addresses can be copied

The system SHALL give each About contact row one icon-only copy control from the public control family that writes the row's exact authored email value to the clipboard.

#### Scenario: Visitor copies an address

- **WHEN** a visitor activates the copy control of a contact row
- **THEN** the clipboard holds that row's authored email value
- **AND** the control shows a check mark in place of its copy icon for about two seconds without changing size
- **AND** a status region announces `Copied`.

#### Scenario: Copy control semantics are inspected

- **WHEN** assistive technology exposes a copy control
- **THEN** it is a button named `Copy <address>` with the row's visible address
- **AND** it renders at the default 36 CSS pixel icon size with a 44 CSS pixel coarse-pointer target.

#### Scenario: Clipboard is unavailable

- **WHEN** the browser rejects the clipboard write
- **THEN** the status region announces `Select the address to copy`
- **AND** the row's `mailto:` link remains usable.

#### Scenario: Visitor returns through shell navigation

- **WHEN** a visitor reaches the About page through shell navigation, including a return to a cached page
- **THEN** each copy control copies its row's address.
