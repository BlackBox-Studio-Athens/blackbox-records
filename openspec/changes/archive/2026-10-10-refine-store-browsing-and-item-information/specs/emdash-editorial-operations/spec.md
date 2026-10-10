# Spec Delta

## ADDED Requirements

### Requirement: Store information uses the existing EmDash editing workflow

Release and Distro entries SHALL support optional structured, format-specific Tracklist values through the existing content editor. Info SHALL reuse existing editorial fields. Both SHALL follow the existing draft, preview, revision, and publication workflow.

#### Scenario: An editor enters a tracklist

- **WHEN** an editor edits a Release or Distro entry
- **THEN** a labelled optional Tracklist editor offers format selection, side groups for vinyl/cassette, disc groups for CD, ordered track rows, titles and optional validated m:ss durations
- **AND** the editor is not required to create standalone track records, paste JSON or maintain free-text numbering.

#### Scenario: An editor updates Distro information

- **WHEN** an editor updates the existing Distro summary or known format/date fields
- **THEN** the item Info section reflects those values through the normal publication path
- **AND** no additional Distro body field, rich-text editor, or media-resolution path is required.

#### Scenario: Existing content has no additional information

- **WHEN** an existing record or accepted snapshot omits Tracklist
- **THEN** it remains valid and renderable with its existing content
- **AND** no catalogue-wide fill-in or generated placeholder is required.

#### Scenario: New fields are added to an existing environment

- **WHEN** the optional fields are installed through the existing supported schema setup
- **THEN** current records, identities, commerce links, media, drafts, and revisions remain intact
- **AND** the setup adds no new commerce authority or private-table mutation mechanism.

#### Scenario: An editor previews and publishes

- **WHEN** an editor saves changed Tracklist or Info content
- **THEN** preview shows the draft through the shared item presentation while the public site retains accepted content
- **AND WHEN** publication is explicitly completed
- **THEN** accepted-snapshot runtime and retained static rendering show the same information and preserve ordered tracks and the meaning of existing information.

#### Scenario: An editor changes tracklist format

- **WHEN** an editor changes between vinyl/cassette and CD
- **THEN** existing entered tracks are retained in order and the editor can arrange the new side/disc groups
- **AND** no source format is silently treated as an identical edition of another format.
