## ADDED Requirements

### Requirement: Pre-order native film pause by direct interaction

The Home pre-order showcase SHALL let a visitor pause and resume prepared native background footage by clicking or tapping the exposed film background. It SHALL provide a descriptive native keyboard control with Enter/Space activation and focus visible for keyboard input only, without a new visible icon, caption or persistent control. Existing reduced-motion, data-saving, visibility and player eligibility SHALL remain authoritative.

#### Scenario: Visitor pauses and resumes a film

- **WHEN** the visitor clicks or taps the film background
- **THEN** its manual pause intent toggles and a paused film retains its last displayed frame
- **AND** only a subsequent explicit resume permits eligible playback again, including after scrolling away/back, tab visibility changes, responsive source changes and player-session suspension.

#### Scenario: Visitor uses a keyboard

- **WHEN** the visitor reaches the film control with a keyboard and presses Enter or Space
- **THEN** it toggles manual pause with a descriptive accessible action name and visible focus outline
- **AND** focus or hover alone never starts playback.

#### Scenario: Visitor uses other actions or scrolls

- **WHEN** the visitor uses purchase, artist, Listen, Watch, next-chapter or player controls, selects text, or scrolls/swipes across the film
- **THEN** those interactions retain their existing behavior and do not toggle background pause
- **AND** controls are not nested and scrolling is not captured or prevented.

#### Scenario: Motion is restricted or footage is missing

- **WHEN** reduced motion/data saving applies, playback fails/refuses, the clip changes, or a chapter has no native film
- **THEN** the complete existing still/purchase experience remains usable, automatic playback restrictions are preserved, and no unrelated film frame or active control is substituted
- **AND** the Home hero and full-video provider controls remain unchanged.
