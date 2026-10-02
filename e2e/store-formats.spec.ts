import { expect, test, waitForShell } from './fixtures';

test('phone Store shows Distro formats without opening a disclosure and selects one', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('store/distro/');
  await waitForShell(page);
  // The search control renders once the Distro enhancement is connected.
  await expect(page.locator('[data-distro-search] input')).toBeVisible();

  const formats = page.getByRole('navigation', { name: 'Browse Distro formats' });
  const cds = formats.getByRole('link', { name: /^CDs/ });
  await expect(cds).toBeVisible();
  await expect(formats.getByRole('link', { name: /^All formats/ })).toHaveAttribute('aria-current', 'true');

  await cds.click();
  await expect(cds).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-distro-search-group]:visible')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'CDs', level: 2 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
