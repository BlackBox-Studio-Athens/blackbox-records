## MODIFIED Requirements

### Requirement: Catalog Promotion terms

The system SHALL use Catalog Promotion language consistently for generated catalog artifacts, provider catalog publication, and runtime/operator controls.

#### Scenario: Promotion artifacts and evidence are discussed

- **GIVEN** current Store Item content is intended to be represented in provider catalog state
- **WHEN** specs, docs, tests, workflows, or code describe the publication path
- **THEN** `DesiredCatalogState` is the generated repo-owned promotion input
- **AND** `DesiredCatalogEntry` describes one buyable variant's desired Product Projection, Desired Price, target environments, availability, and first-publication stock intent
- **AND** `DesiredPrice` means repo/provider-policy input used to create initial provider Price Authority when a variant has none, not checkout runtime authority or permission for normal promotion to replace valid existing Price Authority
- **AND** `ProviderCatalogState` means the observed Stripe/D1 state after verification
- **AND** `PromotionRun` means one environment-scoped execution against an artifact commit
- **AND** `PromotionEvidence` means redacted machine-readable proof for success, failure, skipped, superseded, or not-configured outcomes.
