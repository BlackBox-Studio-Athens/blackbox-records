## ADDED Requirements

This existing delta path is retained for planning continuity. Sveltia has been retired; the requirement below applies to the current EmDash surface. At spec sync, reconcile its destination with the EmDash capability rather than recreating a Sveltia capability.

### Requirement: Distro galleries remain schema-backed editorial content

The EmDash Distro editing surface SHALL expose the optional ordered secondary-image list as CMS-owned editorial media and SHALL require alt text for every secondary image.

#### Scenario: Editor adds a secondary Distro image

- **WHEN** an editor adds a gallery entry to a Distro Store Item
- **THEN** the editor supplies one CMS-owned image and required image alt text
- **AND** the saved object matches the shared content-model schema
- **AND** the primary `image` field remains separate and required.

#### Scenario: Editor leaves the gallery empty

- **WHEN** a Distro item has no secondary images
- **THEN** the optional gallery field may be omitted
- **AND** the saved entry remains valid without an empty placeholder object.

#### Scenario: Editor manages gallery media

- **WHEN** the editor reorders or removes secondary images
- **THEN** the stored order controls detail-page presentation
- **AND** the controls do not expose remote runtime image URLs, Stripe fields, stock fields, or provider mutation settings.

#### Scenario: Gallery edits are saved before publication

- **WHEN** an editor saves or previews changed Distro media
- **THEN** public gallery output retains the accepted snapshot until selected publication through Items succeeds
- **AND** failed publication preserves that snapshot without promoting unrelated drafts.
