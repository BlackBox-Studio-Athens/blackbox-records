import { CheckoutShippingSelectionError } from './errors';
import type { CheckoutShippingLockerSnapshot } from './types';

export function validateCheckoutShippingLocker(locker: CheckoutShippingLockerSnapshot | null | undefined): void {
  const lockerId = locker?.locker_id.trim() ?? '';
  const countryCode = locker?.country_code.trim().toUpperCase() ?? '';
  const lockerNameOrLabel = locker?.locker_name_or_label.trim() ?? '';

  if (!lockerId || countryCode !== 'GR' || !lockerNameOrLabel) {
    throw new CheckoutShippingSelectionError();
  }
}
