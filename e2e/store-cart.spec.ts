import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';

test('add to cart opens the drawer, persists the line and restores it on another page', async ({ page }) => {
  await page.goto(`.${localRepresentativePaths.storeItem}`);
  await waitForShell(page);
  // Built pages server-render the button; a click before hydration is ignored.
  await waitForIsland(page, 'StoreItemPurchaseActions');

  // Ready because the fixture serves a ready offer for this item.
  await page.locator('[data-store-item-add-to-cart]').click();
  const drawer = page.getByRole('dialog', { name: 'Cart' });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(1);
  await expect(drawer.getByRole('link', { name: 'Checkout' })).toHaveAttribute(
    'href',
    /\/blackbox-records\/store\/checkout\/$/,
  );
  expect(await page.evaluate(() => localStorage.getItem('blackbox.storeCart.v2'))).not.toBeNull();

  await page.goto('store/');
  await waitForShell(page);
  const trigger = page.locator('[data-store-cart-trigger]').first();
  await expect(trigger).toHaveAccessibleName('Cart, 1 item');
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Cart' }).locator('[data-store-cart-line-item]')).toHaveCount(1);
});
