/** How copies we have split between people waiting for them and the shop. */
export function splitCopies(have: number, soldNotSent: number) {
  return { forSale: Math.max(0, have - soldNotSent), short: Math.max(0, soldNotSent - have) };
}

/** "copies" for records, "units" for clothes. */
export const copyWord = (itemType: string | null | undefined) => (itemType === 'Clothes' ? 'units' : 'copies');
