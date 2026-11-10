import { useId } from 'react';
import { durationFromParts, durationParts, type DurationSeconds } from '@blackbox/content-model';
import { Input } from '../ui/input';

/** A track length as minutes and seconds, stored as whole seconds. */
export default function DurationField({
  label,
  value,
  disabled = false,
  path,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  disabled?: boolean;
  path?: string;
  onChange(value: DurationSeconds | null): void;
}) {
  const id = useId();
  const parts = typeof value === 'number' ? durationParts(value as DurationSeconds) : null;
  const store = (minutes: string, seconds: string) => {
    if (!minutes && !seconds) return onChange(null);
    const next = durationFromParts(Number(minutes || 0), Number(seconds || 0));
    if (next !== null) onChange(next);
  };
  const digits = (text: string, length: number) => text.replace(/\D/g, '').slice(0, length);
  return (
    <fieldset className="grid min-w-0 gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-2">
        <Input
          id={`${id}-minutes`}
          data-content-path={path}
          inputMode="numeric"
          aria-label={`${label} minutes`}
          className="min-h-11 w-16 text-center text-base tabular-nums"
          value={parts ? String(parts.minutes) : ''}
          onChange={(event) => store(digits(event.target.value, 3), String(parts?.seconds ?? ''))}
        />
        <span aria-hidden="true">:</span>
        <Input
          id={`${id}-seconds`}
          inputMode="numeric"
          aria-label={`${label} seconds`}
          className="min-h-11 w-16 text-center text-base tabular-nums"
          value={parts ? String(parts.seconds).padStart(2, '0') : ''}
          onChange={(event) => store(String(parts?.minutes ?? ''), digits(event.target.value, 2).slice(-2))}
        />
        <span className="text-sm text-muted-foreground">min : sec</span>
      </div>
    </fieldset>
  );
}
