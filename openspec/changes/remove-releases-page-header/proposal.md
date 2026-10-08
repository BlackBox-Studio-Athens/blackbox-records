# Proposal

## Why

The user requested removal of the visible Catalog / Releases introduction while retaining Our Releases below the featured records.

## What Changes

- Replace the introductory header with an accessible, visually hidden Releases heading and remove its unused CSS.
- Keep Our Releases in its existing lower-catalog position and preserve the record layout and shell behavior.
- Update the existing page contracts and verify desktop, mobile and shell navigation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: Retain an accessible page identity without a visible introductory header or reserved header space.
- `section-page-identity`: Exempt the visually hidden Releases identity from visible hero typography and supporting-label requirements.

## Impact

Releases page markup, unused introduction CSS and existing page tests. No public API, data, dependency or publication changes.
