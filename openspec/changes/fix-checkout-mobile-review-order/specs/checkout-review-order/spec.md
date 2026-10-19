## ADDED Requirements

### Requirement: Review items before mobile payment

The cart checkout page SHALL render its existing order summary and quantity editing before its payment panel in document order. Below 48rem, the summary SHALL also precede the payment panel visually. Totals, shipping information, consent and the single payment action SHALL remain together in the existing payment panel.

#### Scenario: Shopper reviews a narrow checkout

- **GIVEN** a multi-item cart with long titles at a 320px or 390px viewport
- **WHEN** checkout finishes loading
- **THEN** item review and Edit quantities appear before the payment panel without horizontal overflow
- **AND** keyboard navigation reaches quantity controls before consent and payment.

#### Scenario: Shopper corrects a quantity

- **WHEN** a shopper edits an item quantity before payment
- **THEN** the existing cart update refreshes the delivery quote and total
- **AND** no payment session is submitted by the layout check.

#### Scenario: Desktop checkout retains two columns

- **GIVEN** a 1440px viewport
- **WHEN** checkout renders
- **THEN** payment remains in the left column and the summary in the right column
- **AND** document and keyboard order still reach item editing before payment.
