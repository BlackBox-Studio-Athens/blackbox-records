## ADDED Requirements

### Requirement: Back closes the open player

While the player modal is open, the shell SHALL keep one history entry for it at the page's own URL, so the device or browser Back control closes the modal instead of navigating the page beneath it. Closing through Back SHALL use the modal's close semantics: an interacted session minimizes into the floating player and any other session stops. Toggling the player through history SHALL NOT route, scroll or re-render the page beneath it.

#### Scenario: Listener presses Back while the player is open

- **GIVEN** the player modal is open over a page
- **WHEN** the listener presses the Android Back key, the Back gesture or the browser's Back
- **THEN** the modal closes, minimizing a session the listener interacted with and stopping one they did not
- **AND** the page beneath keeps its URL, content and scroll position
- **AND** the next Back navigates as it would without the player.

#### Scenario: Listener closes the player with its controls

- **WHEN** the listener closes the modal with Close or Minimize, Escape or the backdrop
- **THEN** the player's history entry is consumed
- **AND** one Back then navigates, with no press that does nothing.

#### Scenario: Player opened from a release overlay

- **GIVEN** the listener opened the player from a release detail overlay
- **WHEN** they press Back
- **THEN** only the player closes and the overlay stays open at its URL
- **AND** the next Back closes the overlay.

#### Scenario: Listener goes Forward after Back closed the player

- **GIVEN** Back minimized an interacted session
- **WHEN** the listener presses Forward
- **THEN** the player modal reopens with the same session
- **AND** the page beneath is not routed again.
