## Why

Staff must distinguish UAT testing from everyday production work and understand that their data is separate. The existing public payment marker and small Staff badge do not explain this.

## What Changes

- Replace the small UAT markers with a permanent yellow English banner above both headers, linking to the corresponding production home.
- Use `[UAT]` browser titles and preserve the checkout payment warning.
- Update release checks and environment guidance for the approved wording.

## Capabilities

### Modified Capabilities

- `uat-review-marker`: Persistent testing and data-separation notice on public and Staff UAT surfaces.
- `project-language`: Approved English banner terminology.
- `static-site-and-deployment`: Updated UAT artifact and smoke cues.

## Impact

Public header/layout, Staff shell/layout, existing marker checks, and environment documentation. No data movement, provider changes, deployment, or production activation.
