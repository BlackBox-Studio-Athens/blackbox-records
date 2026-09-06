## ADDED Requirements

### Requirement: Distro galleries remain schema-backed editorial content

The Distro editing surface SHALL expose the optional ordered secondary-image list as repository-owned editorial media and SHALL require alt text for every secondary image.

#### Scenario: Editor adds a secondary Distro image

- **WHEN** an editor adds a gallery entry to a Distro Store Item
- **THEN** the editor supplies one collection-owned image and required image alt text
- **AND** the saved object matches the Astro content schema
- **AND** the primary `image` field remains separate and required.

#### Scenario: Editor leaves the gallery empty

- **WHEN** a Distro item has no secondary images
- **THEN** the optional gallery field may be omitted
- **AND** the saved entry remains valid without an empty placeholder object.

#### Scenario: Editor manages gallery media

- **WHEN** the editor reorders or removes secondary images
- **THEN** the stored order controls detail-page presentation
- **AND** the controls do not expose remote runtime image URLs, Stripe fields, stock fields, or provider mutation settings.
