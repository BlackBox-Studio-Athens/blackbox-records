## ADDED Requirements

### Requirement: Artist card images match News hover feedback

Artist card photos SHALL use the existing News image hover treatment while preserving their current framing, image fitting, overlays, links, and responsive delivery. The decorative effect MUST respect reduced-motion preferences and MUST NOT require JavaScript.

#### Scenario: Visitor hovers an Artist card

- **WHEN** a hover-capable pointer enters an Artist card with no reduced-motion preference
- **THEN** its photo scales to 1.03 over 500 ms, matching News
- **AND** leaving the card returns the photo smoothly to its original scale
- **AND** the card frame and surrounding layout remain stationary.

#### Scenario: Shared Artist cards render

- **WHEN** homepage featured, detailed roster, or default Artist cards render
- **THEN** they offer the same image hover feedback
- **AND** their existing photo fitting, aspect ratios, overlays, navigation, and image loading behavior remain unchanged.

#### Scenario: Visitor requests reduced motion

- **WHEN** the visitor enables reduced motion and hovers an Artist card
- **THEN** its photo remains at its original scale without a transform transition
- **AND** the card retains visible focus feedback and normal link activation.
