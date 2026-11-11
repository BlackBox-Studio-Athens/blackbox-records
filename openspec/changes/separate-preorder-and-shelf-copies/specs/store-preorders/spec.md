## ADDED Requirements

### Requirement: Ending a pre-order records the copies we have

Every way of ending a pre-order in Staff SHALL open one step that asks "How many copies do we have now?", filled with For sale plus Sold, not sent, and showing the split as staff type. Saving SHALL record the number as a stock count, with every copy for sale offered online, and SHALL then end the pre-order. The step SHALL also offer to stop the pre-order because the records did not come.

#### Scenario: A pressing arrives

- **GIVEN** an open pre-order with 250 for sale and 50 sold, not sent
- **WHEN** staff press Copies arrived
- **THEN** the step asks how many copies we have now, filled with 300, and shows 50 for people who pre-ordered and 250 for sale
- **AND** on Save and end pre-order stock becomes 250, the pre-order ends, and Staff says 50 copies are ready to send with a link to Orders.

#### Scenario: Fewer copies than were sold

- **WHEN** staff enter 40 while 50 are sold, not sent
- **THEN** the step says 10 are short, 10 people who pre-ordered will not get a copy, and For sale becomes 0, with a link to their orders
- **AND** staff can still save.

#### Scenario: The records did not come

- **WHEN** staff choose The records did not come and confirm Stop pre-order
- **THEN** 0 copies are recorded, the pre-order ends, and paid orders stay for staff to refund in Orders.

#### Scenario: The count saves but ending the pre-order fails

- **WHEN** the count is recorded and the pre-order write fails
- **THEN** Staff keeps the recorded count, says the pre-order is still open, and offers to end it again.

### Requirement: Staff stock figures use three plain words in every state

Staff SHALL show stock as three figures with the same labels in every state: We have, Sold, not sent and For sale, with For sale highlighted and each figure explained in one sentence. While a pre-order is open, We have SHALL read Not here yet beside a Pre-order badge. Counting stock SHALL ask "How many copies do we have?" with the same live split. Item setup SHALL explain what to enter for a pre-order.

#### Scenario: Pre-order is open

- **GIVEN** stock is 250 and 50 copies are sold, not sent on an open pre-order
- **WHEN** staff open the item's stock
- **THEN** they read We have Not here yet, Sold, not sent 50 and For sale 250, with the Pre-order badge.

#### Scenario: Ordinary stock

- **GIVEN** stock is 15 and 2 copies are sold, not sent
- **WHEN** staff open the item's stock
- **THEN** they read We have 17, Sold, not sent 2 and For sale 15.

#### Scenario: An order is sent

- **WHEN** staff mark an order with one copy as sent
- **THEN** We have and Sold, not sent each go down by one and For sale stays the same.
