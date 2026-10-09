import { test, expect, waitForIsland } from './fixtures';

test('withdrawal review, edit, explicit confirmation and durable receipt work without a buyer account', async ({
  page,
}) => {
  let sent: Record<string, unknown> | null = null;
  await page.route('**/api/store/withdrawals', async (route) => {
    sent = route.request().postDataJSON();
    const body = sent!;
    await route.fulfill({
      json: {
        status: 'received',
        receiptId: body.submissionId,
        submittedAt: '2026-10-09T10:00:00.000Z',
        receiptText: `BlackBox Records — withdrawal received\n${body.name}\n${body.contract}\n${body.email}\n2026-10-09T10:00:00.000Z`,
      },
    });
  });
  await page.goto('withdrawal/');
  await waitForIsland(page, 'WithdrawalForm');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/withdraw from an order/i);
  await page.getByLabel('Full name', { exact: true }).fill('Test Buyer');
  await page.getByLabel('Order reference or identifying details').fill('The vinyl record I ordered last Friday');
  await page.getByLabel('Email for your acknowledgement').fill('buyer@example.com');
  await page.getByRole('button', { name: 'Review withdrawal' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Review your withdrawal' })).toBeFocused();
  expect(sent).toBeNull();
  await page.getByRole('button', { name: 'Edit details' }).click();
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Test Buyer');
  await page.getByRole('button', { name: 'Review withdrawal' }).click();
  await page.getByRole('button', { name: 'Confirm withdrawal' }).click();
  await expect(page.getByRole('heading', { name: 'Withdrawal received' })).toBeFocused();
  expect(sent).toMatchObject({
    confirmed: true,
    name: 'Test Buyer',
    email: 'buyer@example.com',
    contract: 'The vinyl record I ordered last Friday',
  });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download withdrawal receipt' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^blackbox-withdrawal-.*\.txt$/);
  expect(await download.failure()).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('withdrawal retry reuses submission identity and keeps email fallback visible', async ({ page }) => {
  const ids: string[] = [];
  await page.route('**/api/store/withdrawals', async (route) => {
    ids.push(route.request().postDataJSON().submissionId);
    // A lost/truncated response is retryable without an expected browser network-console error.
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{' });
  });
  await page.goto('withdrawal/');
  await waitForIsland(page, 'WithdrawalForm');
  await page.getByLabel('Full name', { exact: true }).fill('Test Buyer');
  await page.getByLabel('Order reference or identifying details').fill('BBR-EXAMPLE');
  await page.getByLabel('Email for your acknowledgement').fill('buyer@example.com');
  await page.getByRole('button', { name: 'Review withdrawal' }).click();
  await page.getByRole('button', { name: 'Confirm withdrawal' }).click();
  await expect(page.getByRole('alert')).toContainText('email orders@blackboxrecordsathens.com');
  await page.getByRole('button', { name: 'Confirm withdrawal' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(ids).toHaveLength(2);
  expect(ids[0]).toBe(ids[1]);
  await expect(page.getByRole('link', { name: 'orders@blackboxrecordsathens.com', exact: true })).toHaveAttribute(
    'href',
    'mailto:orders@blackboxrecordsathens.com',
  );
});
