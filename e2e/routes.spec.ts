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

      // Phone label and meta text keeps a 12px floor; desktop sizes are unchanged.
      const smallText = await page.locator('main[data-app-shell-main], footer').evaluateAll((roots) =>
        roots.flatMap((root) => {
          const found: string[] = [];
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const parent = node.parentElement;
            const text = node.textContent?.trim();
            if (!parent || !text || parent.closest('svg')) continue;
            if (!parent.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
            const size = Number.parseFloat(getComputedStyle(parent).fontSize);
            if (size < 12) found.push(`${size}px ${parent.className || parent.tagName}: ${text.slice(0, 40)}`);
          }
          return found;
        }),
      );
      expect(smallText).toEqual([]);
    }
  });
}
