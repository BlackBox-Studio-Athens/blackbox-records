/** What staff chose shoppers see once online stock runs out. */
export const ZERO_STOCK_STATES = ['coming_soon', 'repressing', 'sold_out'] as const;
export type ZeroStockState = (typeof ZERO_STOCK_STATES)[number];
