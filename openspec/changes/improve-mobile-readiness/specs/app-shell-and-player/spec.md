## MODIFIED Requirements

### Requirement: Detail overlays

The system SHALL open artist, release, and news detail routes as overlays for shell-managed navigation while preserving full Astro pages for direct loads. An open overlay SHALL be a dialog named by its detail title, and the document title SHALL read `<detail title> | <site name>` while it is open. Closing an overlay without routing SHALL keep the list's scroll position and return focus to the card that opened it. A link inside an overlay to a document the shell does not handle SHALL navigate natively without adding a duplicate history entry.

#### Scenario: Detail link opens in shell

- **GIVEN** a shell-managed page contains a release, artist, or news detail link
- **WHEN** the user follows that link
- **THEN** the shell fetches the partial overlay route
- **AND** the overlay dialog's accessible name and the document title carry the detail title
- **AND** direct loads to the same detail URL still render full pages.

#### Scenario: Shopper closes an overlay far down a list

- **GIVEN** a shopper opened a detail overlay from a card far down a list
- **WHEN** they close it with Close, Escape, the backdrop or Back
- **THEN** the list keeps its scroll position and focus returns to the card without scrolling
- **AND** the previous document title is restored.

## ADDED Requirements

### Requirement: Back closes the cart drawer and phone Menu

While the cart drawer or the phone Menu is open, the shell SHALL keep one history entry for it at the page's own URL, so Back closes the sheet without routing the page beneath it. Closing the sheet in place SHALL consume that entry, and following a Menu section link SHALL replace it.

#### Scenario: Shopper presses Back with the cart open

- **GIVEN** the cart drawer or the phone Menu is open over a page
- **WHEN** the shopper presses Back
- **THEN** the sheet closes and the page keeps its URL, content and scroll position
- **AND** Forward reopens the sheet.

#### Scenario: Shopper closes the sheet with its controls

- **WHEN** the shopper closes the sheet with Close, Escape or the backdrop
- **THEN** the sheet's history entry is consumed
- **AND** the next Back navigates, with no press that does nothing.

### Requirement: History traversal restores the scroll position

The shell SHALL record the scroll offset in the current history entry before a section navigation, before a sheet opens and when the document is hidden, and SHALL restore it when Back or Forward returns to that entry, including a returned or reloaded document. Clicked links and Menu links SHALL keep resetting the scroll to the top.

#### Scenario: Visitor returns to a scrolled section

- **GIVEN** a visitor scrolled a section page, then followed a link to another section
- **WHEN** they press Back
- **THEN** the earlier section is shown at the offset it had when they left.

### Requirement: The floating player reserves page space and stacks below sheets

While a player session exists, the page end and the root bottom scroll padding SHALL reserve the floating player's height plus the bottom safe area, so the last content and focused controls stay visible above it. The phone Menu sheet SHALL stack above the floating player and below the player modal.

#### Scenario: Phone visitor scrolls to the footer with the player minimized

- **GIVEN** a minimized player session on a 390 × 844 phone
- **WHEN** the visitor scrolls to the end of the page
- **THEN** the footer is fully visible above the floating player
- **AND** the open Menu's Close control receives a tap at its own position.

### Requirement: The player modal fits short viewports and phone album embeds

On viewports up to 30rem tall, the player modal SHALL show its header and controls beside the embed with no scrolling inside the modal, and the Bandcamp embed SHALL narrow to fit the available height. Below 40rem wide, a Bandcamp album embed SHALL be sized to its cover-and-transport height without an empty area beneath it.

#### Scenario: Landscape phone opens the player

- **WHEN** the player modal opens at 844 × 390
- **THEN** the embed, its transport controls and Close are inside the viewport
- **AND** the modal does not scroll.

### Requirement: The background is inert behind the player modal and detail overlays

While the player modal or a detail overlay is open, the skip link, header, main content and footer SHALL be inert. Inertness SHALL lift before focus returns on close, and focus return SHALL NOT scroll the page.

#### Scenario: Keyboard user opens a detail overlay

- **GIVEN** a detail overlay or the player modal is open
- **WHEN** the user moves through the page with Tab or a screen reader's reading order
- **THEN** only the open dialog's content is reachable
- **AND** after closing it, the page is interactive again and focus is on the control that opened it.

### Requirement: The fixed header never covers focused or anchored content

The root top scroll padding SHALL equal the header height plus 0.5rem, section scroll margins SHALL be relative to it, and script-driven target scrolling SHALL apply the same offset. The skip link and the route loading indicator SHALL paint above the header and below sheets and dialogs.

#### Scenario: Keyboard user starts on a phone

- **WHEN** a keyboard user presses Tab on a fresh page at 390 px wide
- **THEN** the skip link is the first stop and is painted above the header
- **AND** following an in-page anchor lands the target below the header.

### Requirement: Cart quantity changes are announced

The cart drawer's quantity controls SHALL form a labelled group, and each quantity step SHALL be announced politely with the item title, the new quantity and the line total; a removal announcement SHALL take priority.

#### Scenario: Shopper increases a quantity

- **WHEN** the shopper presses the increase control for a cart line
- **THEN** a polite live region announces the title, the new quantity and the line total.

### Requirement: Closing the cart returns focus to its opener on tap-only browsers

Closing the cart drawer SHALL return focus to the control that opened it, the Buy or Add To Cart control or the header Cart, even when the browser did not focus that control on tap; otherwise to the element focused before opening, then the header Cart, then main. The shell SHALL set `html[data-app-shell-ready]` once its document listeners are attached, so tests and tooling wait for that marker instead of a delay.

#### Scenario: iOS Safari shopper closes the cart after Buy

- **GIVEN** a shopper tapped Buy on a Store card and the cart drawer opened
- **WHEN** they close the drawer
- **THEN** focus is on that Buy control.

### Requirement: Public documents declare a dark browser theme

Every public shell document, the redirect layout and the 404 page SHALL declare `theme-color` `#0d0d0d` and a dark `color-scheme`, so phone browser chrome and form controls match the site.

#### Scenario: Phone visitor loads any public page

- **WHEN** a public page, a redirect page or the 404 page loads
- **THEN** its head contains `theme-color` `#0d0d0d` and `color-scheme` `dark`.

### Requirement: Shell documents link a touch icon and a web manifest

Shell documents SHALL link a 180 px `/apple-touch-icon.png` and `/manifest.webmanifest`. The manifest's start URL and scope SHALL be relative, its icons SHALL include 192 px, 512 px and maskable 512 px images, and its display SHALL be `minimal-ui`, so an installed site shares the browser's cart storage and checkout return.

#### Scenario: Visitor adds the site to a home screen

- **WHEN** a phone browser reads the page's icon and manifest links
- **THEN** it receives the 180 px touch icon and a manifest with relative start URL and scope and `minimal-ui` display.

### Requirement: Shared links use the configured site and the product image

The canonical link and `og:url` SHALL be built from the configured site and the request pathname, and a Store Item page SHALL use its product image and alt text as the sharing image.

#### Scenario: Visitor shares a Store Item from a phone

- **WHEN** a Store Item page is loaded
- **THEN** its canonical link and `og:url` are the configured site plus the item's pathname
- **AND** its `og:image` is a 1200 px JPEG of the product image.

### Requirement: Public text fields are 16 px on phones

Below 48rem every public text input, select and textarea SHALL render at a computed size of at least 16 px without disabling pinch zoom; wider viewports keep their sizes.

#### Scenario: iPhone visitor focuses a field

- **WHEN** a visitor at 390 px wide focuses any public text field
- **THEN** its computed font size is at least 16 px, so iOS Safari does not zoom the page.

### Requirement: Search fields and form errors suit phone keyboards

The Store and Artists search fields SHALL offer a search Enter key with autocorrect, autocapitalisation and spellcheck off, and Return SHALL dismiss the keyboard without changing results. Clear filters SHALL move focus to the live result count. A Notify me submission failing only on consent SHALL move focus to the consent checkbox.

#### Scenario: Shopper searches the Store on a phone

- **WHEN** the shopper types a query in Store search and presses Return
- **THEN** the keyboard closes
- **AND** the filtered results stay as typed.

#### Scenario: Shopper clears the filters

- **WHEN** the shopper activates Clear filters
- **THEN** focus moves to the live result count.
