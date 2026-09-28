# Tasks

## 1. Point-in-time capture

- [x] 1.1 Export media storage keys in the same transactional D1 batch as the database snapshot while keeping the restore blob format unchanged; verify the focused export test.
- [x] 1.2 Merge media captured before and after the D1 snapshot, allow ordinary concurrent edits, and reject a recovery point if a referenced key is missing; verify focused backup tests.

## 2. Acceptance and operations

- [x] 2.1 Cover a content edit and media upload during capture, plus missing or changed referenced-media failures; run the CMS backup test file.
- [x] 2.2 Update the backup runbook and validate the OpenSpec change; run the required final repository validation before the release.
