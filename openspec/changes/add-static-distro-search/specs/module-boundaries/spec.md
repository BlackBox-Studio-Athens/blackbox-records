## ADDED Requirements

### Requirement: Storefront catalog provides route-lazy Distro search

The system MUST keep Distro search presentation inside the closed `storefront-catalog` module while exposing its app-shell integration through a provided entrypoint.

#### Scenario: App shell mounts Distro search

- **WHEN** the app shell imports the route-lazy Distro search control
- **THEN** `apps/web/src/components/distro/**` is owned by `storefront-catalog`
- **AND** `apps/web/src/components/distro/DistroSearch.tsx` is listed as a provided entrypoint
- **AND** boundary validation passes without an ownership exception or compatibility facade.
