import { expect, plantSentinel, sentinelIntact, test, waitForIsland, waitForShell, type Page } from './fixtures';

const artistsRow = (page: Page) => page.locator('#home-artists-row');
const artistsDots = (page: Page) => page.getByRole('group', { name: 'Artists position' }).getByRole('button');

// Distance of a card's left edge from the row's padding edge, which sits on the page gutter. Adding 0 turns -0 into 0.
const offsetFromGutter = (page: Page, index: number) =>
  artistsRow(page).evaluate(
    (row, cardIndex) =>
      Math.round(row.children[cardIndex].getBoundingClientRect().left - parseFloat(getComputedStyle(row).paddingLeft)) +
      0,
    index,
  );

test('phone rows swipe card by card, and their dots follow after shell navigation to Home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./about/');
  await waitForShell(page);
  await plantSentinel(page);

  await page.getByRole('banner').getByRole('link', { name: 'BlackBox Records' }).click();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await waitForIsland(page, 'swipe-row-dots');
  // waitForIsland returns once any dots island hydrates; both rows need theirs before a tap counts.
  await expect(page.locator('astro-island[component-url*="swipe-row-dots"][ssr]')).toHaveCount(0);

  const dots = artistsDots(page);
  const cardCount = await artistsRow(page).evaluate((row) => row.children.length);
  expect(cardCount).toBeGreaterThan(1);
  await expect(dots).toHaveCount(cardCount);
  await expect(dots.first()).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('group', { name: 'News position' })).toBeVisible();

  // The next card is partly visible and the page itself never scrolls sideways.
  const secondCardLeft = await artistsRow(page).evaluate((row) => row.children[1].getBoundingClientRect().left);
  expect(secondCardLeft).toBeLessThan(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await dots.nth(1).click();
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect.poll(() => offsetFromGutter(page, 1)).toBe(0);

  // A swipe to the end marks the last card.
  await artistsRow(page).evaluate((row) => row.scrollTo({ left: row.scrollWidth, behavior: 'instant' }));
  await expect(dots.last()).toHaveAttribute('aria-current', 'true');
  expect(await sentinelIntact(page)).toBe(true);
});

test('neighbouring cards fade on phones unless the visitor asks for reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await waitForShell(page);

  const opacity = (index: number) =>
    artistsRow(page).evaluate((row, cardIndex) => Number(getComputedStyle(row.children[cardIndex]).opacity), index);
  expect(await opacity(0)).toBe(1);
  if (await page.evaluate(() => CSS.supports('animation-timeline: view()'))) {
    expect(await opacity(1)).toBeLessThan(0.7);
  } else {
    // Without scroll timelines (Firefox) the guarded fade never applies, so no card stays dimmed.
    expect(await opacity(1)).toBe(1);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => opacity(1)).toBe(1);
});

test('wider viewports keep the grids without dots', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('./');
  await waitForShell(page);

  const columns = await artistsRow(page).evaluate((row) => getComputedStyle(row).gridTemplateColumns.split(' ').length);
  expect(columns).toBeGreaterThan(1);
  await expect(page.getByRole('group', { name: 'Artists position' })).toBeHidden();
  await expect(page.getByRole('group', { name: 'News position' })).toBeHidden();
});
