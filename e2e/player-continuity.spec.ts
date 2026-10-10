import { expect, type Page, plantSentinel, press, sentinelIntact, test, waitForShell } from './fixtures';

// Provider embeds are replaced by a local fixture, as in apps/backend/scripts/smoke-content-preview.mjs.
const providerEmbeds = /^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//;
// The fixture is a focusable <button>; real Bandcamp and Tidal controls are not, so focus and tap handling inside
// a real embed stay unverified here.

/** Opens a shell section through the header on desktop and through the Menu on phones. */
async function openSection(page: Page, name: string, phone: boolean) {
  if (phone) await press(page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true }), true);
  const navigation = page.getByRole('navigation', { name: phone ? 'Mobile' : 'Primary' });
  await press(navigation.getByRole('link', { name, exact: true }), phone);
}

test('player survives shell navigation, minimize/reopen and history; Stop destroys it', async ({ page, isMobile }) => {
  test.setTimeout(180_000);
  await page.route(providerEmbeds, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);

  await press(page.locator('[data-music-streaming-service-embedded-player-trigger]').first(), isMobile);
  const modal = page.getByRole('dialog', { name: 'Music player' });
  await expect(modal).toBeVisible();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  // Real embed interaction is what turns close into minimize.
  await press(iframe.contentFrame().getByRole('button', { name: 'Player fixture' }), isMobile);
  await press(page.getByRole('button', { name: 'Minimize player' }), isMobile);
  await expect(modal).toBeHidden();
  const originalIframe = await iframe.elementHandle();
  const isOriginalIframeConnected = () => originalIframe.evaluate((element) => element.isConnected);

  await openSection(page, 'Store', isMobile);
  // The local server renders a complete Store document before the shell can commit this route.
  await expect(page).toHaveURL(/\/store\/$/, { timeout: 60_000 });
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  expect(await isOriginalIframeConnected()).toBe(true);

  await press(page.getByRole('button', { name: 'Open player' }), isMobile);
  await expect(modal).toBeVisible();
  expect(await isOriginalIframeConnected()).toBe(true);
  await press(page.getByRole('button', { name: 'Minimize player' }), isMobile);
  await expect(modal).toBeHidden();

  await page.goBack();
  await expect(page).toHaveURL(/\/releases\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Releases' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
  expect(await isOriginalIframeConnected()).toBe(true);

  // Stop asks once in place: the first press arms it (Stop?), the second ends the session.
  const stop = page.getByRole('button', { name: 'Stop player' });
  await press(stop, isMobile);
  await expect(stop).toHaveText('Stop?');
  await expect(iframe).toHaveCount(1);
  await press(stop, isMobile);
  await expect(iframe).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open player' })).toBeHidden();
});

test('Back closes the open player without moving the page beneath; its controls leave no extra entry', async ({
  page,
  isMobile,
}) => {
  // A short desktop window leaves the last trigger below the fold; a phone's own height does.
  if (!isMobile) await page.setViewportSize({ width: 1280, height: 400 });
  await page.route(providerEmbeds, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('artists/');
  await waitForShell(page);
  await openSection(page, 'Releases', isMobile);
  await expect(page.getByRole('heading', { level: 1, name: 'Releases' })).toBeVisible();

  const trigger = page.locator('[data-music-streaming-service-embedded-player-trigger]').last();
  await press(trigger, isMobile);
  const modal = page.getByRole('dialog', { name: 'Music player' });
  await expect(modal).toBeVisible();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await press(iframe.contentFrame().getByRole('button', { name: 'Player fixture' }), isMobile);
  // The shell has registered the embed interaction once dismissing means minimize.
  await expect(page.getByRole('button', { name: 'Minimize player' })).toBeVisible();
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(0);

  // Android's Back key and the browser's Back both traverse history.
  await page.goBack();
  await expect(modal).toBeHidden();
  await expect(page).toHaveURL(/\/releases\/$/);
  await expect(page.getByRole('button', { name: 'Open player' })).toBeVisible();
  // Routing the unchanged URL again would scroll to the top and focus main.
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollY)).toBeLessThanOrEqual(2);

  await press(page.getByRole('button', { name: 'Open player' }), isMobile);
  await expect(modal).toBeVisible();
  await press(page.getByRole('button', { name: 'Minimize player' }), isMobile);
  await expect(modal).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/artists\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Artists' })).toBeVisible();
});

test('on phones the floating player leaves the page end and the Menu reachable; landscape fits the embed', async ({
  page,
  hasTouch,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(providerEmbeds, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('releases/');
  await waitForShell(page);

  await press(page.locator('[data-music-streaming-service-embedded-player-trigger]').first(), hasTouch);
  const modal = page.getByRole('dialog', { name: 'Music player' });
  await expect(modal).toBeVisible();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await press(iframe.contentFrame().getByRole('button', { name: 'Player fixture' }), hasTouch);
  await press(page.getByRole('button', { name: 'Minimize player' }), hasTouch);
  await expect(modal).toBeHidden();
  const miniPlayer = page.locator('.music-streaming-service-embedded-player-mini-player');
  await expect(miniPlayer).toHaveAttribute('data-state', 'open');

  // At the page end the footer scrolls clear of the floating player.
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect
    .poll(() =>
      page.evaluate(() => {
        const footer = document.querySelector('footer')!.getBoundingClientRect();
        const mini = document
          .querySelector('.music-streaming-service-embedded-player-mini-player')!
          .getBoundingClientRect();
        return footer.bottom <= mini.top;
      }),
    )
    .toBe(true);

  // The Menu sheet stacks above the floating player, so its Close button takes the tap.
  await press(page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true }), hasTouch);
  const menuClose = page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Close', exact: true });
  await expect(menuClose).toBeVisible();
  // Polled: the sheet slides in from the side, so its Close starts outside the viewport.
  await expect
    .poll(() =>
      menuClose.evaluate((button) => {
        const { x, y, width, height } = button.getBoundingClientRect();
        return button.contains(document.elementFromPoint(x + width / 2, y + height / 2));
      }),
    )
    .toBe(true);
  await press(menuClose, hasTouch);
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();

  // A landscape phone shows the whole embed and the dismiss control without scrolling the card.
  await page.setViewportSize({ width: 844, height: 390 });
  await press(page.getByRole('button', { name: 'Open player' }), hasTouch);
  await expect(modal).toBeVisible();
  const geometry = await modal.evaluate((card) => {
    const frame = card
      .querySelector('[data-music-streaming-service-embedded-player-iframe][data-state="active"]')!
      .getBoundingClientRect();
    const dismiss = card
      .querySelector('[data-music-streaming-service-embedded-player-modal-dismiss]')!
      .getBoundingClientRect();
    return {
      cardScrolls: card.scrollHeight > card.clientHeight + 1,
      frameBottom: frame.bottom,
      dismissBottom: dismiss.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.cardScrolls).toBe(false);
  expect(geometry.frameBottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.dismissBottom).toBeLessThanOrEqual(geometry.viewportHeight);
});
