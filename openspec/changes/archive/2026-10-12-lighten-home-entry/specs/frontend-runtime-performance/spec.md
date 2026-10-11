## MODIFIED Requirements

### Requirement: Critical font delivery is bounded and glyph-safe

The system MUST deliver the Veneer brand font without a late font-driven layout task. Its bytes MUST stay unmodified unless the owner has confirmed that modification is permitted; then only the owner-approved derivative may ship.

#### Scenario: Brand font can be legally subset

- **GIVEN** the font license permits modification and subsetting
- **WHEN** the critical WOFF2 is produced
- **THEN** it covers the declared fixed UI and repository-content corpus plus required Greek and Latin Extended fixtures
- **AND** automated coverage verification fails when a required glyph is absent
- **AND** the transferred critical brand-font file is no more than 160 KiB.

#### Scenario: Brand font cannot be legally or safely subset

- **WHEN** license or glyph inspection cannot prove that a subset is permitted and complete
- **THEN** the original font file is not modified
- **AND** implementation narrows font usage or preload scope instead of shipping an unverified derivative
- **AND** the unresolved byte budget is reported with the blocking evidence.

#### Scenario: Font modification rights remain unavailable

- **GIVEN** neither a license in the repository nor a recorded owner confirmation permits modification
- **WHEN** the main-site font path is prepared
- **THEN** `veneer_regular.woff2` remains byte-for-byte identical to the original 312,816-byte source
- **AND** no subset, conversion, glyph removal, outline extraction, or generated font derivative is produced
- **AND** an automated SHA-256 parity check covers every retained copy of the asset.

#### Scenario: Owner-approved outline simplification

- **GIVEN** the owner confirmed on 2026-10-02 that modifying Veneer is permitted
- **WHEN** the main-site font path is prepared
- **THEN** every retained copy of `veneer_regular.woff2` is the output of `apps/web/scripts/simplify-veneer.py` applied to the original source with SHA-256 `f02b74cb53a1640c6cbfc9a2aa5f5ce0609fa358231a9b30b93c1e0072622939`
- **AND** the generator refuses any other source and fails when the glyph order, cmap, advance widths or GPOS, GSUB, GDEF, name, OS/2, post, gasp or cvt tables differ from the original
- **AND** no glyph is removed, so the original character coverage remains
- **AND** an automated SHA-256 parity check covers every retained copy of the derivative.

#### Scenario: Main site requests Veneer

- **WHEN** bundled main-site CSS declares the Veneer face
- **THEN** Astro or Vite emits a fingerprinted font URL covered by the immutable static cache policy
- **AND** the declaration uses `font-display: optional`
- **AND** the approved `Veneer, Bebas Neue, Impact, sans-serif` fallback order remains intact
- **AND** the stable public font path is not requested by the main site.

#### Scenario: Holding Page retains a stable font asset

- **WHEN** the PRD Holding Page artifact is built
- **THEN** its required stable public WOFF2 and stylesheet remain in the closed asset set
- **AND** the public stylesheet also prevents a late font swap
- **AND** the Holding Page artifact check proves that its font bytes match the main-site source.

#### Scenario: Font loading is profiled

- **WHEN** the final critical font path is traced with the declared desktop and mobile stress profiles
- **THEN** it produces no repeatable font-triggered task or long animation frame of 50 milliseconds or longer
- **AND** no late font load triggers a repeatable layout burst
- **AND** font preload remains absent unless at least three equivalent A/B runs improve LCP without delaying primary media or reintroducing layout work.

#### Scenario: Fallback and cached typography are reviewed

- **WHEN** the font is unavailable on first navigation or available from cache later
- **THEN** English, Greek, accents and diacritics, long public titles, navigation, cards, Store and checkout labels, and the Holding Page remain legible
- **AND** mobile and desktop screenshots show no clipping, overlap, broken hierarchy, or material layout shift.
