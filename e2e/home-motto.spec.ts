import { expect, plantSentinel, sentinelIntact, test, waitForShell, type Page } from './fixtures';

// Local content keeps an older motto; show the hosted one before the page scripts run so its last word can cycle.
// Fulfilling the document from a route instead would fail Chrome's local network check for the dev server socket.
async function serveHostedMotto(page: Page) {
  await page.addInitScript(() => {
    new MutationObserver((_, observer) => {
      const paragraph = document.querySelector('[data-content-path="hero.tagline"] p');
      if (paragraph?.textContent !== 'Fine music on record.') return;
      paragraph.innerHTML = 'No borders.<br>No genres.<br>Just records.';
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
}

const shownWord = (page: Page) =>
  page
    .locator('.motto-word-cycle__word:not([data-hidden])')
    .evaluateAll((words) => words.map((word) => word.textContent));

test('the motto opens on Records, scrubs through Art and Noise, and keeps cycling after shell navigation', async ({
  page,
}) => {
  await serveHostedMotto(page);
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);

  const tagline = page.locator('[data-content-path="hero.tagline"]');
  await expect(tagline).toHaveText(/No borders\.\s*No genres\.\s*Just records\./i);
  // A slow load can reach the first scrub, which shows Records with Art behind the playhead.
  expect((await shownWord(page))[0]).toBe('records.');
  await expect.poll(() => shownWord(page), { timeout: 8_000 }).toEqual(['art.']);
  // Screen readers keep the written motto rather than following the animation.
  await expect(tagline).toHaveText(/Just records\./i);

  const primary = page.getByRole('navigation', { name: 'Primary' });
  await primary.getByRole('link', { name: 'Who we are' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await page.getByRole('banner').getByRole('link', { name: 'BlackBox Records' }).click();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await expect(page.locator('.motto-word-cycle__stage')).toHaveCount(1);
  const returned = (await shownWord(page))[0];
  await expect.poll(() => shownWord(page), { timeout: 8_000 }).not.toEqual([returned]);
  expect(await sentinelIntact(page)).toBe(true);
});

test('a visitor who arrives elsewhere sees the motto cycle after shell navigation to Home', async ({ page }) => {
  await serveHostedMotto(page);
  await page.goto('./about/');
  await waitForShell(page);
  await plantSentinel(page);

  await page.getByRole('banner').getByRole('link', { name: 'BlackBox Records' }).click();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await expect(page.locator('.motto-word-cycle__stage')).toHaveCount(1);
  await expect.poll(() => shownWord(page), { timeout: 8_000 }).toEqual(['art.']);
  expect(await sentinelIntact(page)).toBe(true);
});

test('reduced motion keeps the written word', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await serveHostedMotto(page);
  await page.goto('./');
  await waitForShell(page);
  await page.waitForTimeout(5_500);
  expect(await shownWord(page)).toEqual(['records.']);
  expect(await page.locator('.motto-word-cycle__playhead:not([data-hidden])').count()).toBe(0);
});
