## ADDED Requirements

### Requirement: Cart and checkout thumbnails use a bounded derivative

The system SHALL show StoreCart and checkout line images from a small derivative of the Store Item image, never the original upload.

#### Scenario: Shopper adds a Store Item to the cart

- **WHEN** a Store card, Store Item page, or checkout page seeds a StoreCart line
- **THEN** the line image URL points to one 176 px WebP derivative computed once per Store Item, or the nearest hosted width rung
- **AND** the cart seed keeps its existing field names and types
- **AND** the rendered thumbnail declares its 88 px width and height and decodes asynchronously.

#### Scenario: A stored cart line predates the derivative

- **WHEN** a StoreCart line already in localStorage carries an earlier image URL
- **THEN** it keeps rendering until the line is rewritten
- **AND** no storage migration is required.

### Requirement: Editorial image candidates match their rendered slots

The system SHALL describe each editorial and Store image's rendered slot in `sizes` and SHALL keep width ladders, quality, and fallback sources proportional to what browsers request.

#### Scenario: Built pages are checked for picked candidates

- **WHEN** the built image-markup check evaluates the LCP and lead images of releases, release detail, news, news detail, artist hero, and Store card roles
- **THEN** the candidate a browser picks at 390×844 DPR 2, 390×844 DPR 3, and 1440×900 DPR 1 is the smallest one covering the slot measured from the site CSS, including gutters, padding, frames, and grid columns
- **AND** the first `/news/` card receives high fetch priority.

#### Scenario: A contained photo sits in a fixed frame

- **WHEN** the artist hero shows a photo with `object-fit: contain` inside its frame
- **THEN** `sizes` follows the painted image from its aspect ratio against the frame's, with small rungs available for portrait and square photos
- **AND** the contain-over-blur presentation is unchanged.

#### Scenario: Editorial images are encoded

- **WHEN** an editorial or LCP image is encoded through Astro
- **THEN** it uses one shared editorial WebP quality, 68 unless a recorded visual check sets another value
- **AND** the `src` fallback reuses the largest `srcset` transform instead of encoding an extra full-resolution file.

#### Scenario: Store cards and gallery thumbnails render

- **WHEN** a Store card or a Store Item gallery thumbnail renders
- **THEN** card candidates are 240, 360, 480, 640, and 720 pixels wide
- **AND** 72 px gallery thumbnails offer 144 and 216 pixel candidates.

### Requirement: Link previews, small brand marks, and the header logo are fit for their role

The system SHALL keep link-preview and small brand-mark images within derivative sizes appropriate to their use, and SHALL never lazy-load the header logo.

#### Scenario: A page publishes link-preview metadata

- **WHEN** a page with a Content Image emits `og:image` and `twitter:image`
- **THEN** both reference a 1200 px JPEG derivative resolved against the site origin
- **AND** the original upload is not referenced solely for link previews.

#### Scenario: The PRD Holding Page shows its logo

- **WHEN** the Holding Page renders its logo at 72 to 120 CSS pixels
- **THEN** it uses a derivative no wider than 240 pixels
- **AND** its stable metadata image and closed asset set remain valid.

#### Scenario: The header renders on any page

- **WHEN** the header brand logo renders
- **THEN** it loads eagerly, because it can be the first-viewport LCP element
- **AND** it keeps its fingerprinted derivative and stable geometry.
