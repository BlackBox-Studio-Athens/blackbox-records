# Spec Delta

## ADDED Requirements

### Requirement: Storefront provides the record Buy mark to Releases

The system MUST keep the record Buy mark inside the closed `web-store` module while exposing it to Releases through one provided entrypoint.

#### Scenario: Releases renders a catalog Buy

- **WHEN** a remaining Releases catalog card renders an ordinary Buy action
- **THEN** `apps/web/src/components/store/StoreBuyIcon.tsx` is owned by `web-store` and listed as a provided entrypoint
- **AND** `web-editorial` imports it through its existing `web-store` dependency without copying the icon layers
- **AND** boundary validation passes without an ownership exception
