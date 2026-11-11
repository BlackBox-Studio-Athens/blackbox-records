import { CalendarDays } from 'lucide-react';
import { formatDayDate, parseIsoDate } from '@blackbox/content-model';
import { Button } from '../ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { todayIsoDate } from './field-values';

/** A calendar date with the browser's date picker, a Today shortcut and the chosen day in words. */
export default function DateField({
  path,
  label,
  value,
  required = true,
  errors = [],
  disabled = false,
  onChange,
  onBlur,
}: {
  path: string;
  label: string;
  value: unknown;
  required?: boolean;
  errors?: string[];
  disabled?: boolean;
  onChange(value: string | null): void;
  onBlur?(): void;
}) {
  const id = `content-${path}`;
  const date = parseIsoDate(value);
  return (
    <Field className="min-w-0" data-invalid={errors.length > 0}>
      <FieldLabel htmlFor={id} required={required} icon={CalendarDays}>
        {label}
      </FieldLabel>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={id}
          data-content-path={path}
          type="date"
          className="min-h-11 w-auto min-w-44 text-base"
          value={date ?? ''}
          // Not native `required`: a date inside a closed card or <details> cannot take focus, so the browser
          // would silently refuse to submit the whole form. The editors report missing dates themselves.
          aria-required={required || undefined}
          disabled={disabled}
          aria-invalid={errors.length > 0 || undefined}
          aria-describedby={`${id}-readback ${id}-error`}
          onChange={(event) => onChange(event.target.value || null)}
          onBlur={onBlur}
        />
        <Button type="button" variant="outline" disabled={disabled} onClick={() => onChange(todayIsoDate())}>
          Today
        </Button>
      </div>
      <FieldDescription id={`${id}-readback`} aria-live="polite">
        {date ? formatDayDate(date) : required ? 'No date chosen.' : 'Optional'}
      </FieldDescription>
      <FieldError id={`${id}-error`}>{errors.join(' ')}</FieldError>
    </Field>
  );
}
