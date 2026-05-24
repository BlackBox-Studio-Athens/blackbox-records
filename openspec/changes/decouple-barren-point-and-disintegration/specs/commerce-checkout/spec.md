## MODIFIED Requirements

### Requirement: Store Item identity MUST be source-owned and unambiguous

Each Store Item identity MUST belong to exactly one content source. A release-derived Store Item MUST use the release source ID, and a distro-derived Store Item MUST use the distro source ID. The same source ID MUST NOT be reused to identify a different sellable item in D1 rows, Stripe lookup keys, smoke defaults, redirects, or browser checkout state.

#### Scenario: Disintegration and Barren Point are decoupled

- **GIVEN** Disintegration is modeled as a release source with ID `disintegration`
- **AND** Barren Point is modeled as a distro source with ID `barren-point`
- **WHEN** Store Items are generated from Astro content
- **THEN** Disintegration has Store Item slug `disintegration-black-vinyl-lp`
- **AND** Disintegration has variant ID `variant_disintegration-black-vinyl-lp_standard`
- **AND** Barren Point has Store Item slug `barren-point`
- **AND** Barren Point has variant ID `variant_barren-point_standard`
- **AND** no Disintegration checkout identity uses `barren-point`.

### Requirement: Release Store Item identity MUST derive from sellable format

Release-derived Store Item slugs MUST be generated from the release title and first physical sellable format. The generated variant ID MUST be `variant_{storeItemSlug}_standard`, and the option label MUST be the first physical sellable format.

#### Scenario: Release format derivation keeps current public URLs

- **GIVEN** Disintegration has title `Disintegration`
- **AND** its first physical sellable format is `Black Vinyl LP`
- **WHEN** the release Store Item is generated
- **THEN** the public Store Item path is `/store/disintegration-black-vinyl-lp/`
- **AND** no release-specific override is required.

#### Scenario: Digital formats are skipped for the primary option label

- **GIVEN** a release has multiple formats including `Digital`
- **WHEN** the release Store Item option label is generated
- **THEN** the label uses the first non-`Digital` format.
