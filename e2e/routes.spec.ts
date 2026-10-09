import { publicSmokeRoutes } from '../scripts/smoke-core';
import { expect, localRepresentativePaths, test } from './fixtures';

for (const [route, expectedText] of publicSmokeRoutes(localRepresentativePaths)) {
  test(`renders ${route}`, async ({ page }) => {
    // A relative path keeps the /blackbox-records/ base path.
    const response = await page.goto(`.${route}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main[data-app-shell-main]')).toBeVisible();
    for (const text of expectedText) {
      await expect(page.locator('body')).toContainText(text, { ignoreCase: true });
    }
    // Below the md breakpoint every text control is at least 16px, so iOS Safari does not zoom the page on focus.
    if ((page.viewportSize()?.width ?? 0) < 768) {
      const smallControls = await page
        .locator('input:not([type="checkbox"], [type="radio"], [type="hidden"]), select, textarea')
        .evaluateAll((controls) =>
          controls
            // Shadow-root controls belong to dev tooling such as the Astro toolbar, not the site.
            .filter(
              (control) =>
                control.getRootNode() === document && Number.parseFloat(getComputedStyle(control).fontSize) < 16,
            )
            .map((control) => control.getAttribute('aria-label') ?? control.getAttribute('name') ?? control.className),
        );
      expect(smallControls).toEqual([]);
    }
  });
}
