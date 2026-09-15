## 1. Shared private rendering

- [x] 1.1 Add the public reader seam and private published-context renderer; verify public and CMS builds and render parity.
- [x] 1.2 Add authenticated bounded preview POST and isolation; verify invalid input, origin, identity, concurrent drafts, and no-write tests.
- [x] 1.3 Replace field previews with responsive live iframe preview; verify debounce, cancellation, stale failures, scrolling, and all collection contexts.

## 2. Focused workspace

- [x] 2.1 Implement focused selection and responsive editing with unsaved protections; verify keyboard and mobile flows.
- [x] 2.2 Move publication summary/history to the top with bounded refresh; verify pending/live/failure behavior.
- [x] 2.3 Improve copy, image guidance, semantic colors, and pointer states; verify contrast and required fields.

## 3. Verification and guidance

- [x] 3.1 Update CMS design and operating guidance, including preview limitations and local resource evidence.
- [x] 3.2 Pass unit tests, check, public build, canonical CMS build/no-KV guard, and local browser review at 390/768/1280/1600 px.
