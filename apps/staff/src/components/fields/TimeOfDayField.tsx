import { Clock } from 'lucide-react';
import { parseTimeOfDay, timeOfDayFromParts, timeOfDayParts, type TimeOfDay } from '@blackbox/content-model';
import { FieldDescription, FieldError, FieldLegend, FieldSet } from '../ui/field';
import CountStepper from './CountStepper';

/** A 24-hour time of day as hour and minute steppers, the same in every browser locale. */
export default function TimeOfDayField({
  path,
  label,
  value,
  required = true,
  errors = [],
  disabled = false,
  onChange,
}: {
  path: string;
  label: string;
  value: unknown;
  required?: boolean;
  errors?: string[];
  disabled?: boolean;
  onChange(value: TimeOfDay): void;
}) {
  const time = parseTimeOfDay(value);
  const { hour, minute } = time ? timeOfDayParts(time) : { hour: null, minute: null };
  const id = `content-${path}`;
  const store = (nextHour: number, nextMinute: number) => {
    const next = timeOfDayFromParts(nextHour, nextMinute);
    if (next) onChange(next);
  };
  return (
    <FieldSet className="min-w-0 gap-2" data-invalid={errors.length > 0} disabled={disabled}>
      <FieldLegend variant="label" required={required} icon={Clock}>
        {label}
      </FieldLegend>
      <div className="flex flex-wrap items-center gap-2">
        <CountStepper
          id={`${id}-hour`}
          path={path}
          label="hour"
          value={hour}
          min={0}
          max={23}
          pad={2}
          invalid={errors.length > 0}
          describedBy={`${id}-help`}
          onChange={(next) => store(next, minute ?? 0)}
        />
        <span aria-hidden="true" className="text-lg">
          :
        </span>
        <CountStepper
          id={`${id}-minute`}
          label="minutes"
          value={minute}
          min={0}
          max={59}
          step={5}
          pad={2}
          describedBy={`${id}-help`}
          onChange={(next) => store(hour ?? 20, next)}
        />
      </div>
      <FieldDescription id={`${id}-help`}>24-hour time</FieldDescription>
      <FieldError>{errors.join(' ')}</FieldError>
    </FieldSet>
  );
}
