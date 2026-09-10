## ADDED Requirements

### Requirement: Store Coverflow retains one pre-ready disclosure activation

An eligible Store Coverflow MUST retain one full-catalog activation received after progressive preview is visible but before its shared controller is ready.

#### Scenario: Visitor activates disclosure before readiness

- **WHEN** a pointer or keyboard-generated activation reaches the visible full-catalog control before its group is ready
- **THEN** one group-local disclosure intent is retained
- **AND** repeated pre-ready activations are coalesced
- **AND** the shared controller consumes the intent exactly once after all group listeners are attached.

#### Scenario: Pending disclosure becomes invalid

- **WHEN** the route exits, its snapshot is captured, progressive enhancement falls back, or controller cleanup runs before the intent is consumed
- **THEN** pending disclosure state is removed
- **AND** no activation leaks into a later route visit or another Coverflow group.
