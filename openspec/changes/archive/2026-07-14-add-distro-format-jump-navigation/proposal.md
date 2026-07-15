## Why

The 79-item Distro catalog has useful format headings but no quick way to reach them. Rough Trade's category orientation is worth borrowing, while its separate category routes and carousel stack are unnecessary for BlackBox's five populated browse groups.

## What Changes

- Add one server-rendered `Browse formats` navigation between the Distro intro/search control and catalog groups.
- Derive every format link, item count, and target from the same populated browse-group data so navigation cannot drift from rendered sections.
- Reuse native anchors, the existing app-shell target-scroll behavior, and local shadcn button styling without a new component or dependency.
- Hide the whole format navigation while a non-empty Distro search query is active, then restore it on clear, rather than exposing stale counts or links to hidden groups.
- Implement after `organize-distro-format-discovery` and `add-static-distro-search`; add no featured showcase, rail, category route, filter state, pagination, or virtualization.

## Capabilities

### New Capabilities

- `distro-format-jump-navigation`: Defines populated-group jump links, shared targets and counts, native fallback, and Distro-search visibility behavior.

### Modified Capabilities

None.

## Impact

- Frontend rendering: Distro route group metadata and one compact navigation block.
- Existing seams: Distro grouping, Distro search control, app-shell target scrolling, and local `buttonVariants`.
- Regression coverage: server-rendered navigation/group consistency, search visibility, keyboard use, and no-JavaScript fallback.
- No content, schema, API, route, commerce-authority, dependency, or deployment change.
