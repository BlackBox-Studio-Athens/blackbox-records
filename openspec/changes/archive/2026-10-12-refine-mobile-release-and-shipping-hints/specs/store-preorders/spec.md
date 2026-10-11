## ADDED Requirements

### Requirement: Home background playback has no text play control

The Home pre-order film SHALL omit the manual Play background text button, preserve poster fallback and preference-aware muted playback, and retain accessible motion interruption and explicit full-video playback.

#### Scenario: Shopper views a film chapter

- **WHEN** a Home video pre-order chapter renders
- **THEN** no Play background text button is shown
- **AND** Watch full video and Listen retain their existing behavior

#### Scenario: Motion is restricted

- **WHEN** reduced motion or data saving applies, or ambient playback fails
- **THEN** the complete poster remains available without a text background-play control
