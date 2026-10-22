import { expect, localRepresentativePaths, test, waitForShell } from './fixtures';
import type { Page } from 'playwright/test';

// Counts the characters actually rendered on each long paragraph's first line, as laid out in the browser.
async function charactersPerLine(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((paragraphs) =>
    paragraphs
      .filter((paragraph) => (paragraph.textContent ?? '').trim().length > 120)
      .map((paragraph) => {
        const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let firstTop: number | null = null;
        let count = 0;
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent ?? '';
          for (let index = 0; index < text.length; index += 1) {
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            const rect = range.getClientRects()[0];
            if (!rect || !text[index]!.trim()) {
              if (firstTop !== null) count += 1;
              continue;
            }
            firstTop ??= rect.top;
            if (rect.top > firstTop + rect.height / 2) return count;
            count += 1;
          }
        }
        return count;
      }),
  );
}

test('News articles read at a comfortable measure on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(localRepresentativePaths.news.replace(/^\//, ''));
  await waitForShell(page);
  await expect(page.locator('.news-markdown-content')).toHaveCSS('font-size', '16px');
  const measures = await charactersPerLine(page, '.news-markdown-content p');
  expect(measures.length).toBeGreaterThan(0);
  for (const measure of measures) (expect(measure).toBeGreaterThanOrEqual(60), expect(measure).toBeLessThanOrEqual(75));
});

test('About text keeps a readable measure on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('about/');
  await waitForShell(page);
  const measures = await charactersPerLine(page, '.rich-text-content p');
  expect(measures.length).toBeGreaterThan(0);
  for (const measure of measures) (expect(measure).toBeGreaterThanOrEqual(55), expect(measure).toBeLessThanOrEqual(75));
  // The contact directory fits the narrower column.
  const overflow = await page.locator('.about-contact__list').evaluate((list) => list.scrollWidth - list.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('News and About keep their phone layout @phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, card] of [
    [localRepresentativePaths.news, '.layout-container:has(.news-markdown-content) > *'],
    ['/about/', '.rich-text-content'],
  ] as const) {
    await page.goto(path.replace(/^\//, ''));
    await waitForShell(page);
    const { cardWidth, frameWidth } = await page
      .locator(card)
      .first()
      .evaluate((element) => {
        const frame = element.closest('.layout-container')!;
        const style = getComputedStyle(frame);
        return {
          cardWidth: element.closest('.surface-card')!.getBoundingClientRect().width,
          frameWidth: frame.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        };
      });
    expect(Math.round(cardWidth)).toBe(Math.round(frameWidth));
  }
});
