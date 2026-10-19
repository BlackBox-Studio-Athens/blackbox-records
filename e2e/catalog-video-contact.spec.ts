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

for (const width of [320, 360, 390, 430, 459, 460, 640, 719, 720, 768, 1024, 1440]) {
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
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const delivery = footer.getByRole('link', { name: 'Delivery information', exact: true });
    await expect(delivery).toBeVisible();
    expect(await footer.locator('.site-footer-nav-list').evaluate((list) => getComputedStyle(list).display)).toBe(
      'flex',
    );
    expect(boxes.map((box) => box.text)).toEqual([
      'Artists',
      'Releases',
      'Store',
      'Services',
      'Who we are',
      'Delivery information',
      'Withdraw from an order',
      'Privacy information',
    ]);
    const ceiling = new Map([
      [320, 380],
      [390, 360],
      [768, 285],
      [1440, 245],
    ]).get(width);
    if (ceiling) expect((await footer.boundingBox())!.height).toBeLessThanOrEqual(ceiling);
    await expect(footer.locator('.site-footer-disclosure')).toHaveText(
      'This website was designed and developed with assistance from generative AI tools.',
    );
    for (let index = 1; index < boxes.length; index++) {
      const previous = boxes[index - 1];
      const current = boxes[index];
      expect(current.y >= previous.y - 1).toBe(true);
      if (Math.abs(current.y - previous.y) < 1) expect(current.x).toBeGreaterThan(previous.x);
    }
    await expectNoHorizontalOverflow(page);
    await plantSentinel(page);
    await footer.getByRole('link', { name: 'Releases', exact: true }).click();
    await expect(page).toHaveURL(/\/releases\/$/);
    await expect(page.getByRole('heading', { name: 'Releases', exact: true, level: 1 })).toBeVisible();
    expect(await sentinelIntact(page)).toBe(true);
  });
}

test('footer keeps keyboard focus and reflows longer content with no socials at 200% text @phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('./privacy/');
  await waitForShell(page);
  const footer = page.getByRole('contentinfo');
  const delivery = footer.getByRole('link', { name: 'Delivery information', exact: true });
  await delivery.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  expect(await delivery.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  expect(await delivery.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  await footer.locator('.site-footer-description').evaluate((element) => {
    element.textContent = `${element.textContent} `.repeat(4);
  });
  await footer.locator('.site-footer-social-row').evaluate((element) => element.replaceChildren());
  await footer
    .getByRole('link', { name: 'Artists', exact: true })
    .evaluate((element) => element.parentElement!.remove());
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expectNoHorizontalOverflow(page);
  const outside = await footer.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [...element.querySelectorAll('a, p')]
      .filter((child) => {
        const box = child.getBoundingClientRect();
        return box.left < bounds.left || box.right > bounds.right + 0.5;
      })
      .map((child) => child.textContent);
  });
  expect(outside).toEqual([]);
  expect(
    await footer
      .locator('.site-footer-disclosure')
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBe(24);
  await expect(footer.locator('.site-footer-disclosure')).toBeVisible();
});

test('footer destinations and disclosure are available without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 320, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto('./privacy/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.locator('.site-footer-disclosure')).toHaveText(
      'This website was designed and developed with assistance from generative AI tools.',
    );
    await footer.getByRole('link', { name: 'BlackBox Records home' }).click();
    await expect(page).toHaveURL(baseURL!);
    await footer.getByRole('link', { name: 'Releases', exact: true }).click();
    await expect(page).toHaveURL(/\/releases\/$/);
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Releases', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expectNoHorizontalOverflow(page);
  } finally {
    await context.close();
  }
});
