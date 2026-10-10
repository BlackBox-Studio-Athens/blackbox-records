## ADDED Requirements

### Requirement: Store Crate terms are canonical

The system SHALL use `Store Crate`, shown to shoppers as Crate, for the per-format browsing view of a Store collection, and SHALL keep it distinct from the Artists roster's crate index.

#### Scenario: Crate parts are named

- **WHEN** specs, code, tests, docs or UI copy describe the Store Crate
- **THEN** `bin` names one format's place in it: the `crate` for Vinyl 12-inch, the `CD bin` for CDs and the `tape rack` for Tapes
- **AND** `sleeve` names one item standing in a flip bin, `pile` the sleeves flipped forward, `back board` the end of a flip bin, and `item in hand` the item the shopper is looking at
- **AND** `Coverflow` no longer names any Store browsing view.
