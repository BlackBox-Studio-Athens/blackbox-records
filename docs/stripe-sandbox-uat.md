# Stripe Sandbox UAT Guide

This guide is for label-member testing of the sandbox checkout flow on GitHub Pages.

## Test URL

Use the GitHub Pages sandbox UAT site:

https://blackbox-studio-athens.github.io/blackbox-records/

The site is static, but checkout calls the sandbox Worker:

https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev

## Important Rules

- This is Stripe test mode only.
- Do not enter real card details.
- No real charges are created.
- Orders, stock changes, and webhook evidence are sandbox-only.
- Report buyer-facing UI issues, confusing wording, broken flows, and anything that feels unsafe or unclear.

## What To Test

Start from the store, open an item, add it to the cart, and continue to checkout.

Use any realistic Greek shipping address and phone number in Stripe Checkout. The address is only sandbox test data.

### Successful Payment

- Card number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any three digits
- Expected result: payment completes and returns to the site.

### 3DS Payment

- Card number: `4000 0027 6000 3184`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows a test 3DS challenge, then payment completes and returns to the site.

### Declined Payment

- Card number: `4000 0000 0000 0002`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows a decline message and no paid order is created.

### Insufficient Funds

- Card number: `4000 0000 0000 9995`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows an insufficient-funds decline and no paid order is created.

### Expired Card

- Card number: `4000 0000 0000 0069`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows an expired-card decline and no paid order is created.

### Incorrect CVC

- Card number: `4000 0000 0000 0127`
- Expiry: any future date
- CVC: any three digits
- Expected result: Stripe shows an incorrect-CVC decline and no paid order is created.

## Feedback To Send

Send the page or checkout step where the issue happened, what you expected, what happened instead, and whether you were on desktop or mobile.

Good feedback topics:

- confusing checkout wording
- unclear shipping/payment expectations
- missing product/order information
- mobile layout issues
- Stripe return-page issues
- any moment that feels less trustworthy than a normal online checkout

Do not send real payment details, private customer data, Stripe secret keys, webhook secrets, or screenshots containing sensitive information.
