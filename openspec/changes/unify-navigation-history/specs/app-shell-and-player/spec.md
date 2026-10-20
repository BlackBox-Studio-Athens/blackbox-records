# Spec Delta

## MODIFIED Requirements

### Requirement: Back closes the cart drawer and phone Menu

Opening the cart drawer or phone Menu SHALL create a history step at the page's URL. Back and Forward SHALL restore its position in the browsing sequence. Explicit Close, Escape or backdrop dismissal SHALL exit its surface group without consuming unrelated entries. Following a Menu section link SHALL preserve the Menu as the preceding view.

#### Scenario: Shopper presses Back with the cart open

- **GIVEN** the cart drawer or phone Menu is open over a page with no later browsing changes
- **WHEN** the shopper presses Back
- **THEN** the sheet closes and the page keeps its URL, content and scroll position
- **AND** Forward reopens the sheet.

#### Scenario: Shopper closes the sheet with its controls

- **WHEN** the shopper closes the sheet with Close, Escape or the backdrop
- **THEN** its surface group is consumed and final browsing choices remain applied
- **AND** the next Back continues before that group, with no press that does nothing.

#### Scenario: Shopper follows a phone Menu link

- **GIVEN** the shopper opens the Menu over a scrolled page and follows a section link
- **WHEN** they press Back from the destination
- **THEN** the source page and its Menu are restored with their prior scroll and focus context
- **AND** a further Back closes that Menu without routing the source page.

### Requirement: History traversal restores the scroll position

The shell SHALL record each entry's document and owned-pane scroll positions and focus context before leaving it and when the document is hidden. Back, Forward and same-tab reload SHALL restore those positions after the destination and its browsing state are ready. Repeated visits to one URL SHALL retain independent positions. Clicked page links SHALL retain their normal top or anchor destination.

#### Scenario: Visitor returns to a scrolled section

- **GIVEN** a visitor scrolled a section page, then followed a link to another section
- **WHEN** they press Back
- **THEN** the earlier section is shown at the offset it had when they left.

#### Scenario: Visitor returns to a repeated URL

- **GIVEN** two history entries share a URL but have different choices, offsets or focused items
- **WHEN** the visitor traverses between those entries
- **THEN** each entry restores its own browsing context after content becomes ready
- **AND** a missing originating element uses the appropriate results or page heading without a stale focus callback.

## ADDED Requirements

### Requirement: Public history retraces deliberate browsing choices

Public browsing SHALL record distinct page, selected-content, filter, tab, pagination and view changes. Repeating the current choice SHALL create no duplicate entry. Back and Forward SHALL restore each entry's choices and visible results without generating new history steps or changing current authoritative commerce or playback state.

#### Scenario: Shopper retraces Store and Artists browsing

- **WHEN** a visitor changes Store or Artists search, filters or view, selects an item, then uses Back and Forward
- **THEN** the corresponding choices, selected content, result presentation and position are restored one step at a time
- **AND** Crate item selection, image-gallery selection and Home video/chapter selection participate when deliberately changed.

#### Scenario: Passive changes do not fill history

- **WHEN** a visitor scrolls, hovers, opens a small option popover, watches an animation, or playback progresses
- **THEN** those passive or auxiliary changes create no browsing history step
- **AND** automatic data refresh and restoration create no new entries.

### Requirement: Public search history groups typing

Live search SHALL record one history step for each burst of typing, committed after a 500 ms typing pause, Enter or blur. These history boundaries SHALL preserve existing live-result timing and phone-keyboard behavior. A repeated commit of the same query SHALL create no additional step.

#### Scenario: Visitor finishes typing a query

- **WHEN** a visitor types a query without a 500 ms pause and then pauses, presses Enter or leaves the field
- **THEN** the query creates one history step and Back restores the preceding committed query
- **AND** the later timer or blur does not commit it again.

#### Scenario: Visitor navigates before the search timer fires

- **WHEN** the visitor leaves a view or traverses history while a typing commit is pending
- **THEN** the live source query is captured for its entry and the pending timer cannot write over the destination
- **AND** Forward restores the recorded query without replaying a stale search response.

### Requirement: Public surface history follows interaction order

History SHALL restore open public surfaces in their actual interaction order. Choices inside a modal SHALL remain individually traversable until explicit dismissal exits that modal group and keeps its final browsing choices. Nested dismissal SHALL return to the immediate opener with focus and scroll preserved. Restoration SHALL NOT replay a submission or revive a stopped player session.

#### Scenario: Visitor retraces changes inside the Filter sheet

- **GIVEN** the visitor opens the Filter sheet and makes several distinct filter choices
- **WHEN** they press Back repeatedly
- **THEN** the choices are restored in reverse order while the sheet remains open
- **AND** Back from its opening step closes the sheet; Forward restores the corresponding choices and open state.

#### Scenario: Visitor explicitly dismisses a changed modal

- **WHEN** the visitor dismisses a modal after several internal browsing changes using Close, Escape or its backdrop
- **THEN** it returns immediately to its opener, retaining final applicable browsing choices
- **AND** the next Back continues before that modal group without undoing unrelated navigation.

#### Scenario: Visitor opens nested public surfaces

- **GIVEN** a detail overlay, player, cart, gallery or other full-view surface is opened over another view
- **WHEN** the visitor traverses or dismisses its history
- **THEN** the actual recorded surface order determines which view closes or reopens
- **AND** the active player keeps its existing minimize, reopen and Stop semantics and iframe identity where the shell remains mounted.

### Requirement: Navigation from a modal retains its source context

Navigating from a modal to a shell-managed page SHALL retain that modal and its background as the source history context. Returning SHALL restore the background before its choices, open surfaces, positions, focus and document title. Direct detail loads and checkout or external-provider documents SHALL retain native navigation behavior without duplicate entries or replayed submissions.

#### Scenario: Visitor returns from a Store Item to a release modal

- **GIVEN** a visitor opens a release modal from a filtered, scrolled listing and follows its Store Item link
- **WHEN** they press Back from that item page
- **THEN** the original listing and release modal are restored with their browsing context
- **AND** further Back and Forward steps retrace the recorded journey.

#### Scenario: Restoration waits for lazy content

- **WHEN** a returned background or surface needs loading or hydration
- **THEN** its saved state is applied when its owning controls become ready, before final position/focus restoration
- **AND** an older fetch, transition, search or focus callback cannot overwrite a newer history destination.

#### Scenario: An old destination is unavailable

- **WHEN** history references missing content or a surface that is no longer valid
- **THEN** the visitor receives the existing safe loading, unavailable or native fallback behavior
- **AND** navigation does not trap them, fabricate a successful view or execute an old operation.
