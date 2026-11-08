# Tasks

## 1. Data and contracts (Codex)

- [x] 1.1 Add an additive D1 migration for `shippingLockerAddressLine` and `shippingLockerPostalCode` on `CheckoutOrder` and the checkout stock hold, and `lockerUsedId`, `lockerUsedName` and `parcelNumbers` (JSON array, `json_valid` check) on `OrderDispatch`; regenerate Prisma and verify the migration applies to a fresh local D1 and to a copy with existing rows.
  - 2026-11-07: 0041 applied to a fresh Local D1 and to a copy of the Local D1 (48 orders, one test dispatch); new columns TEXT NULL, pre-existing columns byte-identical by SHA-256, `json_valid` rejects invalid parcelNumbers and accepts `[]`. Real Local state only read.
- [x] 1.2 Extend `ShippingLockerSnapshot`, the public `CheckoutStateShippingLocker` and the internal order schemas with address and postcode, and the internal order schema with the dispatch locker used and parcel numbers; regenerate the API clients and verify `pnpm test` for the backend contracts and both client packages.

## 2. Start Checkout carries the locker (Codex)

- [x] 2.1 Add the optional `shippingLocker` object and `lockerFallback` flag to `StartCheckoutBody` with bounded strings and `countryCode: 'GR'`, include the locker in the request fingerprint, and copy it through the hold to the pending order; verify with checkout use-case tests for a valid locker, the fallback, an invalid locker rejected before any hold or Session, and a changed locker creating a new attempt.
- [x] 2.2 Return address and postcode in `CheckoutState.shippingLocker`; verify with the public checkout state test.

## 3. Checkout locker panel (Claude)

- [x] 3.1 Build the BOX NOW locker panel above Review and pay as approved in draft 3: intro, Last used on this device with Use this locker, Find a locker, chosen locker with Change locker, Delivery to row, and Continue to payment disabled with "Choose a locker above to continue."; verify with component tests and a 390px and 1440px capture against draft 3.
- [x] 3.2 Load BOX NOW's widget only on tap, accept messages only from `https://widget-v5.boxnow.gr`, keep the five locker fields, store the last locker per device with a try/catch storage fallback, and send the locker with Start Checkout; verify with unit tests for origin filtering and field reduction, and a browser check that no BOX NOW request happens before the tap.
- [x] 3.3 Present the map-unavailable panel state for owner approval, then build the 10-second fallback that enables payment without a locker and sends `lockerFallback`; verify with a test that simulates a failed script and the approved capture.
- [x] 3.4 Change the cart drawer line to "BOX NOW locker delivery within Greece. You choose the locker at checkout." and the Review and pay note to the approved Stripe-address wording; verify with the cart and checkout copy tests.
- [x] 3.5 Check keyboard focus, persistent-player continuity and narrow-screen layout of the panel with the open map; verify with the agent-workflow continuity checks and a phone-width capture with no horizontal overflow.
  - 2026-11-07: `pnpm test:e2e e2e/player-continuity.spec.ts e2e/checkout-locker.spec.ts` 19 passed (chromium-desktop, chromium-mobile, webkit-mobile); focus returns to Change locker and Try the map again; 390px captures of every panel state, map open included, have no horizontal overflow.

## 4. Return page (Claude)

- [x] 4.1 Show the locker name, postcode and ID on the confirmed paid return page and replace the Delivery and Fulfillment next steps with the approved copy, including the fallback wording; verify with `checkout-return-status-state` tests for locker, fallback and pre-order orders and a capture against draft 3.

## 5. Emails (Codex)

- [x] 5.1 Add the Locker row and the fallback paragraph to the payment confirmation in HTML and plain text; verify with template tests and a preview render reviewed against draft 3.
- [x] 5.2 Add Locker, Parcel number(s), Track actions to `https://boxnow.gr/en?track=<number>`, and the pickup and full-locker paragraphs to the shipping email for one, several and no numbers; verify with template tests that escape values, build links only from 10-digit numbers, and keep HTML and text in agreement, plus preview renders reviewed against draft 3.

## 6. Staff (Claude for UI, Codex for the write)

- [x] 6.1 Extend the protected dispatch write to accept the locker used and up to five 10-digit parcel numbers, saved in the same compare-and-set write as the shipped mark; verify with order-shipping worker tests for one number, several numbers, an invalid number refused with nothing saved, a stale write, and undo/re-mark.
- [x] 6.2 Build the For BOX NOW Send parcel section (size suggestion with BOX NOW price, recipient, phone, email, locker, locker ID, Copy, Copy all, Open Send parcel) and its no-locker state; verify with order-workspace tests and a capture against draft 3 at desktop and phone width.
- [x] 6.3 Extend Dispatch with Locker used and Change, parcel number fields with Add parcel, inline 10-digit validation, and Check the number on BOX NOW; verify with order-workspace tests and a capture of the one-parcel and two-parcel states against draft 3.

## 7. Delivery information and operations

- [x] 7.1 (Claude) Add the browse-only Find a locker near you panel to Delivery & returns, reusing the panel's map loader, with its unavailable state; verify with a test that a selection there changes nothing in checkout and a capture against draft 3.
- [x] 7.2 (Codex) Replace runbook step 2 in `docs/commerce-operations.md` with the Send parcel steps (copy from Staff, pay, drop at any locker, paste the 10-digit number, change Locker used if needed, Mark shipped) and add the no-locker fallback case; verify with `pnpm agent:check`.
- [ ] 7.3 Prepare the new Staff-owned delivery terms wording (you choose the locker at checkout, BOX NOW's full-locker redirection, the pickup code) for owner publication through the normal content workflow; verify the draft is saved and listed in Review, not published.

## 8. Integration

- [x] 8.1 Run `pnpm validate` on the final tree and strict OpenSpec validation for this change; record the results.
  - 2026-11-07: `pnpm validate` PASSED, 65/65 Nx tasks, after the owner's copy feedback (`.codex-artifacts/validation/2026-11-07T12-23-29-335Z-25620-5a708e/summary.json`). Strict OpenSpec validation: valid; info only, archive needs `add-order-shipped-email` archived first. Browser checks: checkout-locker (including the browse-only finder test), checkout-review-order, checkout-return and player-continuity pass on all three Playwright projects. The owner approved the built checkout, return page, Staff, email and finder screens on 2026-11-07, with the shortened Delivery and shipping-email copy.
  - 2026-11-08: after the review fixes in `validation.md`, `pnpm validate` PASSED 65/65 (`.codex-artifacts/validation/2026-11-08T02-44-47-483Z-47704-1b9ee2/summary.json`), strict OpenSpec validation valid, and the recaptured shipping emails are byte-identical to the approved captures.
- [ ] 8.2 On UAT with the Stripe sandbox, complete one order with a real map selection and one through the forced fallback, then copy from Staff, mark shipped with a test number and check the sink shipping email; record the evidence before any PRD rollout.

## Workflow follow-up

- Archive `add-order-shipped-email` and `add-shipping-email-choice` before archiving this change.
- Enforce "locker or fallback" in Start Checkout only after the web release is live everywhere.
- Archive this change after UAT acceptance and the owner's review.
