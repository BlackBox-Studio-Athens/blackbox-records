import { chromium } from 'playwright';

import { expect, expectNoHorizontalOverflow, test, waitForShell } from './fixtures';

test('@phone Home media cropping does not create nested vertical scroll containers', async ({ page }) => {
  await page.goto('./');
  await waitForShell(page);

  const offsets = await page
    .locator('#homepage-hero-section, .homepage-hero-section__media-layer')
    .evaluateAll((layers) =>
      layers.map((layer) => {
        const crop = layer as HTMLElement;
        // Probe overflow without changing the crop's size: hidden creates a scroll node even without scrollbars.
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;top:calc(100% + 8px);left:0;width:1px;height:8px';
        crop.append(probe);
        crop.scrollTop = 1;
        const offset = crop.scrollTop;
        crop.scrollTop = 0;
        probe.remove();
        return offset;
      }),
    );
  expect(offsets).toEqual([0, 0]);
});

test('@phone native touch swipes traverse Home and return with its ghost intact', async ({
  page: localPage,
  browserName,
  baseURL,
}, testInfo) => {
  test.skip(
    Boolean(process.env.CI),
    'Full-page scrolling is a Local diagnostic; CI runs only the fast crop regression.',
  );
  test.skip(
    browserName !== 'chromium',
    'Chromium exposes native touch drags through CDP; Android WebView uses Chromium.',
  );
  const endpoint = process.env.BLACKBOX_ANDROID_WEBVIEW_CDP;
  const attached = endpoint ? await chromium.connectOverCDP(endpoint) : undefined;
  try {
    const page = attached ? attached.contexts()[0]!.pages()[0]! : localPage;
    await page.goto(new URL('./', baseURL!).href);
    await waitForShell(page);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(15_000);
    await testInfo.attach('scroll-browser', {
      body: JSON.stringify(
        await page.evaluate(() => ({
          userAgent: navigator.userAgent,
          viewport: [innerWidth, innerHeight, devicePixelRatio],
          scrollTimeline: CSS.supports('animation-timeline: scroll()'),
        })),
      ),
      contentType: 'application/json',
    });
    const cdp = await page.context().newCDPSession(page);
    const { width, height } = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    const media = page.locator('.homepage-hero-section__media-layer');
    try {
      for (const direction of [1, -1]) {
        const target =
          direction > 0 ? await page.evaluate(() => document.documentElement.scrollHeight - innerHeight) : 0;
        for (let swipe = 0; swipe < 12; swipe++) {
          const before = await page.evaluate(() => scrollY);
          if (Math.abs(before - target) < 1) break;
          const start = height * (direction > 0 ? 0.8 : 0.2);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width / 2, y: start }] });
          for (let step = 1; step <= 8; step++) {
            await cdp.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [{ x: width / 2, y: start - (direction * height * 0.6 * step) / 8 }],
            });
            await page.waitForTimeout(40);
          }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await expect.poll(() => page.evaluate((before) => Math.abs(scrollY - before), before)).toBeGreaterThan(1);
        }
        await expect.poll(() => page.evaluate((target) => Math.abs(scrollY - target), target)).toBeLessThan(1);
        await expect(media).toHaveCSS('position', 'fixed');
        await expect(media).toHaveCSS('opacity', direction > 0 ? '0.12' : '1');
      }
      await expectNoHorizontalOverflow(page);
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }).catch(() => {});
      await cdp.detach();
    }
  } finally {
    await attached?.close();
  }
});
