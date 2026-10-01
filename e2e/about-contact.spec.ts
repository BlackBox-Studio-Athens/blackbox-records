import type { Page } from 'playwright/test';

import { expect, test, waitForShell } from './fixtures';

const addresses = [
  'info@blackboxrecordsathens.com',
  'demos@blackboxrecordsathens.com',
  'touring@blackboxrecordsathens.com',
];
const touring = 'touring@blackboxrecordsathens.com';

async function copyTouringAddress(page: Page) {
  const contact = page.locator('main .about-contact');
  const copy = contact.getByRole('button', { name: `Copy ${touring}` });
  // A snapshot cached during the feedback window must come back idle.
  await expect(copy).not.toHaveAttribute('data-copied');
  await expect(contact.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(0);
  await page.evaluate(() => navigator.clipboard.writeText(''));

  await copy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(touring);
  await expect(copy).toHaveAttribute('data-copied', '');
  await expect(copy.locator('svg.lucide-check')).toBeVisible();
  await expect(contact.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
}

test('About contact rows keep mailto links and copy their address after shell navigation', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./');
  await waitForShell(page);
  const primary = page.getByRole('navigation', { name: 'Primary' });

  await primary.getByRole('link', { name: 'Who we are' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  for (const address of addresses) {
    await expect(page.locator(`main a.about-contact__link[href="mailto:${address}"]`)).toContainText(address);
  }
  await copyTouringAddress(page);

  // Leave inside the two-second feedback window, then return to the cached About snapshot.
  await primary.getByRole('link', { name: 'Releases' }).click();
  await expect(page).toHaveURL(/\/releases\/$/);
  await primary.getByRole('link', { name: 'Who we are' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await copyTouringAddress(page);
});
