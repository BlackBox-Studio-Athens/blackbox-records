## ADDED Requirements

### Requirement: Staff can skip the shipping email when recording dispatch

Eligible order detail SHALL show a default-checked Send shipping email checkbox immediately before Mark shipped when no shipping-email delivery or saved opt-out exists. The workspace SHALL preserve the choice during refresh and failure, reset it between orders, disable it while saving, and show a saved opt-out as neutral Shipping email skipped information.

#### Scenario: Staff records an already-shipped order

- **WHEN** staff unchecks Send shipping email and chooses Mark shipped
- **THEN** the protected dispatch request explicitly disables the email
- **AND** successful feedback confirms the shipment was recorded without queuing an email
- **AND** Notifications shows Shipping email skipped after reopening the order.

#### Scenario: Staff revisits a previous decision

- **WHEN** an unshipped order has a saved opt-out or an existing shipping-email delivery
- **THEN** its saved outcome appears instead of a new checkbox
- **AND** undo/re-mark neither removes an opt-out nor cancels or duplicates existing email work.

#### Scenario: Refresh, submission failure and order switching

- **WHEN** an eligible order refreshes or its dispatch submission fails
- **THEN** the entered checkbox selection remains
- **AND** selecting another eligible order starts with Send shipping email checked.

#### Scenario: Keyboard and narrow-screen use

- **WHEN** staff records dispatch using a keyboard or a phone-width viewport
- **THEN** the checkbox has a visible associated label and helper text, visible focus and a reachable target
- **AND** controls wrap without horizontal overflow and become disabled during submission.
