# staff-structured-editing Specification

## Purpose

Lets label members edit every Staff record through grouped task cards and typed inputs, so they choose known values instead of typing them and always see what is done and what blocks publishing.

## Requirements

### Requirement: Editors are ordered stacks of task cards

Every Staff content editor SHALL present its fields as an ordered stack of named task cards. The card order and names SHALL be fixed per editor. Exactly zero or one card SHALL be open. Opening a card SHALL close the other open card. A closed card SHALL show its name, its state and a one-line summary.

#### Scenario: Release editor cards

- **WHEN** staff open a Release
- **THEN** the cards are Basics, Artwork & photos, Formats, Listening, Tracklist, Credits, Text, Home & ordering and Product safety, in that order
- **AND** the Selling and Stock tabs remain beside the details.

#### Scenario: Show editor cards

- **WHEN** staff open a Show
- **THEN** the cards are Title, When, Where, Tickets, Lineup, Poster and Links, in that order.

#### Scenario: One card open

- **WHEN** the When card is open and staff open Tickets
- **THEN** When closes, Tickets opens, and focus moves to the Tickets header.

### Requirement: Cards report their state in text

Each card SHALL show one state: done, required and missing, optional, or problem. The state SHALL be conveyed by a mark and by text available to assistive technology. A card is a problem when any field in it fails validation. It is required and missing when it holds a required field that is empty. It is optional when all its fields are optional and empty. Otherwise it is done.

#### Scenario: Missing poster description

- **WHEN** a Show has a poster without alt text
- **THEN** the Poster card shows the problem state with the summary "Description missing"
- **AND** a screen reader announces the card name, the state and the summary.

### Requirement: Card summaries read back stored values

A closed card's summary SHALL describe its current values in plain words, formatted for people, and SHALL update as staff edit. Empty optional cards SHALL say what is missing or that nothing is set.

#### Scenario: When summary

- **WHEN** the Show date is 2026-12-05 and doors are 20:00
- **THEN** the When summary reads "Sat 05 Dec 2026 · doors 20:00".

#### Scenario: Tickets summary

- **WHEN** prices are 1000, 1200 and 1500 cents and the ticket link is on more.com
- **THEN** the Tickets summary reads "€10 / €12 / €15 · More.com".

### Requirement: Publishing opens the first blocking card

When Publish changes finds incomplete or invalid fields, Staff SHALL open the first card in order that blocks publishing and focus its first problem field. Autosave, private drafts, conflict handling and review SHALL behave as before.

#### Scenario: Publish with a missing ticket link

- **WHEN** staff choose Publish changes on a Show without a ticket link
- **THEN** the Tickets card opens, the ticket link field is focused with its message, and no publication starts.

### Requirement: Known values are chosen, not typed

Fields with a known value set SHALL use a choice control, and SHALL offer Other only where new values are valid. Sets of two to four options SHALL use a segmented control. Larger closed sets SHALL use a searchable picker. Open sets SHALL use chips with suggestions and an Other entry.

#### Scenario: Genre chips

- **WHEN** staff edit an Artist's genre
- **THEN** they select one or more genres from the label's genre list as chips, and can add another genre through Other.

#### Scenario: Two-option choice

- **WHEN** staff set a Release stage or a product condition
- **THEN** they choose from a segmented control, not a dropdown or text.

### Requirement: Money is entered and stored as euro cents

Every Staff price input SHALL accept euro amounts with at most two decimals. It SHALL show the euro sign, and SHALL store integer cents. Invalid input SHALL be kept visible with a field message and never stored as a price.

#### Scenario: Show prices

- **WHEN** staff add 10, 12 and 15 as Show ticket prices
- **THEN** the stored prices are 1000, 1200 and 1500 cents, displayed as €10, €12 and €15.

#### Scenario: Too many decimals

- **WHEN** staff type 12.345 in an item price
- **THEN** the field shows "Use at most two decimals" and the stored price is unchanged.

### Requirement: Times and durations are locale-independent

Times of day SHALL be entered as 24-hour hours and minutes with steppers, whatever the browser locale. Track durations SHALL be entered as minutes and seconds and stored as whole seconds.

#### Scenario: Greek browser

- **WHEN** staff using a Greek-locale browser set doors to 20:00
- **THEN** the control shows 20 and 00, never "08:00 μμ", and stores 20:00.

#### Scenario: Track length

- **WHEN** staff enter 4 minutes 32 seconds
- **THEN** the stored duration is 272 seconds and the Tracklist summary includes it in the total length.

### Requirement: Links to known services are checked as they are entered

Fields for a known service SHALL accept a pasted page address or identifier. They SHALL show the recognised service, and SHALL reject an address on another host with a field message naming the expected service. YouTube fields SHALL store the video identifier and show its thumbnail.

#### Scenario: Wrong host for Facebook event

- **WHEN** staff paste an Instagram address into the Facebook event field
- **THEN** the field explains that a facebook.com event address is needed, and nothing is stored.

#### Scenario: Ticket seller recognised

- **WHEN** staff paste a more.com ticket page address
- **THEN** the field shows More.com and stores the HTTPS address.

### Requirement: Counts use steppers within their bounds

Counts and ordinal values SHALL use steppers with typed entry, limited to their valid range. Examples are stock quantities, priority and established year.

#### Scenario: Stocktake bound

- **WHEN** staff set online copies above counted copies
- **THEN** the stepper stops at the counted value and states the limit.

### Requirement: Text fields stay text with limits shown

Titles, prose, bios, alt text, names and legal wording SHALL remain text inputs. Fields with a maximum length SHALL show the current length against the limit.

#### Scenario: Track title limit

- **WHEN** staff type a track title
- **THEN** the field shows the count against 300 and blocks input beyond it.

### Requirement: Cards work on phones and by keyboard

At 320 to 430 CSS pixels, cards SHALL stack full width with 44-pixel targets, and summaries SHALL truncate on one line. Card headers SHALL be buttons: Enter or Space toggles a card, and Escape closes an open card and returns focus to its header.

#### Scenario: Phone Show editor

- **WHEN** staff open a Show at 390 pixels
- **THEN** every card header and control is at least 44 pixels high and no content scrolls horizontally.

#### Scenario: Keyboard close

- **WHEN** focus is inside the open Tickets card and staff press Escape
- **THEN** the card closes and focus returns to the Tickets header.
