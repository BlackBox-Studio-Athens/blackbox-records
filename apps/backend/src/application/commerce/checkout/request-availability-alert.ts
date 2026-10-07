import type { AvailabilityAlertRepository } from '../../../domain/commerce/repositories/spi';
import {
  AVAILABILITY_ALERT_CONSENT_COPY_VERSION,
  AVAILABILITY_ALERT_PENDING_CAP,
  isAvailabilityAlertEligible,
  normalizeAvailabilityAlertEmail,
} from '../../../domain/commerce';
import { StoreItemNotFoundError } from './errors';
import type { StoreOffer } from './types';

export class AvailabilityAlertIneligibleError extends Error {}
export class AvailabilityAlertCapReachedError extends Error {}

/** Notify me is offered only while the offer reads Coming Soon or Repressing. */
export function acceptsAvailabilityAlerts(offer: StoreOffer): boolean {
  return offer.catalogStatus === 'sold_out' && isAvailabilityAlertEligible(offer.availability.state);
}

/** Records one pending alert; a repeat request for the same address is the same success. */
export async function requestAvailabilityAlert(
  offer: StoreOffer | null,
  alerts: Pick<AvailabilityAlertRepository, 'request'>,
  command: { storeItemSlug: string; email: string; consentedAt: Date },
): Promise<void> {
  if (!offer) throw new StoreItemNotFoundError(command.storeItemSlug);
  if (!acceptsAvailabilityAlerts(offer)) throw new AvailabilityAlertIneligibleError('Item is not awaiting copies.');
  const outcome = await alerts.request(
    {
      variantId: offer.variantId,
      email: normalizeAvailabilityAlertEmail(command.email),
      consentCopyVersion: AVAILABILITY_ALERT_CONSENT_COPY_VERSION,
      consentedAt: command.consentedAt,
    },
    AVAILABILITY_ALERT_PENDING_CAP,
  );
  if (outcome === 'cap_reached') throw new AvailabilityAlertCapReachedError('Too many alerts for this item.');
}
