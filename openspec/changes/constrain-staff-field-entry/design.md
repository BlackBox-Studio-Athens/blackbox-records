## Context

The content editor form uses `noValidate`, so the browser's `type`, `min` and `max` hints do not stop anyone entering a value there. Zod validation reports problems only after entry. `CountryPicker` and `TracklistFields` already constrain entry; this change applies the same approach to the remaining closed-set fields.

## Decisions

| Field                                       | Control                                                                                                       | Enforcement                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| About fact key                              | Select of `ABOUT_STAT_KEYS`                                                                                   | `z.enum`                                              |
| About contact value                         | Email input                                                                                                   | `z.email()`, because the site renders it as `mailto:` |
| Social title                                | Select of `SOCIAL_PLATFORMS` (the footer icon set)                                                            | `z.enum`                                              |
| Social URL                                  | Hide this link checkbox that writes `#`; otherwise an HTTPS input                                             | Existing refine                                       |
| Navigation URL, Home news and artists links | Select of `SITE_PAGES`                                                                                        | `z.enum(SITE_PAGE_PATHS)`                             |
| Settings country                            | Single-choice searchable `CountryPicker`                                                                      | Exactly one recognized country                        |
| Services id                                 | Normalized to lowercase-hyphen form while typing                                                              | Slug regex plus unique ids                            |
| Bandcamp player                             | Accepts Share/Embed code or a player src, and stores the canonical src                                        | Existing refine                                       |
| Row counts                                  | Add and Remove are disabled at the schema bounds                                                              | Existing min/max                                      |
| Tracklist                                   | Duration keystrokes must keep the text a prefix of m:ss; side letters already in use are disabled             | Existing schema                                       |
| EUR amounts                                 | Keystrokes must keep the text a prefix of an accepted amount                                                  | Existing `euroMinor`                                  |
| Stock change                                | Online ≤ counted; notes ≤ 500 characters; searches ≤ 200 characters; removal keeps its existing preview guard | Existing Worker rules                                 |
| Stock reason                                | Labels typed from the generated API type; restored pending changes parse as the same closed set               | `z.enum` on the request body                          |

- If pasted text cannot be parsed, it is kept as the raw draft value so that validation reports it. Private drafts may be incomplete; publication rejects them.
- Stock history keeps `reason: string`, because recorded rows may contain older reasons or reasons written by the system.
- Open-set labels remain free text, because new values are legitimate and current data does not fit a closed list.

## Risks / Trade-offs

- A hosted entry with a value outside the new sets cannot be saved or published until staff correct it in the new controls. Inventory such entries before the next promotion, following the Free-tier rule.
- `SITE_PAGES` needs a new entry whenever a new public page ships.

## Migration Plan

No data migration is needed; Local seeds already conform. To roll back, revert the schema and UI changes together.
