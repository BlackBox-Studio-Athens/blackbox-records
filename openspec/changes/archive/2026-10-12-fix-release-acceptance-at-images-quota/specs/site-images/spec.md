## ADDED Requirements

### Requirement: Release media smoke verifies published originals

The release `public_assets` smoke SHALL verify that representative published media returns successful image responses from the target site's original-media paths. It SHALL resolve trusted direct Images URLs to their same-environment source without requesting a transformation. The separately selected `image_transform` scenario SHALL continue to require a genuine bounded, immutable transformation and reject original fallback responses.

#### Scenario: Images Free transformation allowance is exhausted

- **GIVEN** hosted markup uses the configured direct Images host and a same-environment published media SHA
- **WHEN** the software release runs its public-assets smoke
- **THEN** the media check requests that published original under the target site
- **AND** successful original availability remains verifiable without another transformation request.

#### Scenario: An image URL names an untrusted source

- **WHEN** the discovered media points outside the target site's origin or configured base path
- **THEN** the media discovery fails rather than fetching a foreign original.

#### Scenario: An operator explicitly tests transformation delivery

- **WHEN** the `image_transform` scenario is selected
- **THEN** it still requires a successful small AVIF or WebP transformation with immutable caching
- **AND** an original fallback or quota error fails that scenario.
