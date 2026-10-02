import type { EmailShipEstimate } from './types';

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function shipEstimateText(estimate: EmailShipEstimate | null): string {
  if (!estimate) return 'To be confirmed';
  return estimate.kind === 'date'
    ? `on ${dateFormat.format(new Date(`${estimate.date}T00:00:00Z`))}`
    : `around ${estimate.part ? `${estimate.part} ` : ''}${monthFormat.format(new Date(`${estimate.month}-01T00:00:00Z`))}`;
}

const partDay = { early: '10', mid: '20', late: '31' } as const;
const sortKey = (estimate: EmailShipEstimate) =>
  estimate.kind === 'date' ? estimate.date : `${estimate.month}-${estimate.part ? partDay[estimate.part] : '31'}`;

export function latestEmailShipEstimate(estimates: readonly (EmailShipEstimate | null)[]): EmailShipEstimate | null {
  let latest: EmailShipEstimate | null = null;
  for (const estimate of estimates) {
    if (!estimate) return null;
    if (!latest || sortKey(estimate) > sortKey(latest)) latest = estimate;
  }
  return latest;
}
