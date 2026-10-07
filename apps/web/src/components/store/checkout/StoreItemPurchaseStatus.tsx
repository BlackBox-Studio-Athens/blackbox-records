import { Disc3, RotateCw } from 'lucide-react';

import type { PublicCheckoutApi } from '@/components/store/checkout/public-checkout-api';
import { cn } from '@/components/ui/utils';
import { availabilityNote, expectedMonthText, isNotifiable } from '@/platform/lib/availability-copy';
import AvailabilityAlertForm from './AvailabilityAlertForm';
import { purchaseActionLayoutClasses } from './public-checkout-presentation';

// The status fields of the purchase actions state; declared here so this lazy module never imports the actions.
type StoreItemPurchaseStatusState = {
  label: string | null;
  statusTone: 'neutral' | 'sold-out' | 'incoming';
  availabilityState?: string;
  expectedMonth?: string;
};

// Not buyable is information, not a control: a status in the purchase slot, never a disabled button. Coming Soon and
// Repressing add their explanatory line and Notify me; an unlabelled state renders nothing.
export default function StoreItemPurchaseStatus({
  api,
  state,
  storeItemSlug,
}: {
  api?: PublicCheckoutApi | undefined;
  state: StoreItemPurchaseStatusState;
  storeItemSlug: string | null;
}) {
  if (!state.label) return null;
  const { availabilityState, expectedMonth } = state;
  const status = (
    <p
      role="status"
      aria-atomic="true"
      data-store-item-purchase-status
      data-store-item-purchase-tone={state.statusTone}
      className={cn(
        purchaseActionLayoutClasses,
        'inline-flex min-h-11 items-center justify-center gap-2 border px-4 pt-px text-center font-display text-base leading-none tracking-[0.06em] text-foreground uppercase',
        state.statusTone === 'sold-out' && 'border-[var(--store-accent)]',
        state.statusTone === 'incoming' && 'border-dashed border-[#8c8c8c]',
        state.statusTone === 'neutral' && 'border-[#767676]',
      )}
    >
      {availabilityState === 'coming_soon' && <Disc3 aria-hidden="true" size={14} strokeWidth={1.75} />}
      {availabilityState === 'repressing' && <RotateCw aria-hidden="true" size={14} strokeWidth={1.75} />}
      {state.label}
    </p>
  );
  if (!isNotifiable(availabilityState)) return status;
  const month = expectedMonthText(expectedMonth);
  return (
    <div className="store-availability-status" data-store-item-availability={availabilityState}>
      {status}
      <p className="store-availability-note" data-store-item-availability-note>
        {availabilityNote(availabilityState)}
        {month && ` · ${month}`}
      </p>
      {storeItemSlug && <AvailabilityAlertForm api={api} storeItemSlug={storeItemSlug} />}
    </div>
  );
}
