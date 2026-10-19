import {
  expect,
  expectNoHorizontalOverflow,
  openSurfaceWithinClickTask,
  plantSentinel,
  press,
  sentinelIntact,
  test,
  waitForShell,
  watchSurfaceWarmup,
} from './fixtures';

const main = 'main[data-app-shell-main]';

test('rapid Back and Forward cancel stale page swaps', async ({ page }) => {
  await page.goto('releases/');
  await waitForShell(page);
  await page.locator('header [data-nav-link="/store/"]').evaluate((element: HTMLElement) => element.click());
  await expect(page.locator('.store-crate')).toHaveAttribute('data-store-crate-ready', '');
  await page.goBack();
  await page.goForward();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.locator('.store-crate')).toHaveAttribute('data-store-crate-ready', '');
  await expect(page.getByRole('heading', { level: 1, name: 'Releases' })).toHaveCount(0);
});

test('Back preserves the scrolled release listing through nested details and Forward', async ({ page }) => {
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }));
  const offset = await page.evaluate(() => window.scrollY);
  expect(offset).toBeGreaterThan(100);
  const card = page.locator(`${main} a[href*="/releases/"]`).first();
  // Activate without Playwright scrolling the card into view first.
  await card.evaluate((element: HTMLElement) => element.click());
  const close = page.getByRole('button', { name: 'Close detail view' });
  await expect(close).toBeVisible();
  await page.goBack();
  await expect(close).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(offset, 0);
  await page.goForward();
  await expect(close).toBeVisible();
  await page.getByRole('dialog').locator('a[href*="/artists/"]').first().click();
  await expect(page).toHaveURL(/\/artists\/[^/]+\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/releases\/[^/]+\/$/);
  await page.goBack();
  await expect(close).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(offset, 0);
  await expect(card).toBeFocused();
  expect(await sentinelIntact(page)).toBe(true);
});

test('Back closes Crate, Forward restores it and Grid consumes its entry', async ({ page, isMobile }) => {
  // On phones Grid and Crate sit in the Filter sheet, which closes and consumes its own entry before the choice applies.
  const view = async (name: RegExp | string) => {
    if (isMobile) await page.locator('[data-store-filter-trigger]').click();
    await page.getByRole('button', { name, exact: typeof name === 'string' }).click();
    if (isMobile) await expect(page.locator('#store-filter-sheet')).toBeHidden();
  };
  await page.goto('releases/');
  await waitForShell(page);
  await page.locator('header [data-nav-link="/store/"]').evaluate((element: HTMLElement) => element.click());
  await expect(page).toHaveURL(/\/store\/$/);
  const crate = page.locator('.store-crate');
  await expect(crate).toHaveAttribute('data-store-crate-ready', '');
  await expect(page.locator('[data-store-search-toolbar]')).toHaveAttribute('data-store-search-ready', '');
  const offset = await page.evaluate(() => window.scrollY);
  await view(/^Crate/);
  await expect(crate).toHaveAttribute('data-store-crate', 'open');
  await page.goBack();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(crate).toHaveAttribute('data-store-crate', 'grid');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(offset, 0);
  await page.goForward();
  await expect(crate).toHaveAttribute('data-store-crate', 'open');
  await view('Grid');
  await expect(crate).toHaveAttribute('data-store-crate', 'grid');
  await page.goBack();
  await expect(page).toHaveURL(/\/releases\/$/);
});

test('Back closes the phone Filter sheet and every dismissal consumes its entry', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The Filter sheet is offered on phones.');
  await page.goto('releases/');
  await waitForShell(page);
  await page.locator('header [data-nav-link="/store/"]').evaluate((element: HTMLElement) => element.click());
  await expect(page).toHaveURL(/\/store\/$/);
  const trigger = page.locator('[data-store-filter-trigger]');
  const sheet = page.locator('#store-filter-sheet');
  await expect(page.locator('[data-store-search-toolbar]')).toHaveAttribute('data-store-search-ready', '');
  await trigger.click();
  await expect(sheet).toBeVisible();
  // The sheet borrows the format links and artists, and returns them on close.
  await expect(sheet.getByRole('navigation', { name: 'Browse Distro formats' })).toBeVisible();
  await expect(sheet.getByRole('group', { name: 'Artists' })).toBeVisible();
  const offset = await page.evaluate(() => window.scrollY);
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.locator('#store-artists-menu [data-store-artist-fieldset]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(offset, 0);
  await page.goForward();
  await expect(sheet).toBeVisible();
  for (const dismissal of ['done', 'close', 'escape', 'backdrop']) {
    if (dismissal === 'done') await sheet.locator('[data-store-filter-sheet-done]').click();
    else if (dismissal === 'close') await sheet.getByRole('button', { name: 'Close', exact: true }).click();
    else if (dismissal === 'escape') await page.keyboard.press('Escape');
    else await page.mouse.click(1, 1);
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.goBack();
    await expect(page).toHaveURL(/\/releases\/$/);
    if (dismissal !== 'backdrop') {
      await page.goForward();
      await expect(page).toHaveURL(/\/store\/$/);
      await expect(page.locator('.store-crate')).toHaveAttribute('data-store-crate-ready', '');
      await trigger.click();
      await expect(sheet).toBeVisible();
    }
  }
});

test('@phone Back closes the Filter sheet while the player is minimized and the player survives', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The Filter sheet is offered on phones.');
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('store/');
  await waitForShell(page);
  await expect(page.locator('[data-store-search-toolbar]')).toHaveAttribute('data-store-search-ready', '');
  await page.locator('.store-item-card__listen .music-listen-trigger').first().tap();
  const modal = page.getByRole('dialog', { name: 'Music player' });
  await expect(modal).toBeVisible();
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await iframe.contentFrame().getByRole('button', { name: 'Player fixture' }).tap();
  await page.getByRole('button', { name: 'Minimize player' }).tap();
  await expect(modal).toBeHidden();
  const original = await iframe.elementHandle();

  const sheet = page.locator('#store-filter-sheet');
  await page.locator('[data-store-filter-trigger]').tap();
  await expect(sheet).toBeVisible();
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.getByRole('button', { name: 'Open player' })).toBeVisible();
  expect(await original!.evaluate((frame) => frame.isConnected)).toBe(true);
});

test('Back closes full video, Forward restores it and Close consumes its entry', async ({ page }) => {
  // Supply a video to the real Home island independently of the local server's pre-order projection.
  await page.route(/\/blackbox-records\/(?:\?.*)?$/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text())
      .replaceAll('&quot;firstClipId&quot;:[0,null]', '&quot;firstClipId&quot;:[0,&quot;dQw4w9WgXcQ&quot;]')
      // This fixture changes the props, so mount this island client-only instead of hydrating mismatched SSR.
      .replace(
        /<astro-island\b[^>]*component-url="[^"]*StorePreorderShowcase[^>]*>/,
        (island) =>
          '<script>window.Astro ||= {}; window.Astro.only = async (load) => (await load())();</script>' +
          island.replace('client="load"', 'client="only"'),
      );
    await route.fulfill({ response, body });
  });
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ body: '<p>Video fixture</p>', contentType: 'text/html' }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  await page.goto('./');
  const watch = page.getByRole('button', { name: 'Watch full video', exact: true }).first();
  await expect(watch).toBeVisible();
  await watch.click();
  const close = page.getByRole('button', { name: 'Close video', exact: true });
  await expect(close).toBeVisible();
  await page.goBack();
  await expect(close).toBeHidden();
  await expect(watch).toBeFocused();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await page.goForward();
  await expect(close).toBeVisible();
  await close.click();
  await expect(close).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/releases\/$/);
});

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

  await press(page.locator('[data-music-streaming-service-embedded-player-trigger]').first(), isMobile);
  const player = page.getByRole('dialog', { name: 'Music player' });
  const iframe = page.locator('[data-music-streaming-service-embedded-player-iframe]');
  await expect(iframe).toHaveAttribute('data-music-streaming-service-embedded-player-load-state', 'loaded');
  await press(iframe.contentFrame().getByRole('button', { name: 'Player fixture' }), isMobile);
  await press(page.getByRole('button', { name: 'Minimize player' }), isMobile);
  await expect(player).toBeHidden();
  const originalIframe = await iframe.elementHandle();

  const menu = page.locator('[data-app-shell-mobile-navigation-trigger]');
  if (isMobile) await menu.tap();
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

  await press(page.locator(`${main} a.prose-card-link[href*="/news/"]`).first(), isMobile);
  const article = page.getByRole('dialog');
  await expect(article.locator('[data-app-shell-overlay-kind="news"]')).toBeVisible();
  await press(page.getByRole('button', { name: 'Close detail view' }), isMobile);
  await expect(article).toBeHidden();
  await expect(page).toHaveURL(/\/blackbox-records\/news\/$/);
  await expect(page.locator('header [data-nav-link="/news/"]')).toHaveAttribute('aria-current', 'page');
  expect(await sentinelIntact(page)).toBe(true);
  expect(await originalIframe!.evaluate((element) => element.isConnected)).toBe(true);

  await press(page.getByRole('button', { name: 'Open player' }), isMobile);
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
    await expectNoHorizontalOverflow(page);
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
  isMobile,
}) => {
  await page.goto('releases/');
  await waitForShell(page);
  await plantSentinel(page);

  await press(page.locator('a.release-card-title-link[href*="/releases/"]').first(), isMobile);
  const overlay = page.getByRole('dialog');
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('[data-app-shell-overlay-kind="releases"]')).toBeVisible();
  await expect(page).toHaveURL(/\/releases\/[^/]+\/$/);
  const detailUrl = page.url();

  await press(page.getByRole('button', { name: 'Close detail view' }), isMobile);
  await expect(overlay).toBeHidden();
  await expect(page).toHaveURL(/\/releases\/$/);
  expect(await sentinelIntact(page)).toBe(true);

  await page.goto(detailUrl);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator(main).getByRole('heading', { level: 1 })).toBeVisible();
});

test('closing a detail overlay by Close or Back keeps the list in place and returns focus to its card', async ({
  page,
  isMobile,
}) => {
  await page.goto('releases/');
  await waitForShell(page);
  const card = page.locator('a.release-card-title-link[href*="/releases/"]').last();
  await card.scrollIntoViewIfNeeded();
  const listScrollY = await page.evaluate(() => window.scrollY);
  expect(listScrollY).toBeGreaterThan(0);
  const overlay = page.getByRole('dialog');

  for (const dismissal of ['Close', 'Back']) {
    await press(card, isMobile);
    await expect(overlay).toBeVisible();
    if (dismissal === 'Back') await page.goBack();
    else await press(page.getByRole('button', { name: 'Close detail view' }), isMobile);
    await expect(overlay).toBeHidden();
    await expect(page).toHaveURL(/\/releases\/$/);
    await expect(card).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(listScrollY);
  }
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
  await menuButton.tap();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
  await expect(mobileNav).toBeVisible();

  const links = mobileNav.getByRole('link');
  await expect(links.first()).toHaveText('Home');
  await expect(links.first()).toHaveAttribute('aria-current', 'page');
  const store = mobileNav.getByRole('link', { name: 'Store' });
  expect(await store.getAttribute('aria-current')).toBeNull();
  await expect(store).toHaveCSS('border-left-width', '0px');
  await expect(store).not.toHaveAttribute('data-nav-accent');
  // Every section marks its current page with the same Flint underline.
  expect(
    await links
      .first()
      .evaluate((link) => getComputedStyle(link.querySelector('.site-nav-link__label')!, '::after').backgroundColor),
  ).toBe('rgb(136, 147, 150)');
  for (const target of [...(await links.all()), page.getByRole('button', { name: 'Close', exact: true })]) {
    expect((await target.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }

  await store.tap();
  await expect(page).toHaveURL(/\/blackbox-records\/store\/$/);
  await expect(mobileNav).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();
  await expect(page.locator(main)).toBeFocused();
  await expectNoHorizontalOverflow(page);

  await menuButton.tap();
  await mobileNav.getByRole('link', { name: 'Home' }).tap();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await expect(mobileNav).toBeHidden();
  await expect(page.locator(main)).toBeFocused();
  expect(await sentinelIntact(page)).toBe(true);
});

test('the detail overlay and player modal make the page behind them inert and name themselves', async ({
  page,
  isMobile,
  browserName,
}) => {
  test.skip(!isMobile, 'Phone-width screen-reader and switch access.');
  await page.route(/^https:\/\/(bandcamp\.com|embed\.tidal\.com)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<button>Player fixture</button>' }),
  );
  await page.goto('releases/');
  await waitForShell(page);
  const background = page.locator('body > :is(.accessibility-skip-to-content-link, header, main, footer)');
  const inertCount = () =>
    background.evaluateAll((elements) => elements.filter((element) => (element as HTMLElement).inert).length);
  await expect(background).toHaveCount(4);
  const listTitle = await page.title();

  // The skip link is the first Tab stop and paints above the fixed header. iOS Safari's Tab reaches only form controls
  // and buttons unless Full Keyboard Access is on, so WebKit focuses it directly.
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  if (browserName === 'webkit') await skipLink.focus();
  else await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  expect(
    await skipLink.evaluate((link) => {
      const box = link.getBoundingClientRect();
      return link.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }),
  ).toBe(true);

  const card = page.locator('a.release-card-title-link[href*="/releases/"]').first();
  await card.tap();
  const overlay = page.getByRole('dialog');
  await expect(overlay.locator('[data-app-shell-overlay-title]')).toBeVisible();
  const detailTitle = (await overlay
    .locator('[data-app-shell-overlay-title]')
    .getAttribute('data-app-shell-overlay-title'))!;
  await expect(overlay).toHaveAccessibleName(detailTitle);
  await expect.poll(() => page.title()).toContain(`${detailTitle} | `);
  await expect.poll(inertCount).toBe(4);
  await page.getByRole('button', { name: 'Close detail view' }).tap();
  await expect(overlay).toBeHidden();
  await expect.poll(inertCount).toBe(0);
  await expect(card).toBeFocused();
  await expect(page).toHaveTitle(listTitle);

  const listen = page.locator('[data-music-streaming-service-embedded-player-trigger]').first();
  await listen.tap();
  await expect(page.getByRole('dialog', { name: 'Music player' })).toBeVisible();
  await expect.poll(inertCount).toBe(4);
  await page.getByRole('button', { name: 'Close player' }).tap();
  await expect(page.getByRole('dialog', { name: 'Music player' })).toBeHidden();
  await expect.poll(inertCount).toBe(0);
  await expect(listen).toBeFocused();
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

test('a warmed Menu opens in the tap task', async ({ page, isMobile, browserName }) => {
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
  // Mobile WebKit has no wheel input; the lock class above is its check.
  if (browserName !== 'webkit') {
    const scrollY = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/\bis-shell-scroll-locked\b/);
});

test('the Menu closes when the desktop layout starts', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The Menu opens only below the desktop breakpoint.');
  await page.goto('./');
  await waitForShell(page);
  const menuButton = page.locator('[data-app-shell-mobile-navigation-trigger]');
  await menuButton.tap();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});

test('footer sitemap wraps with touch-sized links on small phones', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch-sized sitemap links apply to the phone layout.');
  for (const [width, textScale] of [
    [390, 1],
    [320, 1],
    [390, 1.25],
    [320, 2],
    [390, 2],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    // Use a prose route for the 200% reading-size check so unrelated Home media does not own this footer test.
    await page.goto(textScale === 2 ? './terms/' : './');
    await page.evaluate((scale) => (document.documentElement.style.fontSize = `${scale * 100}%`), textScale);
    const footer = page.locator('footer.site-footer-shell');
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
    // Approved Flowing links reference; enlarged text grows rather than clipping to meet the budget.
    const height = (await footer.boundingBox())?.height ?? 0;
    if (textScale === 1) expect(height).toBeLessThanOrEqual(width === 390 ? 360 : 380);
    await expect(footer.getByText('All rights reserved.')).toBeVisible();
    await expect(footer.locator('.site-footer-disclosure')).toHaveText(
      'This website was designed and developed with assistance from generative AI tools.',
    );
    // The top rule stops at the page gutters (1rem, so it follows enlarged text).
    const rule = await footer.locator('.site-footer-top').evaluate((element) => {
      const before = getComputedStyle(element, '::before');
      const own = getComputedStyle(element);
      return [before.left, before.right, own.paddingLeft, own.paddingRight];
    });
    expect(rule.slice(0, 2)).toEqual(rule.slice(2));
    if (textScale === 1) expect(rule[0]).toBe('16px');
    await expectNoHorizontalOverflow(page);
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

test('Back closes the phone Menu and the cart drawer without navigating the page beneath', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The Menu opens only below the desktop breakpoint.');
  await page.goto('releases/');
  await waitForShell(page);
  const menuButton = page.locator('[data-app-shell-mobile-navigation-trigger]');
  const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
  await menuButton.tap();
  await mobileNav.getByRole('link', { name: 'Store' }).tap();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.locator(main)).toBeFocused();

  await menuButton.tap();
  await expect(mobileNav).toBeVisible();
  await page.goBack();
  await expect(mobileNav).toBeHidden();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.getByRole('searchbox', { name: 'Search Store' })).toBeVisible();

  // Dismissing it in place (Escape, Close or the backdrop) consumes the Menu's entry, so no Back press does nothing.
  await menuButton.tap();
  await expect(mobileNav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(mobileNav).toBeHidden();

  const drawer = page.getByRole('dialog', { name: 'Cart' });
  await page.locator('[data-store-cart-trigger]').first().tap();
  await expect(drawer).toBeVisible();
  await page.goBack();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/\/store\/$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/releases\/$/);
});

test('Back returns a shell section to the offset it was left at; new navigation starts at the top', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Leaves through the phone Menu.');
  await page.goto('releases/');
  await waitForShell(page);
  // Instant: WebKit honours the root's smooth scrolling, and a mid-animation offset is not where the page was left.
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const leftAt = await page.evaluate(() => window.scrollY);

  await page.locator('[data-app-shell-mobile-navigation-trigger]').tap();
  await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Store' }).tap();
  await expect(page).toHaveURL(/\/store\/$/);
  await expect(page.locator(main)).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.goBack();
  await expect(page).toHaveURL(/\/releases\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(leftAt);
});
