import { expect, localRepresentativePaths, test, waitForIsland, waitForShell } from './fixtures';

test('add to cart opens the drawer, persists the line and restores it on another page', async ({ page }) => {
  await page.goto(`.${localRepresentativePaths.storeItem}`);
  await waitForShell(page);
  // Built pages server-render the button; a click before hydration is ignored.
  await waitForIsland(page, 'StoreItemPurchaseActions');

  // Ready because the fixture serves a ready offer for this item.
  const addToCart = page.locator('[data-store-item-add-to-cart]');
  await addToCart.click();
  // The purchase control confirms in place at once (the drawer's chunks may still be loading in dev).
  await expect(addToCart).toHaveText('Added');
  const drawer = page.getByRole('dialog', { name: 'Cart' });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('[data-store-cart-line-item]')).toHaveCount(1);
  await expect(drawer.getByRole('link', { name: 'Checkout' })).toHaveAttribute(
    'href',
    /\/blackbox-records\/store\/checkout\/$/,
  );
  expect(await page.evaluate(() => localStorage.getItem('blackbox.storeCart.v2'))).not.toBeNull();

  // Closing returns focus to what opened the drawer; the confirmation then resets on its own.
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(addToCart).toBeFocused();
  await expect(addToCart).toHaveText('Add To Cart', { timeout: 6000 });

  await page.goto('store/');
  await waitForShell(page);
  const trigger = page.locator('[data-store-cart-trigger]').first();
  await expect(trigger).toHaveAccessibleName('Cart, 1 item');
  await trigger.click();
  const reopened = page.getByRole('dialog', { name: 'Cart' });
  await expect(reopened.locator('[data-store-cart-line-item]')).toHaveCount(1);

  // Remove acts at once and leaves a focused Undo in the line's place; Undo restores it.
  await reopened.getByRole('button', { name: 'Remove' }).click();
  await expect(reopened.locator('[data-store-cart-line-item]')).toHaveCount(0);
  const undo = reopened.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeFocused();
  await undo.click();
  await expect(reopened.locator('[data-store-cart-line-item]')).toHaveCount(1);

  // The modal hides the header from assistive technology; after closing, the control is back with its count and focus.
  await page.keyboard.press('Escape');
  await expect(reopened).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAccessibleName('Cart, 1 item');
});

test('the header cart control appears only with items or in the store', async ({ page }) => {
  await page.goto('.');
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]')).toHaveCount(0);

  await page.goto('store/');
  await waitForShell(page);
  await expect(page.locator('[data-store-cart-trigger]').first()).toHaveAccessibleName('Cart');
});
