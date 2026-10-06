## ADDED Requirements

### Requirement: Homepage motto cycles its last word with a waveform scrub

The homepage hero SHALL cycle the last word of the Staff motto through Records, Art and Noise when the motto ends with one of them, starting from the written word in its casing and punctuation. A playhead SHALL scrub between words with random glitch tears and torn track-waveform fragments, confined to a span that moves from the old word's length to the new word's length and ending before the scrub's last third. The written word SHALL hold 2.5 s on entry, every later word 2.8 s, and each scrub SHALL take 1.4 s. Assistive technology SHALL read the written motto.

#### Scenario: Visitor opens Home

- **WHEN** Home renders the motto `No borders. No genres. Just records.`
- **THEN** Records shows first and is the word announced to assistive technology
- **AND** after its hold a playhead scrubs to Art, then Noise, then Records again without moving the preceding words or the line layout.

#### Scenario: Staff writes a different motto

- **WHEN** the motto's last word is not Records, Art or Noise
- **THEN** the motto renders exactly as written with no animation.

#### Scenario: Visitor prefers reduced motion or cannot see the hero

- **WHEN** the visitor prefers reduced motion
- **THEN** the written word stays and no playhead or tears appear
- **AND** while the hero is off screen or the tab is hidden the cycle pauses and resumes its remaining hold afterwards.

#### Scenario: Visitor returns to Home through the shell

- **WHEN** the visitor leaves Home through shell navigation and returns
- **THEN** the motto keeps cycling without a full page load.
