import { expect, type Page, plantSentinel, press, sentinelIntact, test, waitForShell } from './fixtures';

// The retained Local source carries BlackBox Showcase Vol. I (Saturday 5 December 2026). After that date the
// placements leave the site; live-show.test.ts covers that switch with fixed clocks.
test.skip(new Date() >= new Date('2026-12-05T22:00:00Z'), 'The Vol. I fixture has passed in Athens.');

const tickets = 'https://www.more.com/gr-el/tickets/music/offer/sidus-afterwise-double-release-live-show-hylas/';
const strip = (page: Page) => page.locator('[data-show-strip]');

async function stripIsOneLineAboveMain(page: Page) {
  const box = (await strip(page).boundingBox())!;
  expect(box.height).toBe(36);
  const header = (await page.locator('header').first().boundingBox())!;
  const heading = (await page.locator('main h1, main h2').first().boundingBox())!;
  expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
}

test('the strip is one line linking to tickets, with the lineup on desktop only @phone', async ({ page, isMobile }) => {
  await page.goto('releases/');
  await waitForShell(page);
  await expect(strip(page)).toHaveAttribute('href', tickets);
  await expect(strip(page)).toHaveAttribute('target', '_blank');
  await expect(strip(page)).toHaveAccessibleName(/BlackBox Showcase Vol\. I, Sat 05 Dec 2026.*More\.com/);
  await expect(strip(page)).toContainText('Live · Sat 05 Dec');
  await expect(strip(page)).toContainText('AN Club');
  await expect(strip(page).locator('.show-strip__lineup')).toBeVisible({ visible: !isMobile });
  await stripIsOneLineAboveMain(page);
});

test('the strip persists through shell navigation and an overlay while the player plays', async ({
  page,
  isMobile,
}) => {
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('');
  await waitForShell(page);
  await plantSentinel(page);
  const original = await strip(page).elementHandle();

  await press(page.locator('header [data-nav-link="/releases/"]'), isMobile);
  await expect(page).toHaveURL(/\/releases\/$/);
  await press(page.locator('[data-music-streaming-service-embedded-player-trigger]').first(), isMobile);
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  // As in player-continuity.spec.ts: the lazy header can steal focus from the iframe until it has mounted.
  const modal = page.getByRole('dialog', { name: 'Music player' });
  await expect(modal.locator('.music-streaming-service-embedded-player-provider-switcher')).toBeAttached();
  await expect(modal.getByRole('button', { name: 'Close player', exact: true })).toBeFocused();
  await press(iframe.contentFrame().getByRole('button', { name: 'Player fixture' }), isMobile);
  await press(page.getByRole('button', { name: 'Minimize player' }), isMobile);
  const player = await iframe.elementHandle();

  await press(page.locator('a.release-card-title-link[href*="/releases/"]').first(), isMobile);
  await expect(page.getByRole('dialog').locator('[data-app-shell-overlay-kind="releases"]')).toBeVisible();
  await expect(strip(page)).toBeVisible();
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
  expect(await player!.evaluate((element) => element.isConnected)).toBe(true);
  expect(await sentinelIntact(page)).toBe(true);
});

test('Home shows the whole poster beside the facts and links to tickets @phone', async ({ page, isMobile }) => {
  await page.goto('');
  const section = page.locator('.home-show-section');
  await expect(section.getByRole('heading', { name: 'BlackBox Showcase Vol. I' })).toBeVisible();
  // Live sits directly before News.
  await expect(page.locator('.home-show-section + .home-news-section')).toHaveCount(1);
  const poster = section.locator('[data-show-poster]');
  await poster.scrollIntoViewIfNeeded();
  await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete)).toBe(true);
  const ratio = await poster.evaluate((image: HTMLImageElement) => ({
    shown: image.clientWidth / image.clientHeight,
    natural: image.naturalWidth / image.naturalHeight,
  }));
  expect(Math.abs(ratio.shown - ratio.natural)).toBeLessThan(0.02);
  await expect(section.getByRole('link', { name: /^Get tickets/ })).toHaveAttribute('href', tickets);
  await expect(section.getByRole('link', { name: /^Facebook event/ })).toHaveAttribute(
    'href',
    'https://www.facebook.com/events/1446071347664122/',
  );
  await expect(section.getByRole('link', { name: 'Sidus', exact: true })).toHaveAttribute(
    'href',
    /\/artists\/sidus\/$/,
  );
  await expect(section.getByText('Hylas')).toBeVisible();
  await expect(section.getByRole('link', { name: 'Hylas' })).toHaveCount(0);
  const posterBox = (await poster.boundingBox())!;
  const titleBox = (await section.getByRole('heading', { name: 'BlackBox Showcase Vol. I' }).boundingBox())!;
  // Beside the facts on desktop, stacked above them on phones.
  if (isMobile) expect(titleBox.y).toBeGreaterThan(posterBox.y + posterBox.height);
  else expect(titleBox.x).toBeGreaterThan(posterBox.x + posterBox.width);
});

test('lineup Artist pages show their next show; others do not', async ({ page }) => {
  await page.goto('artists/sidus/');
  const box = page.locator('[data-artist-next-show]');
  await expect(box).toContainText('LOTUS release show');
  await expect(box).toContainText('BlackBox Showcase Vol. I');
  await expect(box).toContainText('AN Club, Athens · with Afterwise · Hylas opens · Doors 20:00');
  await expect(box.getByRole('link', { name: /^Tickets from €10/ })).toHaveAttribute('href', tickets);

  await page.goto('artists/ouranopithecus/');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('[data-artist-next-show]')).toHaveCount(0);
});

// Local LOTUS has no Store Item, so its Pre-order action is checked on UAT; the line adds no commerce markup.
test('LOTUS on Releases mentions its release show after its description', async ({ page }) => {
  await page.goto('releases/');
  const line = page.locator('[data-release-show-line]').first();
  await expect(line).toHaveText('Release show · Sat 05 Dec, AN Club');
  await expect(line).toHaveAttribute('href', tickets);
  const card = line.locator('xpath=ancestor::*[.//*[@data-release-summary]][1]');
  await expect(card.getByText('LOTUS', { exact: true }).first()).toBeVisible();
  const summaryBeforeLine = await card.evaluate((element) => {
    const summary = element.querySelector('[data-release-summary]')!;
    const showLine = element.querySelector('[data-release-show-line]')!;
    return !!(summary.compareDocumentPosition(showLine) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(summaryBeforeLine).toBe(true);
  await expect(line.locator('[data-release-commerce], form, button')).toHaveCount(0);
});
