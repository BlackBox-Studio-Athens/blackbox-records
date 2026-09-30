## Purpose

Define how the Artists roster, artist detail lead media, and Home featured roster present artist identity and imagery, so that any artist image a label member uploads renders evenly without fixed frames, fill bars, or text over photos.

## ADDED Requirements

### Requirement: Artist images render as native-aspect prints

Every artist image on the Artists roster, artist detail lead media, and Home featured roster SHALL render as a photo print: the image at its source aspect ratio inside an off-white border, followed by a caption strip carrying the roster number and artist name. The system SHALL NOT crop artist images to a fixed ratio, pad them with fill colour, or place text or gradients over the image.

#### Scenario: Square light artwork renders

- **WHEN** an artist image is square with a light background, such as the Chronoboros logo
- **THEN** the print shows the whole image at 1:1 inside its border
- **AND** no dark bar, band, or gradient appears above, below, or beside the image

#### Scenario: Landscape and portrait photos render

- **WHEN** an artist image is landscape or portrait
- **THEN** its print keeps the source aspect ratio within the slot's maximum width and height
- **AND** the artist name, genre, and other text render outside the image

#### Scenario: Print keeps layout stable

- **WHEN** a print renders before its image bytes arrive
- **THEN** its slot already reserves the final width and height from the source dimensions
- **AND** loading the image causes no layout shift

### Requirement: Artists roster renders as a crate index

The Artists route SHALL render the roster as a server-rendered list of rows. Each row SHALL show the artist's roster number (or letter marker when grouped), name, genre, country, and release count, and SHALL provide a link to the artist. The page SHALL keep the shared internal page hero with the `Roster` / `Artists` pair.

#### Scenario: Roster renders directly or through the shell

- **WHEN** the Artists route renders on direct load or shell-managed navigation
- **THEN** every artist appears as a list row in name order with a working link to the artist
- **AND** the rows are usable before any client script loads

### Requirement: Wide viewports preview the active artist as a print pile

On wide viewports, the roster SHALL show a sticky preview panel beside the list. Hovering or focusing a row SHALL make that artist the active preview: its print is placed on top of a pile that keeps the two most recently previewed artists underneath, and the panel shows the artist's genre, country, bio excerpt, release count, latest release, and actions to open the artist and listen. The first artist SHALL be the server-rendered default preview.

#### Scenario: Visitor hovers or focuses rows

- **WHEN** a visitor hovers a row or moves keyboard focus onto it
- **THEN** the active row is marked with a heavier rule
- **AND** that artist's print becomes the top print of the pile, and the previous active artist's print moves underneath
- **AND** the pile never shows more than three prints

#### Scenario: Preview script is unavailable

- **WHEN** the preview script has not loaded or fails
- **THEN** the panel still shows the first artist's print and details
- **AND** every row link still works

#### Scenario: Only the top print is announced

- **WHEN** assistive technology reads the preview panel
- **THEN** only the top print's image exposes alternative text
- **AND** the prints underneath are hidden from assistive technology

### Requirement: Narrow viewports disclose prints inline

On narrow viewports, each roster row SHALL show a small tilted print thumbnail and SHALL act as a native disclosure that reveals the artist's full print, release count, latest release, and a link to the artist. The disclosure SHALL work without client script.

#### Scenario: Visitor opens a row on a phone

- **WHEN** a visitor activates a roster row on a narrow viewport
- **THEN** the row expands to show the full print and the latest release with a link to the artist
- **AND** the row exposes its expanded state to assistive technology
- **AND** activating it again collapses it

### Requirement: Print motion respects reduced motion

Print tilt SHALL be a static visual treatment. Any motion that places a print on the pile or reveals a disclosed print SHALL be brief and SHALL be removed when the visitor prefers reduced motion.

#### Scenario: Visitor prefers reduced motion

- **WHEN** the visitor's system requests reduced motion
- **THEN** prints change without animated movement
- **AND** all roster content and actions remain available

### Requirement: Artist detail and Home roster use prints

The artist detail lead media and each Home featured roster entry SHALL present the artist image as a native-aspect print, with the genre and artist name rendered outside the image.

#### Scenario: Artist detail loads

- **WHEN** an artist detail page or overlay renders its lead image
- **THEN** the image appears as a print at its source aspect ratio without a fixed frame or fill bars

#### Scenario: Home featured roster renders

- **WHEN** the Home page renders its featured roster
- **THEN** each entry shows the artist print with the genre and name below it
- **AND** no gradient overlays the image
