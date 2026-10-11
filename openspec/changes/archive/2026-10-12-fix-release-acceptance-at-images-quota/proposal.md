## Why

The 11 October release deployed UAT but could not pass acceptance. A delayed overlay focus callback can treat a missing panel as the document scroll root, and the public-media smoke requests an Images transformation even though published originals remain available when the Free transformation quota is exhausted.

## What Changes

- Ignore overlay content-focus callbacks after their panel has disconnected, preserving list position and focus on close.
- Verify published original media in the release's public-assets smoke, while keeping the explicit image-transformation scenario strict and separate.
- Verify the existing browser image fallback with controlled transformation failures locally.
- Commit the prepared main tree, pass the complete UAT release, promote that accepted source to PRD and verify both identities and preserved runtime controls.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: delayed overlay callbacks must not move the background after closure.
- `site-images`: release media availability checks use published originals independently of transformation-provider availability.

## Impact

App-shell overlay focus, release smoke discovery and their tests; release documentation. No new dependency, image transformation variant, paid plan, content publication, catalog mutation, DNS change or checkout launch is introduced. Existing Crate performance and private CMS Local acceptance remain separate.
