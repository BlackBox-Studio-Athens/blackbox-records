# Spec Delta

## REMOVED Requirements

### Requirement: Shared links use the configured site and the product image

**Reason**: Every shared link now uses one brand card so previews look the same in wide and square-crop apps.
**Migration**: Replaced by "Shared links use the configured site and the brand card".

## ADDED Requirements

### Requirement: Shared links use the configured site and the brand card

The canonical link and `og:url` SHALL be built from the configured site and the request pathname. Every shell document SHALL use the configured 1200 × 630 JPEG brand card as `og:image` and `twitter:image`, with its type, width, height and alt text, while the title and description stay page-specific.

#### Scenario: Visitor shares a Store Item from a phone

- **WHEN** a Store Item page is loaded
- **THEN** its canonical link and `og:url` are the configured site plus the item's pathname
- **AND** its `og:image` is the absolute brand card URL with `og:image:type` `image/jpeg`, `og:image:width` 1200 and `og:image:height` 630
- **AND** its `og:title` names the item.
