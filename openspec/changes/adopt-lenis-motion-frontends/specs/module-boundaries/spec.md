## ADDED Requirements

### Requirement: Public Lenis scrolling respects web module boundaries

The public web app SHALL expose one Lenis runtime through its existing module layers so the app shell, Store features, and private-preview behavior share one registry without lower-level dependencies on app-shell internals.

#### Scenario: Web modules use the public Lenis runtime

- **WHEN** app-shell, Store, or private-preview code scrolls an owned surface
- **THEN** it uses `apps/web/src/lib/lenis-scroll.ts` owned by `platform-shared`
- **AND** app-shell components may use the provided `apps/web/src/components/app-shell/lenis-scroll.ts` entrypoint
- **AND** lower-level modules do not import app-shell internals.
