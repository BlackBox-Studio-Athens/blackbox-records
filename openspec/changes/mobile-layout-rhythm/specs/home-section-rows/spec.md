## MODIFIED Requirements

### Requirement: Home sections swipe sideways on phones

Below a 40rem viewport, the Home News and Artists sections SHALL each present their cards as one horizontal row that the visitor swipes card by card, with part of the next card visible inside the content frame; the row SHALL be clipped at the right gutter rather than bleeding to the viewport edge. Wider viewports SHALL keep the existing grids. The page itself SHALL NOT scroll horizontally.

#### Scenario: Visitor swipes the Artists row on a phone

- **GIVEN** a visitor opens Home at 390 px wide
- **WHEN** the visitor swipes the Artists row to the left
- **THEN** the row settles with the next artist card aligned to the page gutter
- **AND** part of the following card, or of the previous card at the end, remains visible
- **AND** the page does not scroll horizontally

#### Scenario: Visitor opens Home on a computer

- **WHEN** Home renders at 1280 px wide
- **THEN** News and Artists render as grids with every card visible
- **AND** no dot indicator is shown

### Requirement: Swipe rows show their position

Each Home swipe row SHALL show a dot per card under the row, marking the card aligned to the gutter as current. Each dot SHALL be a button of 44 by 44 CSS pixels that scrolls the row to its card, labelled with its position, and the current mark SHALL use Slate #66a2d2 and be exposed with `aria-current`. The dots SHALL render the same in every supported browser and keep working after shell navigation to Home.

#### Scenario: Visitor taps a dot

- **GIVEN** the Artists row shows its first card
- **WHEN** the visitor taps the second dot
- **THEN** the row scrolls to the second card
- **AND** the second dot becomes current

#### Scenario: Visitor reaches Home through shell navigation

- **GIVEN** a visitor first loaded another section on a phone
- **WHEN** the visitor navigates to Home through the shell and swipes a row
- **THEN** the row's dots follow the swipe

#### Scenario: Dots are used with a phone or keyboard

- **WHEN** a visitor taps or focuses a dot
- **THEN** the target is 44×44 with the shared visible ink focus ring and a small Slate current mark
- **AND** position is conveyed by its accessible name and current state, not colour alone.
