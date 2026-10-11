# Spec Delta

## ADDED Requirements

### Requirement: Home mobile input evidence covers first use and content state

The runtime harness SHALL use actual mobile/touch browser behavior for mobile-load profiles and SHALL report Home early input separately from settled first and repeat scrolling for populated and empty preorder showcases.

#### Scenario: Mobile Home is opened and used immediately

- **WHEN** the declared mobile profile opens Home with a cleared cache and dispatches swipes and taps before settlement
- **THEN** the evidence records viewport, DPR, CPU, network, content fixture, release identity, request activity, gesture timing, and long tasks
- **AND** tap responsiveness is reported separately from continuous scrolling.
- **AND** a first `scroll` event is labeled as an event observation, not as the first visible frame.

#### Scenario: Local swipe and Menu diagnostics distinguish browser activation

- **WHEN** a declared local Home diagnostic performs a direct Menu tap or taps after a touch swipe
- **THEN** its evidence retains touch, pointer, scroll, frame, and browser-dispatched click timestamps alongside Menu state and the actual touch-end-to-tap interval
- **AND** a missing browser `click` is distinguished from a dispatched click that the shell did not handle.

#### Scenario: Populated and empty showcases are compared

- **WHEN** Home is measured with populated and empty preorder states
- **THEN** each state is identified in the output and comparable before/after runs use the same state and input cadence
- **AND** valid slow runs and unrelated scheduling delays remain visible rather than being dropped.

#### Scenario: Android Messenger acceptance is evaluated

- **WHEN** a physical Android phone is available for release validation
- **THEN** the same release is checked in Messenger and Chrome with device, Android, browser/app versions, and observed swipe/tap behavior recorded
- **AND** emulation alone does not close the reported Messenger delay.
