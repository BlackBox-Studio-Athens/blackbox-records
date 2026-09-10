## ADDED Requirements

### Requirement: Store Distro disclosure is first-click reliable and bounded

Store Distro full-catalog disclosure MUST retain its first activation across route-lazy controller readiness and MUST complete within the existing fixed interaction profiles without weakening load budgets.

#### Scenario: Controller readiness is delayed

- **WHEN** a direct load or shell entry delays the route-lazy Distro controller and the visitor activates `View all` once before readiness
- **THEN** the same activation enters catalog mode exactly once after readiness
- **AND** no second activation is required.

#### Scenario: Ready controller opens the catalog

- **WHEN** the visitor activates `View all` after controller readiness
- **THEN** catalog mode and `aria-expanded="true"` apply by the next animation frame
- **AND** the visual reveal completes within 250 milliseconds on the fixed desktop profile and 350 milliseconds on the fixed mobile-stress profile
- **AND** disclosure introduces no application-attributable task of 50 milliseconds or longer.

#### Scenario: Disclosure optimization preserves route budgets

- **WHEN** the Store Distro route runs the fixed load and interaction profiles
- **THEN** LCP remains no more than 2.5 seconds and CLS remains no more than 0.1
- **AND** unrelated routes do not request or execute the Distro search module.
