## ADDED Requirements

### Requirement: Preserve editorial concurrency during upgrade

The system SHALL use EmDash 1.1.0 while preserving revision-fenced deletion and draft saves, accepted snapshot identity, and existing Local data.

#### Scenario: Stale write after upgrade

- **WHEN** a writer submits a stale revision
- **THEN** the write conflicts without changing current content

### Requirement: Focus staff workspaces

The staff Stock workspace SHALL close its finder after selection and allow reopening without losing unfinished work. Editorial preview SHALL have explicit close/show controls, preserve drafts and visibility preference, use full editing width while closed and pause preview requests.

#### Scenario: Close preview during editing

- **WHEN** staff close preview with unsaved changes
- **THEN** editing retains the changes and uses the available workspace width

### Requirement: Support validated images and videos

The system SHALL upload one or multiple validated images with ordered successes and individual failures. Cover fields SHALL remain singular. Full text SHALL support richer images and approved YouTube/Vimeo embeds with explicit loading and no autoplay, while short descriptions remain text-only.

#### Scenario: Partial batch failure

- **WHEN** one image in a batch fails
- **THEN** other images complete and retry does not upload successful files again

### Requirement: Show accepted publication evidence

The system SHALL show publisher, destination, action, times, affected entries and verifiable before/after comparisons. It SHALL show comparison unavailability where historical evidence is missing.

#### Scenario: Publication activation is retried

- **WHEN** activation succeeds and confirmation is retried
- **THEN** history retains the actual previous snapshot and records successful completion once

### Requirement: Recover images within the Free plan

The system SHALL keep Cloudflare Images on Free and automatically serve verified originals when transformations fail. Social-image URLs SHALL use the server fallback so crawlers do not require JavaScript. Successful transformations SHALL retain existing canonical source identities, and temporary fallbacks SHALL permit recovery after the allowance resets.

#### Scenario: Social-image transformation quota is exhausted

- **WHEN** Cloudflare returns quota error 9422 for a social image
- **THEN** the server serves the accepted original with a short cache and retries the same approved transformation after recovery, without enabling a paid Images plan

### Requirement: Provide a read-only publication calendar

The staff calendar SHALL show every successful publication including repeated updates and removals, use Europe/Athens, expose requested-time fallback labels, and support responsive month/agenda views and collection filtering without silent pagination truncation.

#### Scenario: Earlier update has no completion time

- **WHEN** staff view that successful update in the calendar
- **THEN** it uses requested time and explicitly labels the missing completion time

### Requirement: Restore scrolling after release dismissal

The public shell SHALL restore mouse-wheel scrolling after a release detail closes in Firefox, including backdrop dismissal, while preserving the background route and persistent player.

#### Scenario: Close Ouranopithecus release from its backdrop

- **WHEN** a Firefox visitor opens Anarchotribal by Ouranopithecus from Releases and clicks outside the detail
- **THEN** the Releases page scrolls with the mouse wheel, including after repeated opening and closing
