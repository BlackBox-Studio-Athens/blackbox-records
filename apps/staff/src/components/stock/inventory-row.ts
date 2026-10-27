/** Shoppers see how many copies remain at or below this online quantity; staff see the same point as low stock. */
export const LOW_STOCK_NOTICE_THRESHOLD = 5;

type InventoryRowSource = { displayName?: string | undefined; storeItemSlug: string; itemType?: string | null };

/** The shop product name repeats the label and the format; the row already shows the format below the name. */
export function inventoryName({ displayName, storeItemSlug, itemType }: InventoryRowSource) {
  const name = displayName ?? storeItemSlug.replaceAll('-', ' ');
  let short = name.replace(/^BlackBox Records\s+-\s+/i, '');
  const formatSuffix = itemType ? ` - ${itemType}` : '';
  if (formatSuffix && short.toLowerCase().endsWith(formatSuffix.toLowerCase()))
    short = short.slice(0, -formatSuffix.length);
  return short.trim() || name;
}

export const isLowStock = (onlineQuantity: number | null | undefined) =>
  typeof onlineQuantity === 'number' && onlineQuantity > 0 && onlineQuantity <= LOW_STOCK_NOTICE_THRESHOLD;
