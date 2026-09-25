# Site images Specification Delta

## ADDED Requirements

### Requirement: Staff thumbnail inventory and repair preserve originals

The system SHALL provide a bounded inventory and backfill path for native staff media that distinguishes missing originals, unsupported storage keys, and missing or invalid private derivatives. It SHALL write derivatives separately and MUST NOT modify or delete originals.

#### Scenario: A current media key is supported

- **WHEN** a flat JPEG, PNG, or WebP key satisfies the native upload contract
- **THEN** the client URL helper, authenticated thumbnail route, upload validator, and backfill accept the same key
- **AND** the complete key is encoded as one path segment.

#### Scenario: A derivative is missing or invalid

- **WHEN** a listed native original has no valid derivative
- **THEN** the bounded report identifies the derivative as missing or invalid and may prepare a separate PNG derivative at most 96 × 96 pixels and 40 KiB
- **AND** the original object bytes and metadata are not written or deleted.

#### Scenario: An explicitly selected original is absent

- **WHEN** a requested source key is not present in R2
- **THEN** the report identifies a missing original separately from an unsupported key or missing derivative.

#### Scenario: A current EmDash media record has no stored original

- **WHEN** the read-only media audit checks an image record against R2
- **THEN** it reports a missing original separately from unsupported keys and missing or invalid thumbnails
- **AND** the audit does not write or delete any R2 object or D1 row.

#### Scenario: A new image is uploaded

- **WHEN** the staff site uploads JPEG, PNG, or WebP media
- **THEN** it submits a valid PNG thumbnail no larger than 96 × 96 pixels and 40 KiB
- **AND** the CMS stores that derivative only after the native original upload succeeds
- **AND** a derivative error does not undo, replace, or delete the original.

#### Scenario: A staff thumbnail is requested without authorization

- **WHEN** an unauthenticated request targets a staff thumbnail
- **THEN** the CMS rejects it before reading the private derivative
- **AND** successful and failed staff thumbnail responses remain `private, no-store`.

### Requirement: Public CMS images use bounded transformations with original fallback

Published Content Images in accepted runtime snapshots MAY use Cloudflare Images URL transformations from the dedicated image hostname. Originals remain in environment-owned R2 storage and remain the source of truth.

#### Scenario: A public CMS image requests a supported responsive size

- **GIVEN** a public request references an exact content-addressed media path in the current environment
- **WHEN** its source origin is the current UAT or PRD Pages origin and its width is an existing approved responsive size
- **THEN** the renderer requests that width with `format=auto` from `images.blackboxrecordsathens.com`
- **AND** transformed responses have immutable caching and vary correctly by `Accept`.

#### Scenario: A transformation fails or is unavailable

- **WHEN** the transformation request errors, is rejected, or returns a non-image response
- **THEN** the renderer returns the verified original image bytes from the environment's R2 snapshot.

#### Scenario: A request targets private or non-CMS media

- **WHEN** a request targets a staff draft, preview, arbitrary origin, unapproved path, or unsupported width
- **THEN** it is not sent to the Images transformation host.

#### Scenario: A repository-owned image is rendered

- **WHEN** an image is a static repository asset
- **THEN** it keeps the existing Astro build and Pages delivery path.
