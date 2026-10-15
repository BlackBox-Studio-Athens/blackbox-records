## 1. Reproduce and implement

- [x] 1.1 Investigate all four reports and reproduce Back leaving Crate, Artists and video. The initial overlay offset probe passed; the connected-exit focus race is covered separately in unit tests.
- [x] 1.2 Fix shared overlay scroll/focus behavior and nested overlay returns.
- [x] 1.3 Reuse marked history entries for Crate, Artists and full video; audit other dialogs.

## 2. Verify

- [x] 2.1 Add and pass focused history/scroll unit tests and touched module tests.
- [x] 2.2 Add and pass browser Back, Forward, nested-surface, explicit-close and scroll checks.
- [x] 2.3 Run strict OpenSpec validation, local affected validation and graph refresh; record actual evidence and remaining limits.
