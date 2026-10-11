## REMOVED Requirements

### Requirement: Store Coverflow uses one shared progressive enhancement contract

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "Store collections offer the Crate only for formats with a bin" and "The Crate survives Back and never enters cached pages".

### Requirement: Store Coverflow supports discrete touch swipe navigation

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "Crate input stays within its stage" and "A flip bin turns one sleeve per gesture".

### Requirement: Store Coverflow supports intentional wheel navigation

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "Crate input stays within its stage": horizontal wheel turns sleeves, vertical wheel scrolls the page.

### Requirement: Store Coverflow keeps native keyboard and link behavior

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "A flip bin turns one sleeve per gesture" for keys and "The item in hand is its own Store card" for links.

### Requirement: Store Coverflow interaction work remains bounded

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "Crate work stays bounded".

### Requirement: Store Coverflow presents one shared actionable cover cue

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Sleeves are buttons with visible focus inside the Crate; the item in hand keeps its own card link cue.

### Requirement: Store Coverflow isolates consumed wheel input from page scrolling

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "Crate input stays within its stage".

### Requirement: Store Coverflow switches views with one glyph switch

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "Store collections offer the Crate only for formats with a bin" for the Grid | Crate switch.

### Requirement: The Coverflow front card shows its price row

**Reason**: Store Coverflow is replaced by the Store Crate.

**Migration**: Use `store-crate-browsing` "The item in hand is its own Store card".
