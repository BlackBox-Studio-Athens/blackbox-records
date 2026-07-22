## ADDED Requirements

### Requirement: Editorial CMS identifies authoritative commerce operations

The system MUST explain inside the Decap editor where common non-editorial Store Item operations happen and MUST preserve existing authority boundaries.

#### Scenario: Editor needs to change a Store Item price

- **WHEN** an editor looks for price controls while editing a Release or Distro Store Item
- **THEN** the CMS states that price changes happen in Stripe Dashboard by creating a replacement Price under the existing Product and following existing verification
- **AND** it does not expose or ask the editor to copy Stripe IDs, lookup keys, metadata identities, D1 IDs, amounts, or currency into Decap.

#### Scenario: Editor needs to change available stock

- **WHEN** an editor needs to record stock movement or change online quantity
- **THEN** the CMS identifies the protected `/stock/` operations surface as the stock authority
- **AND** it does not represent a Decap field, content order, or content deletion as stock state.

#### Scenario: Editor needs to stop an item selling

- **WHEN** an editor needs to stop checkout for an editorially visible Store Item
- **THEN** the CMS directs them to online-stock or commerce-operator checkout controls
- **AND** it states that deleting the Release or Distro content entry is not the supported stop-selling action.

#### Scenario: Editor needs order or fulfillment work

- **WHEN** an editor needs to inspect payment, order, or fulfillment state
- **THEN** the CMS states that Worker/Stripe paid-order state and the existing manual fulfillment process own that work
- **AND** it does not expose order mutation, BOX NOW credentials, voucher state, tracking state, or provider payloads.
