## Why

The Content header can keep showing an older failed publication after a newer request has started because the UI ranks historical failures ahead of pending work. This makes a truthful publication journal look like the current request failed and weakens confidence in the staff workspace during launch preparation.

## What Changes

- Derive the top-right publication status from the active client request or newest journal entry, while retaining older failed entries in history.
- Track publication request-in-flight and status-read errors explicitly instead of inferring them from feedback copy.
- Keep pending polling and direct top-right refresh available, and make current versus historical publication entries clear.
- Apply a compact, consistent visual system to Content, Images, Items, Stock, and Orders using installed shadcn/Radix and Lucide components.
- Update workspace hierarchy, typography, status treatments, responsive controls, loading states, and actionable copy without changing commerce permissions or operational authority.
- Record the decisions and evidence in the backoffice design guide and this OpenSpec change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-publishing`: the staff publication status view distinguishes the current request from retained historical failures and never equates an accepted or stale state with Live.
- `emdash-editorial-operations`: the shared staff workspace presents publication, loading, error, focus, and responsive states consistently while preserving protected editorial and operator workflows.

## Impact

The change affects the staff Content publication status and ContentApp coordination, shared staff workspace styles, Content image selection presentation, Items setup presentation, Stock controls/history presentation, Orders filters/detail presentation, browser and unit fixtures, `docs/backoffice-design.md`, and the related OpenSpec specs. No new dependency, endpoint, database migration, publication journal mutation, commerce permission, or public-site rendering mode is required.
