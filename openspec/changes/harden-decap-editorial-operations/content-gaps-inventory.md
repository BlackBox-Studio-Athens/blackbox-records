# Decap editorial content gaps inventory

Task 1.8 baseline captured from required worktree HEAD `f6d7b1d9a9af3982ff11e9f20b4789faf86a7ec5` on July 22, 2026. This is evidence only: no config, schema, content, image, preview, test, or runtime fix is included.

## Method and counting rules

- The 12 configured Decap collections and their fields were reconciled against `collection-field-matrix.md`, the builders under `apps/web/src/lib/admin/`, `apps/web/src/content.config.ts`, committed content, and current public routes/components.
- A **field contract** is one editable stored path in one collection. Repeated committed entries count separately only in the image-instance inventory.
- A **public consumer** is a static-site query, route, layout, or component. Decap previews are editor-only and do not count as public consumers, matching the task 1.5 matrix rule (`collection-field-matrix.md:7-12`).
- A **missing alt value** is absent or blank. A **model gap** means an image can be committed without alt text because Decap and Astro both mark the sibling alt field optional. Identity-only text is recorded separately as a quality-review candidate rather than reclassified as missing.
- Settings `logo` is excluded from key rendered imagery: it is a string path, not a Decap image widget (`decap-settings-fields.ts:22-29`), and its only current consumer is Organization JSON-LD (`SiteLayout.astro:60,125-132`).

## Key public image and alt-text inventory

Every configured Decap image widget has a sibling alt-text field. Active committed content contains 115 key image instances and 115 non-blank alt values; no current key image is missing alt text.

| Collection / field | Decap and Astro model | Current instances | Baseline finding | Public consumer evidence |
| --- | --- | ---: | --- | --- |
| Home `hero.image` / `hero.image_alt` | both required | 1 | non-blank, scene-oriented alt | `pages/index.astro:17-27` |
| Home `sections[journey].image` / `image_alt` | both required | 0 | paired model exists, but the whole Journey variant is dormant | builder `decap-home-fields.ts:141-163`; schema `content.config.ts:207-218` |
| About `hero.image` / `hero.image_alt` | both required | 1 | non-blank | `pages/about/index.astro:22-29` |
| Services `sections[services].items[].image` / `image_alt` | both required | 3 | all three non-blank and scene-oriented | `pages/services/index.astro:45-56` |
| Artists `image` / `image_alt` | image required; alt optional in Decap and Astro | 3 | all three values are non-blank, but a newly saved entry may omit alt and public rendering falls back to the Artist title | builder `decap-artist-collection.ts:44-55`; schema `content.config.ts:23-24`; consumer `ArtistDetailContent.astro:61-68` |
| Releases `cover_image` / `cover_image_alt` | image required; alt optional in Decap and Astro | 3 | all three values are non-blank, but a newly saved entry may omit alt and public rendering falls back to Release title | builder `decap-release-collection.ts:32-43`; schema `content.config.ts:55-56`; consumer `ReleaseDetailContent.astro:35-43` |
| Distro Store Items `image` / `image_alt` | both required | 101 | all 101 values are present and non-blank; values identify the product, format/front view, artwork mockup, or visible fallback object | builder `decap-distro-collection.ts:40-50`; schema `content.config.ts:103-104`; consumer `DistroCard.astro:35-38,65-70` |
| News `image` / `image_alt` | image required; alt optional in Decap and Astro | 3 | all three values are non-blank, but a newly saved entry may omit alt and public rendering falls back to article title | builder `decap-news-collection.ts:26-37`; schema `content.config.ts:80-81`; consumer `NewsDetailContent.astro:29-38` |

### Alt-text counts and gaps

- Active image instances: **115** = Home 1 + About 1 + Services 3 + Artists 3 + Releases 3 + Distro Store Items 101 + News 3.
- Missing or blank committed alt values: **0**.
- Configured image widgets with no sibling alt-text model: **0 of 8**. The eighth pair is dormant Home Journey imagery.
- Optional active alt field contracts: **3** (`artists.image_alt`, `releases.cover_image_alt`, `news.image_alt`), covering **9** current entries. Runtime title fallbacks prevent an empty HTML `alt`, but do not enforce editor-authored descriptive text.
- Required active alt field contracts: **4**, covering **106** current instances. Home Journey is required but has no current instance.

### Identity-only quality-review candidates

These eight values are present and non-blank, so they are not missing-content defects. Visual inspection shows that they identify the entity or location without describing the visible scene/artwork requested by the current Decap hint. Later collection tasks can decide exact replacement copy.

| Entry | Current alt | Visible image baseline |
| --- | --- | --- |
| About `site.json` | `BlackBox Records Studio` | illuminated BlackBox sign on a dark wall (`content/about/site.json:4-7`) |
| Artist `chronoboros.md` | `Chronoboros` | black-and-white samurai-mask illustration (`content/artists/chronoboros.md:6-7`) |
| Artist `mass-culture.md` / Afterwise | `Afterwise` | band performing on a black-and-white stage (`content/artists/mass-culture.md:6-7`) |
| Artist `ouranopithecus.md` | `Ouranopithecus` | three band members posed among trees (`content/artists/ouranopithecus.md:6-7`) |
| Release `anarchotribal.md` | `Anarchotribal by Ouranopithecus` | monochrome rider on horseback with magenta title treatment (`content/releases/anarchotribal.md:5-6`) |
| Release `caregivers.md` | `Caregivers by Chronoboros` | cropped black samurai-mask illustration on a pale field (`content/releases/caregivers.md:5-6`) |
| Release `disintegration.md` | `Disintegration by Afterwise` | red, orange, and black distressed abstract artwork (`content/releases/disintegration.md:5-6`) |
| News `lorem-ipsum.md` | `Caregivers by Chronoboros` | Caregivers sleeve photographed among dry leaves (`content/news/lorem-ipsum.md:7-8`) |

The other 107 active values are non-blank and already state a scene, artwork/product role, format/front view, or visible object. This inventory does not rewrite them or impose a new editorial wording standard.

## Dormant Home section variants and values

Committed Home content contains exactly one `news` section and one `artists` section (`content/home/site.json:9-25`). Decap and Astro also expose two uncommitted variants. The public homepage asks only for `news` and `artists` and renders only their title/link values (`pages/index.astro:18-19,31-84`). The admin preview still has editor-only Distro and Journey branches (`public/admin/init.js:676-684,722-765`).

| Dormant variant | Exposed stored paths | Decap source | Astro schema | Committed value | Public consumer |
| --- | --- | --- | --- | --- | --- |
| `distro` | implicit `type`; `section_label`; `title`; `link_text`; `link_url` | `decap-home-fields.ts:109-137` | `content.config.ts:199-205` | none | none |
| `journey` | implicit `type`; `section_label`; `title`; `image`; `image_alt`; `paragraphs`; `stats`; `stats[].key`; `stats[].label` | `decap-home-fields.ts:140-195` | `content.config.ts:206-220` | none | none |

Dormant total: **2 variants**, **12 explicit editor value fields**, and **2 implicit stored `type` discriminators**. Both variants are schema-valid and previewable but absent from committed Home content and unreachable from current public rendering.

Two active Home values are separately stored but unused: `sections[news].section_label = "News"` and `sections[artists].section_label = "Artists"` (`content/home/site.json:12,19`). The public route renders each section's `title` and CTA fields but never reads either `section_label` (`pages/index.astro:31-84`).

## CMS fields without an Astro schema counterpart and/or public consumer

### Missing explicit Astro schema counterpart

| Field contract | Collections | Committed shape | Public status | Classification |
| --- | --- | --- | --- | --- |
| `$schema` | Home, About, Distro Page, Services, Newsletter, Settings, Navigation, Socials, Distro Store Items | present and non-blank in all **118** committed JSON entries | no public consumer | intentionally non-public editor/tooling metadata; generated by `buildSchemaField()` (`decap-yaml-builder.ts:196-204`) and intentionally absent from each collection `z.object` |
| Markdown `body` | Artists | one non-empty body and two empty bodies | public detail/overlay consumer through Astro `render()` | intentional loader-owned document body, not frontmatter (`decap-artist-collection.ts:125-131`; `ArtistDetailContent.astro:20-26,80-88`) |
| Markdown `body` | News | body present in all three entries; one contains only `.` | public detail/overlay consumer through Astro `render()` | intentional loader-owned document body, not frontmatter (`decap-news-collection.ts:46`; `NewsDetailContent.astro:15-18,50-53`) |

Missing-explicit-schema total: **11 field contracts**. Nine are `$schema` metadata contracts with no public consumer; two are loader-owned Markdown bodies with public consumers.

### Schema-backed fields with no current public consumer

| State | Field contracts | Count | Evidence |
| --- | --- | ---: | --- |
| Uncommitted and unrendered | Home dormant `distro` and `journey` paths listed above | 14 | builder/schema expose them; Home content and public route do not |
| Uncommitted and unrendered | Artist `section_label` | 1 | optional in builder/schema, absent from all three Artist entries, no source consumer (`decap-artist-collection.ts:118-124`; `content.config.ts:43-44`) |
| Committed, stored, and unused | Home `news.section_label`; Home `artists.section_label` | 2 | values present at `content/home/site.json:12,19`; route omits them |
| Committed, stored, and unused | Distro Page `page_title`; `page_description`; `hero.section_label` | 3 | values present at `content/distro-page/site.json:3-7`; public component uses only `hero.title`, `hero.intro`, and `group_intros` (`StoreDistroCatalog.astro:17,58-60,159`) while route metadata comes from Store Category config (`pages/store/distro/index.astro:1-10`) |

Schema-backed/no-public-consumer total: **20 field contracts**.

### Reconciled totals and boundaries

- Field contracts with no explicit Astro schema counterpart: **11**.
- Field contracts with no current public consumer: **29** = nine `$schema` contracts + 20 schema-backed contracts.
- Distinct union matching “no schema counterpart and/or no public consumer”: **31 field contracts**.
- Intentionally non-public fields: the nine `$schema` contracts only.
- Intentionally operational CMS fields: **0**. Current Decap builders expose no price, stock, checkout, order, fulfillment, provider credential, or provider mutation fields; those operational authorities remain outside editorial content.
- Settings `logo` is schema-backed and publicly consumed as structured metadata, so it is neither a schema gap nor a no-consumer field and does not need a visual alt sibling under its current use.

## Task 1.5 reconciliation

The task 1.5 matrix already contains every configured collection field and correctly distinguishes `$schema`, Markdown body, dormant Home variants, stored-but-unused Home/Distro Page values, and Artist `section_label` (`collection-field-matrix.md:31-65,145-165,206-229,282-294`). No matrix correction is required. This file adds task 1.8 instance counts, alt-text model/quality evidence, and explicit gap-category totals only.
