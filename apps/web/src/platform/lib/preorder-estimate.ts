// Pre-order wording. Backend email and staff keep their own copies of this table
// (design decision 10); each test asserts the same sample strings.
export type ShipEstimate =
  { kind: 'month'; month: string; part: 'early' | 'mid' | 'late' | null } | { kind: 'date'; date: string };

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
];

// Month number from 'YYYY-MM' or 'YYYY-MM-DD'.
function monthName(value: string) {
  return MONTH_NAMES[Number(value.slice(5, 7)) - 1] ?? '';
}

// '2026-10-20' -> '20 Oct 2026'
function shortDate(isoDate: string) {
  return `${Number(isoDate.slice(8, 10))} ${monthName(isoDate).slice(0, 3)} ${isoDate.slice(0, 4)}`;
}

export function shipEstimateText(estimate: ShipEstimate) {
  if (estimate.kind === 'date') {
    return `on ${Number(estimate.date.slice(8, 10))} ${monthName(estimate.date)} ${estimate.date.slice(0, 4)}`;
  }

  const part = estimate.part ? `${estimate.part} ` : '';

  return `around ${part}${monthName(estimate.month)} ${estimate.month.slice(0, 4)}`;
}

function shipsText(estimate: ShipEstimate | null) {
  if (!estimate) return '';

  return estimate.kind === 'date' ? ` · ships ${shortDate(estimate.date)}` : ` · ships ${shipEstimateText(estimate)}`;
}

// Chip beside a cart line and the post-release badge share one wording.
export function preorderChipText(shipEstimate: ShipEstimate | null) {
  return `Pre-order${shipsText(shipEstimate)}`;
}

// releaseDate is an ISO date or a Date; "out" follows the UTC-day rule of isReleaseOutNow.
export function preorderBadges({
  releaseDate,
  shipEstimate,
  today,
}: {
  releaseDate?: string | Date | null | undefined;
  shipEstimate: ShipEstimate | null;
  today: Date;
}) {
  if (!releaseDate) return [preorderChipText(shipEstimate)];

  const releaseDay = (typeof releaseDate === 'string' ? releaseDate : releaseDate.toISOString()).slice(0, 10);

  if (releaseDay > today.toISOString().slice(0, 10)) return [`Pre-order · out ${shortDate(releaseDay)}`];

  return ['Out now', preorderChipText(shipEstimate)];
}

const PART_DAY = { early: 10, mid: 20, late: 31 } as const;

// Sort key: a month counts as its last day, parts as day 10, 20 and 31.
function estimateKey(estimate: ShipEstimate) {
  if (estimate.kind === 'date') return estimate.date;

  return `${estimate.month}-${PART_DAY[estimate.part ?? 'late']}`;
}

// null when there are no estimates or any is withheld: the order's date is unknown.
export function latestShipEstimate(estimates: readonly (ShipEstimate | null)[]) {
  let latest: ShipEstimate | null = null;

  for (const estimate of estimates) {
    if (!estimate) return null;
    if (!latest || estimateKey(estimate) > estimateKey(latest)) latest = estimate;
  }

  return latest;
}
