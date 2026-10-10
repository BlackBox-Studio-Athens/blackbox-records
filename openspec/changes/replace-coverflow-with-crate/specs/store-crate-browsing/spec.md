## ADDED Requirements

### Requirement: Store collections offer the Crate only for formats with a bin

Every Store collection SHALL render its complete canonical Grid first and SHALL offer a Grid | Crate switch only while the visible Grid holds a Store Item whose format has a bin. A format SHALL have a bin when the collection holds at least seven Store Items of it. All formats, and any text, artist or pre-order filter, SHALL use the Grid.

#### Scenario: Formats map to bins

- **WHEN** a collection's Store Items are grouped by format
- **THEN** `Vinyl 12-inch` stands in a crate, `CDs` in a CD bin and `Tapes` in a tape rack
- **AND** every other format, including Vinyl 7-inch, Vinyl 10-inch, Clothes and Other, has no bin.

#### Scenario: Distro offers the crate and the CD bin

- **GIVEN** Distro holds 52 Vinyl 12-inch, 39 CDs and 4 Tapes
- **WHEN** it renders with JavaScript available
- **THEN** the Grid shows every Store Item in its canonical order and Grid | Crate appears with Grid pressed
- **AND** the crate and the CD bin are available while Tapes, Vinyl 7-inch and Vinyl 10-inch stay in the Grid.

#### Scenario: Nothing in the Grid has a bin

- **WHEN** the Grid holds no Store Item of a format with a bin, as on Merch or while Distro is filtered to Tapes
- **THEN** Grid | Crate is not shown and the Grid behaves as it does without the Crate.

#### Scenario: A filter is applied

- **WHEN** the shopper searches, picks an artist or shows pre-orders, including while the Crate is open
- **THEN** the Grid shows the filtered results and Grid | Crate stays hidden until the filter clears.

#### Scenario: Enhancement is unavailable

- **WHEN** JavaScript is unavailable or the Crate code fails to load
- **THEN** the complete Grid remains with no nonfunctional Crate controls.

### Requirement: The Crate opens on the card the Grid is on

Opening the Crate SHALL put in hand the card the Grid is on: the one the shopper came back from the Crate with, or the first card on screen after filtering or scrolling. When that card's format has no bin, the next card down that has one SHALL be used. Items before it SHALL start on the pile. Returning to the Grid SHALL keep the format filter when it holds the item in hand, otherwise show that item's format, and SHALL scroll only as far as needed to show it.

#### Scenario: A round trip returns to the same item

- **GIVEN** the shopper holds a record in the crate
- **WHEN** they return to the Grid and then press Crate again without scrolling
- **THEN** the crate opens with the same record in hand.

#### Scenario: Covers travel between Grid and Crate

- **WHEN** the view switches with motion allowed
- **THEN** only covers on screen travel between card and bin, each as one transform, while card text fades
- **AND** the switch finishes within 750ms and a switch press during it is ignored.

#### Scenario: The shopper prefers reduced motion

- **WHEN** reduced motion is preferred
- **THEN** every switch, flip and pull is instant, with the same item, scroll position and focus.

### Requirement: A flip bin turns one sleeve per gesture

The crate and the CD bin SHALL flip. The sleeve in hand SHALL follow a pointer drag with its top edge under the pointer. Past the bin's tipping point it SHALL leave the pointer and fall onto the pile, and that drag SHALL turn no further sleeve. A release before the tipping point SHALL lean it back unless the release is a flick, which SHALL turn exactly one sleeve. A horizontal wheel notch, an arrow key, Previous or Next SHALL turn one sleeve. A back board SHALL end every flip bin.

#### Scenario: A long drag turns one sleeve

- **WHEN** the shopper drags a sleeve far past its tipping point with a mouse, pen or finger
- **THEN** exactly that sleeve falls onto the pile and the next sleeve is in hand.

#### Scenario: The shopper reaches the end

- **WHEN** every sleeve is flipped forward
- **THEN** the back board shows and nothing flips past it
- **AND** Back to the start and lifting the last sleeve return through the bin.

#### Scenario: The shopper digs with the keyboard

- **WHEN** focus is on a flip bin
- **THEN** Arrow keys and Page Up or Page Down turn one sleeve, Home returns to the start, End reaches the last sleeve, Enter or Space lifts the sleeve in hand, and a letter key jumps to that artist.

### Requirement: The tape rack pulls one tape at a time

Tapes SHALL stand spine-out in a rack showing artist and title. Sliding along the spines SHALL pull the tape under the pointer up and turn it to face the shopper while the tape in hand returns to its slot. The rack SHALL take only sideways input, so vertical touch input scrolls the page over it.

#### Scenario: The shopper slides along the rack

- **WHEN** a sideways drag ends over a spine
- **THEN** that tape is pulled out facing the shopper and the previous tape is back in its slot.

#### Scenario: The rack is dormant

- **WHEN** a collection holds fewer than seven Tapes
- **THEN** no tape rack is offered and its Tapes stay in the Grid.

### Requirement: The Crate walks between bins and remembers each

In the Crate, a format choice SHALL walk to that format's bin, and each bin SHALL keep the shopper's place for the visit. All formats, or a format without a bin, SHALL return to the Grid with that filter. Collections without format navigation SHALL offer the same choice through the Crate's own bin row. On Distro the format selection SHALL equal the current bin while the Crate is open.

#### Scenario: The shopper walks between bins

- **GIVEN** the shopper has flipped to the eighth record in the crate
- **WHEN** they choose CDs and then Vinyl 12-inch
- **THEN** the CD bin opens where they left it and the crate returns to the eighth record.

#### Scenario: The shopper chooses a format without a bin

- **WHEN** the shopper chooses All formats or Vinyl 7-inch in the Crate
- **THEN** the Grid returns showing that filter.

### Requirement: The item in hand is its own Store card

The panel beside the bin SHALL be the item in hand's own Store card, so its item link, credit, format, listing price, availability, Buy, Listen and In player state behave exactly as in the Grid. Every other card SHALL leave presentation, focus order and the accessibility tree while the Crate is open, and a polite status message SHALL announce the item in hand.

#### Scenario: The shopper buys from the Crate

- **WHEN** the item in hand is priced and stocked
- **THEN** its Buy action shows at every width and adds it to StoreCart through the card's existing path.

#### Scenario: The shopper listens from the Crate

- **WHEN** the shopper presses the item in hand's Listen
- **THEN** the player opens for that item and focus returns to that Listen when the player closes.

### Requirement: The Crate survives Back and never enters cached pages

The Crate SHALL record its bin, each bin's place and the item in hand in the current history entry without removing the shell's own history state. Returning to that entry SHALL reopen the Crate at the same sleeve without the switch animation. Shell page snapshots SHALL contain no Crate state, and leaving a Store route SHALL release the Crate.

#### Scenario: The shopper returns from an item page

- **WHEN** the shopper opens an item's page from the Crate and presses Back
- **THEN** the collection shows the Crate with the same bin and item in hand.

#### Scenario: A Store route is cached

- **WHEN** the shell caches a Store route while the Crate is open
- **THEN** the cached copy holds the complete Grid with no Crate attribute, sleeve or hand marker.

### Requirement: Crate input stays within its stage

A flip bin SHALL keep vertical touch input for flipping while pinch zoom stays native, and SHALL accept pointer drags with one axis chosen after a short movement. The tape rack SHALL take only horizontal input. Horizontal wheel input over a bin SHALL turn sleeves without scrolling the page or navigating history; vertical wheel input SHALL scroll the page. The Crate SHALL add no document or window listeners and no state on the root element.

#### Scenario: Vertical wheel over a bin

- **WHEN** the shopper scrolls vertically with the pointer over a bin
- **THEN** the page scrolls and no sleeve turns.

#### Scenario: Touch on a phone

- **WHEN** a finger swipes down on the crate at 390 × 844
- **THEN** one sleeve flips without the page scrolling
- **AND** the page still scrolls from outside the bin with the item in hand's Buy reachable.

### Requirement: Crate work stays bounded

The Crate code SHALL load on the shopper's first Crate intent and SHALL stay outside eager bundle graphs. While the Crate is open, each flip or drag frame SHALL write styles only for sleeves within the drawn window around the hand and SHALL animate only transform and opacity. Sleeves SHALL be created when their bin is first visited, never by cloning lazy card images, and only sleeves within the drawn window SHALL request images.

#### Scenario: First Crate press

- **WHEN** the shopper presses Crate for the first time
- **THEN** the Crate code loads once, a press made while it loads opens the Crate exactly once, and no eager bundle grows.

#### Scenario: Flipping through a large bin

- **WHEN** the shopper flips through the 52-record crate
- **THEN** no long task of 50ms or more occurs and only sleeves within the drawn window have image sources.
