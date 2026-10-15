## MODIFIED Requirements

### Requirement: Ordinary buying actions share restrained purchase feedback

Enabled ordinary Buy actions on Releases and Store SHALL use the shared Violet filled treatment, white labels and existing white format marks. They SHALL retain finite hover, visible keyboard focus, busy/disabled states and reduced-motion behavior without moving their footprint or surrounding artwork. Pre-order SHALL remain Sea and Listen SHALL remain Slate.

#### Scenario: Visitor hovers Buy

- **WHEN** a hover-capable pointer enters an enabled ordinary buying action
- **THEN** its face and edge provide subtle local feedback
- **AND** every ordinary Buy uses #7d58a0 at rest and #664584 on hover/press, with #b08fd0 hover edge; Store labels read Buy and Release labels identify vinyl, CD or cassette
- **AND** its footprint and surrounding artwork remain unchanged

#### Scenario: Buying is disabled or loading

- **WHEN** a buying control is disabled or loading
- **THEN** its action remains unavailable and does not acquire enabled hover feedback
- **AND** a Store card Buy retains its Violet role and format mark with the shared disabled/busy treatment
- **AND** reduced-motion preference removes nonessential transition timing
