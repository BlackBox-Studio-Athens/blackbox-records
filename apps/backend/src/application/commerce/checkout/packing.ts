export type ParcelTier = 'small' | 'medium';

export type ItemPackingProfile = {
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  weightGrams: number;
  measurementReference: string;
  synthetic?: boolean;
};

export type PackagePackingProfile = {
  tier: ParcelTier;
  innerLengthMm: number;
  innerWidthMm: number;
  innerHeightMm: number;
  outerLengthMm: number;
  outerWidthMm: number;
  outerHeightMm: number;
  tareGrams: number;
  maxGrossWeightGrams: number;
  measurementReference: string;
  synthetic?: boolean;
};

export type PackingPolicy = {
  items: ReadonlyMap<string, ItemPackingProfile>;
  packages: readonly PackagePackingProfile[];
  charges: Record<ParcelTier, number>;
  allowSynthetic: boolean;
};

export type DeliveryQuote = { tier: ParcelTier; amountMinor: number; currencyCode: 'EUR' };

const positiveInteger = (value: number) => Number.isSafeInteger(value) && value > 0;
const footprintFits = (length: number, width: number, availableLength: number, availableWidth: number) =>
  (length <= availableLength && width <= availableWidth) || (width <= availableLength && length <= availableWidth);

export function quoteDelivery(
  lines: readonly { variantId: string; quantity: number }[],
  policy: PackingPolicy,
): DeliveryQuote | null {
  if (!lines.length) return null;
  const quantities = new Map<string, number>();
  for (const line of lines) {
    const quantity = (quantities.get(line.variantId) ?? 0) + line.quantity;
    if (!positiveInteger(line.quantity) || !positiveInteger(quantity)) return null;
    quantities.set(line.variantId, quantity);
  }

  let height = 0;
  let weight = 0;
  const profiles: ItemPackingProfile[] = [];
  for (const [variantId, quantity] of quantities) {
    const item = policy.items.get(variantId);
    if (
      !item ||
      !item.measurementReference.trim() ||
      (item.synthetic && !policy.allowSynthetic) ||
      ![item.lengthMm, item.widthMm, item.thicknessMm, item.weightGrams].every(positiveInteger)
    )
      return null;
    height += item.thicknessMm * quantity;
    weight += item.weightGrams * quantity;
    if (!positiveInteger(height) || !positiveInteger(weight)) return null;
    profiles.push(item);
  }

  // ponytail: one flat stack; add another measured method only for demonstrated rejected demand.
  for (const tier of ['small', 'medium'] as const) {
    const packages = policy.packages.filter((pack) => pack.tier === tier);
    const pack = packages[0];
    if (
      packages.length !== 1 ||
      !pack ||
      !pack.measurementReference.trim() ||
      (pack.synthetic && !policy.allowSynthetic) ||
      !positiveInteger(policy.charges[tier]) ||
      ![
        pack.innerLengthMm,
        pack.innerWidthMm,
        pack.innerHeightMm,
        pack.outerLengthMm,
        pack.outerWidthMm,
        pack.outerHeightMm,
        pack.tareGrams,
        pack.maxGrossWeightGrams,
      ].every(positiveInteger) ||
      pack.innerLengthMm >= pack.outerLengthMm ||
      pack.innerWidthMm >= pack.outerWidthMm ||
      pack.innerHeightMm >= pack.outerHeightMm ||
      pack.outerHeightMm > (tier === 'small' ? 80 : 170) ||
      !footprintFits(pack.outerLengthMm, pack.outerWidthMm, 600, 450)
    )
      return null;
    const grossWeight = weight + pack.tareGrams;
    if (!positiveInteger(grossWeight)) return null;
    if (
      height <= pack.innerHeightMm &&
      grossWeight <= pack.maxGrossWeightGrams &&
      profiles.every((item) => footprintFits(item.lengthMm, item.widthMm, pack.innerLengthMm, pack.innerWidthMm))
    )
      return { tier, amountMinor: policy.charges[tier], currencyCode: 'EUR' };
  }
  return null;
}
