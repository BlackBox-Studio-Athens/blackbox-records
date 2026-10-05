## ADDED Requirements

### Requirement: Releases merchandising remains presentation-only

The web-editorial module SHALL expose ReleaseCatalogPresentation.tsx to web-pages and the shared pure release-presentation.ts sanitizer to app-shell through its declared public API. The shell MUST NOT eagerly acquire the live Releases connector or its React island. These entrypoints SHALL reuse the existing public listing projection from web-store, controls from ui-foundation, and preorder wording from web-platform. They MUST NOT acquire cart mutation, checkout, payment, stock persistence or a second commerce lifecycle.

#### Scenario: Cached Releases claims are neutral before insertion

- **WHEN** app-shell captures an enriched Releases page for a cached return
- **THEN** its snapshot uses the same neutral presentation factory to reset purchase actions, physical badges and shipping estimates
- **AND** the live page and snapshot layout remain intact
- **AND** the restored connector makes a fresh offer read before asserting buying availability

#### Scenario: Releases adapts to a current physical offer

- **WHEN** web-pages mounts the Releases presentation
- **THEN** it consumes the declared web-editorial entrypoint
- **AND** the connector derives display and eligible order from the existing public listing projection
- **AND** buying links reach the existing canonical edition purchase path and authoritative offer check

#### Scenario: Module policy is verified

- **WHEN** the public entrypoint changes
- **THEN** its project.json contract, executable boundary manifest and this delta remain consistent
- **AND** the focused boundary check verifies that no new checkout or persistence dependency was introduced
