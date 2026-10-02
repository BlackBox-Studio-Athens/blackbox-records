# Tasks

## 1. Cart usability and coverage

- [x] 1.1 Capture the missing Close regression, pin heading and 44px Close using existing dismissal, and verify focused cart tests.
- [x] 1.2 Add cart-only Firefox projects and run overflow, loading/error, empty and persistence coverage at all three compact sizes, preserving Chromium touch swipes.
- [x] 1.3 Verify three-item cart dismissal by Close, Continue Shopping, Escape and backdrop restores scrolling, BUY, focus and player continuity in Chromium and Firefox.
- [x] 1.4 Install both browsers in public end-to-end CI; verify the workflow contract and document browser limitations in the validation note.

## 2. Integration acceptance

- [x] 2.1 Run focused shell/player checks, strict OpenSpec validation and pnpm validate; record source-bound evidence and pending Android acceptance.

## Release acceptance

Real Android Firefox UAT acceptance is required before PRD promotion. PRD verification follows the existing release gates. These remain pending external acceptance; this implementation request does not authorize promotion.
