# Staff language

Use label members' words in the workspace. Internal service names remain precise and do not become ordinary UI instructions.

| Term                         | Meaning                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Artist                       | Band or performer                                                             |
| Release                      | A BlackBox musical release; may be website-only                               |
| Distro                       | Music distributed for another label                                           |
| Merch                        | Clothing or other merchandise                                                 |
| Format / option              | A sellable version, named concretely, such as Black vinyl LP                  |
| Copies on hand               | Physical music inventory; use units for merch                                 |
| Available online             | Conservative quantity available to checkout; may be lower than copies on hand |
| Draft                        | Never-published editorial work                                                |
| Unpublished changes          | Private changes to a previously published entry                               |
| On the website               | This entry's verified accepted revision                                       |
| Updating website…            | A publication operation is pending                                            |
| Update not confirmed         | The result is uncertain; check status before retrying                         |
| Confirmation email delivered | Email delivery only; says nothing about parcel dispatch                       |

Avoid records, collections, revisions, staging, and Checkout Sessions in routine instructions. Technical reconciliation identifiers remain available in secondary details. Saving a draft, publishing website changes, setting a price and recording stock are distinct effects. Sold out is valid catalog availability, not an error.

Use **Count stock**, **Counting progress**, and **Finish counting** in staff instructions. **Available to buy online** means the quantity customers may buy through the website, not total physical inventory. Use **copies** for music and **units** for merchandise. **Review website changes** discovers saved drafts and lets members publish one or several explicitly selected entries; it is not a price or stock operation.

## Physical-edition tracklists

| Term                     | Definition                                                                          | Aliases to avoid              |
| ------------------------ | ----------------------------------------------------------------------------------- | ----------------------------- |
| **Tracklist** (new)      | Ordered editorial tracks for the physical format of one catalogue entry.            | Song database, playback queue |
| **Track** (new)          | A title and optional known duration at a position within a Side or Disc.            | Recording, Store Item         |
| **Side** (new)           | A letter-labelled playable face of a vinyl record or cassette.                      | Disc, medium                  |
| **Disc** (new)           | One CD within a CD edition, ordered within its Tracklist.                           | Side                          |
| **Track position** (new) | A display label derived from side/disc and authored track order, such as A1 or 2-3. | Track ID                      |
| **Track duration** (new) | An optional known playing time written as minutes and seconds.                      | Estimated runtime             |

### Relationships

- A **Tracklist** has one physical format and ordered **Sides** or **Discs**; each contains ordered **Tracks**.
- These are embedded editorial values without independent identity or commerce authority.
- The Store Item shows only a matching **Tracklist** with at least one **Track**.

### Example dialogue

> Editor: “This vinyl has two Sides, A and B.”
> Developer: “Add Tracks under each Side; their Track positions become A1, A2, B1.”
> Editor: “The CD order differs.”
> Developer: “Its Tracklist belongs to that CD edition; we do not reuse the vinyl side assignment.”

### Flagged ambiguities

A BlackBox **Release** can list several editorial formats, but its Store Item currently sells one selected physical option. A **Tracklist** describes that option's format. A **Track** is not an independently managed Recording or playable embed. A **Side** is not a separate physical disc. Terminology informed by [Discogs](https://support.discogs.com/hc/en-us/articles/360005055373-Database-Guidelines-12-Tracklisting) and [MusicBrainz](https://musicbrainz.org/doc/Medium).
