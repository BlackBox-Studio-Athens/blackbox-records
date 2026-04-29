import { CheckoutShippingSelectionError } from './errors';
import type { ShippingLockerSnapshot } from '../../../domain/commerce/repositories';
import type { CheckoutShippingLockerSnapshot } from './types';

export function validateCheckoutShippingLocker(
  locker: CheckoutShippingLockerSnapshot | null | undefined,
): ShippingLockerSnapshot {
  const lockerId = locker?.locker_id.trim() ?? '';
  const countryCode = locker?.country_code.trim().toUpperCase() ?? '';
  const lockerNameOrLabel = locker?.locker_name_or_label.trim() ?? '';

  if (!lockerId || countryCode !== 'GR' || !lockerNameOrLabel) {
    throw new CheckoutShippingSelectionError();
  }

  return {
    country_code: 'GR',
    locker_id: lockerId,
    locker_name_or_label: lockerNameOrLabel,
  };
}
