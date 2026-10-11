# Staff workspace delta

## MODIFIED Requirements

### Requirement: Browse a growing catalog

Staff MUST filter distro and merch by existing format groups before cursor pagination through EmDash. Lists MUST retain editorial-only entries and restore their navigation state. Distro & merch, Artists, Releases, and News SHALL expose the same explicit Previous/Next behavior wherever they use the shared content list, with at most 25 entries per page.

When multiple pages exist, Previous and Next SHALL appear above and below the results with visible text and a readable position summary. The upper controls SHALL be discoverable without scrolling through the entries at supported viewport sizes. The first page SHALL disable Previous and the final page SHALL disable Next. The interface SHALL distinguish entries on the current page from a total count; it SHALL NOT invent a total or offer unsupported page-number jumps.

#### Scenario: Find an entry beyond the first page

- **WHEN** a member filters or searches a catalog with more than 250 entries
- **THEN** all matching entries are reachable through 25-entry pages, with artwork and publication state
- **AND** the existing All, Distro, Merch, format, search, and sort choices apply to the complete collection before paging
- **AND** a fixed matching collection can be traversed to its end without skipped or duplicate entries, including entries sharing a title or edit timestamp

#### Scenario: Discover and advance the list

- **WHEN** a member opens the first page of Distro & merch with more results available
- **THEN** labeled paging controls and the current position are visible above the results without searching the bottom of the list
- **WHEN** the member successfully advances using either Next control
- **THEN** the next batch replaces the current batch and its beginning is brought into view, with keyboard focus on the results heading and an announced position update

#### Scenario: Reach a boundary or empty result

- **WHEN** the collection has zero, fewer than 25, exactly 25, or a partially filled final page of entries
- **THEN** the interface presents the actual returned entries and a truthful empty or end state
- **AND** Next is available only when the service supplies a continuation, irrespective of the current row count
- **AND** an empty filtered result retains the search/filter controls and provides a clear way to reset them

## ADDED Requirements

### Requirement: Page transitions preserve a usable list

Page transitions SHALL preserve the last successful rows, position, and navigation context until the requested page succeeds. Loading SHALL be communicated and duplicate page requests SHALL be prevented. A failed or superseded request SHALL NOT advance the displayed position or corrupt the previous-page trail. Changing the collection, search, area, format, or sort SHALL start a new paging sequence using the chosen criteria.

#### Scenario: A page request fails

- **WHEN** Next or Previous fails because of a network or service error
- **THEN** the current successful page, URL, previous-page trail, scroll position, and focused control remain usable
- **AND** an inline error offers a retry of the failed page without reloading the entire workspace or appending a duplicate history entry
- **AND** an access denial instead follows the existing access-required behavior and does not retain unauthorized content

#### Scenario: A newer browse intent supersedes an older response

- **WHEN** a member changes the filter or sort while an earlier page request is pending
- **THEN** only the newest intent can update rows, URL, position, loading state, or error feedback
- **AND** cursors from the prior criteria are not sent with the new criteria

#### Scenario: Repeated clicks or background reads occur

- **WHEN** Next is activated repeatedly, or an automatic read overlaps an explicit page transition
- **THEN** one successful user transition produces one page advance
- **AND** background reads do not change history, reset the page, or move focus or scroll

#### Scenario: A continuation becomes unusable

- **WHEN** a supplied cursor is rejected or repeats without progress, or a previously populated page becomes empty after catalog changes
- **THEN** the workspace stops automatic continuation attempts and offers a labeled return to the first page with the current criteria
- **AND** it does not misrepresent a service error as the end of the catalog

### Requirement: Browser navigation restores staff context

Browser Back and Forward SHALL restore successful staff navigation states, including collection or workspace, search, filters, sort, cursor, selected detail, and relevant tab. Same-tab reload SHALL restore the current addressable state and known previous-page context. Returning to a list SHALL restore its scroll position and originating item focus when that item still exists, otherwise its results heading. Explicit Next/Previous transitions SHALL be traversable through browser history; automatic refresh and history restoration SHALL NOT create new navigation entries.

#### Scenario: Traverse pages with browser history

- **WHEN** a member advances from page one to page two and page three, then uses browser Back twice and Forward once
- **THEN** the corresponding second, first, and second batches, criteria, positions, and controls are restored
- **AND** browser Back from page two does not skip page one to the workspace visited before the catalog

#### Scenario: Return from an editor

- **WHEN** a member opens an entry from a filtered later page and returns using the visible Back action or browser Back
- **THEN** the same collection, criteria, page, scroll position, and originating row are restored
- **AND** the return action does not introduce a list/editor loop in browser history

#### Scenario: Reload or open a copied cursor URL

- **WHEN** a member reloads a later page in the same tab
- **THEN** its current results and available previous-page context remain usable
- **WHEN** the member opens a copied later-page URL without a known cursor trail
- **THEN** that page can load and Next can continue if available
- **AND** the interface does not pretend to know its ordinal or immediate predecessor, and provides an explicit First page action

#### Scenario: Restore a different workspace or tab

- **WHEN** history crosses Catalog, Website, Images, Stock, Orders, or Review changes, including Details/Selling/Stock tabs and media mode
- **THEN** visible content, selected navigation, URL, and return destination agree
- **AND** stale editor content does not remain visible under a different collection or workspace address

### Requirement: Staff has a visible contextual way back

Every primary BlackBox staff workspace page other than Overview SHALL provide a visible, text-labeled `Back to <destination>` action in a consistent position near the task heading. Detail pages SHALL prefer the known originating staff task and its list context; a direct entry without a known origin SHALL use a meaningful parent. Catalog and Website list roots, Images, Stock, Orders, and Review changes SHALL fall back to Overview. Catalog editors SHALL fall back to their collection; Website singleton editors SHALL fall back to Pages or Navigation & footer as appropriate. New release, distro, and merch flows SHALL fall back to their corresponding catalog list. Order and stock details SHALL fall back to their respective lists.

Return targets SHALL remain within the current staff environment and recognized staff destinations. Invalid, external, or unavailable return metadata SHALL fall back safely. Existing URLs SHALL remain usable. Panels, dialogs, media pickers, and multi-step workflows SHALL retain their local Close, Cancel, or previous-step actions; those SHALL remain distinct from leaving the task.

#### Scenario: Work across the staff workspace

- **WHEN** a member opens an editor, item setup, stock detail, order detail, or review from another staff task
- **THEN** the visible Back label names its actual destination and returns to that task with applicable context
- **AND** top-level destinations offer Back to Overview when no supported origin is available

#### Scenario: Open a singleton or deep link directly

- **WHEN** a member opens Home page, Buying & delivery, Label details, a catalog entry, or an order in a new tab
- **THEN** a visible labeled parent action is available without relying on earlier browser history
- **AND** it does not leave the staff workspace for a previous external site

#### Scenario: Return through review or legacy item links

- **WHEN** Review changes opens an entry, or a supported legacy variant link resolves to its catalog editor
- **THEN** Back retains a valid known originating task, including review selection and browse position
- **AND** absent origin metadata uses the appropriate parent without losing the resolved item identity

#### Scenario: Close a nested surface

- **WHEN** a member closes Publication history or an image detail/picker, or goes to the preceding setup step
- **THEN** the member returns to the underlying task or step with focus and local work preserved
- **AND** closing that surface neither consumes an unrelated page-history entry nor activates the task-level Back action

### Requirement: Navigation protects pending work

Visible Back actions and staff navigation SHALL use the existing draft-save, conflict, stock-input, and operation-recovery protections. Editorial navigation SHALL wait for autosave to settle; a failure or conflict SHALL keep local input available and explain recovery. Stock and commerce actions SHALL NOT be submitted, repeated, or discarded by navigation. Declining to leave SHALL keep the current task, URL, focus, and recovery identity coherent. Full-document browser navigation SHALL retain the native unload protection where in-page interception is unavailable.

#### Scenario: Leave during autosave

- **WHEN** a member chooses Back while a draft save is pending or types again during that save
- **THEN** navigation waits until the latest local draft is saved through the existing serialized save path
- **AND** it navigates once without publishing the draft

#### Scenario: A save fails or conflicts

- **WHEN** Back or browser-history navigation encounters a failed or conflicting save
- **THEN** the editor and its latest input remain available with retry or the existing explicit resolution options
- **AND** canceling navigation restores a matching URL and UI without an automatic discard or history loop

#### Scenario: Leave stock, setup, or publication recovery

- **WHEN** a member attempts to leave entered stock counts, a pending item setup, or an operation with an uncertain result
- **THEN** existing leave/recovery protections and operation identities remain effective
- **AND** navigation alone does not record stock, create a price, repeat setup, publish content, or clear recovery state

### Requirement: Paging and return controls are accessible

Paging and return actions SHALL use native link/button behavior, visible text, keyboard activation, visible focus, and touch targets at least 44 CSS pixels high. Duplicated pagers SHALL have distinguishable navigation labels and identical enabled states. Controls and status text SHALL remain usable at 390, 768, 1280, and 1600 CSS pixels, at 200% zoom, and with reduced motion. No action SHALL require hover, a gesture, or icon recognition alone.

#### Scenario: Navigate with keyboard or a narrow viewport

- **WHEN** a member browses, advances a page, opens an item, and returns using only the keyboard at a supported width
- **THEN** controls fit without horizontal overflow, status changes are announced, and focus follows the successful transition
- **AND** failed requests retain the initiating control, while returning from a detail restores the originating row or list heading
- **AND** reduced motion does not prevent orientation or require an animation to complete
