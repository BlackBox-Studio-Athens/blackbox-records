import { useId, useState } from 'react';
import { Check, Plus, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { cn } from '../ui/utils';

/** Adds a new value once, ignoring case and outer spaces. */
export function addChoice(values: readonly string[], input: string): string[] {
  const next = input.trim();
  return !next || values.some((value) => value.toLowerCase() === next.toLowerCase()) ? [...values] : [...values, next];
}

/**
 * Known values as toggle chips, with Other for a value not in the list.
 * `single` keeps at most one chosen value.
 */
export default function ChoiceChips({
  path,
  label,
  options,
  value,
  single = false,
  required = false,
  allowOther = true,
  otherLabel = 'Other',
  maxLength,
  description,
  errors = [],
  disabled = false,
  onChange,
}: {
  path: string;
  label: string;
  options: readonly string[];
  value: readonly string[];
  single?: boolean;
  required?: boolean;
  allowOther?: boolean;
  otherLabel?: string;
  maxLength?: number;
  description?: string | undefined;
  errors?: string[];
  disabled?: boolean;
  onChange(value: string[]): void;
}) {
  const id = useId();
  const [other, setOther] = useState<string | null>(null);
  const chips = [...value.filter((chosen) => !options.includes(chosen)), ...options];
  const toggle = (chip: string) =>
    onChange(
      value.includes(chip) ? value.filter((chosen) => chosen !== chip) : single ? [chip] : addChoice(value, chip),
    );
  function addOther() {
    if (other === null) return;
    onChange(single ? (other.trim() ? [other.trim()] : [...value]) : addChoice(value, other));
    setOther(null);
  }
  return (
    <Field className="min-w-0" data-invalid={errors.length > 0}>
      <FieldLabel id={`${id}-label`} required={required} icon={Tag}>
        {label}
      </FieldLabel>
      <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
        {chips.map((chip, index) => {
          const on = value.includes(chip);
          return (
            <Button
              key={chip}
              type="button"
              variant="outline"
              data-content-path={index === 0 ? path : undefined}
              aria-pressed={on}
              disabled={disabled}
              className={cn('min-h-11 rounded-full px-4 text-sm', on && 'border-primary bg-accent font-semibold')}
              onClick={() => toggle(chip)}
            >
              {on && <Check aria-hidden="true" className="size-4" />}
              {chip}
            </Button>
          );
        })}
        {allowOther && other === null && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            data-content-path={chips.length ? undefined : path}
            className="min-h-11 rounded-full border-dashed px-4 text-sm text-muted-foreground"
            onClick={() => setOther('')}
          >
            <Plus aria-hidden="true" className="size-4" />
            {otherLabel}
          </Button>
        )}
      </div>
      {other !== null && (
        <div className="flex flex-wrap gap-2">
          <Input
            autoFocus
            aria-label={`${otherLabel} ${label.toLowerCase()}`}
            className="min-h-11 min-w-0 flex-1 text-base"
            value={other}
            maxLength={maxLength}
            onChange={(event) => setOther(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addOther();
              }
              if (event.key === 'Escape') {
                // Close only the Other entry, not the card around it.
                event.stopPropagation();
                setOther(null);
              }
            }}
          />
          <Button type="button" onClick={addOther} disabled={!other.trim()}>
            Add
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOther(null)}>
            Cancel
          </Button>
        </div>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{errors.join(' ')}</FieldError>
    </Field>
  );
}
