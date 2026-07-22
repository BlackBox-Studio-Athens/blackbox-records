## MODIFIED Requirements

### Requirement: All Store exposes Distro format discovery

The All Store route SHALL expose a compact Distro format ledger when the classified Distro collection has populated groups, using the same server-derived Distro group names, counts, and fragment targets as the Store Distro route without repeating its introduction or a standalone Distro subtotal.

#### Scenario: All Store renders Distro discovery

- **GIVEN** `/store/` contains a populated classified Distro collection
- **WHEN** the All Store document renders
- **THEN** it shows one `Browse Distro formats` navigation landmark before the All card collection without Distro introduction copy or a standalone Distro item total
- **AND** each populated Distro group appears once in the same order and with the same current count as `/store/distro/`.

#### Scenario: All Store format link opens canonical Distro group

- **WHEN** a visitor activates an All Store Distro format link
- **THEN** it is a base-aware ordinary link to the matching `/store/distro/#distro-group-*` target
- **AND** it does not create an All-local duplicate group, filter state, tab state, or second Distro card projection.

#### Scenario: Distro group membership changes

- **WHEN** accepted Distro records enter, leave, or move between populated browse groups
- **THEN** All Store Distro counts and links follow the same server-derived group list at the next static build
- **AND** no authored navigation count or duplicated catalog membership is required.

#### Scenario: JavaScript is unavailable on All Store

- **WHEN** a visitor follows an All Store Distro format link without client JavaScript
- **THEN** the ordinary link reaches the rendered canonical Store Distro group heading
- **AND** complete Distro browsing remains available.
