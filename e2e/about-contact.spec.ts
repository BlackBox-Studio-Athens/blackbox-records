import type { Page } from 'playwright/test';

import { expect, expectNoHorizontalOverflow, test, waitForShell } from './fixtures';

const addresses = [
  'info@blackboxrecordsathens.com',
  'demos@blackboxrecordsathens.com',
  'touring@blackboxrecordsathens.com',
];
const touring = 'touring@blackboxrecordsathens.com';

for (const input of ['desktop', 'phone']) {
  test(`Contact emails wrap only between mailbox and domain${input === 'phone' ? ' @phone' : ''}`, async ({
    page,
    browserName,
  }) => {
    await page.goto('./about/');
    await waitForShell(page);
    const contact = page.locator('main .about-contact');
    await expect(contact).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    for (const width of [320, 360, 375, 390, 414, 430, 640, 768, 820, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 820 ? 390 : 900 });
      await expectNoHorizontalOverflow(page, `Contact at ${width}px`);
      const rendered = await contact.locator('.about-contact__address').evaluateAll((elements) =>
        elements.map((element) => {
          const bounds = element.getBoundingClientRect();
          const lines = new Map<number, string>();
          const outside: string[] = [];
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            for (let offset = 0; offset < (node.textContent?.length ?? 0); offset++) {
              const range = document.createRange();
              range.setStart(node, offset);
              range.setEnd(node, offset + 1);
              const rect = range.getBoundingClientRect();
              if (rect.width === 0) continue;
              const character = node.textContent![offset]!;
              const top = Math.round(rect.top);
              lines.set(top, (lines.get(top) ?? '') + character);
              if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) outside.push(character);
            }
          }
          return { text: element.textContent?.trim(), lines: [...lines.values()], outside };
        }),
      );
      expect(rendered.map(({ text }) => text)).toEqual(addresses);
      for (const [index, row] of rendered.entries()) {
        const address = addresses[index]!;
        const [mailbox, domain] = address.split('@');
        expect([[address], [`${mailbox}@`, domain]], `${address} at ${width}px`).toContainEqual(row.lines);
        expect(row.outside, `${address} clipped at ${width}px`).toEqual([]);
        const link = contact.getByRole('link').nth(index);
        await expect(link).toHaveAttribute('href', `mailto:${address}`);
        await expect(link).toHaveAccessibleName(new RegExp(address.replaceAll('.', '\\.')));
        await expect(contact.getByRole('button', { name: `Copy ${address}`, exact: true })).toBeVisible();
      }
    }

    await page.setViewportSize({ width: 320, height: 900 });
    await contact.getByRole('link').first().focus();
    for (const [index, address] of addresses.entries()) {
      // iOS Safari skips links on Tab without Full Keyboard Access, as in the shell navigation checks.
      if (browserName === 'webkit') await contact.getByRole('link').nth(index).focus();
      await expect(contact.getByRole('link').nth(index)).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(contact.getByRole('button', { name: `Copy ${address}`, exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
    }

    const text = contact.locator('.about-contact__label, .about-contact__address');
    await text.evaluateAll((elements) => {
      for (const element of elements) {
        (element as HTMLElement).style.fontSize = `${Number.parseFloat(getComputedStyle(element).fontSize) * 2}px`;
      }
    });
    const clipped = await text.evaluateAll((elements) =>
      elements.filter((element) => element.scrollWidth > element.clientWidth + 1).map((element) => element.textContent),
    );
    expect(clipped, 'Contact text at 200% must remain inside its allocated space').toEqual([]);
    await expectNoHorizontalOverflow(page);
  });
}

async function copyTouringAddress(page: Page) {
  const contact = page.locator('main .about-contact');
  const copy = contact.getByRole('button', { name: `Copy ${touring}` });
  // A snapshot cached during the feedback window must come back idle.
  await expect(copy).not.toHaveAttribute('data-copied');
  await expect(contact.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(0);
  await page.evaluate(() => navigator.clipboard.writeText(''));

  await copy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(touring);
  await expect(copy).toHaveAttribute('data-copied', '');
  await expect(copy.locator('svg.lucide-check')).toBeVisible();
  await expect(contact.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
}

test('About contact rows keep mailto links and copy their address after shell navigation', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./');
  await waitForShell(page);
  const primary = page.getByRole('navigation', { name: 'Primary' });

  await primary.getByRole('link', { name: 'Who we are' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  for (const address of addresses) {
    await expect(page.locator(`main a.about-contact__link[href="mailto:${address}"]`)).toContainText(address);
  }
  await copyTouringAddress(page);

  // Leave inside the two-second feedback window, then return to the cached About snapshot.
  await primary.getByRole('link', { name: 'Releases' }).click();
  await expect(page).toHaveURL(/\/releases\/$/);
  await primary.getByRole('link', { name: 'Who we are' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await copyTouringAddress(page);
});
