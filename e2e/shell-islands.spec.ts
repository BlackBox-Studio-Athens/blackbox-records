import { expect, plantSentinel, sentinelIntact, test, waitForIsland, waitForShell } from './fixtures';

const newsletter = 'NewsletterSignupForm';

test('React islands in cached shell pages hydrate again when the page returns', async ({ page }) => {
  const registrations: unknown[] = [];
  await page.route('**/api/newsletter/registrations', (route) => {
    registrations.push(route.request().postDataJSON());
    return route.fulfill({ status: 202, json: { status: 'registered' } });
  });
  const island = page.locator(`astro-island[component-url*="${newsletter}"]`);
  const email = island.getByRole('textbox', { name: 'Email address' });
  const primary = page.getByRole('navigation', { name: 'Primary' });
  const home = page.getByRole('banner').getByRole('link', { name: 'BlackBox Records' });
  const about = primary.getByRole('link', { name: 'Who we are' });

  async function subscribe(address: string) {
    await waitForIsland(page, newsletter);
    // The typed address left before navigating away must not come back with the cached page.
    await expect(email).toHaveValue('');
    await email.fill(address);
    await island.getByRole('checkbox').check();
    await island.getByRole('button', { name: /subscribe/i }).click();
    await expect(island.getByRole('status')).toContainText('Subscribed.');
  }

  // Home is the initial document (snapshotted when the shell mounts); About arrives as a fetched snapshot.
  await page.goto('./');
  await waitForShell(page);
  await waitForIsland(page, newsletter);
  await plantSentinel(page);
  await email.fill('left@example.com');
  await about.click();
  await expect(page).toHaveURL(/\/about\/$/);
  await waitForIsland(page, newsletter);
  await email.fill('left@example.com');
  await primary.getByRole('link', { name: 'Releases' }).click();
  await expect(page).toHaveURL(/\/releases\/$/);

  await about.click();
  await expect(page).toHaveURL(/\/about\/$/);
  await subscribe('about@example.com');
  await home.click();
  await expect(page).toHaveURL(/\/blackbox-records\/$/);
  await subscribe('home@example.com');

  expect(registrations).toEqual([
    { consentAccepted: true, email: 'about@example.com' },
    { consentAccepted: true, email: 'home@example.com' },
  ]);
  expect(await sentinelIntact(page)).toBe(true);
});
