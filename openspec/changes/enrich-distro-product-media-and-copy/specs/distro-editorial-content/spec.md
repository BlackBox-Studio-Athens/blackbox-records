## Purpose

Defines complete, source-backed editorial copy and physical-product media for Distro items while keeping catalog identity and commerce authority separate.

## ADDED Requirements

### Requirement: Distro summaries use official release evidence

Every current canonical Distro item SHALL have concise original summary copy reviewed against at least one official Bandcamp release or product page or official band/label Facebook publication for that item.

#### Scenario: Existing summary is supported

- **WHEN** the reviewed official source supports the existing concise summary
- **THEN** the summary may remain unchanged
- **AND** it contains only supported release, sound, context, or physical-edition facts.

#### Scenario: Existing summary is weak

- **WHEN** the reviewed summary is generic, unsupported, inaccurate, stale, or contains source-metadata boilerplate
- **THEN** it is rewritten in concise original wording using only facts supported by the official source
- **AND** it does not copy a promotional paragraph.

#### Scenario: Sources disagree or do not identify the stocked edition

- **WHEN** available official sources conflict or cannot be matched confidently to the current Distro item
- **THEN** unsupported claims are omitted
- **AND** the item remains unresolved in research evidence rather than receiving invented copy.

### Requirement: CD listings use verified physical-product photography

Every current Distro item classified as a CD MUST use at least one image of the actual physical CD edition accepted under the Distro artwork source-evidence requirement before this change is accepted.

#### Scenario: Official CD photography is found

- **WHEN** an official Bandcamp page or official band/label Facebook publication shows the stocked CD edition
- **THEN** the repository stores a local Content Image showing the actual packaging
- **AND** jewel cases, digipaks, softcases, sleeves, or other real packaging are accepted when they match the edition
- **AND** the image alt text describes the visible package and view.

#### Scenario: More than one useful CD view is available

- **WHEN** official sources provide distinct useful views of the same CD edition
- **THEN** one image remains the primary image and additional verified views may be stored as secondary images
- **AND** duplicate crops or unrelated editions are not added merely to increase image count.

#### Scenario: No verified physical CD image is found

- **WHEN** official Bandcamp and official artist or label Facebook sources do not provide a confidently matched physical-product image
- **THEN** the item is recorded as unresolved
- **AND** a cover-only image, generated mockup, marketplace photo, or unrelated edition does not satisfy completion.

### Requirement: Distro detail pages support secondary product images

The system SHALL allow a Distro item to define an ordered list of secondary local Content Images with required alt text while retaining one primary image.

#### Scenario: Distro item has secondary images

- **WHEN** its Store Item detail page renders
- **THEN** secondary images appear after the primary presentation in source order in an accessible responsive product gallery
- **AND** every rendered image has explicit alt text and stable layout geometry.

#### Scenario: Distro item has no secondary images

- **WHEN** its Store Item detail page renders
- **THEN** the existing single-primary-image presentation remains valid
- **AND** no empty gallery control or placeholder is shown.
