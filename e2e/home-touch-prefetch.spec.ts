import { expect, test, waitForShell } from './fixtures';

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
