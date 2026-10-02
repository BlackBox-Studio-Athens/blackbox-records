import * as React from 'react';
import { useId, useState } from 'react';
import type { InternalStockDetail } from '../../lib/backend/internal-stock-api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { athensToday, preorderPreview, shipEstimateText, type ShipEstimate } from './preorder-preview';

interface PreorderControlProps {
  preorder: InternalStockDetail['stock']['preorder'];
  disabled: boolean;
  busy: boolean;
  onSave(estimate: ShipEstimate | null): Promise<void>;
  today?: string;
}

const selectClass =
  'min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export default function PreorderControl({
  preorder,
  disabled,
  busy,
  onSave,
  today = athensToday(),
}: PreorderControlProps) {
  const id = useId();
  const [enabled, setEnabled] = useState(preorder?.open ?? false);
  const [kind, setKind] = useState<ShipEstimate['kind']>(preorder?.shipEstimate.kind ?? 'month');
  const [month, setMonth] = useState(
    preorder?.shipEstimate.kind === 'month' ? preorder.shipEstimate.month : today.slice(0, 7),
  );
  const [part, setPart] = useState<Extract<ShipEstimate, { kind: 'month' }>['part']>(
    preorder?.shipEstimate.kind === 'month' ? preorder.shipEstimate.part : null,
  );
  const [date, setDate] = useState(preorder?.shipEstimate.kind === 'date' ? preorder.shipEstimate.date : '');
  const months = Array.from({ length: 18 }, (_, index) => {
    const value = new Date(today.slice(0, 7) + '-01T00:00:00Z');
    value.setUTCMonth(value.getUTCMonth() + index);
    return value.toISOString().slice(0, 7);
  });
  if (!months.includes(month)) months.unshift(month);
  const tomorrow = new Date(today + 'T00:00:00Z');
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const estimate: ShipEstimate = kind === 'month' ? { kind, month, part } : { kind, date };
  const rows = enabled && (kind === 'month' || date) ? preorderPreview(estimate, today) : ['Not on pre-order'];
  const monthPassed = kind === 'month' && month < today.slice(0, 7);
  const monthLabel = (value: string) =>
    shipEstimateText({ kind: 'month', month: value, part: null }).replace('around ', '');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (enabled && !disabled && !busy) void onSave(estimate);
      }}
      className="min-w-0 border-t border-border pt-4"
    >
      <fieldset disabled={disabled || busy} aria-busy={busy ? 'true' : undefined} className="grid min-w-0 gap-4">
        <legend className="sr-only">Pre-order settings</legend>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
          <span className="grid gap-1">
            <span className="font-medium">Pre-order</span>
            <span id={id + '-description'} className="text-sm text-muted-foreground">
              Take orders before the copies are on the shelf.
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={enabled}
            aria-describedby={id + '-description'}
            className="peer sr-only"
            onChange={(event) => {
              if (!event.currentTarget.checked && preorder?.open) void onSave(null);
              else setEnabled(event.currentTarget.checked);
            }}
          />
          <span
            aria-hidden="true"
            className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border bg-muted after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-background after:content-[''] peer-checked:border-primary peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50"
          />
        </label>
        {enabled && (
          <>
            <p className="text-sm text-muted-foreground">
              Copies: enter the number you expect as the stock quantity. Count the stock again when they arrive.
            </p>
            <label className="grid gap-2" htmlFor={id + '-kind'}>
              <span>When it ships</span>
              <select
                id={id + '-kind'}
                className={selectClass}
                value={kind}
                onChange={(event) => setKind(event.currentTarget.value as ShipEstimate['kind'])}
              >
                <option value="month">About a month</option>
                <option value="date">Exact date</option>
              </select>
            </label>
            {kind === 'month' ? (
              <>
                <label className="grid gap-2" htmlFor={id + '-month'}>
                  <span>Month</span>
                  <select
                    id={id + '-month'}
                    className={selectClass}
                    value={month}
                    required
                    aria-describedby={id + '-help'}
                    onChange={(event) => setMonth(event.currentTarget.value)}
                  >
                    {months.map((value) => (
                      <option key={value} value={value}>
                        {monthLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2" htmlFor={id + '-part'}>
                  <span>Part of the month</span>
                  <select
                    id={id + '-part'}
                    className={selectClass}
                    value={part ?? ''}
                    onChange={(event) => setPart((event.currentTarget.value as typeof part) || null)}
                  >
                    <option value="">Any time in the month</option>
                    <option value="early">Early</option>
                    <option value="mid">Mid</option>
                    <option value="late">Late</option>
                  </select>
                </label>
                <p id={id + '-help'} className="text-sm text-muted-foreground">
                  {!monthPassed && (
                    <>Shoppers see &quot;ships {shipEstimateText({ kind: 'month', month, part })}&quot;. </>
                  )}
                  The pre-order stays open until you press Copies arrived.
                </p>
                {monthPassed && (
                  <p role="alert" className="text-sm">
                    This month has passed. Shoppers see Pre-order without a date until you update it.
                  </p>
                )}
              </>
            ) : (
              <>
                <label className="grid gap-2" htmlFor={id + '-date'}>
                  <span>Exact ship date</span>
                  <Input
                    id={id + '-date'}
                    type="date"
                    className="min-h-11"
                    required
                    min={tomorrow.toISOString().slice(0, 10)}
                    value={date}
                    aria-describedby={id + '-help'}
                    onChange={(event) => setDate(event.currentTarget.value)}
                  />
                </label>
                <p id={id + '-help'} className="text-sm text-muted-foreground">
                  Shoppers see the date. On this date the pre-order ends by itself.
                </p>
                <p className="text-sm">
                  Enter an exact date only when you are sure of it. It ends the pre-order whether or not the copies
                  arrived.
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="min-h-11" disabled={monthPassed}>
                {busy ? 'Saving pre-order…' : 'Save pre-order'}
              </Button>
              {preorder?.open && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => void onSave(null)}
                  aria-describedby={id + '-arrival'}
                >
                  Copies arrived
                </Button>
              )}
            </div>
            {preorder?.open && (
              <p id={id + '-arrival'} className="text-sm text-muted-foreground">
                Ends the pre-order now. If the plant slips, change the estimate instead: every waiting order gets an
                email.
              </p>
            )}
          </>
        )}
      </fieldset>
      <div className="mt-4 text-sm" aria-live="polite">
        <p className="font-medium">What shoppers see</p>
        <ul className="mt-1 list-inside list-disc text-muted-foreground">
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </div>
    </form>
  );
}
