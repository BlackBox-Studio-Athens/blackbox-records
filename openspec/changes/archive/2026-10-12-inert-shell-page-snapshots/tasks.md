# Tasks

## 1. Implementation

- [x] 1.1 Clone the live `<main>` into the inert owner document of a `<template>`'s content in `readDocumentShellPageSnapshot`; keep every sanitizer and the stored HTML unchanged.

## 2. Verification

- [x] 2.1 Update the unit-test document fakes (`createElement` returning a template whose owner document imports the node); `pnpm test:app-shell` passes.
- [x] 2.2 Add the Store lazy-image check to `e2e/shell-navigation.spec.ts`; it fails before the fix on desktop and mobile and passes after.
- [x] 2.3 Run `pnpm validate` and strict OpenSpec validation on the final tree. See `validation.md`.
