# Upgrade EmDash to 1.4.0

## Why

Adopt upstream fixes for concurrent D1 saves and content handling while preserving BlackBox's revision-fenced deletes, private content and Staff editor integration.

## What changes

- Pin core, Cloudflare and admin packages to 1.4.0 and rebase the two workspace patches.
- Rehearse the upgrade on a disposable copy of a stopped Local 1.3.1 store and run the existing CMS checks.
- Assess the requested release fixes against BlackBox's existing runtime and record limits.

## Impact

The CMS build, Staff package, migration rehearsal and Local validation are affected. This change does not authorize hosted access, publication or deployment.
