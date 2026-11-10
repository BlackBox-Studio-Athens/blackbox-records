import { useState } from 'react';
import { Euro, Plus, X } from 'lucide-react';
import { formatEuro } from '@blackbox/content-model';
import { Button } from '../ui/button';
import { FieldDescription, FieldError, FieldLegend, FieldSet } from '../ui/field';
import MoneyInput from '../fields/MoneyInput';

/** Up to `max` euro prices in display order, kept as cents; each shows as a removable chip. */
export default function PriceList({
  path,
  label,
  value,
  max = 4,
  description,
  errors = [],
  disabled = false,
  onChange,
}: {
  path: string;
  label: string;
  value: readonly number[];
  max?: number;
  description?: string;
  errors?: string[];
  disabled?: boolean;
  onChange(value: number[]): void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const full = value.length >= max;
  function add() {
    if (draft === null || full) return;
    onChange([...value, draft]);
    setDraft(null);
    setResetKey((key) => key + 1);
  }
  const id = `content-${path}`;
  return (
    <FieldSet className="min-w-0 gap-3" data-invalid={errors.length > 0} disabled={disabled}>
      <FieldLegend variant="label" icon={Euro}>
        {label}
      </FieldLegend>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`${label}, in display order`}>
          {value.map((cents, index) => (
            <li
              key={`${cents}-${index}`}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-primary bg-accent pr-1 pl-4 text-sm font-semibold tabular-nums"
            >
              {formatEuro(cents)}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                aria-label={`Remove ${formatEuro(cents)}`}
                onClick={() => onChange(value.filter((_, at) => at !== index))}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <div className="flex flex-wrap items-start gap-2">
          <MoneyInput
            key={resetKey}
            id={id}
            path={path}
            label={`Add a price, ${label.toLowerCase()}`}
            value={draft}
            describedBy={`${id}-help`}
            className="w-40"
            onChange={setDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" variant="outline" className="min-h-11" disabled={draft === null} onClick={add}>
            <Plus aria-hidden="true" className="size-4" />
            Add price
          </Button>
        </div>
      )}
      <FieldDescription id={`${id}-help`}>
        {description ?? (full ? `Up to ${max} prices.` : `Optional. Up to ${max}, in the order shown on the site.`)}
      </FieldDescription>
      <FieldError>{errors.join(' ')}</FieldError>
    </FieldSet>
  );
}
