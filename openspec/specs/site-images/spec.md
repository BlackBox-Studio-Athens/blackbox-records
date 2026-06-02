# site-images Specification

## Purpose

TBD - created by archiving change standardize-site-images. Update Purpose after archive.

## Requirements

### Requirement: Simple Image Roles

The system SHALL classify site image behavior with a small set of image roles.

#### Scenario: Image behavior is described

- **GIVEN** docs, specs, implementation, validation output, or handoff notes describe image behavior
- **WHEN** the image belongs to the site image policy
- **THEN** it uses one of these roles: Content Image, Public Brand Asset, Runtime Image Snapshot, or Provider Product Image URL.

### Requirement: Repo Content Owns Content Images

The system SHALL treat repo-owned content collections and CMS-authored content files as the source of truth for Content Images.

#### Scenario: Product image is needed downstream

- **GIVEN** a release or distro item has a repo-owned image
- **WHEN** store, cart, checkout, metadata, or provider projection needs product image data
- **THEN** the downstream image data is derived from the repo-owned content image
- **AND** duplicate editable provider-specific product image fields are not introduced by this change.

### Requirement: Static Local Images Use Astro Image Handling

The system SHALL use Astro image handling for static local content images where Astro image metadata is available.

#### Scenario: Static Astro surface renders a Content Image

- **GIVEN** an Astro page, card, detail, or layout receives a local Content Image as Astro image metadata
- **WHEN** it renders the image
- **THEN** it uses Astro image handling with explicit alt text and stable layout framing.

#### Scenario: Runtime image string is rendered

- **GIVEN** a client-rendered component, cart drawer, checkout summary, public brand asset, provider badge, admin chrome, or external image URL renders an image string
- **WHEN** Astro image metadata is not available
- **THEN** raw image rendering is allowed
- **AND** the rendered image still has explicit alt or decorative semantics and stable dimensions or aspect ratio.

### Requirement: Provider Image URLs Are Projected

The system SHALL derive Provider Product Image URLs from repo-owned content and the target Product Environment.

#### Scenario: Provider product image URL is emitted

- **GIVEN** catalog promotion or provider reconciliation emits product image data
- **WHEN** the target Product Environment is UAT or PRD
- **THEN** the image URL is an absolute public URL for that same Product Environment
- **AND** browser-submitted image URLs are not accepted as product-media authority.
