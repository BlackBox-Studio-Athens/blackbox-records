## MODIFIED Requirements

### Requirement: Ordinary buying actions share restrained purchase feedback

Enabled ordinary Buy actions on Releases and Store SHALL give subtle hover, visible keyboard focus and pressed feedback without layout movement or JavaScript animation. Releases Buy vinyl SHALL keep the shared restrained primary feedback. The Store card Buy SHALL take the Listen chrome (dark face, hairline edge, the Listen hover highlight with a Store Blood hover edge) with the same stationary footprint, busy, disabled and reduced-motion behaviour. Disabled or loading controls MUST NOT receive active hover feedback. Existing preorder and Listen treatments MUST retain their independent meanings and reduced-motion support.

#### Scenario: Visitor hovers Buy

- **WHEN** a hover-capable pointer enters an enabled ordinary buying action
- **THEN** its face and edge provide subtle local feedback
- **AND** a Store card Buy's edge turns Store Blood with the Listen highlight, while Releases Buy vinyl keeps its restrained tonal feedback
- **AND** its footprint and surrounding artwork remain unchanged

#### Scenario: Buying is disabled or loading

- **WHEN** a buying control is disabled or loading
- **THEN** its action remains unavailable and does not acquire enabled hover feedback
- **AND** a Store card Buy keeps its resting Listen chrome
- **AND** reduced-motion preference removes nonessential transition timing
