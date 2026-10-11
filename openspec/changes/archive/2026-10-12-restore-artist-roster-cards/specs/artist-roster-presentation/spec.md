## REMOVED Requirements

### Requirement: Artist images render as native-aspect prints

**Reason**: The label asked for uniform artist photos as they were, not prints at varying sizes.

**Migration**: Artist photos render whole in uniform 3:4 card frames over a blurred fill ("Artist photos are uniform without a scrim").

### Requirement: Artists roster renders as a crate index

**Reason**: The Artists roster returns to the server-rendered card grid.

**Migration**: Each artist is a card linking to the artist, with genre, name, bio, release count, and latest release below the photo.

### Requirement: Wide viewports preview the active artist as a print pile

**Reason**: The preview panel and its island leave with the crate index.

**Migration**: Each card shows its own photo and details. Hover feedback is the existing photo zoom.

### Requirement: Narrow viewports disclose prints inline

**Reason**: Cards show the photo and details on every viewport, so nothing needs disclosing.

**Migration**: None.

### Requirement: Print motion respects reduced motion

**Reason**: Prints, tilt, and the pile are removed.

**Migration**: The artist card photo zoom keeps its reduced-motion rule under `site-images`.

### Requirement: Artist detail and Home roster use prints

**Reason**: The artist detail lead image and Home featured roster return to their frames.

**Migration**: Both use the blurred fill described in "Artist photos are uniform without a scrim".

## ADDED Requirements

### Requirement: Artist photos are uniform without a scrim

Artist cards on the Artists roster and the Home featured roster SHALL show each artist photo whole inside a uniform 3:4 frame. Space the photo leaves in the frame SHALL show a blurred, darkened copy of the same photo instead of a solid fill. The genre and name SHALL render below the photo, and no gradient or other scrim SHALL cover the photo. The artist detail lead image SHALL use the same blurred fill inside its own frame.

#### Scenario: Square light artwork renders

- **WHEN** an artist image is square with a light background, such as the Chronoboros logo
- **THEN** its card frame matches the size of every other artist card
- **AND** the whole image is visible, with a blurred copy of it filling the space above and below
- **AND** no black bar, band, or gradient appears near the artist name

#### Scenario: Landscape and portrait photos render

- **WHEN** an artist image is landscape or portrait
- **THEN** the whole photo is visible inside the same 3:4 frame, with the blurred copy filling any remaining space
- **AND** the genre and name render below the frame on the card background

#### Scenario: Blurred fill stays decorative

- **WHEN** a card or the artist detail frame renders the blurred fill
- **THEN** the fill image has empty alt text, is hidden from assistive technology, has no high fetch priority, and ignores pointer input
- **AND** only the main photo carries the artist's alt text and responsive width ladder
