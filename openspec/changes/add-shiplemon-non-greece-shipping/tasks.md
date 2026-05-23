## 1. Reactivation

- [ ] 1.1 Reconfirm that non-Greece shipping is approved for post-MVP work.
- [ ] 1.2 Verify Shiplemon sandbox API access and credential handling before implementation.
- [ ] 1.3 Replan package-profile and quote requirements against current store catalog and checkout code.

## 2. Backend Implementation

- [ ] 2.1 Add D1/Prisma models and repository seams for package profiles, shipping quotes, and Shiplemon shipments.
- [ ] 2.2 Add Worker-only Shiplemon gateway bindings and adapter with no public credential or raw payload exposure.
- [ ] 2.3 Add sanitized public quote APIs and protected operator shipment readback.

## 3. Checkout and Fulfillment

- [ ] 3.1 Require a valid app-owned `shippingQuoteId` for non-Greece checkout.
- [ ] 3.2 Preserve Greece-only manual BOX NOW behavior.
- [ ] 3.3 Create Shiplemon shipments only after verified paid webhook reconciliation and operator-ready review.

## 4. Verification

- [ ] 4.1 Run generated API, targeted backend/frontend tests, `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [ ] 4.2 Use Browser Use for changed shopper checkout UI.
- [ ] 4.3 Record sandbox and production shipping evidence separately.
