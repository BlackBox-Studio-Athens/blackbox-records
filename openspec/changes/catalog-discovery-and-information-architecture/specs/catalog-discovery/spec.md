## ADDED Requirements

### Requirement: Research precedes catalog implementation

The change MUST record current behavior, evidence, and a reviewed proposal before a numbered item becomes implementation-ready.

#### Scenario: Research is incomplete

- **WHEN** a requested area lacks verified evidence or an approved proposal
- **THEN** the area remains a research task and no implementation assumption is promoted to a requirement

#### Scenario: Numbered item is approved

- **WHEN** the user approves a numbered item's proposal
- **THEN** one separate native OpenSpec change owns its normative behavior and implementation tasks
- **AND** this research index links that child without duplicating its requirements
