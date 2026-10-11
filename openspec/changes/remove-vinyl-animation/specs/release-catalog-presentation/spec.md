## ADDED Requirements

### Requirement: Vinyl visuals remain static

The public site SHALL NOT render decorative sliding or rotating vinyl records or animate vinyl Buy icons. Release artwork SHALL remain complete without a record behind its sleeve. Vinyl Buy icons SHALL retain their existing appearance as stationary artwork. CD and cassette effects and Grid/Crate browsing SHALL retain their existing behavior.

#### Scenario: Visitor engages vinyl artwork or an edition action

- **WHEN** a visitor hovers or keyboard-focuses a vinyl release artwork link or edition action at any viewport or motion preference
- **THEN** no decorative vinyl record is rendered or animated and no record-photo asset is requested
- **AND** the edition action retains its existing wording, bracket styling and hover/focus feedback
- **AND** native edition artwork and action keep their shared destination while Listen remains independent

#### Scenario: Visitor engages a vinyl Buy icon

- **WHEN** a visitor hovers, focuses or presses Buy for a vinyl item or another item using the vinyl mark
- **THEN** the vinyl icon remains stationary with its existing appearance
- **AND** buying and cart behavior remain unchanged
