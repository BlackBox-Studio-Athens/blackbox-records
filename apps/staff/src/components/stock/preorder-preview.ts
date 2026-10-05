import { DIGITAL_RELEASE_BADGE, type PreorderShippingBadge, type PreorderBadges } from '@blackbox/content-model';
import type { SetStockPreorderBody } from '../../lib/backend/internal-stock-api';

export type ShipEstimate = NonNullable<SetStockPreorderBody['shipEstimate']>;

export function athensToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const shortDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function shipEstimateText(estimate: ShipEstimate): string {
  return estimate.kind === 'month'
    ? `around ${estimate.part ? estimate.part + ' ' : ''}${monthFormat.format(new Date(estimate.month + '-01T00:00:00Z'))}`
    : `on ${dateFormat.format(new Date(estimate.date + 'T00:00:00Z'))}`;
}

export function preorderBadges({
  releaseDate,
  shipEstimate,
  today,
}: {
  releaseDate?: string | undefined;
  shipEstimate: ShipEstimate | null;
  today: string;
}): PreorderBadges {
  if (releaseDate && releaseDate > today) {
    return [`Pre-order · out ${shortDateFormat.format(new Date(releaseDate + 'T00:00:00Z'))}`];
  }
  const badge: PreorderShippingBadge = !shipEstimate
    ? 'Pre-order'
    : shipEstimate.kind === 'month'
      ? `Pre-order · ships ${shipEstimateText(shipEstimate)}`
      : `Pre-order · ships ${shortDateFormat.format(new Date(shipEstimate.date + 'T00:00:00Z'))}`;
  return releaseDate ? [DIGITAL_RELEASE_BADGE, badge] : [badge];
}

export function preorderPreview(
  estimate: ShipEstimate | null,
  today: string,
  releaseDate?: string,
): PreorderBadges | ['Not on pre-order'] {
  if (!estimate || (estimate.kind === 'date' && estimate.date <= today)) return ['Not on pre-order'];
  return preorderBadges({
    releaseDate,
    today,
    shipEstimate: estimate.kind === 'month' && estimate.month < today.slice(0, 7) ? null : estimate,
  });
}
