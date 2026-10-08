# Spec Delta

## ADDED Requirements

### Requirement: Releases retains accessible identity without a visible introduction

The Releases page SHALL retain one accessible level-one heading named Releases without displaying a Catalog / Releases introduction or reserving space for that introduction. Our Releases SHALL remain the visible heading for the populated remaining catalog, after the featured records.

#### Scenario: Releases opens directly or through the shell

- **WHEN** Releases opens directly or through persistent shell navigation at desktop or mobile width
- **THEN** no visible Catalog / Releases introduction or blank header space appears
- **AND** assistive technology can identify the Releases level-one heading
- **AND** shell navigation retains its focus reset

#### Scenario: Remaining catalog is populated

- **WHEN** releases remain after the featured records
- **THEN** Our Releases remains visible in its current position above those remaining records
- **AND** record order, purchase actions and listening behavior remain intact
