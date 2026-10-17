# Design

## Context

See proposal.md. On 18 October 2026 the owner selected existing Inter and authorized this worker to implement and deliver through UAT to PRD. Rollout 01a14bd1-38d0-7e83-b578-fc01a44d1217 confirms gpt-6.1-sol, high, danger-full-access, approval never.

## Goals / Non-Goals

Use one render-time Unicode Greek-script predicate, including Greek Extended and Greek bases with decomposed accents, through the existing public UI utils export. No observer, content rewriting, dependency, new font or redesign.

## Decisions

- One class changes family and weight with explicit precedence over listing selectors and Home font shorthands. Each surface retains casing, line height, tracking and scale.
- Astro and React share the predicate; Crate reuses StoreItemCard and shell fragments reuse detail components.
- Audit includes artist hero/latest/previous releases, News card/hero, release card/detail, Store card/detail/cart/checkout, Services and Home preorder titles. Body prose, credits, video captions, prices, controls and order-state copy retain existing treatment. Order return has no brand-font content-item title renderer.
- Chromium platform-font evidence uses actual Greek text rather than a sample-free document.fonts.check.

## Risks / Trade-offs

- Inter is wider: verify long and mixed titles at 320/390/430/1440px, Grid/Crate and shell navigation; adjust layout only for a demonstrated defect.
- Main contains unpublished shipping-email behavior: inspect release ancestry and preserve unrelated files with recorded hashes; never bundle that behavior.
- Emulation does not establish physical-phone appearance.

## Migration Plan

Run focused tests, browser checks, strict OpenSpec, final validation, build:web and one Graphify refresh. Commit only scoped paths. Publish the font candidate excluding shipping-email behavior, wait for all pages.yml jobs, verify UAT fonts/identities, promote the exact candidate with promote-prd.yml, and verify apex identity/fonts and preserved content/checkout state. Existing revert/push/promote is the rollback path.
