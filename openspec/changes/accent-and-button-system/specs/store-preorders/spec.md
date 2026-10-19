## MODIFIED Requirements

### Requirement: Pre-order presentation stays within the visual language

Pre-order actions SHALL use Sea #2d766a resting fills with white labels, #256258 hover/pressed faces and #4ca999 hover edges. Pre-order information SHALL use #4ca999 text and the approved Sea surface only for pre-order meaning. Controls SHALL use the shared 44px family. Home SHALL preserve ink Veneer identity, Bebas prices/actions, Inter information and intact original artwork, and SHALL use the approved Soft edge treatment for its showcase purchase actions only.

#### Scenario: Badge and action render

- **WHEN** a pre-order badge or action is shown on any surface
- **THEN** browse status is a plain Sea text line at 4.5:1 contrast or better, and the action is Sea-filled at rest without a 3px base line or an extra framed digital-status badge
- **AND** targets are at least 44px, text does not clip at 200% zoom or 390px width, and reduced-motion preferences are respected.

#### Scenario: Approved Home artwork and layout render

- **WHEN** a video or no-video Home chapter is viewed at narrow mobile, small laptop or wide desktop dimensions
- **THEN** original square covers retain their detail and framing, album and artist are distinct, and actual metadata and shipping estimates remain readable
- **AND** screenshot crops, fake shopping controls, prototype instructions and fixture catalog values never appear as live product content.

#### Scenario: Refined Home identity and navigation render

- **WHEN** an approved Home chapter is displayed
- **THEN** covers are noninteractive, accepted artist paths produce subtle profile links, and missing paths retain plain artist text
- **AND** video chapters omit the repeated album details block; a next chapter offers only a visible down-arrow with a descriptive accessible label.

#### Scenario: Home purchase information and Base sweep render

- **WHEN** a shopper views or interacts with a Home pre-order action
- **THEN** the action stays Sea-filled at rest and uses Soft edge: a 385ms darker Sea face and 700ms centre-out 1px lower line with 6px side/4px bottom insets, softly transparent ends and 72% opacity, with a 455ms exit and cubic-bezier(.22,.61,.36,1)
- **AND** text and geometry never shift; the upward sweep belongs only to the Flint hero CTA
- **AND** touch/non-hover presses animate over 220ms with a minimum 220ms visual press and 180ms retreat, without delaying the Store Item link; reduced motion removes transitions and the visual hold
- **AND** the Home section retains truthful shipping information and an existing terms link instead of repeated payment/whole-parcel copy; purchase and checkout disclosures remain unchanged.

#### Scenario: Soft edge covers each Home chapter without changing other surfaces

- **WHEN** Home renders a video, photograph or cover-only pre-order chapter
- **THEN** every purchase action uses the same Soft edge treatment, preserves its accessible name and destination, and keeps its existing pair with Listen
- **AND** its decorative layer is noninteractive and hidden from assistive technology, and the link remains usable before hydration or without JavaScript
- **AND** Store and Releases pre-order actions retain their existing treatments, with no shipped preview picker, duration control or preview status message.
