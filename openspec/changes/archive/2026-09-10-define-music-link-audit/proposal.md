## Why

Artist profile links and Release player sources have different roles, and a successful HTTP response does not prove correct identity, intent, or playback. The project needs one small, repeatable manual audit before editing provider links.

## What Changes

- Define one dated, committed `music-link-audit.md` output covering the twelve current Artist/Release Bandcamp and Tidal slots in stable order.
- Separate entries structurally into `Missing`, `Questionable`, and `Verified` sections with source-content links and concise evidence.
- Require manual provider, identity, role, redirect, and Release-player confirmation before a link is verified.
- Treat absent links as catalog gaps rather than automatic errors, and keep uncertain intent, access failures, or track-versus-album choices questionable.
- Keep the audit read-only; content corrections remain a later change.

## Capabilities

### New Capabilities

- `music-link-audit`: Defines the bounded audit artifact, state model, ordering, evidence, and manual-verification rules.

### Modified Capabilities

None.

## Impact

- One audit-run output contract and its review workflow; item 2.3 creates the first report.
- Manual Browser Use verification of Bandcamp and Tidal destinations and Release embeds.
- No runtime, schema, dependency, or content mutation.
