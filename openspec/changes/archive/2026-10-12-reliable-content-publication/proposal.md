# Reliable content publication

## Why

Hosted publication takes over seven minutes because every editorial change exports the whole CMS, stages all media, builds Astro and deploys Pages. The browser can publish a CMS revision without recording a durable website publication. Unrelated draft saves invalidate captures.

## What Changes

- Publish a selected saved revision through a durable server-owned operation.
- Activate immutable incremental snapshots independently of software builds.
- Serve public HTML from the existing templates in a Worker, through a Pages service gateway preserving public URLs.
- Retain Free-tier operation, private drafts, verified media, environment isolation and commerce authority.

## Capabilities

### New Capabilities

- `content-publication`: Durable selected-record publication and runtime delivery within sixty seconds.

## Impact

CMS publication, public content readers/routes, Pages delivery, code release bundles, Local stack and operational documentation. User explicitly authorized a worktree, merge, push and UAT/PRD code release; this does not authorize live catalog changes or shopper launch.
