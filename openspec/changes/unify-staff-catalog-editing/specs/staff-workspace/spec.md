## ADDED Requirements

### Requirement: Editors offer an explicit current-item publish action

Content editors SHALL offer a prominent Publish changes action alongside review alternatives. Autosave SHALL remain private. The action SHALL finish saving the current item, retain its exact revision, and use the existing publication checks and recovery operation. It SHALL NOT publish unrelated drafts, automatically include required linked drafts, or replace an unconfirmed operation.

#### Scenario: Publish an edited or newly created item

- **WHEN** a member selects Publish changes with valid content and no incomplete upload
- **THEN** the current draft is saved and that exact saved revision is submitted once for publication
- **AND** the interface reports the confirmed publication status.

#### Scenario: Publication requires attention

- **WHEN** a linked draft is required, the saved revision changed, or a previous operation remains unconfirmed
- **THEN** the existing review or recovery interface explains the next action without automatically broadening or repeating the publication.

#### Scenario: Keep drafts for later

- **WHEN** a member keeps editing or chooses the review alternative
- **THEN** drafts remain private until an explicit publication action, and the global review queue remains reachable.

#### Scenario: Leave an unfinished creation

- **WHEN** a member leaves midway without selecting a final action
- **THEN** saved work remains a private draft available to resume
- **AND** reopening or recovering setup never publishes content or enables buying.

#### Scenario: Create an item ready for sale

- **WHEN** a member explicitly selects Create and publish after confirming price and starting stock
- **THEN** setup completes before the existing shop publication operation publishes content and enables buying
- **AND** failure or incomplete setup leaves the item unavailable to buy, with its draft and recovery state preserved.

### Requirement: Saved artist identity is visible before selection

The release editor SHALL resolve the saved artist independently of dropdown pagination and display its name before opening the picker. A delayed lookup SHALL NOT replace a subsequent selection.

#### Scenario: Saved artist is outside the first page

- **WHEN** a release references an artist absent from the first choices page
- **THEN** the picker shows that artist's resolved name without opening or paging the dropdown
- **AND** selecting another artist remains authoritative if the old lookup finishes later.

### Requirement: Shop publication is discoverable beside price editing

The Price & stock tab SHALL show shop publication status and available publication actions without expanding a disclosure. Price-saving and shop-publication actions SHALL explain their distinct effects using staff-facing language and preserve existing revision and readiness safeguards.

#### Scenario: A member changes a price

- **WHEN** a member saves a price and a further shop publication action is required
- **THEN** the resulting status and next action are visible near the top of the tab.

### Requirement: Catalogue search includes band identity

Staff catalogue search SHALL match album titles and their band or artist names, including linked release artists and distro credits. Matches SHALL remain reachable across bounded pages with current filters and draft privacy preserved.

#### Scenario: Find an album by its band

- **WHEN** a member searches for a band whose name is absent from its album title
- **THEN** matching releases and distro entries appear in the appropriate catalogue results, including beyond the first source page.

### Requirement: Bulk photos belong to one catalogue entry

Release and distro editors SHALL accept multiple images in one selection and append successful uploads in selection order to that entry's gallery. Existing images, cover, unrelated edits and successful uploads SHALL survive another file's failure. Validation and private media access SHALL remain enforced.

#### Scenario: One upload fails

- **WHEN** a batch includes valid images and a rejected file
- **THEN** successful images remain attached, the rejected file is identified, and retry does not duplicate successful attachments.

#### Scenario: Editor changes during upload

- **WHEN** a member edits other fields while images upload
- **THEN** completion preserves those edits and never attaches images to a different entry.

### Requirement: Image preview recovery preserves pending changes

Preview readiness SHALL reflect the images in the current rendering and SHALL preserve genuine loading failures as actionable errors. Retry SHALL retain saved drafts, exact review selection and the previous successful rendering.

#### Scenario: An image fails to load

- **WHEN** a saved review preview encounters an image loading failure
- **THEN** the member can retry without losing or publishing any pending changes.

#### Scenario: Return to an unchanged review

- **WHEN** a member switches applications or browser tabs and returns
- **THEN** the current successful preview and publish eligibility remain intact without a required review refresh
- **AND** publication still rejects changed server revisions.

#### Scenario: Open the standalone review

- **WHEN** the saved changes review displays a preview
- **THEN** its frame fills the available preview pane using the same layout styling as the editor.
