## MODIFIED Requirements

### Requirement: Artist entry supports validated choices and incomplete private drafts

Artist creation SHALL wait for an edit before autosaving. An unselected image SHALL remain a valid private draft value on both new and upgraded CMS stores. Country selection SHALL use ISO country identities, support multiple countries without duplicates, and preserve the existing public country labels. Genre entry SHALL offer suggestions while allowing new genres. Standard artist links SHALL use service choices and matching HTTPS domains; Spotify SHALL be rejected.

#### Scenario: Member uploads an artist portrait

- **WHEN** an image upload succeeds inside the artist picker
- **THEN** it is selected without a second click
- **AND** the full image fits the 3:4 portrait frame, with any leftover space shown as a blurred copy of the photo, without manual cropping or loss of original bytes
- **AND** dimensions guidance recommends 1800 × 2400 px with 1200 × 1600 px minimum
- **AND** the description uses library metadata or the entry title, with optional accessibility editing.
