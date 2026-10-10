## ADDED Requirements

### Requirement: Staff owned scroll surfaces use Lenis with immediate recovery

The staff workspace SHALL use a lifecycle-owned Lenis runtime for the document/workspace and explicitly owned scroll panes. Saved navigation positions, focus restoration, validation recovery, and private preview synchronization MUST remain immediate. Draft protection and third-party editor behavior MUST remain intact.

#### Scenario: Staff navigates between workspace entries

- **WHEN** the staff workspace saves or restores a navigation entry
- **THEN** each owned scroll pane and the window restore its recorded position immediately
- **AND** focus returns to the recorded row or supplied fallback without an animated jump.

#### Scenario: Staff scrolls a nested workspace pane

- **WHEN** staff scrolls an owned list, editor outer pane, navigation drawer, or history/review panel
- **THEN** its Lenis instance handles that pane without double-consuming input in an ancestor
- **AND** EmDash editor internals, form controls, preview iframes, and third-party surfaces remain native.

### Requirement: Staff first-party surface transitions use lifecycle-safe Motion

Coordinated staff-owned drawer, history, and disclosure transitions SHALL use Motion while preserving dialog focus, save protection, and workspace contents. Reduced motion SHALL settle each transition immediately.

#### Scenario: Staff closes or interrupts a surface transition

- **WHEN** the staff member closes a drawer or a route replaces its contents during animation
- **THEN** the animation is canceled and its owner releases resources
- **AND** saved drafts, navigation recovery, and focus behavior remain usable.
