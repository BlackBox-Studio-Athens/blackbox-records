# Decap collection field matrix

Task 1.5 baseline captured from required worktree HEAD `4de0f64712d92c198a693f294056ca0650593720` on July 22, 2026. This is evidence only: mismatches and unused data below are not fixes.

## Reading guide

- Decap fields are sourced from `apps/web/src/lib/admin/decap-*.ts`; fields are required unless marked `required: false`.
- Astro contracts are sourced from `apps/web/src/content.config.ts`.
- Committed-shape evidence is from `apps/web/src/content/**` at the recorded HEAD.
- Public consumers are current static-site queries, routes, or components. Admin previews are not counted as public consumers.
- Every JSON collection includes a hidden required Decap `$schema` field with a collection-specific default. No Astro `z.object` declares `$schema`; committed JSON retains it, while public consumers use only parsed schema data.
- Markdown `body` is loader-owned document body, not a frontmatter property in the collection `z.object`.

## Current collection order and storage

| Decap collection | Collection options                                                                                           | Committed storage                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `home`           | fixed file; `create: false`; `delete: false`; JSON; local media `.` / `./`                                   | `apps/web/src/content/home/site.json`                |
| `about`          | fixed file; `create: false`; `delete: false`; JSON; local media `.` / `./`                                   | `apps/web/src/content/about/site.json`               |
| `distro-page`    | fixed file; `create: false`; `delete: false`; JSON                                                           | `apps/web/src/content/distro-page/site.json`         |
| `services`       | fixed file; `create: false`; `delete: false`; JSON; local media `.` / `./`                                   | `apps/web/src/content/services/site.json`            |
| `newsletter`     | fixed file; `create: false`; `delete: false`; JSON                                                           | `apps/web/src/content/newsletter/site.json`          |
| `settings`       | fixed file; `create: false`; `delete: false`; JSON                                                           | `apps/web/src/content/settings/site.json`            |
| `navigation`     | folder; `create: false`; `delete: false`; JSON; summary `{{title}} -> {{url}}`                               | seven files under `apps/web/src/content/navigation/` |
| `socials`        | folder; `create: true`; `delete: true`; JSON; summary `{{title}}`                                            | four files under `apps/web/src/content/socials/`     |
| `artists`        | folder; `create: true`; `delete: true`; Markdown frontmatter; slug `{{fields.slug}}`; local media `.` / `./` | three files under `apps/web/src/content/artists/`    |
| `releases`       | folder; `create: true`; `delete: true`; Markdown frontmatter; local media `.` / `./`                         | three files under `apps/web/src/content/releases/`   |
| `distro`         | folder; `create: true`; `delete: true`; JSON; local media `.` / `./`                                         | 101 files under `apps/web/src/content/distro/`       |
| `news`           | folder; `create: true`; `delete: true`; Markdown frontmatter; local media `.` / `./`                         | three files under `apps/web/src/content/news/`       |

## Home

Public query: `getHomeContent()` in `apps/web/src/lib/site-data.ts`. Public route: `apps/web/src/pages/index.astro`.

| Decap path / type / options                                                                           | Astro schema                                   | Committed representation               | Current public consumer / finding                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$schema` / hidden / default `home.schema.json`                                                       | no schema field                                | top-level string                       | no public consumer; editor metadata only                                                                                                                 |
| `hero` / object / collapsed, tagline summary                                                          | required object                                | one object                             | `index.astro` passes fields to `HomeHero`                                                                                                                |
| `hero.tagline` / string                                                                               | required string                                | string                                 | `HomeHero` tagline                                                                                                                                       |
| `hero.image` / image                                                                                  | required `image()`                             | relative `./hero-live-band.jpg`        | `HomeHero` background image                                                                                                                              |
| `hero.image_alt` / string                                                                             | required string                                | string                                 | `HomeHero` alt text                                                                                                                                      |
| `hero.scroll_indicator_text` / string                                                                 | required string                                | string                                 | `HomeHero` scroll cue                                                                                                                                    |
| `sections` / typed list / collapsed; `typeKey: type`; variants `news`, `artists`, `distro`, `journey` | required array of matching discriminated union | two entries: one `news`, one `artists` | `getContentSection()` selects first matching `news` and `artists`; array order, duplicates, `distro`, and `journey` are not rendered by current homepage |
| `sections[].type` / implicit typed-list discriminator                                                 | required literals                              | `news`, `artists`                      | selector only; `distro` and `journey` remain accepted by CMS/schema but have no committed entry or public consumer                                       |
| `sections[news].section_label` / string                                                               | required string                                | `News`                                 | no public consumer; homepage renders title and CTA only                                                                                                  |
| `sections[news].title` / string                                                                       | required string                                | `News`                                 | homepage section heading                                                                                                                                 |
| `sections[news].link_text` / string                                                                   | required string                                | `Read News`                            | homepage CTA label                                                                                                                                       |
| `sections[news].link_url` / string                                                                    | required string                                | `/news/`                               | homepage CTA href via `createProjectRelativeUrl()`; no schema/Decap path pattern                                                                         |
| `sections[artists].section_label` / string                                                            | required string                                | `Artists`                              | no public consumer; homepage renders title and CTA only                                                                                                  |
| `sections[artists].title` / string                                                                    | required string                                | `Artists`                              | homepage section heading                                                                                                                                 |
| `sections[artists].button_text` / string                                                              | required string                                | `View Full Roster`                     | homepage CTA label                                                                                                                                       |
| `sections[artists].button_link` / string                                                              | required string                                | `/artists/`                            | homepage CTA href; no schema/Decap path pattern                                                                                                          |
| `sections[distro].section_label` / string                                                             | required string                                | absent: no `distro` entry              | no public consumer                                                                                                                                       |
| `sections[distro].title` / string                                                                     | required string                                | absent                                 | no public consumer                                                                                                                                       |
| `sections[distro].link_text` / string                                                                 | required string                                | absent                                 | no public consumer                                                                                                                                       |
| `sections[distro].link_url` / string                                                                  | required string                                | absent                                 | no public consumer                                                                                                                                       |
| `sections[journey].section_label` / string                                                            | required string                                | absent: no `journey` entry             | no public consumer                                                                                                                                       |
| `sections[journey].title` / string                                                                    | required string                                | absent                                 | no public consumer                                                                                                                                       |
| `sections[journey].image` / image                                                                     | required `image()`                             | absent                                 | no public consumer                                                                                                                                       |
| `sections[journey].image_alt` / string                                                                | required string                                | absent                                 | no public consumer                                                                                                                                       |
| `sections[journey].paragraphs` / list, collapsed, scalar `value` text items                           | required string array                          | absent                                 | no public consumer                                                                                                                                       |
| `sections[journey].stats` / list, collapsed, label summary                                            | required object array                          | absent                                 | no public consumer                                                                                                                                       |
| `sections[journey].stats[].key` / string                                                              | required string                                | absent                                 | no public consumer                                                                                                                                       |
| `sections[journey].stats[].label` / string                                                            | required string                                | absent                                 | no public consumer                                                                                                                                       |

Baseline finding: CMS permits structural add/remove/reorder for `sections`, while public rendering resolves fixed known types and ignores list order. Two exposed variants have no current render path.

## About

Public query/route: `getAboutContent()` and `apps/web/src/pages/about/index.astro`.

| Decap path / type / options                                                                | Astro schema                       | Committed representation                   | Current public consumer / finding                                                        |
| ------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `$schema` / hidden                                                                         | no schema field                    | top-level string                           | no public consumer                                                                       |
| `hero` / object / collapsed, title summary                                                 | required object                    | one object                                 | `InternalPageHero`                                                                       |
| `hero.section_label` / string                                                              | required string                    | `About`                                    | hero eyebrow                                                                             |
| `hero.title` / string                                                                      | required string                    | `The Label`                                | hero title                                                                               |
| `hero.image` / image                                                                       | required `image()`                 | bare collection-relative filename          | hero image                                                                               |
| `hero.image_alt` / string                                                                  | required string                    | string                                     | hero alt text                                                                            |
| `sections` / typed list / collapsed; variants `lead`, `story`, `quote`, `contact`, `stats` | required discriminated-union array | lead, story, contact, stats; no quote      | route selects first entry of each type; order and duplicates are ignored                 |
| `sections[].type` / implicit discriminator                                                 | required literals                  | four of five variants                      | selects public block; `quote` has a consumer but no committed entry                      |
| `sections[lead].text` / text                                                               | required string                    | one paragraph                              | opening display paragraph                                                                |
| `sections[story].title` / string                                                           | required string                    | `Philosophy`                               | story heading                                                                            |
| `sections[story].paragraphs` / list of text `value`                                        | required string array              | one paragraph                              | mapped to paragraphs in order                                                            |
| `sections[quote].text` / text                                                              | required string                    | absent                                     | implemented blockquote consumer                                                          |
| `sections[quote].cite` / string                                                            | required string                    | absent                                     | implemented citation consumer                                                            |
| `sections[contact].title` / string                                                         | required string                    | `Contact`                                  | contact heading                                                                          |
| `sections[contact].intro` / text                                                           | required string                    | string                                     | contact intro                                                                            |
| `sections[contact].items` / list, collapsed, label/value summary                           | required object array              | three rows                                 | contact list                                                                             |
| `sections[contact].items[].label` / string                                                 | required string                    | strings                                    | visible row label                                                                        |
| `sections[contact].items[].value` / string                                                 | required string                    | email strings                              | displayed value and unconditional `mailto:` href; schema/CMS do not require email format |
| `sections[stats].items` / list, collapsed                                                  | required object array              | four rows                                  | stat cards                                                                               |
| `sections[stats].items[].key` / string                                                     | required string                    | `artists`, `releases`, `countries`, `year` | magic-key switch computes values; unknown strings are schema-valid but render blank      |
| `sections[stats].items[].label` / string                                                   | required string                    | strings                                    | stat labels                                                                              |

Baseline finding: outer section controls allow structural changes that the first-by-type renderer does not honor as arbitrary layout. `stats.key` is an unconstrained string despite four supported runtime values.

## Services

Public query/route: `getServicesContent()` and `apps/web/src/pages/services/index.astro`; inquiry props also flow through `AppShell.astro` → `ShellPortalOutlets.tsx` → `ServicesInquiryForm.tsx`.

| Decap path / type / options                                                    | Astro schema                       | Committed representation         | Current public consumer / finding                                                           |
| ------------------------------------------------------------------------------ | ---------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| `$schema` / hidden                                                             | no schema field                    | top-level string                 | no public consumer                                                                          |
| `hero` / object / collapsed                                                    | required object                    | one object                       | Services intro block                                                                        |
| `hero.title` / string                                                          | required string                    | `Services`                       | page heading                                                                                |
| `hero.intro` / text                                                            | required string                    | string                           | intro copy                                                                                  |
| `hero.cta_text` / string                                                       | required string                    | `Start an Inquiry`               | anchor CTA label                                                                            |
| `sections` / typed list / collapsed; variants `services`, `process`, `inquiry` | required discriminated-union array | exactly one of each              | route selects first by type; order/duplicates ignored although CMS permits structural edits |
| `sections[].type` / implicit discriminator                                     | required literals                  | `services`, `process`, `inquiry` | block selector                                                                              |
| `sections[services].items` / list, collapsed, title summary                    | required object array              | three services                   | rendered in stored order; no schema/CMS minimum                                             |
| `items[].id` / string                                                          | required string                    | kebab-case strings               | article `id`; CMS hint only, no runtime pattern                                             |
| `items[].title` / string                                                       | required string                    | strings                          | headings and inquiry preselection value                                                     |
| `items[].image` / image                                                        | required `image()`                 | bare filenames                   | service imagery                                                                             |
| `items[].image_alt` / string                                                   | required string                    | strings                          | image alt text                                                                              |
| `items[].summary` / text                                                       | required string                    | strings                          | service copy                                                                                |
| `items[].bullets` / list of string `value`                                     | required string array, `.min(2)`   | three per service                | rendered list; Decap has no `min`, so one-item saves fail Astro validation                  |
| `items[].contact_note` / text                                                  | required string                    | strings                          | inquiry nudge                                                                               |
| `items[].partner_name` / optional string                                       | optional string                    | only Vinyl Printing              | rendered only when `partner_url` is also present; fields are independently optional         |
| `items[].partner_url` / optional string                                        | optional `z.url()`                 | one HTTPS URL                    | partner link; Decap has no URL constraint                                                   |
| `sections[process].title` / string                                             | required string                    | string                           | process heading                                                                             |
| `sections[process].intro` / text                                               | required string                    | string                           | process intro                                                                               |
| `sections[process].steps` / list, collapsed                                    | required object array, `.min(3)`   | three steps                      | cards in order; Decap has no `min`, so fewer than three fail Astro validation               |
| `steps[].title` / string                                                       | required string                    | strings                          | step headings                                                                               |
| `steps[].body` / text                                                          | required string                    | strings                          | step copy                                                                                   |
| `sections[inquiry].title` / string                                             | required string                    | string                           | inquiry heading                                                                             |
| `sections[inquiry].intro` / text                                               | required string                    | string                           | inquiry intro                                                                               |
| `sections[inquiry].email` / string                                             | required `z.email()`               | one email                        | noscript mailto and React form recipient; Decap has no email constraint                     |
| `sections[inquiry].submit_text` / string                                       | required string                    | `Compose Inquiry`                | React inquiry submit label via persistent app shell                                         |

## Newsletter

Public query/component: `getNewsletterContent()` and `NewsletterSignup.astro`; currently mounted on Home and About.

| Decap path / type / options | Astro schema    | Committed representation | Current public consumer / finding |
| --------------------------- | --------------- | ------------------------ | --------------------------------- |
| `$schema` / hidden          | no schema field | top-level string         | no public consumer                |
| `section_label` / string    | required string | `Newsletter`             | signup eyebrow                    |
| `title` / string            | required string | `Join the Collective`    | signup heading                    |
| `description` / text        | required string | string                   | signup copy                       |
| `placeholder` / string      | required string | `your@email.com`         | email input placeholder           |
| `button_label` / string     | required string | `Subscribe`              | submit button                     |
| `note` / text               | required string | string                   | note below form                   |

## Distro Page

Public query/component: `getDistroPageContent()` and `StoreDistroCatalog.astro` on `/store/distro/`.

| Decap path / type / options         | Astro schema                                    | Committed representation                    | Current public consumer / finding                                                        |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `$schema` / hidden                  | no schema field                                 | top-level string                            | no public consumer                                                                       |
| `page_title` / string               | required string                                 | `Distro`                                    | no current public consumer; Store route metadata comes from Store category configuration |
| `page_description` / text           | required string                                 | string                                      | no current public consumer                                                               |
| `hero` / object / collapsed         | required object                                 | one object                                  | partial use in Distro orientation panel                                                  |
| `hero.section_label` / string       | required string                                 | `Distro`                                    | no current public consumer; panel eyebrow is hard-coded `Store shelf`                    |
| `hero.title` / string               | required string                                 | `Distro`                                    | orientation heading                                                                      |
| `hero.intro` / text                 | required string                                 | string                                      | orientation copy                                                                         |
| `group_intros` / object / collapsed | required `z.record(z.enum(groups), z.string())` | object with all seven configured group keys | active group intro lookup                                                                |
| `group_intros.Vinyl 12-inch` / text | required record value                           | string                                      | rendered for active 12-inch group                                                        |
| `group_intros.Vinyl 10-inch` / text | required record value                           | string                                      | rendered for active 10-inch group                                                        |
| `group_intros.Vinyl 7-inch` / text  | required record value                           | string                                      | rendered for active 7-inch group                                                         |
| `group_intros.CDs` / text           | required record value                           | string                                      | rendered for active CD group                                                             |
| `group_intros.Clothes` / text       | required record value                           | string                                      | consumer exists; no committed Distro item currently uses Clothes                         |
| `group_intros.Tapes` / text         | required record value                           | string                                      | rendered for active Tapes group                                                          |
| `group_intros.Other` / text         | required record value                           | string                                      | consumer exists; no committed Distro item currently uses Other                           |

## Site Settings

Public query: `getLabelSettings()`. Consumers: `SiteLayout.astro`, `Footer.astro`, `AppShell.astro`, and About year calculation.

| Decap path / type / options                             | Astro schema              | Committed representation | Current public consumer / finding                                                                         |
| ------------------------------------------------------- | ------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `$schema` / hidden                                      | no schema field           | top-level string         | no public consumer                                                                                        |
| `label_name` / string                                   | required string           | `Blackbox Records`       | Organization name, footer label, mobile-menu subtitle                                                     |
| `established_year` / number, integer, Decap `min: 1900` | required positive integer | `2026`                   | JSON-LD founding date, footer copyright/Est., About years active; Decap is stricter than Astro below 1900 |
| `url` / string                                          | required `z.url()`        | absolute HTTPS URL       | Organization JSON-LD URL; Decap has no URL constraint                                                     |
| `logo` / string                                         | required string           | root-relative asset path | Organization JSON-LD logo URL; footer uses a separate imported logo asset                                 |
| `location` / object / collapsed                         | required object           | locality/country object  | JSON-LD postal address                                                                                    |
| `location.locality` / string                            | required string           | `Athens`                 | `addressLocality`                                                                                         |
| `location.country` / string                             | required string           | `Greece`                 | `addressCountry`                                                                                          |

## Navigation

Public query: `getNavigationItems()` sorts by `order`, then `title`; header/footer selectors filter flags.

| Decap path / type / options                                   | Astro schema                 | Committed representation                                                 | Current public consumer / finding                                                  |
| ------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `$schema` / hidden                                            | no schema field              | string in every entry                                                    | no public consumer                                                                 |
| `title` / string                                              | required string              | seven strings                                                            | desktop/mobile header and footer labels; sort tie-breaker                          |
| `url` / string                                                | required string              | root-relative paths                                                      | href, active-route checks, shell routing; no path/URL constraint in Decap or Astro |
| `order` / number, integer, `min: 0`                           | required nonnegative integer | integers; duplicate order `1` exists for hidden News and visible Artists | sort key; title resolves ties                                                      |
| `show_in_header` / boolean, `required: false`, default `true` | required boolean             | explicit in all seven files                                              | header/mobile inclusion; removing optional CMS value would fail Astro schema       |
| `show_in_footer` / boolean, `required: false`, default `true` | required boolean             | explicit in all seven files                                              | footer inclusion; same optional-vs-required mismatch                               |

## Socials

Public query: `getSocialItems()` sorts by `order`, then `title`. Consumers: Footer icons, Organization `sameAs`, and the PRD holding page Instagram link.

| Decap path / type / options         | Astro schema                 | Committed representation          | Current public consumer / finding                                                    |
| ----------------------------------- | ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `$schema` / hidden                  | no schema field              | string in every entry             | no public consumer                                                                   |
| `title` / string                    | required string              | four platform names               | icon selection, accessible label/title, sort tie-breaker                             |
| `url` / string                      | required string              | three HTTPS URLs and Bandcamp `#` | Footer and JSON-LD filter blank/`#`; CMS hint says full HTTPS but schema accepts `#` |
| `order` / number, integer, `min: 0` | required nonnegative integer | `1` through `4`                   | public ordering                                                                      |

## Artists

Public query/paths: `listArtistProfiles()`, `createArtistDetailStaticPaths()`, `sitemap.xml.ts`; public cards, full detail route, and overlay use the entry.

| Decap path / type / options                               | Astro schema                                      | Committed representation                                                                 | Current public consumer / finding                                                               |
| --------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `title` / string                                          | required string                                   | frontmatter in all three files                                                           | cards, detail heading/metadata, sorting, release artist display                                 |
| `slug` / string with Decap kebab-case pattern             | required unconstrained string                     | frontmatter in all three; one file is `mass-culture.md` while stored slug is `afterwise` | artist static path, links, sitemap, overlay identity; Astro does not enforce Decap slug pattern |
| `genre` / string                                          | required string                                   | all three                                                                                | cards, roster search data, detail kicker                                                        |
| `country` / optional string                               | optional string                                   | all three                                                                                | roster search data, detail kicker, About country count                                          |
| `image` / image                                           | required `image()`                                | mixed `./filename` and bare filename frontmatter                                         | cards, detail, page metadata                                                                    |
| `image_alt` / optional string                             | optional string                                   | all three                                                                                | image/page metadata alt with title fallback                                                     |
| `bio` / text                                              | required string                                   | all three                                                                                | cards, search data, detail fallback, page description                                           |
| `profile_links` / optional list, collapsed, label summary | optional object array                             | all three; one or two links                                                              | detail profile navigation                                                                       |
| `profile_links[].label` / string                          | required string                                   | platform names                                                                           | visible label and icon selection                                                                |
| `profile_links[].url` / string                            | required `z.url()`                                | absolute URLs                                                                            | detail href; Decap has no URL constraint                                                        |
| `videos` / optional list, collapsed, title summary        | optional object array                             | only Afterwise                                                                           | artist detail video grid                                                                        |
| `videos[].title` / string                                 | required string                                   | one value                                                                                | iframe title and card title                                                                     |
| `videos[].youtube_video_id` / string                      | required 11-character regex                       | one value                                                                                | YouTube-nocookie embed URL; Decap hint only, no pattern                                         |
| `videos[].description` / optional text                    | optional string                                   | one value                                                                                | video description                                                                               |
| `upcoming_release` / optional string                      | optional string                                   | present once as empty string                                                             | detail callout only after trimming and excluding empty/current-title values                     |
| `section_label` / optional string                         | optional string                                   | absent from all three                                                                    | no current public consumer                                                                      |
| `body` / optional Markdown                                | no frontmatter schema field; loader document body | non-empty only in `mass-culture.md`                                                      | `render(artist)` in detail/overlay; overrides Bio as main story when present                    |

## Releases

Public query/paths: `listReleaseCatalog()`, detail and overlay routes, release cards, artist discography, music player, and Store Item projection.

| Decap path / type / options                          | Astro schema                                        | Committed representation            | Current public consumer / finding                                                                                                        |
| ---------------------------------------------------- | --------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `title` / string                                     | required string                                     | all three frontmatters              | release pages/cards, Store Item title, metadata                                                                                          |
| `artist` / build-time select options                 | required `reference('artists')`                     | artist identity string in all three | artist resolution, display, artist filtering/routes; CMS options can lag newly added artists until config rebuild                        |
| `release_date` / datetime, `YYYY-MM-DD`, no time     | required `z.coerce.date()`                          | ISO date-only strings               | sorting/latest/upcoming, display, metadata, Store Item metadata                                                                          |
| `cover_image` / image                                | required `image()`                                  | bare filenames                      | cards/detail/page metadata; Store Item may use hard-coded visual override                                                                |
| `cover_image_alt` / optional string                  | optional string                                     | all three                           | image/page alt with title fallback                                                                                                       |
| `merch_url` / optional string                        | optional unconstrained string                       | `/store/` in all three              | fallback commerce link only if native Store Item is unavailable; CMS hint asks for `https://`, while committed values are internal paths |
| `bandcamp_embed_url` / optional string               | optional custom canonical Bandcamp embed refinement | all three                           | player provider on cards/detail/shell                                                                                                    |
| `tidal_url` / optional string                        | optional custom Tidal URL refinement                | two of three                        | optional Tidal player provider                                                                                                           |
| `summary` / optional text                            | optional string                                     | all three                           | cards/detail/page metadata/Store Item summary                                                                                            |
| `formats` / optional list, collapsed, scalar `value` | optional string array                               | all three                           | badges, list metadata, artist discography, Store Item slug/metadata and physical-edition projection                                      |
| `credits` / optional list, collapsed, role summary   | optional object array                               | all three                           | detail credits section                                                                                                                   |
| `credits[].role` / string                            | required string                                     | all entries                         | credit label                                                                                                                             |
| `credits[].name` / string                            | required string                                     | all entries                         | credit value                                                                                                                             |

## Distro Store Items

Public query/projection: `listDistroEntries()`, `createStoreItemFromDistroEntry()`, `listStoreCollectionEntries()`, `StoreDistroCatalog.astro`, `DistroCard.astro`, and Store Item routes.

| Decap path / type / options                               | Astro schema                       | Committed representation                                                             | Current public consumer / finding                                                          |
| --------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `$schema` / hidden                                        | no schema field                    | string in all 101 entries                                                            | no public consumer                                                                         |
| `title` / string                                          | required string                    | present/non-empty in 101                                                             | card/detail title, search, Store Item identity                                             |
| `group` / select with seven duplicated options            | required enum of same seven values | 55 Vinyl 12-inch, 1 Vinyl 10-inch, 2 Vinyl 7-inch, 39 CDs, 4 Tapes; no Clothes/Other | grouping, category membership, search, metadata; options and schema are duplicated sources |
| `artist_or_label` / string                                | required string                    | present/non-empty in 101                                                             | subtitle, search, catalog identity                                                         |
| `image` / image                                           | required `image()`                 | 101 bare filenames                                                                   | card/detail image                                                                          |
| `image_alt` / string                                      | required string                    | present/non-empty in 101                                                             | card/detail alt                                                                            |
| `summary` / text                                          | required string                    | present/non-empty in 101                                                             | card/detail/Store Item summary                                                             |
| `eyebrow` / optional string                               | optional string                    | key present in 79; absent in 22; two present values are empty strings                | card metadata/Store Item eyebrow after falsey normalization                                |
| `format` / optional string                                | optional string                    | present/non-empty in all 101 despite optional contract                               | card/search/Store Item metadata and physical-edition projection                            |
| `release_date` / optional datetime, `YYYY-MM-DD`, no time | optional coerced date              | present in 97, absent in 4                                                           | Store Item month/year metadata; no direct Distro card date line                            |
| `order` / number, integer, `min: 0`                       | required nonnegative integer       | present in 101; duplicate values exist within Vinyl 12-inch                          | sort within group; title is deterministic tie-breaker in `sortDistroEntries()`             |

## News

Public query/paths: `listNewsArticles()`, homepage/news cards, detail and overlay routes, page metadata, and sitemap.

| Decap path / type / options              | Astro schema                                      | Committed representation                       | Current public consumer / finding                                                 |
| ---------------------------------------- | ------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `title` / string                         | required string                                   | all three frontmatters                         | cards, detail hero, page metadata                                                 |
| `date` / datetime, `YYYY-MM-DD`, no time | required `z.coerce.date()`                        | date-only strings                              | sorting, cards/detail display, article metadata                                   |
| `summary` / text                         | required string                                   | all three                                      | cards, detail lead, page description                                              |
| `image` / image                          | required `image()`                                | one bare filename; two `../releases/...` paths | cards/detail/page metadata                                                        |
| `image_alt` / optional string            | optional string                                   | all three                                      | image/page alt with title fallback                                                |
| `section_label` / optional string        | optional string                                   | all three                                      | detail hero only; listing cards ignore it                                         |
| `body` / required Markdown               | no frontmatter schema field; loader document body | body in all three; one body is only `.`        | `render(item)` in detail/overlay; no schema constraint on meaningful body content |

## Cross-collection baseline findings

1. Hidden `$schema` is a Decap/committed JSON field outside every corresponding Astro schema and has no public consumer.
2. Home `distro` and `journey` variants are exposed and schema-valid but absent from committed Home content and unrendered. Home `news.section_label` and `artists.section_label` are committed but unrendered.
3. Distro Page `page_title`, `page_description`, and `hero.section_label` are committed and schema-valid but unconsumed by current public Store rendering.
4. Artist `section_label` has no committed value or public consumer.
5. Fixed-layout Home, About, and Services outer lists permit add/remove/reorder, while public routes select the first section of each known type and do not honor arbitrary block order.
6. Decap lacks Astro cardinality constraints for Services bullets (`min 2`) and process steps (`min 3`), and lacks several Astro URL/email/YouTube constraints.
7. Navigation visibility booleans are optional with defaults in Decap but required in Astro; all committed entries currently provide both.
8. Release `merch_url` guidance expects a full external URL, while committed values are internal `/store/` paths and Astro permits any string.
9. Social URL guidance expects HTTPS, while committed Bandcamp uses `#`; public consumers explicitly filter that value.
10. Distro group choices are duplicated between Decap and Astro. Current content uses five of seven values; all 101 entries carry optional `format`, while `eyebrow` and `release_date` have mixed presence.
11. Markdown `body` for Artists and News is intentionally outside frontmatter schemas. It is publicly consumed through Astro `render()`, but News CMS requiredness is not represented by an Astro schema constraint.
