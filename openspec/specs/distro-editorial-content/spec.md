## Purpose

Defines complete, source-backed editorial copy and physical-product media for Distro items while keeping catalog identity and commerce authority separate.

## Requirements

### Requirement: Distro summaries use official release evidence

Every current canonical Distro item SHALL have concise original summary copy reviewed against an official Bandcamp page or artist/label website, Instagram, YouTube or permitted Facebook publication identifying that item.

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

- **WHEN** a verified official artist/label source shows the stocked CD edition
- **THEN** CMS-owned media stores a Content Image showing the actual packaging
- **AND** jewel cases, digipaks, softcases, sleeves, or other real packaging are accepted when they match the edition
- **AND** the image alt text describes the visible package and view.

#### Scenario: More than one useful CD view is available

- **WHEN** official sources provide distinct useful views of the same CD edition
- **THEN** one image remains the primary image and additional verified views may be stored as secondary images
- **AND** duplicate crops or unrelated editions are not added merely to increase image count.

#### Scenario: One official photograph contains multiple stocked CDs

- **WHEN** the same official photograph is evidence for more than one stocked title
- **THEN** each item uses a distinct title-specific source-derived crop in which its own packaging remains identifiable
- **AND** byte-identical full-frame reuse across different filenames is rejected.

#### Scenario: Verified CD photography is retouched

- **WHEN** an accepted physical-product photograph is normalized for Store presentation
- **THEN** its primary is 1440x1440 sRGB and its galleries retain natural proportions with a maximum 1800px longest edge without enlargement
- **AND** exports are correctly oriented, metadata-stripped, and restrained in sharpening and compression
- **AND** the photographed product, packaging, artwork, printed text, disc, geometry, edition colors, wear, and overlapping hands remain unchanged.

#### Scenario: A correctly sized file has insufficient photographic detail

- **WHEN** a crop clips packaging, lacks usable native product detail, or relies on blurred duplicate padding
- **THEN** it fails visual acceptance despite valid dimensions and a unique hash
- **AND** the original is replaced with a better verified photograph or recorded as a source blocker without inventing missing product detail.

#### Scenario: CD photography is displayed in Store

- **WHEN** a CD appears in a browse card or on its detail page
- **THEN** its full image is contained without hover cropping or dark photo overlays
- **AND** its detail frame is square and independent of adjacent text height
- **AND** responsive image size hints cover expanded cards as well as preview cards.

#### Scenario: No verified physical CD image is found

- **WHEN** available permitted official sources do not provide a confidently matched physical-product image
- **THEN** the item is recorded as unresolved
- **AND** a cover-only image, generated mockup, marketplace photo, or unrelated edition does not satisfy completion.

### Requirement: Distro detail pages support secondary product images

The system SHALL allow a Distro item to define an ordered list of secondary CMS-owned Content Images with required alt text while retaining one primary image. Public rendering SHALL use accepted snapshot media rather than unpublished uploads or third-party hotlinks.

#### Scenario: Distro item has secondary images

- **WHEN** its Store Item detail page renders
- **THEN** secondary images appear after the primary presentation in source order in an accessible responsive product gallery
- **AND** every rendered image has explicit alt text and stable layout geometry.
- **AND** intrinsic dimensions preserve each gallery image's natural proportions without forced portrait cropping.

#### Scenario: Distro item has no secondary images

- **WHEN** its Store Item detail page renders
- **THEN** the existing single-primary-image presentation remains valid
- **AND** no empty gallery control or placeholder is shown.

### Requirement: Approved primary artwork mockups retain real product evidence

An approved Distro CD or vinyl mockup SHALL use the established Store presentation, identify itself in alt text, retain accepted physical-edition photographs in its gallery, and SHALL NOT count as photographic evidence. A requested photo cleanup SHALL preserve recognizable artwork and physical packaging, remove the requested background distractions, and retain the original photograph in its gallery.

#### Scenario: All official vinyl product photos are requested

- **WHEN** the operator is asked to download and use every photo of an official Bandcamp vinyl edition
- **THEN** every vinyl product photo is retained locally and represented in the item's gallery
- **AND** byte-identical accepted media is reused without duplicate uploads.

#### Scenario: Primary photograph is replaced by an approved mockup

- **WHEN** an operator publishes an approved artwork mockup as the primary image
- **THEN** the previous primary photograph appears first among secondary images unless already represented there
- **AND** the remaining accepted gallery retains its order without duplicate images
- **AND** unrelated editorial fields and commerce state are preserved.

#### Scenario: A suitable mockup already exists

- **WHEN** the same item and artwork already have an accepted suitable mockup or matching CMS media record
- **THEN** that media is reused rather than uploaded again
- **AND** only the reviewed placements and image alternatives are published.

#### Scenario: Publication has not been confirmed

- **WHEN** an upload, revision conflict, quota check or publication confirmation prevents completion
- **THEN** the batch reports the affected file as pending with its retained media and operation identities
- **AND** it does not report the mockup as live until PRD serves the accepted image.

#### Scenario: A stocked CD has nonstandard packaging

- **WHEN** the physical edition uses a digipak, digisleeve or handmade sleeve
- **THEN** its mockup preserves that packaging treatment instead of adding a standard plastic jewel case
- **AND** handmade exterior artwork is taken from the actual sleeve rather than substituted with booklet artwork.
