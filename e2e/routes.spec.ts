import { publicSmokeRoutes } from '../scripts/smoke-core';
import { expect, test } from './fixtures';

for (const [route, expectedText] of publicSmokeRoutes) {
  test(`renders ${route}`, async ({ page }) => {
    // A relative path keeps the /blackbox-records/ base path.
    const response = await page.goto(`.${route}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main[data-app-shell-main]')).toBeVisible();
    for (const text of expectedText) {
      await expect(page.locator('body')).toContainText(text, { ignoreCase: true });
    }
  });
}
