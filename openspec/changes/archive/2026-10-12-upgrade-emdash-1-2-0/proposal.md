# Upgrade EmDash to 1.2.0

## Why

EmDash 1.2.0 fixes concurrent saves and several runtime/editor defects. BlackBox needs the current supported packages while preserving its private drafts, accepted snapshots, Access identity and image-only upload contract.

## What Changes

- Pin the three direct EmDash packages to 1.2.0 and regenerate the lockfile.
- Rebase the existing dependency patches; retire the save-race workaround only after the upstream implementation passes the existing regression.
- Limit the native admin build to the English locale already used by Staff, and keep unsupported native video uploads out of the embedded editor.
- Extend the existing stopped-store upgrade rehearsal to accept a 1.1.0 source and record migration identities, release applicability and local acceptance.

## Capabilities

No new product capability or changed content contract. This is a dependency and compatibility maintenance change; `skip_specs: true` preserves the existing editorial and publication requirements.

## Impact

Backend and Staff dependencies, pnpm patches, CMS configuration, embedded Portable Text editor, existing upgrade/browser checks and CMS operational documentation. Work and commit stay on local main. Hosted migration, publication, push and deployment are outside this request.
