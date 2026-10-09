import { publicSmokeRoutes } from '../scripts/smoke-core';
import { expect, expectNoHorizontalOverflow, localRepresentativePaths, test } from './fixtures';

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

// WCAG 2.5.8 Target Size (Minimum): pointer targets are at least 24 by 24 CSS px. Exempt by the standard: a link
// inside a sentence or block of text (inline). Visually hidden controls (sr-only, 1px) defer to their visible label.
const minimumTarget = 24;

for (const [route] of publicSmokeRoutes(localRepresentativePaths)) {
  test(`phone sweep of ${route} keeps the page width and 24px targets @phone`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`.${route}`);
    await expect(page.locator('main[data-app-shell-main]')).toBeVisible();
    // Resized in place: a second navigation would abort the first page's lazy reads, which WebKit logs as errors.
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await expectNoHorizontalOverflow(page, `${route} at ${viewport.width}px scrolls sideways`);
      const smallTargets = await page
        .locator('a[href], button, [role="button"], input:not([type="hidden"]), select, textarea')
        .evaluateAll((targets, minimum) => {
          const inlineInText = (target: Element) => {
            if (target.tagName !== 'A' || getComputedStyle(target).display !== 'inline') return false;
            const block = target.parentElement;
            return Boolean(
              block &&
              [...block.childNodes].some(
                (node) => node !== target && node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
              ),
            );
          };
          return targets
            .filter((target) => target.getRootNode() === document)
            .filter((target) => !target.closest('[inert], [aria-hidden="true"]'))
            .filter((target) => target.checkVisibility({ visibilityProperty: true, opacityProperty: true }))
            .flatMap((target) => {
              const box = target.getBoundingClientRect();
              if (box.width <= 1 || box.height <= 1 || inlineInText(target)) return [];
              // An absolutely positioned ::before or ::after halo widens the hit area beyond the box.
              const [width, height] = ['::before', '::after'].reduce(
                ([w, h], pseudo) => {
                  const style = getComputedStyle(target, pseudo);
                  if (style.content === 'none' || style.position !== 'absolute') return [w, h];
                  return [
                    Math.max(w, Number.parseFloat(style.width) || 0),
                    Math.max(h, Number.parseFloat(style.height) || 0),
                  ];
                },
                [box.width, box.height],
              );
              if (width >= minimum && height >= minimum) return [];
              const name = (target.getAttribute('aria-label') ?? target.textContent ?? '').trim().slice(0, 30);
              const label = `${target.tagName.toLowerCase()}.${String(target.className).split(' ')[0]} "${name}"`;
              return [`${label} ${Math.round(width)}x${Math.round(height)}`];
            });
        }, minimumTarget);
      expect(smallTargets, `${route} at ${viewport.width}px`).toEqual([]);
    }
  });
}
