## 1. Delivery proof

- [x] 1.1 Probe `info@`, `demos@` and `touring@blackboxrecordsathens.com` with the Resend CLI from the verified sender; verify each reports `delivered`.
- [x] 1.2 Confirm the three probes reached the label Gmail inbox.

## 2. Implementation

- [x] 2.1 Update About contact content to the working addresses and the Tour Booking label; document the About aliases in the environment model.
- [x] 2.2 Add the copy primitive and per-row copy control with its layout and hover; verify unit tests and strict OpenSpec validation.

## 3. Acceptance

- [x] 3.1 Add an e2e check for copy after direct load and after a cached shell return; run it with `pnpm test:app-shell` and `pnpm test:e2e`.
- [x] 3.2 Check desktop, 390px and 320px layout, focus order, hover and copy feedback in Chrome; record observations.
- [x] 3.3 Run final `pnpm validate` and record source-bound results.

## 4. Production content

- [x] 4.1 Publish the three About contact edits through PRD staff; verify the public About page shows the new addresses and copy controls.
