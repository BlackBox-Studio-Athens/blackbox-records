## MODIFIED Requirements

### Requirement: Catalog editing builds on EmDash

The label-focused staff interface SHALL use EmDash APIs for content, private drafts, revision conflicts, references and media, and reuse its Portable Text editor. Existing catalogue entries SHALL expose details, photos, price and stock editing on one page without requiring navigation to Selling or Stock. Commerce and stock authority SHALL remain outside EmDash. Creation SHALL guide Details → Price & starting stock → Review, with private editorial autosave and explicit confirmed selling setup. Editorial-only releases SHALL skip selling setup and retain an independent publication path. Existing deep links SHALL remain usable.

#### Scenario: An occasional member resumes an unfinished release

- **WHEN** a member returns to their saved release draft
- **THEN** incomplete editorial details remain private and editable
- **AND** no price or opening stock is created until the member explicitly confirms setup.

#### Scenario: Update an existing catalogue item

- **WHEN** a member edits an item's images and information
- **THEN** they can change its price and stock on the same page using explicit actions
- **AND** revision conflicts, uncertain outcomes, stock history and entered data retain existing protection.

#### Scenario: Switch editing tasks without losing work

- **WHEN** a member switches between Details & photos and Price & stock
- **THEN** the selected item, ongoing uploads and unsaved inputs remain mounted and intact
- **AND** price and stock are directly available beneath the item header without scrolling through editorial fields.
