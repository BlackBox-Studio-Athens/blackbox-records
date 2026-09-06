## MODIFIED Requirements

### Requirement: Distro artwork uses approved source evidence

The system SHALL use matched repository artwork, verified artwork-fetcher output, or manually verified official Bandcamp or artist/label Facebook product photography for current Distro items. Every accepted image SHALL remain a repo-owned Content Image with per-asset source and compatible reuse-rights evidence.

#### Scenario: Existing matched artwork is available

- **WHEN** a canonical manifest row matches a current verified repository image
- **THEN** that image may be reused.

#### Scenario: Artwork is missing or uncertain

- **WHEN** no verified repository image exists and automated artwork lookup is appropriate
- **THEN** `tools/artwork-fetcher` produces verified, manual-review, or known-missing evidence before its output is accepted.

#### Scenario: Official physical-product photo is manually researched

- **WHEN** an official Bandcamp page or official artist/label Facebook publication exposes a photo of the matched physical edition
- **THEN** a human review verifies artist, title, format, edition, and visible packaging before the photo is accepted
- **AND** reviewable research evidence maps the accepted local filename to that source URL and its reuse-rights status
- **AND** no browser automation or authentication bypass is added to `tools/artwork-fetcher`.

#### Scenario: Primary and secondary image roles are assigned

- **WHEN** a Distro item has more than one accepted image
- **THEN** exactly one repo-owned image remains primary for cards, cart, metadata, and provider projection
- **AND** additional images are detail-only Content Images unless a later field-ownership change explicitly promotes them.

#### Scenario: Artwork is known missing

- **WHEN** tooling or an explicit human review records known-missing status for a non-CD Distro item
- **THEN** a generic format-appropriate fallback may be used
- **AND** fallback is not used merely because lookup was skipped
- **AND** known-missing fallback does not satisfy this change's physical CD photography requirement.
