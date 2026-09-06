## MODIFIED Requirements

### Requirement: Collection controls match stored and rendered content

The system MUST preserve collection/file identities, editorial meaning, and fixed-layout controls while using native-compatible stored keys. It MUST expose only controls that map to the migrated Astro schemas and supported stored or rendered behavior.

#### Scenario: Editor opens the collection list

- **WHEN** the authenticated content view loads
- **THEN** collections appear in this order: Store Items — Distro & Merch, Releases, Artists, News, Site Pages, Advanced — Navigation, Advanced — Social Links, and Advanced — Site Settings
- **AND** labels, descriptions, hints, and warnings remain concise English using current BlackBox domain terms.

#### Scenario: Editor opens Site Pages

- **WHEN** an editor opens the `site-pages` file collection
- **THEN** it contains `home-site`, `about-site`, `services-site`, `newsletter-site`, and `distro-page-site` in that order using their existing files and canonical routes
- **AND** Home, About, and Services expose named fixed-layout objects rather than addable, removable, duplicable, or reorderable section lists.

#### Scenario: Collection contract changes

- **WHEN** an editor field or option is added or changed
- **THEN** it maps to the corresponding Astro schema and current content shape
- **AND** stale CMS-only fields, removed fixed-section types, commerce-authority fields, and unsupported Sveltia options remain absent.

#### Scenario: Distro shelf introduction keys migrate

- **WHEN** the Distro page copy is migrated for native field-name compatibility
- **THEN** `group_intros` stores `vinyl_12_inch`, `vinyl_10_inch`, and `vinyl_7_inch` instead of `Vinyl 12-inch`, `Vinyl 10-inch`, and `Vinyl 7-inch`, respectively
- **AND** the corresponding text and visible field labels remain unchanged, as do the `CDs`, `Clothes`, `Tapes`, and `Other` keys
- **AND** the editor retains fixed named text fields, not an arbitrary key/value editor
- **AND** rendered shelf labels, ordering, membership, and intro text use separate `Vinyl 10-inch` and `Vinyl 7-inch` shelves, each with its matching intro.

#### Scenario: Optional field is left blank

- **WHEN** an optional editor field has no value
- **THEN** Sveltia omits the empty field where required for schema compatibility
- **AND** the saved entry remains accepted by the Astro content collection.

#### Scenario: Markdown content round-trips

- **WHEN** an existing Artist or News Markdown body is loaded and saved
- **THEN** it remains valid Markdown accepted by Astro
- **AND** existing headings, paragraphs, lists, links, emphasis, code, and other stored semantics are preserved.
