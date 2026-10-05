# Editable footer text

## Why

The public footer description is hardcoded in site configuration. Staff can edit the footer's label name and established year, but cannot change its description or find that task under Navigation & footer.

## What Changes

- Add an optional Footer text field to the existing Label details singleton.
- Link Footer text from Website → Navigation & footer.
- Render accepted footer text through the normal EmDash draft, preview and publication flow, retaining the existing description for legacy or blank values.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-workspace`: discoverable footer copy editing through existing site settings and explicit publication.

## Impact

Staff settings form and destination list; shared settings content schema; native CMS field preparation; public Footer; focused settings/publication contracts and operator documentation. No new service, dependency or footer-link restructuring.
