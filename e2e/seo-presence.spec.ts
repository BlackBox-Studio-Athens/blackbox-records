import { expect, test, waitForShell } from './fixtures';

for (const suffix of ['', ' @phone']) {
  test(`client navigation restores the same head metadata as a direct About load${suffix}`, async ({ page }) => {
    const readHead = () =>
      page.evaluate(() => ({
        title: document.title,
        description: document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
        canonical: document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
        social: [...document.head.querySelectorAll<HTMLMetaElement>('meta[property^="og:"],meta[name^="twitter:"]')]
          .map((meta) => [meta.getAttribute('property') || meta.name, meta.content])
          .sort(),
        entities: [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((script) =>
          JSON.parse(script.textContent || '{}'),
        ),
      }));
    await page.goto('about/');
    await waitForShell(page);
    const direct = await readHead();
    await page.goto('store/disintegration-black-vinyl-lp/');
    await waitForShell(page);
    await expect(page.locator('main script[type="application/ld+json"]')).toHaveCount(1);
    await page.locator('header [data-nav-link="/about/"]').evaluate((link: HTMLElement) => link.click());
    await expect(page).toHaveURL(/\/about\/$/);
    await expect.poll(readHead).toEqual(direct);
    await expect(page.locator('main script[type="application/ld+json"]')).toHaveCount(0);
    expect(direct.entities.find((entity) => entity['@type'] === 'Organization').address.addressCountry).toBe('GR');
  });

  for (const route of ['store/', 'store/distro/']) {
    test(`card size estimates preserve the rendered middle card on ${route}${suffix}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      await waitForShell(page);
      await page.evaluate(() => document.fonts.ready);
      const card = page.locator('.store-item-card--listing').nth(30);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      await card.locator('img').evaluateAll(async (images) => {
        await Promise.all(images.map((image) => (image as HTMLImageElement).decode().catch(() => undefined)));
      });
      // Compare the same rendered card, not a fraction of the estimated document height.
      const oldEstimate = await page.addStyleTag({
        content: '.store-item-card--listing { contain-intrinsic-block-size: auto 520px !important; }',
      });
      await card.scrollIntoViewIfNeeded();
      const before = await card.screenshot({ animations: 'disabled' });
      await oldEstimate.evaluate((style) => style.remove());
      await card.scrollIntoViewIfNeeded();
      const after = await card.screenshot({ animations: 'disabled' });
      await testInfo.attach('same-card-old-estimate', { body: before, contentType: 'image/png' });
      await testInfo.attach('same-card-current-estimate', { body: after, contentType: 'image/png' });
      expect(after.equals(before), 'the same rendered card must retain identical pixels').toBe(true);
    });
  }
}
