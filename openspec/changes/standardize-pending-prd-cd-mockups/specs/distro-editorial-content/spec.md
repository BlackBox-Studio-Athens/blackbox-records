## ADDED Requirements

### Requirement: Approved primary artwork mockups retain real product evidence

An explicitly approved Distro CD artwork mockup SHALL use the established uniform Store presentation, identify itself as a mockup in alt text, and retain accepted photographs of the stocked physical edition in its gallery. A mockup SHALL NOT count as physical-product photographic evidence.

The same retention and publication rules SHALL apply to an approved vinyl-cover mockup. An explicitly requested photo cleanup SHALL preserve the photographed package's recognizable artwork and physical treatment, remove the requested background distractions, and retain its original photograph as gallery evidence.

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
