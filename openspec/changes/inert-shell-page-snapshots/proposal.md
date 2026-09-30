# Proposal

## Why

The shell snapshots the current page when it mounts and before every section navigation, so it can restore that page later without a fetch. It cloned `<main>` inside the live document, and Chrome fetches every image in such a clone, including `loading="lazy"` ones. On PRD on 2026-09-30, a phone visit to Store requested 136 of its 137 images (about 4 MB) before any scrolling; the same HTML without scripts requested 25. Local Store requested 111 images on desktop and 130 on mobile for 110 images in `<main>`.

## What Changes

- Clone the live `<main>` into an inert document (the owner document of a `<template>`'s content), which has no browsing context and fetches nothing. The sanitizers and the stored snapshot HTML are unchanged.
- Add a Playwright check that loading Store requests fewer than half of its images before scrolling, on desktop and at 390 px.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: capturing a page snapshot starts no network requests.

## Impact

`shell-page-snapshot.ts`, its unit-test fakes and `e2e/shell-navigation.spec.ts`. Fetched-page snapshots already parse through `DOMParser`, which is inert. No dependency, content, Worker or commerce change.
