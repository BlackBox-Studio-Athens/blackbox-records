## MODIFIED Requirements

### Requirement: Releases page presents distinct editorial tiers

The system SHALL retain the current principal split and select up to two native physical editions in accepted editorial priority order, retaining catalog source order for ties. Remaining records SHALL share the existing Our releases catalog in source order. Presentation roles and record order MUST be identical in initial SSR, hydration, shell navigation and fresh offer resolution. Offer state SHALL determine truthful physical badges and actions independently of these editorial roles.

#### Scenario: All three roles are available

- **GIVEN** Sidus and Afterwise have the first two accepted editorial priorities, Chronoboros has stocked vinyl, and Ouranopithecus has only a future physical edition
- **WHEN** Releases renders
- **THEN** the principal region presents Sidus then Afterwise
- **AND** Chronoboros remains under Our releases with its confirmed buying path
- **AND** Ouranopithecus retains its catalog source position with separate digital and future-vinyl messages

#### Scenario: Visitor reads the page in source order

- **WHEN** a visitor reads or tabs through Releases
- **THEN** accepted principal priority precedes the remaining catalog in source order
- **AND** headings and truthful physical states expose that sequence without unnecessary section labels

#### Scenario: Wide viewport uses the selected asymmetric composition

- **WHEN** two native physical editions occupy the principal region at a wide viewport
- **THEN** both have complete identity and appropriate actions
- **AND** the label-selected first entry owns the lead emphasis
- **AND** lower entries begin after that area without duplicate releases

#### Scenario: Visitor waits for current offers

- **GIVEN** accepted editorial priorities select two native physical editions
- **WHEN** Releases first renders and live offers are pending, ready or failed
- **THEN** their lead and supporting roles and the remaining catalog order stay fixed
- **AND** neutral detail links remain available until confirmed offers establish buying eligibility
- **AND** every release appears once

#### Scenario: An offer changes availability

- **WHEN** a featured edition opens or closes ordering, sells out, or gains stock
- **THEN** its current physical badge and action reflect the authoritative offer
- **AND** its artwork, heading role and placement remain stable
- **AND** digital availability remains independently derived from accepted timing

### Requirement: Release presentation transitions derive automatically from existing facts

The system SHALL derive each record's visible physical state and purchase action from accepted editorial timing and the current authoritative public commerce presentation. Opening, closing, selling out and restocking SHALL update badges and actions on the normal offer read without a separate editorial edit. Accepted editorial priority and native edition identity SHALL establish stable principal placement and remaining catalog order independently of offer readiness. The system SHALL reuse current preorder rules without a duplicated persisted commerce lifecycle, scheduler or state-machine framework.

#### Scenario: Vinyl ordering opens

- **WHEN** an announced physical edition gains a confirmed buyable preorder offer
- **THEN** its action becomes Pre-order vinyl with the current supplied estimate
- **AND** the release remains in its existing editorial position

#### Scenario: Estimated month passes

- **WHEN** the existing commerce owner keeps a month-estimate preorder open after that month passes
- **THEN** Releases retains Pre-order vinyl and withholds the stale estimate
- **AND** it does not infer physical receipt or end preorder itself

#### Scenario: Exact preorder date is reached

- **WHEN** the existing commerce owner ends an exact-date preorder on its confirmed date
- **THEN** a still-buyable offer automatically uses Buy vinyl and Vinyl available
- **AND** the page does not claim verified receipt solely from the calendar date

#### Scenario: Staff records actual arrival

- **WHEN** Staff uses the existing Copies arrived action and records actual stock facts
- **THEN** Releases reflects the resulting offer automatically without another page or editorial-state edit

#### Scenario: Principal offer sells out

- **WHEN** a principal record's current offer is sold out or paused
- **THEN** its buying action is removed and its physical badge reflects that offer
- **AND** its principal position stays fixed while release detail and listening remain accessible once

#### Scenario: Unavailable record becomes buyable again

- **WHEN** stock is replenished or buying reopens and the current offer confirms eligibility
- **THEN** the physical action is recomputed while the retained editorial position stays fixed

#### Scenario: Confirmed digital release date is reached

- **WHEN** accepted editorial timing establishes that a confirmed scheduled digital release is now available
- **THEN** its supporting digital message advances independently of physical availability
- **AND** accepted label preference remains stable
- **AND** no private draft is published automatically

### Requirement: Releases page composes its tiers as one Evolved Split Showcase

The Releases page SHALL retain its continuous BlackBox composition: dominant artwork-and-copy split, compact supporting column and square cards under Our releases. Document, reading and keyboard order MUST follow accepted principal priority and then remaining catalog source order. The initial document and hydrated presentation MUST share this composition without a Featured records heading or added storefront navigation.

#### Scenario: Wide catalog uses the asymmetric showcase

- **WHEN** two native physical editions occupy the principal region
- **THEN** the first editorial choice receives lead emphasis and the second has complete supporting content
- **AND** neutral or confirmed physical actions remain truthful within those fixed roles
- **AND** lower entries begin after the principal region without duplication

#### Scenario: Visual placement does not reorder content

- **WHEN** the page is read or navigated by keyboard
- **THEN** principal order precedes the remaining catalog
- **AND** CSS placement and offer updates do not reorder it

#### Scenario: Missing tiers do not leave showcase scaffolding

- **WHEN** an editorial role has no accepted entries
- **THEN** its empty column, heading and placeholder are absent from the visible page
- **AND** present entries use the available width

## ADDED Requirements

### Requirement: Featured Releases artwork keeps its intrinsic square geometry

Featured artwork wrappers SHALL remain square and fit complete covers independently of adjacent copy height. They MUST NOT stretch into empty tall frames or crop away artwork at rest. Mobile SHALL retain native stacking and accessible controls.

#### Scenario: Supporting copy is taller than the lead cover

- **WHEN** a wide Releases row contains long copy or tall supporting content
- **THEN** the lead artwork wrapper remains square with no empty lower frame
- **AND** the whole cover remains visible

#### Scenario: A shopper uses a narrow screen

- **WHEN** Releases renders at 320px, 390px or 430px
- **THEN** featured covers remain complete and square
- **AND** copy and controls stack without horizontal overflow
