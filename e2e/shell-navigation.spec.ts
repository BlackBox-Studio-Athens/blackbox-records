import {
  expect,
  openSurfaceWithinClickTask,
  plantSentinel,
  sentinelIntact,
  test,
  waitForShell,
  watchSurfaceWarmup,
} from './fixtures';

const main = 'main[data-app-shell-main]';

test('News sits before Who we are and preserves the player through navigation and article overlays', async ({
  page,
  isMobile,
}) => {
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);

  await page.locator('[data-music-streaming-service-embedded-player-trigger]').first().click();
  const player = page.getByRole('dialog', { name: 'Music player' });
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture' }).click();
  await page.getByRole('button', { name: 'Minimize player' }).click();
  await expect(player).toBeHidden();
  const originalIframe = await iframe.elementHandle();

  const menu = page.locator('[data-app-shell-mobile-navigation-trigger]');
  if (isMobile) await menu.click();
  const navigation = page.getByRole('navigation', { name: isMobile ? 'Mobile' : 'Primary' });
  const news = navigation.getByRole('link', { name: 'News', exact: true });
  await expect(navigation.getByRole('link').last()).toHaveText('Who we are');
  await news.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/blackbox-records\/news\/$/);
  await expect(page.locator(main).getByRole('heading', { level: 1, name: 'News' })).toBeVisible();
  await expect(page.locator(main)).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('header [data-nav-link="/news/"]')).toHaveAttribute('aria-current', 'page');
  if (isMobile) {
    await expect(navigation).toBeHidden();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  }
  await expect(page.locator('footer').getByRole('link', { name: 'News', exact: true })).toHaveCount(0);

  await page.locator(`${main} a.prose-card-link[href*="/news/"]`).first().click();
  const article = page.getByRole('dialog');
  await expect(article.locator('[data-app-shell-overlay-kind="news"]')).toBeVisible();
  await page.getByRole('button', { name: 'Close detail view' }).click();
  await expect(article).toBeHidden();
  await expect(page).toHaveURL(/\/blackbox-records\/news\/$/);
  await expect(page.locator('header [data-nav-link="/news/"]')).toHaveAttribute('aria-current', 'page');
  expect(await sentinelIntact(page)).toBe(true);
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);

  await page.getByRole('button', { name: 'Open player' }).click();
  await expect(player).toBeVisible();
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);
});

test('News precedes Who we are and the main navigation fits phone and desktop widths', async ({ page }) => {
  for (const width of [320, 390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('news/');
    await waitForShell(page);
    if (width < 1024) await page.locator('[data-app-shell-mobile-navigation-trigger]').click();
    const navigation = page.getByRole('navigation', { name: width < 1024 ? 'Mobile' : 'Primary' });
    const links = navigation.getByRole('link');
    await expect(links).toHaveText([
      ...(width < 1024 ? ['Home'] : []),
      'Artists',
      'Releases',
      'Store',
      'Services',
      'News',
      'Who we are',
    ]);
    await expect(links.nth(-2)).toHaveAttribute('aria-current', 'page');
    await expect
      .poll(async () => {
        const box = await navigation.boundingBox();
        return box ? box.x + box.width : Infinity;
      })
      .toBeLessThanOrEqual(width);
    for (const link of await links.all()) {
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      if (width < 1024) expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('header section link swaps main in place and shows the delayed Store status', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The primary header navigation is desktop only.');
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);
  // Delay only the shell's fetch of the Store page so the 750 ms "Loading Store" feedback is deterministic.
  await page.route('**/blackbox-records/store/', async (route) => {
    if (route.request().resourceType() === 'fetch') {
      await new Promise((resolve) => setTimeout(resolve, 1_200));
    }
    await route.continue();
  });

  const storeLink = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Store' });
  await storeLink.click();
  const routeStatus = page.locator('.app-shell-route-loading-indicator');
  await expect(routeStatus.getByText('Loading Store')).toBeVisible();
  await expect(routeStatus.getByText('Loading Store')).toBeHidden();
  await expect(routeStatus).toHaveAttribute('data-state', 'closed');

  await expect(page).toHaveURL(/\/blackbox-records\/store\/$/);
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  await expect(page.locator(main)).toBeFocused();
  await expect(storeLink).toHaveAttribute('aria-current', 'page');
  // The footer renders outside the swapped <main>; the shared sync keeps its current page in step.
  await expect(page.locator('footer').getByRole('link', { name: 'Store' })).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(await sentinelIntact(page)).toBe(true);
});

test('detail link opens an overlay that closes back to the list; a direct load renders the full page', async ({
  page,
}) => {
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);

  await page.locator('a.release-card-title-link[href*="/releases/"]').first().click();
  const overlay = page.getByRole('dialog');
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('[data-app-shell-overlay-kind="releases"]')).toBeVisible();
  await expect(page).toHaveURL(/\/releases\/[^/]+\/$/);
  const detailUrl = page.url();

  await page.getByRole('button', { name: 'Close detail view' }).click();
  await expect(overlay).toBeHidden();
  await expect(page).toHaveURL(/\/releases\/$/);
  expect(await sentinelIntact(page)).toBe(true);

  await page.goto(detailUrl);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator(main).getByRole('heading', { level: 1 })).toBeVisible();
});

test('detail-link intent warms the overlay panel so the overlay opens in the click task', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Hover intent is a desktop pointer behaviour.');
  const panelWarmed = watchSurfaceWarmup(page, 'ShellOverlayPanel');
  await page.goto('releases/');
  await waitForShell(page);
  const trigger = 'a.release-card-title-link[href*="/releases/"]';
  await page.locator(trigger).first().hover();
  await panelWarmed();

  expect(
    await openSurfaceWithinClickTask(page, trigger, '.app-shell-content-overlay[data-state="open"] [role="dialog"]'),
  ).toEqual({ loadingStatus: false, visible: true });
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  // The closed overlay unmounts once its exit transition ends.
  await expect(page.locator('.app-shell-content-overlay')).toHaveCount(0);
});

test('mobile navigation sheet drives shell navigation without horizontal overflow', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation only renders below the desktop breakpoint.');
  await page.goto('./');
  await waitForShell(page);
  await plantSentinel(page);

  // The open Menu hides the header from assistive technology, so read the button's state by its hook.
  const menuButton = page.locator('[data-app-shell-mobile-navigation-trigger]');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
  await expect(mobileNav).toBeVisible();

  const links = mobileNav.getByRole('link');
  await expect(links.first()).toHaveText('Home');
  await expect(links.first()).toHaveAttribute('aria-current', 'page');
  const store = mobileNav.getByRole('link', { name: 'Store' });
  expect(await store.getAttribute('aria-current')).toBeNull();
  await expect(store).toHaveCSS('border-left-width', '0px');
  await expect(store).not.toHaveCSS('color', 'rgb(207, 107, 128)');
  for (const target of [...(await links.all()), page.getByRole('button', { name: 'Close', exact: true })]) {
    expect((await target.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }

  await store.click();
  await expect(page).toHaveURL(/\/blackbox-records\/store\/$/);
  await expect(mobileNav).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  await expect(page.locator(main)).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await menuButton.click();
  await mobileNav.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await expect(mobileNav).toBeHidden();
  await expect(page.locator(main)).toBeFocused();
  expect(await sentinelIntact(page)).toBe(true);
});

test('Escape closes the Menu and returns focus to its button', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The Menu opens only below the desktop breakpoint.');
  await page.goto('./');
  await waitForShell(page);
  const menuButton = page.locator('[data-app-shell-mobile-navigation-trigger]');
  await menuButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(menuButton).toBeFocused();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});

test('a warmed Menu opens in the tap task', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The Menu opens only below the desktop breakpoint.');
  const menuWarmed = watchSurfaceWarmup(page, 'MobileNavigationSheet');
  await page.goto('about/');
  await waitForShell(page);
  const trigger = '[data-app-shell-mobile-navigation-trigger]';
  // The phone layout warms the Menu at idle; pointer intent starts it sooner.
  await page.locator(trigger).hover();
  await menuWarmed();

  expect(await openSurfaceWithinClickTask(page, trigger, '[data-app-shell-mobile-navigation]')).toEqual({
    loadingStatus: false,
    visible: true,
  });
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
  // Coarse pointers use native scrolling; the shell owns the viewport lock before the sheet mounts.
  await expect(page.locator('body')).toHaveClass(/\bis-shell-scroll-locked\b/);
  await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/\bis-shell-scroll-locked\b/);
});

test('the Menu closes when the desktop layout starts', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The Menu opens only below the desktop breakpoint.');
  await page.goto('./');
  await waitForShell(page);
  const menuButton = page.locator('[data-app-shell-mobile-navigation-trigger]');
  await menuButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});

test('footer sitemap wraps with touch-sized links on small phones', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch-sized sitemap links apply to the phone layout.');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('./');
    const sitemap = page.locator('.site-footer-nav-list');
    await sitemap.scrollIntoViewIfNeeded();
    const sitemapBox = await sitemap.boundingBox();
    for (const link of await sitemap.getByRole('link').all()) {
      const box = await link.boundingBox();
      expect(box?.height, `${width}px link height`).toBeGreaterThanOrEqual(44);
      expect((box?.x ?? 0) + (box?.width ?? 0), `${width}px link inside the sitemap`).toBeLessThanOrEqual(
        (sitemapBox?.x ?? 0) + (sitemapBox?.width ?? 0) + 0.5,
      );
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('capturing the live Store snapshot does not fetch its lazy images', async ({ page }) => {
  const imageRequests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'image') imageRequests.push(request.url());
  });
  await page.goto('store/');
  await waitForShell(page);
  // The shell snapshots the live page once the main thread is idle after mount (capped at 2 s); give any fetches that
  // clone starts time to appear.
  await page.waitForTimeout(2_500);

  const imageCount = await page.locator(`${main} img`).count();
  expect(imageCount).toBeGreaterThan(20);
  expect(imageRequests.length).toBeLessThan(imageCount / 2);
});

test('a quick mouse pass over the header prefetches nothing; resting on a link prefetches it', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Hover prefetch applies to mouse pointers on the desktop header.');
  await page.goto('about/');
  await waitForShell(page);
  const sectionFetches: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'fetch' && request.headers().accept === 'text/html') {
      sectionFetches.push(new URL(request.url()).pathname);
    }
  });

  // One synchronous sweep: each link is entered and left within the same task, well inside the dwell.
  await page.evaluate(() => {
    const links = document.querySelectorAll('nav[aria-label="Primary"] a[href]');
    for (const target of [...links, document.body]) {
      target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
    }
  });
  await page.waitForTimeout(400);
  expect(sectionFetches).toEqual([]);

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Artists' }).hover();
  await expect.poll(() => sectionFetches).toEqual(['/blackbox-records/artists/']);
});

test('a second click on a link whose page is still loading stays in the shell', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The primary header navigation is desktop only.');
  await page.goto('about/');
  await waitForShell(page);
  await plantSentinel(page);
  // Hold the shell's fetch so the second click lands while the first click's request is still in flight.
  await page.route('**/blackbox-records/artists/', async (route) => {
    if (route.request().resourceType() === 'fetch') {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    await route.continue();
  });

  // Clicked from script, so no hover or focus prefetch starts a request first: the second click must not join the
  // first click's aborted request and fall back to a full document load.
  await page.evaluate(() => {
    const link = document.querySelector<HTMLAnchorElement>('nav[aria-label="Primary"] a[href$="/artists/"]')!;
    link.click();
    setTimeout(() => link.click(), 60);
  });

  await expect(page).toHaveURL(/\/blackbox-records\/artists\/$/);
  await expect(page.locator(main).getByRole('heading', { level: 1 })).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
});
