# Spec Delta

## MODIFIED Requirements

### Requirement: Browser navigation restores staff context

Browser Back and Forward SHALL restore each deliberate Staff page, search, filter, sort, cursor, selected-content, tab and view change, suppressing repeated current choices. Entries sharing a URL SHALL retain independent browsing and surface context. Same-tab reload SHALL restore current addressable state and known paging context. List returns SHALL restore scroll and originating-item focus, otherwise results-heading focus. Automatic refresh and restoration SHALL create no entries.

#### Scenario: Traverse pages with browser history

- **WHEN** a member advances from page one to page two and page three, then uses browser Back twice and Forward once
- **THEN** the corresponding second, first, and second batches, criteria, positions, and controls are restored
- **AND** browser Back from page two does not skip page one to the workspace visited before the catalog.

#### Scenario: Return from an editor

- **WHEN** a member opens an entry from a filtered later page and returns using the visible Back action or browser Back
- **THEN** the same collection, criteria, page, scroll position, and originating row are restored
- **AND** the return action does not introduce a list/editor loop in browser history.

#### Scenario: Reload or open a copied cursor URL

- **WHEN** a member reloads a later page in the same tab
- **THEN** its current results and available previous-page context remain usable
- **WHEN** the member opens a copied later-page URL without a known cursor trail
- **THEN** that page can load and Next can continue if available
- **AND** the interface does not pretend to know its ordinal or immediate predecessor, and provides an explicit First page action.

#### Scenario: Restore a different workspace or tab

- **WHEN** history crosses Catalog, Website, Images, Stock, Orders, Stats, Calendar or Review changes, including relevant editor, setup, review and media views
- **THEN** visible content, selected navigation, URL, browsing choices and return destination agree
- **AND** stale editor content does not remain visible under a different collection or workspace address.

#### Scenario: Member retraces filters and selected records

- **WHEN** a member changes search, filters, sorting, selected record, tab or view and then traverses history
- **THEN** each deliberate committed change is restored as its own step with its matching results
- **AND** repeating the current choice, automatic refresh or a restored control update creates no extra step.

#### Scenario: Member returns before a delayed read settles

- **WHEN** a newer history destination supersedes an outstanding list, editor, panel or search request
- **THEN** an older response or delayed position/focus callback cannot replace the newer destination
- **AND** saved state is applied after its destination's lazy controls become ready.

### Requirement: Navigation protects pending work

Visible Back actions and staff navigation SHALL use the existing draft-save, conflict, stock-input, and operation-recovery protections. Editorial navigation SHALL wait for autosave to settle; a failure or conflict SHALL keep local input available and explain recovery. Stock and commerce actions SHALL NOT be submitted, repeated, or discarded by navigation. Declining to leave SHALL keep the current task, URL, focus, and recovery identity coherent. Full-document browser navigation SHALL retain the native unload protection where in-page interception is unavailable.

#### Scenario: Leave during autosave

- **WHEN** a member chooses Back while a draft save is pending or types again during that save
- **THEN** navigation waits until the latest local draft is saved through the existing serialized save path
- **AND** it navigates once without publishing the draft.

#### Scenario: A save fails or conflicts

- **WHEN** Back or browser-history navigation encounters a failed or conflicting save
- **THEN** the editor and its latest input remain available with retry or the existing explicit resolution options
- **AND** canceling navigation restores a matching URL and UI without an automatic discard or history loop.

#### Scenario: Leave stock, setup, or publication recovery

- **WHEN** a member attempts to leave entered stock counts, a pending item setup, or an operation with an uncertain result
- **THEN** existing leave/recovery protections and operation identities remain effective
- **AND** navigation alone does not record stock, create a price, repeat setup, publish content, or clear recovery state.

#### Scenario: Member repeats Back during a leave decision

- **WHEN** the member requests further history traversal while autosave or a leave decision is pending
- **THEN** navigation settles once at the permitted destination or retains the protected current task
- **AND** duplicate prompts, repeated writes and URL/UI disagreement do not result.

#### Scenario: History returns to an earlier operation view

- **WHEN** history restores a setup, publication or confirmation view after its underlying operation changed or completed
- **THEN** the view is reconciled against current authoritative state and existing recovery identity
- **AND** no write runs from restoration and any new action requires the current explicit review and confirmation.

## ADDED Requirements

### Requirement: Staff search history groups typing

Staff live search SHALL create one history step after a 500 ms typing pause, Enter or blur, while preserving its existing result timing. Duplicate commits of the same query SHALL be suppressed. A pending commit SHALL NOT overwrite a later navigation destination.

#### Scenario: Member finishes a search

- **WHEN** a member types a query in one burst and pauses, presses Enter or leaves the field
- **THEN** the query creates one history step and Back restores the preceding committed query
- **AND** a later timer or blur does not create another step for that query.

#### Scenario: Member leaves during a pending search

- **WHEN** a member leaves the search view or traverses history before its typing timer settles
- **THEN** the source search context is retained and the old timer and read cannot change the destination
- **AND** restoration creates no new search step.

### Requirement: Staff surfaces retain ordered history groups

Staff dialogs, drawers, full-view panels and their deliberate browsing choices SHALL participate in history in interaction order. Back and Forward SHALL retrace internal choices before leaving the surface. Explicit Close, Escape or backdrop dismissal SHALL exit only that surface's group, retain final applicable browsing choices and return focus to its opener. Named task-return actions SHALL retain their destination semantics.

#### Scenario: Member traverses a history or image surface

- **WHEN** a member opens Publication history, a Calendar detail, an image picker/detail, the Menu or a nested full-view panel and changes its selected content or view
- **THEN** Back retraces those choices before dismissing the surface and Forward restores the corresponding state
- **AND** the underlying task and owned scroll panes retain their context.

#### Scenario: Member explicitly closes a changed surface

- **WHEN** a member dismisses the surface using Close, Escape or its backdrop after internal browsing changes
- **THEN** the member immediately returns to its opener with final applicable browsing choices and local work preserved
- **AND** the next Back continues before that surface group without consuming unrelated navigation.

#### Scenario: Member follows a link out of a surface

- **WHEN** a member follows a supported Staff destination from a dialog, drawer or panel and later presses Back
- **THEN** the original task and source surface are restored before their saved positions and focus
- **AND** no completed operation is repeated.

#### Scenario: Member uses a named task return

- **WHEN** a member activates Back to Inventory, Back to Orders or another named contextual return
- **THEN** it returns to the validated originating task or its existing safe parent
- **AND** it does not become a generic single-step action or discard pending work.
