import { expect, expectNoHorizontalOverflow, plantSentinel, sentinelIntact, test, waitForShell } from './fixtures';

test('a demo click during the inquiry form commit retains its selection', async ({ page }) => {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.services-inquiry-form')) return;
      observer.disconnect();
      document.querySelector<HTMLAnchorElement>('[data-services-inquiry-target-service="Share your demo"]')?.click();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto('./services/');
  await waitForShell(page);
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('Share your demo');
});

test('Share your demo selects the existing inquiry flow and submits without leaving the shell @phone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/services/inquiries', (route) => route.fulfill({ json: { status: 'submitted' } }));
  await page.goto('./services/');
  await waitForShell(page);
  await plantSentinel(page);
  const demoAction = page.getByRole('link', { name: 'Share your demo', exact: true });
  await expect(demoAction).toBeVisible();
  expect((await demoAction.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await demoAction.click();
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('Share your demo');
  await page.getByLabel('Name', { exact: true }).fill('Demo test');
  await page.getByLabel('Email', { exact: true }).fill('demo-test@example.com');
  await page.getByLabel('Band / Project', { exact: true }).fill('Local test band');
  await page.getByLabel('Demo / Listening link', { exact: false }).fill('https://example.com/listen');
  await page.getByLabel('Message', { exact: true }).fill('A local demo inquiry test.');
  const submission = page.waitForRequest(
    (request) => request.url().endsWith('/api/services/inquiries') && request.method() === 'POST',
  );
  await page.locator('.services-inquiry-form button[type="submit"]').click();
  expect((await submission).postDataJSON()).toEqual({
    name: 'Demo test',
    email: 'demo-test@example.com',
    bandOrProject: 'Local test band',
    service: 'Share your demo',
    serviceDetails: 'https://example.com/listen',
    message: 'A local demo inquiry test.',
  });
  await expect(page.getByRole('heading', { name: 'Inquiry submitted' })).toBeVisible();
  expect(await sentinelIntact(page)).toBe(true);
  await page.getByRole('button', { name: 'Send another inquiry' }).click();
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('General');
  await page.locator('.site-footer-shell').getByRole('link', { name: 'Artists', exact: true }).click();
  await expect(page).toHaveURL(/\/artists\/$/);
  await page.goBack();
  await expect(page.getByLabel('Service', { exact: true })).toHaveValue('General');
  expect(await sentinelIntact(page)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

for (const width of [320, 390, 430, 768, 1440]) {
  test(`footer links and description flow naturally at ${width}px${width < 768 ? ' @phone' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./services/');
    await waitForShell(page);
    const footer = page.locator('.site-footer-shell');
    await footer.scrollIntoViewIfNeeded();
    const description = footer.locator('.site-footer-description');
    await expect(description).toBeVisible();
    expect(await description.evaluate((element) => element.children.length)).toBe(0);
    expect(await description.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe('normal');
    const links = footer.locator('.site-footer-nav-list a');
    const boxes = await links.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { text: element.textContent?.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }),
    );
    expect(boxes.length).toBeGreaterThanOrEqual(6);
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 0.01);
      if (width < 768) expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const delivery = footer.getByRole('link', { name: 'Delivery information', exact: true });
    await expect(delivery).toBeVisible();
    if (width < 768) {
      // Four columns of two 44px rows keep sitemap order without an isolated last row. The messages carry the measured
      // geometry and computed styles, so a failure on the production build shows what differs from the dev server.
      const layout = await footer.locator('.site-footer-nav-list').evaluate((list) => {
        const style = (element: Element) => {
          const computed = getComputedStyle(element);
          return {
            display: computed.display,
            alignItems: computed.alignItems,
            alignSelf: computed.alignSelf,
            verticalAlign: computed.verticalAlign,
            minHeight: computed.minHeight,
            lineHeight: computed.lineHeight,
            fontFamily: computed.fontFamily,
          };
        };
        const link = list.querySelector('a')!;
        return {
          columns: getComputedStyle(list).gridTemplateColumns,
          list: style(list),
          li: style(link.parentElement!),
          link: { ...style(link), className: link.className },
        };
      });
      const diagnostics = JSON.stringify({
        ...layout,
        boxes: boxes.map((box) => [
          box.text,
          Math.round(box.x),
          Math.round(box.y),
          Math.round(box.width),
          Math.round(box.height),
        ]),
      });
      expect(layout.columns.split(' ').length, diagnostics).toBe(4);
      const deliveryBox = boxes.find((box) => box.text === 'Delivery information')!;
      expect(
        boxes.some((box) => Math.abs(box.y - deliveryBox.y) < 1 && Math.abs(box.x - deliveryBox.x) > 1),
        diagnostics,
      ).toBe(true);
    }
    await expectNoHorizontalOverflow(page);
    await plantSentinel(page);
    await footer.getByRole('link', { name: 'Releases', exact: true }).click();
    await expect(page).toHaveURL(/\/releases\/$/);
    await expect(page.getByRole('heading', { name: 'Releases', exact: true, level: 1 })).toBeVisible();
    expect(await sentinelIntact(page)).toBe(true);
  });
}
