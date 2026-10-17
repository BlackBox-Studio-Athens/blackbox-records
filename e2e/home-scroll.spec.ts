import { chromium } from 'playwright';

import { expect, expectNoHorizontalOverflow, test, waitForShell } from './fixtures';

test('@phone the scrolling report catches a stall and excludes time spent hidden', async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(
    Boolean(process.env.CI) || process.env.SHOW_REVIEW_SITE_MARKER !== 'true',
    'Local review-build diagnostic only.',
  );
  test.skip(browserName !== 'chromium', 'The affected in-app browser uses Chromium touch input.');
  await page.goto('./?scroll-check=report');
  await waitForShell(page);
  const panel = page.getByRole('region', { name: 'Scrolling report' });
  const finish = panel.getByRole('button', { name: 'Finish and show report' });
  await expect(finish).toBeEnabled();
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 700 }] });
    for (let step = 1; step <= 8; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 150, y: 700 - step * 50 }],
      });
      await page.waitForTimeout(40);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
  // Exercise visibility handling deterministically without depending on a headless window manager.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.evaluate(() => {
    const until = performance.now() + 750;
    while (performance.now() < until) {
      /* Deliberate fault: the report must detect this renderer stall. */
    }
  });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await finish.click();
  const output = panel.getByRole('textbox', { name: 'Scrolling report text' });
  const report = JSON.parse(await output.inputValue());
  await testInfo.attach('home-scroll-report', { body: JSON.stringify(report), contentType: 'application/json' });
  expect(report.hiddenCount).toBe(1);
  expect(report.maxFrameGapMs).toBeGreaterThanOrEqual(650);
  expect(report.maxFrameGapMs).toBeLessThan(1500);
  expect(report.stallsOver250Ms).toBeGreaterThan(0);
  expect(report.longFrames.some((entry: { durationMs: number }) => entry.durationMs >= 650)).toBe(true);
  expect(report.gestures.some((gesture: { moves: number; dy: number }) => gesture.moves > 0 && gesture.dy > 200)).toBe(
    true,
  );
  expect(report.maxScrollY).toBeGreaterThan(report.minScrollY);
  expect(report.frameStalls.length).toBeLessThanOrEqual(24);
  expect(report.longFrames.length).toBeLessThanOrEqual(5);
  await expectNoHorizontalOverflow(page);
  await expect(finish).toBeDisabled();
  await page.goto('./');
  await expect(page.locator('[data-home-scroll-report]')).toBeHidden();
});

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

test('@phone native touch swipes traverse Home twice without long freezes', async ({
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
    expect(
      await page
        .locator('video[data-home-hero-film]')
        .evaluate((video: HTMLVideoElement) => video.canPlayType('video/mp4; codecs="avc1.42E01E"')),
      'This diagnostic needs H.264 playback to exercise the Home video workload.',
    ).not.toBe('');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(15_000);
    await testInfo.attach('scroll-browser', {
      body: JSON.stringify(
        await page.evaluate(() => ({
          userAgent: navigator.userAgent,
          viewport: [innerWidth, innerHeight, devicePixelRatio],
          scrollTimeline: CSS.supports('animation-timeline: scroll()'),
          preorderFilms: document.querySelectorAll('.home-preorders__film').length,
        })),
      ),
      contentType: 'application/json',
    });
    const cdp = await page.context().newCDPSession(page);
    const { width, height } = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    const media = page.locator('.homepage-hero-section__media-layer');
    // shortcut: rAF cannot detect compositor-only freezes; use a native graphics trace for those.
    const frameProbe = await page.evaluateHandle(() => {
      const gaps: number[] = [];
      let previous = 0;
      let frame = 0;
      const sample = (time: number) => {
        if (previous) gaps.push(time - previous);
        previous = time;
        frame = requestAnimationFrame(sample);
      };
      frame = requestAnimationFrame(sample);
      return {
        stop() {
          cancelAnimationFrame(frame);
          const sorted = [...gaps].sort((a, b) => a - b);
          return {
            samples: sorted.length,
            p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
            maximumMs: sorted.at(-1) ?? 0,
            gapsOver100Ms: gaps.filter((gap) => gap > 100),
            visibility: document.visibilityState,
          };
        },
      };
    });
    try {
      for (const direction of [1, -1, 1, -1]) {
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
      const pacing = await frameProbe.evaluate((probe) => probe.stop());
      await testInfo.attach('scroll-frame-pacing', {
        body: JSON.stringify(pacing),
        contentType: 'application/json',
      });
      await frameProbe.dispose();
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }).catch(() => {});
      await cdp.detach();
      expect.soft(pacing.visibility, 'Keep the test page visible while measuring scrolling.').toBe('visible');
      expect.soft(pacing.samples).toBeGreaterThan(60);
      // Detect prolonged stalls locally; ordinary frame-rate variance is not a CI performance budget.
      expect
        .soft(pacing.maximumMs, 'Home stopped producing animation frames for at least half a second.')
        .toBeLessThan(500);
    }
  } finally {
    await attached?.close();
  }
});
