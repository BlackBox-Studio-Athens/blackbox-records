import { expect, test as base, type Page, type Request } from 'playwright/test';

import { expectNoHorizontalOverflow } from './fixtures';

const token = '0123456789abcdef'.repeat(4);
const newsletterLink = `email-preferences/#action=newsletter&token=${token}`;
const withdrawalLink = `email-preferences/#action=availability-withdrawal&token=${token}`;

// The shared fixture fails on every console error, but Chromium logs each 4xx/5xx or aborted fetch; these specs
// exercise exactly those answers. Any other console or page error still fails the test.
const expectedNetworkLog =
  /^Failed to load resource: (the server responded with a status of (400|503)|net::ERR_INTERNET_DISCONNECTED)/;
const devServerHotReloadSocket =
  /^(WebSocket connection to 'ws:\/\/|\[vite\] failed to connect to websocket|Failed to send error to Vite server)/;

const test = base.extend<{ requests: Request[] }>({
  requests: [
    async ({ page }, use) => {
      const requests: Request[] = [];
      page.on('request', (request) => requests.push(request));
      await use(requests);
      // Capabilities never leave the POST body: not in any URL, query or Referer, and nothing goes off this origin.
      for (const request of requests) {
        const url = new URL(request.url());
        expect(request.url(), 'capability in a URL').not.toContain(token);
        expect(['127.0.0.1', 'localhost'], `third-party request ${url.origin}`).toContain(url.hostname);
        if (request.method() === 'POST') expect(request.headers().referer).toBeUndefined();
      }
    },
    { auto: true },
  ],
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'error' && !expectedNetworkLog.test(text) && !devServerHotReloadSocket.test(text))
        errors.push(text);
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await use(page);
    expect(errors, 'console and page errors').toEqual([]);
  },
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[data-email-preferences-app]')).toBeVisible();
}

/** Routes one API path and records each JSON body; answers come from the queue, the last one repeating. */
async function stub(
  page: Page,
  path: string,
  answers: Array<{ status: number; json?: unknown } | 'offline'>,
  gate?: Promise<void>,
) {
  const bodies: unknown[] = [];
  await page.route(`**${path}`, async (route) => {
    bodies.push(route.request().postDataJSON());
    await gate;
    const answer = answers[Math.min(bodies.length, answers.length) - 1]!;
    if (answer === 'offline') return route.abort('internetdisconnected');
    return route.fulfill({ status: answer.status, json: answer.json ?? { error: 'refused' } });
  });
  return bodies;
}

const actionStatus = (page: Page) => page.locator('[data-email-preferences-action-status]');
const actionError = (page: Page) => page.locator('[data-email-preferences-action-error]');

test('a newsletter link waits for Confirm, removes its fragment and confirms by POST', async ({ page, requests }) => {
  let release!: () => void;
  const answered = new Promise<void>((resolve) => (release = resolve));
  const bodies = await stub(
    page,
    '/api/newsletter/confirmations',
    [{ status: 200, json: { status: 'confirmed' } }],
    answered,
  );
  await open(page, newsletterLink);

  // The capability is gone from the address bar and from storage, and nothing was posted on load.
  expect(new URL(page.url()).hash).toBe('');
  expect(page.url()).toMatch(/\/email-preferences\/$/);
  await page.waitForLoadState('networkidle');
  expect(bodies).toEqual([]);
  expect(requests.filter((request) => request.method() !== 'GET')).toEqual([]);
  expect(
    await page.evaluate(() => JSON.stringify([{ ...localStorage }, { ...sessionStorage }, history.state])),
  ).not.toContain('0123456789abcdef');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  await expect(page.locator('[data-app-shell-main], iframe, astro-island')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirm newsletter request');
  await expect(page.getByText('Confirm that this address asked for BlackBox Records')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Request a new link' })).toBeHidden();
  // Live regions exist, empty, before anything is announced.
  await expect(actionStatus(page)).toHaveAttribute('aria-live', 'polite');
  await expect(actionError(page)).toHaveAttribute('aria-live', 'assertive');
  await expect(actionStatus(page)).toBeEmpty();

  const confirm = page.getByRole('button', { name: 'Confirm', exact: true });
  await confirm.focus();
  await page.keyboard.press('Enter');
  await expect(confirm).toBeDisabled();
  await expect(confirm).toHaveAttribute('aria-busy', 'true');
  release();
  await expect(actionStatus(page)).toBeFocused();
  await expect(actionStatus(page)).toContainText(
    'Your email address has been confirmed. Existing unsubscribe preferences remain in place.',
  );
  await expect(actionStatus(page)).toContainText('this does not resubscribe you');
  await expect(actionStatus(page).getByRole('link', { name: 'orders@blackboxrecordsathens.com' })).toHaveAttribute(
    'href',
    'mailto:orders@blackboxrecordsathens.com',
  );
  await expect(confirm).toBeHidden();
  expect(bodies).toEqual([{ token }]);
});

for (const [status, message] of [
  [400, 'This confirmation link has expired or was already used. Sign up again to get a new one.'],
  [503, "We couldn't confirm right now. Wait an hour, then sign up again for a fresh link."],
] as const) {
  test(`a newsletter ${status} answer is final and never resubmits the token`, async ({ page }) => {
    const bodies = await stub(page, '/api/newsletter/confirmations', [{ status }]);
    await open(page, newsletterLink);
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(actionError(page)).toHaveText(message);
    await expect(actionError(page)).toBeFocused();
    await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeHidden();
    expect(bodies).toHaveLength(1);
  });
}

test('a lost connection keeps Confirm available and busy only while submitting', async ({ page }) => {
  const bodies = await stub(page, '/api/newsletter/confirmations', [
    'offline',
    { status: 200, json: { status: 'confirmed' } },
  ]);
  await open(page, newsletterLink);
  const confirm = page.getByRole('button', { name: 'Confirm', exact: true });
  await confirm.click();
  await expect(actionError(page)).toHaveText("Couldn't reach BlackBox Records. Check your connection and try again.");
  await expect(confirm).toBeEnabled();
  await expect(confirm).not.toHaveAttribute('aria-busy', /.*/);
  await confirm.click();
  await expect(actionStatus(page)).toContainText('Your email address has been confirmed.');
  await expect(actionError(page)).toBeEmpty();
  expect(bodies).toEqual([{ token }, { token }]);
});

test('a withdrawal link withdraws on request and still offers a new link @phone', async ({ page }) => {
  const bodies = await stub(page, '/api/availability-alerts/withdrawals', [
    { status: 200, json: { status: 'withdrawn' } },
  ]);
  await open(page, withdrawalLink);
  expect(new URL(page.url()).hash).toBe('');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Availability alerts');
  await expect(page.getByText('Stop all pending availability alerts for this email address.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Request a new link' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(bodies).toEqual([]);

  await page.getByRole('button', { name: 'Withdraw pending alerts' }).click();
  await expect(actionStatus(page)).toBeFocused();
  await expect(actionStatus(page)).toContainText(
    'Withdrawal request processed. If this link was valid, pending alerts have been removed.',
  );
  await expect(actionStatus(page)).toContainText('An email already being sent may still arrive.');
  await expect(page.getByRole('button', { name: 'Withdraw pending alerts' })).toBeHidden();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(bodies).toEqual([{ token }]);
});

test('manage alerts opens the recovery form directly and it validates before sending', async ({ page }) => {
  const bodies = await stub(page, '/api/availability-alerts/withdrawal-links', [
    { status: 200, json: { status: 'requested' } },
    { status: 400 },
    { status: 503 },
  ]);
  await open(page, 'email-preferences/');
  await expect(page.getByRole('heading', { name: 'Request a new link' })).toBeVisible();
  await expect(page.getByText('This link is incomplete.')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Withdraw pending alerts' })).toBeHidden();

  const email = page.getByLabel('Email');
  const recoveryStatus = page.locator('[data-email-preferences-recovery-status]');
  const recoveryError = page.locator('[data-email-preferences-recovery-error]');
  await email.focus();
  await page.keyboard.press('Enter');
  await expect(recoveryError).toHaveText('Enter a valid email.');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAttribute('aria-describedby', 'email-preferences-recovery-error');
  await expect(email).toBeFocused();
  expect(bodies).toEqual([]);

  await email.fill(' fan@example.com ');
  await page.getByRole('button', { name: 'Send link' }).click();
  await expect(recoveryStatus).toBeFocused();
  await expect(recoveryStatus).toHaveText(
    "If email delivery is available, you'll receive a link to manage pending alerts. If you've just requested one, use the email already sent or try again later.",
  );
  await expect(email).not.toHaveAttribute('aria-invalid', /.*/);

  await page.getByRole('button', { name: 'Send link' }).click();
  await expect(recoveryError).toHaveText('Enter a valid email.');
  await expect(email).toBeFocused();
  await expect(recoveryStatus).toBeEmpty();

  await page.getByRole('button', { name: 'Send link' }).click();
  await expect(recoveryError).toHaveText("Couldn't send a link right now. Try again later.");
  await expect(recoveryError).toBeFocused();
  await expect(email).not.toHaveAttribute('aria-invalid', /.*/);
  expect(bodies).toEqual(Array(3).fill({ email: 'fan@example.com' }));
});

test('a malformed newsletter link posts nothing and points to a fresh sign-up', async ({ page, requests }) => {
  await open(page, `email-preferences/#action=newsletter&token=${token.slice(1)}`);
  expect(new URL(page.url()).hash).toBe('');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirm newsletter request');
  await expect(page.getByText('Sign up again from the newsletter form to get a new link.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm', exact: true })).toBeHidden();
  await page.waitForLoadState('networkidle');
  expect(requests.filter((request) => request.method() !== 'GET')).toEqual([]);
});

for (const width of [320, 390]) {
  test(`email-preference states fit ${width}px without horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of [newsletterLink, withdrawalLink, 'email-preferences/']) {
      await open(page, path);
      await expectNoHorizontalOverflow(page, `${path} at ${width}px`);
    }
    await page.getByLabel('Email').fill('x');
    // Enter submits too; a reused astro dev server's toolbar can cover the bottom of a short page.
    await page.getByLabel('Email').press('Enter');
    await expect(page.locator('[data-email-preferences-recovery-error]')).toHaveText('Enter a valid email.');
    const [field, button] = await Promise.all([
      page.getByLabel('Email').boundingBox(),
      page.getByRole('button', { name: 'Send link' }).boundingBox(),
    ]);
    // Phones stack the field over a full-width 44px action.
    expect(button!.y).toBeGreaterThan(field!.y);
    expect(Math.round(button!.height)).toBeGreaterThanOrEqual(44);
    expect(Math.round(field!.height)).toBe(44);
    expect(Math.round(button!.width)).toBe(Math.round(field!.width));
    await expectNoHorizontalOverflow(page);
  });
}
