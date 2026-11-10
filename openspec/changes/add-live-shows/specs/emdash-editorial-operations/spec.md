## ADDED Requirements

### Requirement: Staff manage Shows as editorial content

Staff SHALL find Shows under Website, ordered by date with the soonest first. Opening a blank Show SHALL NOT create a draft; the first edit starts the existing autosave, and incomplete Shows remain private drafts. Preview SHALL render Home with the selected Show. Never-published Shows SHALL move to trash, like News.

#### Scenario: Staff start Vol. II without its date

- **WHEN** staff create a Show with only a title
- **THEN** it autosaves as a private draft
- **AND** review reports the missing date, venue, doors time, ticket link, poster and Headliner.

### Requirement: Show publication includes its references

Show publication SHALL use the existing review and Content Publication operations. It SHALL require every lineup Artist and linked Release to be on the website already or in the same review.

#### Scenario: A lineup Artist is unpublished

- **WHEN** a Show references an Artist that is not on the website and not in the same review
- **THEN** review asks for that Artist to be included before publishing.

#### Scenario: A linked Release belongs to another Artist

- **WHEN** a Headliner links a Release whose Artist is different
- **THEN** draft saving rejects the link with a field-scoped message.

### Requirement: Show editing uses structured fields

The Show editor SHALL use:

- a date picker for the date
- a 24-hour time input for doors
- a URL field for each link
- the existing image picker for the poster, with required alt text
- an ordered lineup list

Each lineup row SHALL choose a published-or-draft Artist or a plain name, and a role of Headliner or Opening act. Rows SHALL reorder with Move up and Move down. A Headliner row with an Artist SHALL offer that Artist's Releases as an optional linked Release.

#### Scenario: Staff add the Hylas opening act

- **WHEN** staff add a lineup row, type Hylas as a plain name and choose Opening act
- **THEN** the row saves as an Opening act without an Artist reference.

#### Scenario: Staff link LOTUS to Sidus

- **WHEN** staff choose Sidus as a Headliner
- **THEN** the linked Release choice lists only Sidus Releases, including LOTUS.

### Requirement: The Show collection is prepared idempotently

New CMS databases SHALL receive the Show collection from the seed schema. The existing explicit catalogue-schema preparation SHALL create the collection and its fields on existing stores when they are absent, verify their types when present, and change no content. Local startup and UAT and PRD releases SHALL run this preparation before deploying the CMS. Software release SHALL NOT create, publish or alter any Show.

#### Scenario: An existing store lacks Shows

- **WHEN** preparation runs on a store without the Show collection
- **THEN** it creates the collection and fields
- **AND** a second run changes nothing.

#### Scenario: A field has an unexpected type

- **WHEN** a Show field exists with a different type
- **THEN** preparation fails with a message naming the collection and field, without altering it.
