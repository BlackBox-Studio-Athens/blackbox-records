import { expect, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

test('@phone Home Browse keeps its compact outline and full tap target', async ({ page }) => {
  await page.goto('./');
  await waitForShell(page);
  const browse = page.locator('#homepage-hero-section').getByRole('link', { name: 'Browse the Store' });
  await expect(browse).toBeVisible();
  await expect(browse).toHaveAttribute('href', /\/store\/$/);

  for (const width of [390, 320, 280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => document.fonts.ready);
    const layout = await browse.evaluate((link) => {
      const rect = link.getBoundingClientRect();
      const halo = getComputedStyle(link, '::before');
      const x = rect.x + rect.width / 2;
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        logoLeft: document.querySelector('header img')!.getBoundingClientRect().left,
        fontSize: getComputedStyle(link).fontSize,
        padding: [getComputedStyle(link).paddingLeft, getComputedStyle(link).paddingRight],
        haloHeight: parseFloat(halo.height),
        edgeHits: [rect.top - 7, rect.bottom + 7].map((y) => link.contains(document.elementFromPoint(x, y))),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    // The content-sized label varies slightly with browser/platform font metrics.
    expect(Math.abs(layout.width - 100), `${width}px drawn width difference`).toBeLessThanOrEqual(2);
    expect(layout.height, `${width}px drawn height`).toBe(28);
    expect(layout.fontSize).toBe('12px');
    expect(layout.padding).toEqual(['8px', '8px']);
    expect(layout.left, `${width}px gutter`).toBeCloseTo(layout.logoLeft, 0);
    expect(layout.haloHeight, `${width}px tap target`).toBeGreaterThanOrEqual(44);
    expect(layout.edgeHits, `${width}px target edges`).toEqual([true, true]);
    expect(layout.overflow, `${width}px overflow`).toBe(false);
  }

  await plantSentinel(page);
  const box = (await browse.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y - 7);
  await expect(page).toHaveURL(/\/store\/$/);
  await waitForShell(page);
  expect(await sentinelIntact(page)).toBe(true);
});

test('@phone a cancelled swipe on a Home news card does not fetch its overlay, but a tap opens it', async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(!isMobile, 'Touch gesture coverage uses phone projects.');
  await page.goto('./');
  await waitForShell(page);
  const link = page.locator('main a.prose-card-link[href*="/news/"]').first();
  await link.scrollIntoViewIfNeeded();
  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.includes('/app-shell-overlay/news/')) requests.push(request.url());
  });

  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 110, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    // WebKit's Playwright surface exposes tap but not touch drag; exercise the same pointer/focus cancellation path.
    await link.dispatchEvent('pointerover', { pointerType: 'touch' });
    await link.dispatchEvent('pointerdown', { pointerType: 'touch' });
    await link.focus();
    await link.dispatchEvent('pointercancel', { pointerType: 'touch' });
  }
  await page.waitForTimeout(250);
  expect(requests).toEqual([]);
  await expect(page).toHaveURL(/\/blackbox-records\/$/);

  await link.tap();
  await expect(page.locator('[data-app-shell-overlay-kind="news"]')).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
});
