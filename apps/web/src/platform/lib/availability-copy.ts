// One shopper vocabulary for zero-stock states on every surface. `unavailable` (a technical selling pause) and any
// state this build does not recognise have no label: surfaces show the price only, with no status and no Buy.

export const AVAILABILITY_LABELS = {
  coming_soon: 'Coming Soon',
  repressing: 'Repressing',
  sold_out: 'Sold Out',
} as const;

export type LabelledAvailabilityState = keyof typeof AVAILABILITY_LABELS;
export type AvailabilityLabel = (typeof AVAILABILITY_LABELS)[LabelledAvailabilityState];

// Coming Soon and Repressing are "not here yet" (dashed edge); Sold Out alone carries the Store Blood edge.
export type AvailabilityTone = 'incoming' | 'sold-out';

export const AVAILABILITY_NOTES = {
  coming_soon: 'First pressing on its way',
  repressing: 'More copies being pressed',
} as const;

function isLabelledState(state: unknown): state is LabelledAvailabilityState {
  return typeof state === 'string' && Object.hasOwn(AVAILABILITY_LABELS, state);
}

export function availabilityLabel(state: unknown): AvailabilityLabel | null {
  return isLabelledState(state) ? AVAILABILITY_LABELS[state] : null;
}

export function availabilityTone(state: unknown): AvailabilityTone | null {
  if (!isLabelledState(state)) return null;
  return state === 'sold_out' ? 'sold-out' : 'incoming';
}

// Notify me is offered only while copies are on the way.
export function isNotifiable(state: unknown): state is 'coming_soon' | 'repressing' {
  return state === 'coming_soon' || state === 'repressing';
}

export function availabilityNote(state: unknown): string {
  return state === 'coming_soon' || state === 'repressing' ? AVAILABILITY_NOTES[state] : '';
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

// 'YYYY-MM' -> ['November', '2026']; malformed or missing months give null.
function monthParts(month: string | null | undefined) {
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  return [MONTH_NAMES[Number(month.slice(5, 7)) - 1]!, month.slice(0, 4)] as const;
}

// '2026-11' -> 'Expected November 2026'; malformed or missing months give ''.
export function expectedMonthText(month: string | null | undefined): string {
  const parts = monthParts(month);
  return parts ? `Expected ${parts[0]} ${parts[1]}` : '';
}

// Store card chip: 'Coming Soon · Nov 2026'.
export function availabilityChipText(state: unknown, month?: string | null): string {
  const label = availabilityLabel(state);
  if (!label) return '';
  const parts = isNotifiable(state) ? monthParts(month) : null;
  return parts ? `${label} · ${parts[0].slice(0, 3)} ${parts[1]}` : label;
}
