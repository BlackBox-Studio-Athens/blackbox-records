import type { ReactNode } from 'react';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';

export type ZeroStockState = 'coming_soon' | 'repressing' | 'sold_out';

export const ZERO_STOCK_STATE_OPTIONS: readonly { value: ZeroStockState; label: string }[] = [
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'repressing', label: 'Repressing' },
  { value: 'sold_out', label: 'Sold Out' },
];

export function isZeroStockState(value: unknown): value is ZeroStockState {
  return value === 'coming_soon' || value === 'repressing' || value === 'sold_out';
}

// The current Europe/Athens month, the earliest month staff can expect copies.
export function currentAthensMonth(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit' })
    .format(now)
    .slice(0, 7);
}

export function waitingShoppersText(count: number | undefined): string {
  if (!count || count < 1) return '';
  return `${count} ${count === 1 ? 'shopper' : 'shoppers'} waiting for an email`;
}

// "When sold out online, show": what shoppers see once online stock runs out, with an optional expected month.
export default function ZeroStockStateControl({
  busy = false,
  disabled = false,
  idPrefix,
  month,
  monthAction,
  onMonthChange,
  onValueChange,
  value,
  waitingCount,
}: {
  busy?: boolean;
  disabled?: boolean;
  idPrefix: string;
  month: string;
  monthAction?: ReactNode;
  onMonthChange: (month: string) => void;
  onValueChange: (value: ZeroStockState) => void;
  value: ZeroStockState;
  waitingCount?: number | undefined;
}) {
  const helpId = `${idPrefix}-zero-stock-help`;
  const waiting = waitingShoppersText(waitingCount);

  return (
    <fieldset
      className={cn('grid gap-2 border-t border-border pt-4', disabled && 'opacity-60')}
      aria-busy={busy ? 'true' : undefined}
      aria-describedby={helpId}
      disabled={disabled}
    >
      <legend className="float-left mb-2 w-full font-medium">When sold out online, show</legend>
      <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border">
        {ZERO_STOCK_STATE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-11 cursor-pointer items-center justify-center border-l border-border px-2 text-center text-sm font-medium first:border-l-0 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-inset',
              disabled && 'cursor-not-allowed',
            )}
          >
            <input
              className="sr-only"
              type="radio"
              name={`${idPrefix}-zero-stock-state`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onValueChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <p id={helpId} className="text-sm text-muted-foreground">
        Shown only while no copies are available online.
      </p>
      {value !== 'sold_out' && (
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor={`${idPrefix}-expected-month`}>
            Expected month (optional)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id={`${idPrefix}-expected-month`}
              className="w-auto min-w-44 text-base"
              type="month"
              min={currentAthensMonth()}
              value={month}
              onChange={(event) => onMonthChange(event.currentTarget.value)}
            />
            {monthAction}
          </div>
        </div>
      )}
      {waiting && (
        <p className="text-sm text-muted-foreground" data-availability-alert-count>
          {waiting}
        </p>
      )}
    </fieldset>
  );
}
